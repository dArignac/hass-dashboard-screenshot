# Home Assistant Dashboard Screenshot Service

A lightweight Docker service that periodically captures a screenshot of a specified Home Assistant Lovelace dashboard using a Long-Lived Access Token, and serves the latest image via HTTP for low-power or secondary display clients (such as a Raspberry Pi 3 running `photoframe` or e-ink displays).

## Features

- **Automated Background Capture:** Periodically snaps full-resolution screenshots of any Lovelace dashboard view at a configurable interval.
- **Seamless Authentication:** Injects Home Assistant Long-Lived Access Tokens directly into browser `localStorage` (`hassTokens`), avoiding login forms or interactive prompts.
- **Kiosk Mode CSS Injection:** Automatically strips top app headers, navigation bars, sidebars, and app drawers (`HIDE_HEADER_AND_SIDEBAR=true`) to output clean dashboard content.
- **In-Memory Streaming:** Serves the latest image directly from memory with `Cache-Control: no-cache, no-store, must-revalidate` headers, preventing stale caches on display clients.
- **Fault-Tolerant & Resilient:** If Home Assistant restarts or experiences network hiccups, the service continues serving the last valid screenshot while logging errors and retrying on the next tick.
- **Health Monitoring:** Built-in `GET /health` endpoint reporting capture timestamps, total count, and operational status.

---

## HTTP Endpoints

| Endpoint | Method | Description | Success Response |
|---|---|---|---|
| `/` | `GET` | Returns latest captured dashboard screenshot | `200 OK` (`image/png` or `image/jpeg`) |
| `/screenshot.png` (or `.jpeg`) | `GET` | Returns latest screenshot by file extension | `200 OK` (`image/png` or `image/jpeg`) |
| `/health` | `GET` | Service status and capture metrics | `200 OK` (`application/json`) |

> [!NOTE]
> If a request is received before the first screenshot has completed capturing, endpoints `/` and `/screenshot.png` return `503 Service Unavailable` with `Cache-Control: no-cache, no-store, must-revalidate`.

---

## Configuration

All configuration is provided via environment variables:

| Variable | Description | Required | Default |
|---|---|---|---|
| `HA_URL` | Base URL of Home Assistant (e.g. `http://homeassistant.local:8123`) | **Yes** | — |
| `HA_TOKEN` | Home Assistant Long-Lived Access Token | **Yes** | — |
| `DASHBOARD_PATH` | Path to the target dashboard/view (e.g., `lovelace/0` or `lovelace-photoframe/overview`) | No | `lovelace/0` |
| `VIEWPORT_WIDTH` | Screenshot/viewport width in pixels | No | `1920` |
| `VIEWPORT_HEIGHT` | Screenshot/viewport height in pixels | No | `1080` |
| `SCREENSHOT_INTERVAL_SECONDS` | Interval between background captures in seconds | No | `60` |
| `RENDER_DELAY_SECONDS` | Seconds to wait after page load for cards/WebSockets to stabilize before snapping | No | `3` |
| `PORT` | HTTP port to listen on inside container | No | `8080` |
| `HOST` | HTTP host interface to bind to | No | `0.0.0.0` |
| `HIDE_HEADER_AND_SIDEBAR` | Whether to inject CSS to hide HA top navigation bar and sidebar | No | `true` |
| `IMAGE_FORMAT` | Output format (`png` or `jpeg`) | No | `png` |

---

## Getting Started

### 1. Generating a Home Assistant Token

1. In Home Assistant, navigate to your user profile (click your name/avatar at bottom-left).
2. Scroll down to **Long-Lived Access Tokens**.
3. Click **Create Token**, give it a name (e.g. `Dashboard Screenshot Service`), and copy the generated token.

### 2. Running with Docker Compose (Recommended)

1. Copy the example compose file and environment template:
   ```bash
   cp docker-compose.yml.example docker-compose.yml
   cp .env.example .env
   ```
2. Edit `.env` with your `HA_URL` and `HA_TOKEN`:
   ```dotenv
   HA_URL=http://homeassistant.local:8123
   HA_TOKEN=your_token_here
   DASHBOARD_PATH=lovelace/0
   ```
3. Start the service:
   ```bash
   docker compose up -d
   ```
4. Access the dashboard screenshot at `http://<HOST_IP>:8080/`.

### 3. Running with Docker CLI

Using the pre-built image from Docker Hub:
```bash
docker run -d \
  --name hass-dashboard-screenshot \
  -p 8080:8080 \
  -e HA_URL="http://homeassistant.local:8123" \
  -e HA_TOKEN="your_token_here" \
  --restart unless-stopped \
  darignac/hass-dashboard-screenshot:latest
```

Or building locally:
```bash
docker build -t hass-dashboard-screenshot .
docker run -d \
  --name hass-dashboard-screenshot \
  -p 8080:8080 \
  -e HA_URL="http://homeassistant.local:8123" \
  -e HA_TOKEN="your_token_here" \
  --restart unless-stopped \
  hass-dashboard-screenshot
```

---

## CI/CD & Automated Docker Publishing

A GitHub Actions workflow (`.github/workflows/docker-publish.yml`) automatically builds and publishes the container image to Docker Hub (`darignac/hass-dashboard-screenshot`) on pushes to `main` when relevant application files are changed.

### Prerequisites & Secrets Setup

To enable automated publishing to Docker Hub:

#### 1. Generate a Docker Hub Personal Access Token (PAT)
1. Sign in to [Docker Hub](https://hub.docker.com/).
2. Navigate to **Account Settings** -> **Security** -> **Personal access tokens**.
3. Click **Generate new token**.
4. Set the description (e.g. `GitHub Actions hass-dashboard-screenshot`).
5. Select **Read & Write** permissions (required to push images to the repository).
6. Click **Generate** and copy the resulting Personal Access Token.

#### 2. Configure GitHub Repository Secrets
1. In the GitHub repository, navigate to **Settings** -> **Secrets and variables** -> **Actions**.
2. Click **New repository secret**.
3. Create the following secrets:
   - `DOCKERHUB_USERNAME`: Your Docker Hub username (`darignac`).
   - `DOCKERHUB_TOKEN`: The Personal Access Token generated above.

### Workflow Behavior
- **Trigger Conditions:** Automatically runs when commits are pushed to `main` modifying application code (`src/**`, `Dockerfile`, `package.json`, `pnpm-lock.yaml`, `tsconfig*.json`, or the workflow file itself).
- **Manual Runs:** Supports manual triggers at any time via the **Run workflow** button in GitHub Actions (`workflow_dispatch`).
- **Pre-publish Validation:** Runs linting, typechecks (`pnpm run lint`), unit tests (`pnpm test`), and compilation (`pnpm run build`) before initiating the Docker build and push.
- **Image Tags:** Publishes both `latest` (on the default branch) and `sha-<short_sha>`.

---

## Local Development

### Prerequisites

- Node.js (v20+)
- pnpm

### Commands

```bash
# Install dependencies
pnpm install

# Run unit and integration tests
pnpm test

# Type check
pnpm run lint

# Build TypeScript to dist/
pnpm run build

# Start the application
pnpm start
```

---

## Integrating with Raspberry Pi `photoframe`

To display your dashboard on a Raspberry Pi running `photoframe`:
Set the photoframe image source to fetch from:
```text
http://<CONTAINER_HOST>:8080/screenshot.png
```
Because the service serves images with `Cache-Control: no-cache, no-store, must-revalidate`, the client receives the freshly updated image on every fetch interval.
