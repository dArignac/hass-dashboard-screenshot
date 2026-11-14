# Statement of Intent: Home Assistant Dashboard Screenshot Service

Confirmed on: 2026-11-14

## Context & Intent

- **Outcome:** A lightweight Docker container that periodically takes a screenshot of a configured Home Assistant dashboard using an access token, and serves the latest image via HTTP for a Raspberry Pi photoframe.
- **User:** `dArignac`, for displaying real-time smart home status on a Raspberry Pi 3 running `photoframe` without burdening the Pi with browser rendering.
- **Why now:** The Pi 3 running `photoframe` displays static images smoothly, but running a full modern browser with heavy Lovelace JavaScript directly on it is resource-intensive and laggy.
- **Success:** The photoframe can request `http://<host>:<port>/` (or `/screenshot.png`) at any time and immediately receive a fresh, full-resolution screenshot refreshed in the background every 60 seconds (or configured interval).
- **Constraint:** Must run in Docker, authenticate to Home Assistant via a long-lived access token, and allow configurable screenshot dimensions/resolution and refresh interval via environment variables.
- **Out of scope:** Multi-dashboard routing, on-the-fly dynamic query parameter resizing, interactive UI controls, and authentication on the screenshot endpoint itself.
