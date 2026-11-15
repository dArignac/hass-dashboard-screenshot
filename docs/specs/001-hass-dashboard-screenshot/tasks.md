# Task List: Home Assistant Dashboard Screenshot Service

- [x] Task 1: Project Setup & Configuration Module
  - Acceptance: `package.json`, `tsconfig.json`, `src/config.ts` created; config properly validates required (`haUrl`, `haToken`) and optional environment variables with Zod defaults.
  - Verify: Run `pnpm test` against `tests/config.test.ts`.
  - Files: `package.json`, `tsconfig.json`, `src/config.ts`, `tests/config.test.ts`

- [x] Task 2: Storage & HTTP Server
  - Acceptance: `src/storage.ts` manages in-memory image buffer, metadata, and health stats. `src/server.ts` exposes `GET /`, `GET /screenshot.png` (or `.jpeg`), and `GET /health` with correct headers (`Cache-Control: no-cache, no-store, must-revalidate`). Returns 503 if no screenshot captured yet.
  - Verify: Run `pnpm test` against `tests/storage.test.ts` and `tests/server.test.ts`.
  - Files: `src/storage.ts`, `src/server.ts`, `tests/storage.test.ts`, `tests/server.test.ts`

- [x] Task 3: Home Assistant Browser Automation & Auth Injection
  - Acceptance: `src/auth.ts` constructs the `hassTokens` payload. `src/browser.ts` initializes headless Chromium with configured dimensions, navigates to target dashboard, injects `localStorage` auth tokens, applies CSS to hide header and sidebar, waits `renderDelaySeconds`, and captures screenshot.
  - Verify: Unit test auth generator and verify Playwright browser controller logic in test suite.
  - Files: `src/auth.ts`, `src/browser.ts`, `tests/auth.test.ts`

- [x] Task 4: Scheduler & Application Lifecycle Entrypoint
  - Acceptance: `src/scheduler.ts` manages the periodic execution loop with configurable interval, catching and logging errors without crashing. `src/index.ts` brings together config, storage, browser, scheduler, and server with graceful shutdown on `SIGINT`/`SIGTERM`.
  - Verify: Test scheduler execution and error recovery in `tests/scheduler.test.ts`.
  - Files: `src/scheduler.ts`, `src/index.ts`, `tests/scheduler.test.ts`

- [x] Task 5: Dockerization & Documentation
  - Acceptance: `Dockerfile` builds a production container image using Playwright base; `docker-compose.yml.example`, `.env.example`, and `README.md` provide clear usage and setup instructions.
  - Verify: `docker build` builds successfully and all pnpm scripts (`build`, `test`, `lint`) pass.
  - Files: `Dockerfile`, `docker-compose.yml.example`, `.env.example`, `README.md`, `.gitignore`
