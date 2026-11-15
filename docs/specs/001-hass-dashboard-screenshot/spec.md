# Spec: Home Assistant Dashboard Screenshot Service

## Objective
Build a lightweight Docker service that periodically captures a screenshot of a specified Home Assistant Lovelace dashboard using a Long-Lived Access Token, and serves the latest image via HTTP for low-power or secondary display clients (specifically a Raspberry Pi 3 running `photoframe`).

### Primary Users & Use Cases
- **User:** Smart home administrator / Digital photo frame user
- **Use Case:** A Raspberry Pi 3 running digital photo frame software requests a static image URL on an interval to display smart home status without needing to render heavy JavaScript/Lovelace client-side.

---

## Tech Stack
- **Runtime:** Node.js (v20+ LTS, ES Modules, TypeScript)
- **Browser Automation:** Playwright (Chromium headless)
- **HTTP Server:** Fastify or native `node:http` (minimal overhead, fast static binary streaming)
- **Containerization:** Docker with official Playwright base image (`mcr.microsoft.com/playwright:v1.49.0-jammy` or lightweight Debian base)
- **Testing:** Vitest for unit tests; mock server tests for HTTP and config validation

---

## Configuration & Environment Variables
The container will be fully configurable via environment variables:

| Variable | Description | Required | Default |
|---|---|---|---|
| `HA_URL` | Base URL of Home Assistant (e.g. `http://homeassistant.local:8123`) | **Yes** | — |
| `HA_TOKEN` | Home Assistant Long-Lived Access Token | **Yes** | — |
| `DASHBOARD_PATH` | Path to the target dashboard/view (e.g., `lovelace/0` or `lovelace-photoframe/overview`) | No | `lovelace/0` |
| `VIEWPORT_WIDTH` | Screenshot/viewport width in pixels | No | `1920` |
| `VIEWPORT_HEIGHT` | Screenshot/viewport height in pixels | No | `1080` |
| `SCREENSHOT_INTERVAL_SECONDS` | Interval between background screenshot captures | No | `60` |
| `RENDER_DELAY_SECONDS` | Seconds to wait after page load for cards/WebSockets to stabilize before snapping | No | `3` |
| `PORT` | HTTP port to listen on inside container | No | `8080` |
| `HOST` | HTTP host interface to bind to | No | `0.0.0.0` |
| `HIDE_HEADER_AND_SIDEBAR` | Whether to inject CSS to hide HA top navigation bar and sidebar | No | `true` |
| `IMAGE_FORMAT` | Output format (`png` or `jpeg`) | No | `png` |

---

## Commands
```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Run unit and integration tests
npm test

# Lint and format checking
npm run lint

# Start in development mode (with tsx / live reload)
npm run dev

# Start in production mode
npm start

# Docker build and run
docker build -t hass-dashboard-screenshot .
docker run -p 8080:8080 --env-file .env hass-dashboard-screenshot
```

---

## Project Structure
```text
├── Dockerfile                  # Production container definition
├── docker-compose.yml.example  # Example compose configuration
├── package.json                # Project dependencies and scripts
├── tsconfig.json               # TypeScript compiler configuration
├── src/
│   ├── index.ts                # Application entrypoint & graceful shutdown
│   ├── config.ts               # Environment validation & parsing (Zod)
│   ├── browser.ts              # Browser lifecycle & screenshot capture logic
│   ├── auth.ts                 # HA authentication injection (localStorage hassTokens)
│   ├── scheduler.ts            # Periodic background execution loop
│   ├── storage.ts              # In-memory buffer holder for latest screenshot & metadata
│   └── server.ts               # HTTP routes (GET /, GET /screenshot.png, GET /health)
├── tests/
│   ├── config.test.ts          # Config validation tests
│   ├── server.test.ts          # HTTP server endpoint tests
│   └── scheduler.test.ts       # Periodic trigger tests
└── docs/
    ├── intent/
    │   └── hass-dashboard-screenshot.md
    └── specs/
        └── 001-hass-dashboard-screenshot/
            ├── spec.md
            ├── plan.md
            └── tasks.md
```

---

## HTTP Endpoints Contract
1. `GET /` and `GET /screenshot.{png|jpeg}`:
   - **Response 200:** Returns the latest screenshot with headers:
     - `Content-Type: image/png` (or `image/jpeg`)
     - `Cache-Control: no-cache, no-store, must-revalidate`
     - `X-Screenshot-Timestamp: <ISO-8601>`
   - **Response 503:** If the first screenshot has not completed yet or capture repeatedly failed.
2. `GET /health`:
   - **Response 200:** `{"status": "ok", "lastScreenshot": "<ISO-8601>", "capturesTotal": N}`

