"""ASU backend hook to inject default external repositories when omitted by clients.

This hook intercepts `asu.build.inject_files` so that clients like
`luci-app-attendedsysupgrade` (which do not specify custom repositories)
automatically get Nikki and Routerich feeds and keys configured.
"""

import logging
import re

log = logging.getLogger("asu.default_repos")

DEFAULT_KEYS = [
    # Nikki public build key (usign for OpenWrt 24.10 / opkg)
    "RWSrAXyIqregizvXvG9kJI/JoTkaCCPDy6CQrrVQ4IZ8Qgu+iWMql0UW\n",
    # Nikki public build key (EC PEM for OpenWrt 25.12 / apk)
    "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAETOwt83tzTFqyvjwimjuuvslR40t6\nXnROMwxZsC0iQAr2hHjuXX8qyhf5WaD2Hd897+Gc1/+4W4DMqroNp5w2Dg==\n-----END PUBLIC KEY-----\n",
    # Routerich build key (usign for OpenWrt 24.10 / opkg)
    "RWQuckAB+2WRb9rwzhWarTedFmsvy8y5kxAS3A0KXe3yUou9V/Nfbqty\n",
    # Routerich build key (EC PEM for OpenWrt 25.12 / apk)
    "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAESvZSR3tinGuItmOwWh0QqROqB7mX\n1TI34mJIlAeL0sTby74OnpYyQNDgZGZQti9Lzma3WlfI74HDWPOu9IVktA==\n-----END PUBLIC KEY-----\n",
]


def _get_branch(version: str) -> str:
    if version.startswith("25.12"):
        return "openwrt-25.12"
    if version == "SNAPSHOT" or version.lower().endswith("snapshot"):
        return "SNAPSHOT"
    return "openwrt-24.10"


def _detect_arch(container, apk_mode: bool) -> str | None:
    from asu.build import run_cmd

    repo_file = "repositories" if apk_mode else "repositories.conf"
    _, stdout, _ = run_cmd(container, ["cat", repo_file])
    m = re.search(r"/packages/([^/\s]+)/base", stdout)
    return m.group(1) if m else None


def setup_hook():
    try:
        import asu.build
    except ImportError:
        return

    original_inject_files = asu.build.inject_files

    def hooked_inject_files(container, build_request, job=None, apk_mode=None):
        if apk_mode is None:
            apk_mode = asu.build._detect_apk_mode(container)

        if not build_request.repositories:
            arch = _detect_arch(container, apk_mode)
            branch = _get_branch(build_request.version)
            repos = {}

            if arch:
                if apk_mode:
                    repos["nikki"] = (
                        f"https://nikkinikki.pages.dev/{branch}/{arch}/nikki/packages.adb"
                    )
                else:
                    repos["nikki"] = (
                        f"https://nikkinikki.pages.dev/{branch}/{arch}/nikki"
                    )

            if build_request.target == "mediatek/filogic":
                openwrt_branch = (
                    "25.12" if build_request.version.startswith("25.12") else "24.10"
                )
                if apk_mode:
                    repos["routerich"] = (
                        f"https://packages.routerich.ru/{openwrt_branch}/mediatek/filogic/routerich/packages.adb"
                    )
                else:
                    repos["routerich"] = (
                        f"https://packages.routerich.ru/{openwrt_branch}/mediatek/filogic/routerich/"
                    )

            if repos:
                log.info(f"Injecting default external repositories: {repos}")
                build_request.repositories = repos
                build_request.repositories_mode = "append"

        if not build_request.repository_keys:
            log.info("Injecting default external repository verification keys")
            build_request.repository_keys = list(DEFAULT_KEYS)

        return original_inject_files(
            container, build_request, job=job, apk_mode=apk_mode
        )

    asu.build.inject_files = hooked_inject_files
    log.info("ASU default external repositories hook registered successfully")


setup_hook()
