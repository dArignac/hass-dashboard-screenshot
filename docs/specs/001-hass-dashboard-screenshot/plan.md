# Technical Implementation Plan: Home Assistant Dashboard Screenshot Service

## Architecture & Components Overview

```
                      +------------------------------------+
                      |            index.ts                |
                      |   (Startup, Lifecycle & Signals)   |
                      +------------------+-----------------+
                                         |
               +-------------------------+-------------------------+
               |                                                   |
               v                                                   v
      +------------------+                               +------------------+
      |    server.ts     |                               |   scheduler.ts   |
      | (Fastify HTTP)   |                               |  (Interval Loop) |
      +--------+---------+                               +--------+---------+
               |                                                   |
               v                                                   v
      +------------------+                               +------------------+
      |   storage.ts     | <============================ |   browser.ts     |
      | (Memory Buffer)  |         writes screenshot     |  (Playwright)    |
      +--------+---------+                               +--------+---------+
                                                                   |
                                                         +---------+--------+
                                                         |     auth.ts      |
                                                         | (HA Auth Inject) |
                                                         +------------------+
```

### Component Breakdown
1. **Config (`src/config.ts`)**:
   - Parses environment variables with Zod.
   - Provides defaults for all optional values, type safety, and clear validation errors.
2. **Storage (`src/storage.ts`)**:
   - Holds the latest image `Buffer`, MIME type, timestamp, and capture metrics in memory.
   - Thread-safe / asynchronous getter and setter.
3. **Browser Automation (`src/browser.ts`, `src/auth.ts`)**:
   - Manages Playwright Chromium instance.
   - Injects HA token into `localStorage`.
   - Navigates to dashboard, injects kiosk CSS (hiding header and sidebar), waits for stabilization, and captures screenshot.
4. **Scheduler (`src/scheduler.ts`)**:
   - Runs a periodic timer loop.
   - Handles errors gracefully without crashing the service.
5. **HTTP Server (`src/server.ts`)**:
   - Fastify-based HTTP server.
   - Endpoints: `GET /`, `GET /screenshot.png`, `GET /health`.
   - Appropriate headers: `Cache-Control: no-cache, no-store, must-revalidate`.
6. **Containerization (`Dockerfile`, `docker-compose.yml.example`)**:
   - Builds production container image based on Playwright, runs unprivileged user if possible, exposes port.

---

## Implementation Order
1. **Foundation & Config**: Project scaffolding (`package.json`, `tsconfig.json`), dependencies, and `src/config.ts` with unit tests.
2. **Storage & Server**: In-memory screenshot store (`src/storage.ts`) and Fastify server (`src/server.ts`) with endpoint tests.
3. **Browser Automation & Auth**: Playwright manager (`src/browser.ts`, `src/auth.ts`) with token injection and header/sidebar removal CSS.
4. **Scheduler & Orchestration**: Periodic capture scheduler (`src/scheduler.ts`) and main application lifecycle (`src/index.ts`).
5. **Containerization & Documentation**: `Dockerfile`, `docker-compose.yml.example`, `.env.example`, and `README.md`.

---

## Risks and Mitigation Strategies

| Risk | Mitigation |
|---|---|
| HA dashboard takes time for Lovelace cards / WebSockets to load | Configurable `RENDER_DELAY_SECONDS` (default 3s) after page load + waiting for DOM selector. |
| Home Assistant restarts or temporary network failure | Scheduler catches exceptions, logs warning, keeps serving previous valid screenshot from memory; retries next interval. |
| Chromium memory leak when running indefinitely | Reuse context/page, but monitor and recreate browser context if memory or error threshold is reached; light Playwright footprint. |
| HA authentication format changes | Token format conforms to official HA Long-Lived Access Token `hassTokens` schema in `localStorage`. |

---

## Verification Checkpoints
- **Checkpoint 1:** Unit tests pass for `config`, `storage`, and `server`.
- **Checkpoint 2:** Playwright test/simulation captures and injects auth & CSS properly.
- **Checkpoint 3:** Full end-to-end integration test / mock server test.
- **Checkpoint 4:** Docker build succeeds and container runs cleanly.