---

## Authentication Mechanism
Home Assistant uses token storage in the browser's `localStorage` (`hassTokens`).
To authenticate headless Chromium cleanly without filling out the web UI login form:
1. Navigate Playwright to the base HA URL (or initialize browser context with pre-seeded `storageState` / `addInitScript`).
2. Populate `localStorage` with:
   ```json
   {
     "hassTokens": {
       "access_token": "<HA_TOKEN>",
       "token_type": "Bearer",
       "clientId": "<HA_URL>/",
       "hassUrl": "<HA_URL>",
       "expires": 9999999999999
     }
   }
   ```
3. Navigate directly to `<HA_URL>/<DASHBOARD_PATH>`.
4. If `HIDE_HEADER_AND_SIDEBAR=true`, inject custom CSS into the page/shadow DOM to hide top app headers, sidebars, and app drawers:
   ```css
   ha-sidebar, app-header, .header, #header, app-drawer { display: none !important; }
   #view { min-height: 100vh !important; }
   ```
5. Wait for network idle or selector `#view` / Lovelace root, wait `RENDER_DELAY_SECONDS`, and take screenshot of the viewport.

---

## Code Style
- **TypeScript:** Strict type-checking (`"strict": true`).
- **Imports:** Explicit ES module imports.
- **Config:** Validate environment variables with Zod or clean parse functions at startup; fail early with actionable error messages if required variables are missing.
- **Logging:** Structured, concise console logging with timestamps and log levels.

Example style:
```typescript
import { z } from 'zod';

export const ConfigSchema = z.object({
  haUrl: z.string().url(),
  haToken: z.string().min(1),
  dashboardPath: z.string().default('lovelace/0'),
  viewportWidth: z.coerce.number().int().positive().default(1920),
  viewportHeight: z.coerce.number().int().positive().default(1080),
  intervalSeconds: z.coerce.number().int().min(5).default(60),
  renderDelaySeconds: z.coerce.number().int().min(0).default(3),
  port: z.coerce.number().int().default(8080),
  host: z.string().default('0.0.0.0'),
  hideHeaderAndSidebar: z.coerce.boolean().default(true),
  imageFormat: z.enum(['png', 'jpeg']).default('png'),
});

export type Config = z.infer<typeof ConfigSchema>;
```

---

## Testing Strategy
- **Framework:** Vitest
- **Unit Tests:**
  - Config parsing & defaults validation (checking valid URLs, token presence, invalid integers).
  - Storage buffer management (updating buffer, metadata timestamps, handling empty buffer).
  - Route handlers (HTTP mock requests asserting headers, status codes, and cache control).
- **Integration Tests:**
  - Fastify / HTTP server request-response lifecycles.
- **Coverage Target:** ≥ 85% on core modules (`config`, `storage`, `server`).

---

## Boundaries
- **Always:**
  - Set `Cache-Control: no-cache, no-store, must-revalidate` so photoframe displays the newest image.
  - Keep single browser instance / context reused across intervals to minimize CPU spikes on capture ticks (recycle only on error or crash).
  - Gracefully handle container shutdown (`SIGTERM`, `SIGINT`) closing the browser and server cleanly.
- **Ask first:**
  - Adding heavy third-party UI dependencies or complex database/queue persistence.
  - Adding persistent auth storage on disk.
- **Never:**
  - Log the `HA_TOKEN` in console or error outputs.
  - Crash the container when a single screenshot attempt fails; log the error, preserve the previous valid screenshot in memory, and retry on the next interval.

---

## Success Criteria
- [ ] Container runs via `docker run` or `docker compose` with environment variables.
- [ ] Connects to Home Assistant and authenticates without requiring manual login interactions.
- [ ] Takes a screenshot matching configured `VIEWPORT_WIDTH` and `VIEWPORT_HEIGHT`.
- [ ] Refreshes the screenshot in the background every `SCREENSHOT_INTERVAL_SECONDS`.
- [ ] HTTP endpoint `/` and `/screenshot.png` return the latest captured image immediately with `200 OK` and correct MIME type.
- [ ] If HA is unreachable during a capture, the service continues serving the last good image and logs the error without crashing.
- [ ] All unit and server tests pass.

---

## Design Decisions Resolved
1. **Lovelace UI chrome (Header & Sidebar):**
   - Automatically inject CSS to hide HA header, app bars, and sidebar (`HIDE_HEADER_AND_SIDEBAR=true` by default).
2. **Browser Lifecycle:**
   - Keep a persistent headless Chromium instance alive and reuse the browser context/page across capture intervals to avoid CPU/RAM overhead on capture ticks. In case of page or context crashes, auto-recover by recreating context.
