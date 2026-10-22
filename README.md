# OpenWrt Attended Sysupgrade & Firmware Selector Stack

A self-hosted OpenWrt firmware builder (ASU) and web selector stack running in Docker with Podman sidecar isolation for ImageBuilders, an upstream package caching proxy, and a single reverse-proxy entrypoint.

## Architecture & Routing

All client-facing traffic is routed through the frontend reverse proxy (port `8088` by default):

- **`/`**: OpenWrt Firmware Selector web UI.
- **`/asu/`**: Attended Sysupgrade Server backend API and Swagger docs (`/asu/docs`, `/asu/api/v1/...`). The backend container has no exposed host ports and is accessible only through the reverse proxy.
- **Port `80`**: Nginx package caching proxy used internally by ImageBuilders to cache downloaded packages and kernel modules.

### Client Integration

- **LuCI (`luci-app-attendedsysupgrade`)**: Set the server URL to `http://<host>:8088/asu`. Built-in CORS handling allows direct cross-origin browser requests from your router's LuCI interface.
- **`owut` CLI**: Pass `-u http://<host>:8088/asu` or configure `url = "http://<host>:8088/asu"` in `owut.toml`.

## Stack Layout

```text
.
├── compose.yaml                # Docker Compose definition (Arcane / Dockge compatible)
├── .env.example                # Example environment variables
├── .env                        # Local overrides (git ignored)
├── config/
│   ├── asu.toml                # ASU backend config (repo allowlist, 1 GiB rootfs limit)
│   ├── nginx-cache.conf        # Upstream package caching proxy config (HTTP/1.1, keepalive)
│   ├── nginx-frontend.conf     # Frontend reverse proxy (routes / to UI and /asu/ to backend)
│   └── firmware-selector-config.js # Frontend UI config (dynamic feeds for Nikki & Routerich + keys)
├── data/                       # Persistent runtime data (git ignored)
│   ├── cache/                  # Nginx package cache data
│   ├── redis/                  # Redis persistence data
│   └── store/                  # Built firmware images and manifests
└── src/                        # Git submodules tracking upstream repositories
    ├── asu/                    # Upstream openwrt/asu
    └── firmware-selector/      # Upstream openwrt/firmware-selector-openwrt-org
```

## Quick Start

1. Clone the repository with submodules:
   ```bash
   git clone --recurse-submodules https://gitea.mikayo.dev/mostm/asu-docker.git
   cd asu-docker
   ```

   *(If cloned without `--recurse-submodules`, run `git submodule update --init --recursive`)*

2. Configure environment:
   ```bash
   cp .env.example .env
   # Adjust FRONTEND_PORT (default 8088) or CACHE_PORT (default 80) if needed
   ```

3. Build and start the stack:
   ```bash
   docker compose up -d --build
   ```

4. Open in browser:
   - **Firmware Selector UI**: `http://<host>:8088/`
   - **ASU API Documentation**: `http://<host>:8088/asu/docs`
