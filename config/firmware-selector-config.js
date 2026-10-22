/* exported config */

function getArchForTarget(target, subtarget) {
  if (target === "x86") return subtarget === "64" ? "x86_64" : "i386_pentium4";
  if (target === "armsr") return "aarch64_generic";
  if (target === "mediatek") {
    if (subtarget === "filogic" || subtarget === "mt7622") return "aarch64_cortex-a53";
    if (subtarget === "mt7629") return "arm_cortex-a7";
    if (subtarget === "mt7623") return "arm_cortex-a7_neon-vfpv4";
    return "mipsel_24kc";
  }
  if (target === "ramips") return "mipsel_24kc";
  if (target === "ath79") return "mips_24kc";
  if (target === "bcm27xx") {
    if (subtarget === "bcm2711") return "aarch64_cortex-a72";
    if (subtarget === "bcm2712") return "aarch64_cortex-a76";
    if (subtarget === "bcm2710") return "aarch64_cortex-a53";
    return "arm_cortex-a7_neon-vfpv4";
  }
  if (target === "qualcommax") return "aarch64_cortex-a53";
  if (target === "rockchip") return "aarch64_generic";
  return `${target}_${subtarget}`;
}

var config = {
  // Show help text for images
  show_help: true,

  // Image download URL
  image_url: "https://downloads.openwrt.org",

  // Insert snapshot versions
  show_snapshots: true,

  // Info link URL
  info_url: "https://openwrt.org/start?do=search&id=toh&q={title} @toh",

  // Attended Sysupgrade Server support (routed through frontend reverse proxy)
  asu_url: window.location.origin + "/asu",
  asu_extra_packages: ["luci", "luci-app-attendedsysupgrade"],

  // Dynamic external repositories based on selected target and OpenWrt version
  get asu_repositories() {
    const targetEl = document.getElementById("image-target");
    const targetFull = targetEl ? targetEl.innerText.trim() : "";
    const [target = "", subtarget = ""] = targetFull.split("/");
    const versionEl = document.getElementById("versions");
    const version = versionEl ? versionEl.value : "";
    const isApk = version.startsWith("25.12") || version === "SNAPSHOT";
    const arch = getArchForTarget(target, subtarget);
    const branch = version.startsWith("25.12")
      ? "openwrt-25.12"
      : version === "SNAPSHOT"
      ? "SNAPSHOT"
      : "openwrt-24.10";

    const repos = {};
    if (arch) {
      repos.nikki = isApk
        ? `https://nikkinikki.pages.dev/${branch}/${arch}/nikki/packages.adb`
        : `https://nikkinikki.pages.dev/${branch}/${arch}/nikki`;
    }

    // Routerich is only built for MediaTek targets
    if (target === "mediatek") {
      const rrBranch = version.startsWith("25.12") ? "25.12" : "24.10";
      repos.routerich = isApk
        ? `https://packages.routerich.ru/${rrBranch}/${target}/${subtarget}/routerich/packages.adb`
        : `https://packages.routerich.ru/${rrBranch}/${target}/${subtarget}/routerich/`;
    }

    return repos;
  },

  asu_repositories_mode: "append",
  asu_repository_keys: [
    // Nikki public build key (usign for OpenWrt 24.10 / opkg)
    "RWSrAXyIqregizvXvG9kJI/JoTkaCCPDy6CQrrVQ4IZ8Qgu+iWMql0UW\n",
    // Nikki public build key (EC PEM for OpenWrt 25.12 / apk)
    "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAETOwt83tzTFqyvjwimjuuvslR40t6\nXnROMwxZsC0iQAr2hHjuXX8qyhf5WaD2Hd897+Gc1/+4W4DMqroNp5w2Dg==\n-----END PUBLIC KEY-----\n",
    // Routerich build key (usign for OpenWrt 24.10 / opkg)
    "RWQuckAB+2WRb9rwzhWarTedFmsvy8y5kxAS3A0KXe3yUou9V/Nfbqty\n",
    // Routerich build key (EC PEM for OpenWrt 25.12 / apk)
    "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAESvZSR3tinGuItmOwWh0QqROqB7mX\n1TI34mJIlAeL0sTby74OnpYyQNDgZGZQti9Lzma3WlfI74HDWPOu9IVktA==\n-----END PUBLIC KEY-----\n",
  ],
};
