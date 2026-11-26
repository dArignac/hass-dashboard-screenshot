# Tasks: Issue #12 - Decrease Docker Image Size

- [x] Task 1: Create `.dockerignore` and Update Workflow Trigger Paths
  - Description: Add `.dockerignore` excluding `node_modules`, `dist`, `.git`, `.agents`, `docs`, `tests`, `.env`, and log files to streamline Docker build context transfer. Update `.github/workflows/docker-publish.yml` paths to include `.dockerignore`.
  - Acceptance: `.dockerignore` exists and build context transfer is reduced to minimal footprint (< 1 MB).
  - Verify: Check `.dockerignore` contents and verify workflow YAML syntax.
  - Files: [.dockerignore, .github/workflows/docker-publish.yml]

- [x] Task 2: Optimize Dockerfile with Debian Slim and Headless Shell
  - Description: Refactor runner stage in `Dockerfile` to use `node:26-bookworm-slim`, install only chromium OS dependencies via `install-deps chromium`, pre-allocate permissions for user `node`, install dependencies with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`, download only `chromium_headless_shell` via `npx playwright install --only-shell chromium`, remove `ffmpeg`, and copy compiled code with correct ownership.
  - Acceptance: `Dockerfile` builds cleanly with non-root `node` user and no duplicate `chown` layers.
  - Verify: `docker build -t darignac/hass-dashboard-screenshot:local .` succeeds with exit code 0.
  - Files: [Dockerfile]

- [x] Task 3: Benchmark Image Size and Verify Container Screenshot Execution
  - Description: Measure uncompressed and compressed Docker image sizes, ensuring uncompressed is < 900 MB and compressed is < 350 MB. Run containerized Playwright screenshot execution test to verify headless Chromium successfully initializes and renders output under `node` user.
  - Acceptance: Image size benchmarks meet reduction targets (~66% uncompressed, ~68% compressed reduction); screenshot smoke test in container exits code 0.
  - Verify: `docker images darignac/hass-dashboard-screenshot:local` and `docker run --rm darignac/hass-dashboard-screenshot:local node -e "const { chromium } = require('playwright'); ..."`
  - Files: [Dockerfile]

- [x] Task 4: Full Codebase Verification and Invariant Checks
  - Description: Run full test suite, TypeScript typecheck, and build to ensure no regressions in codebase integrity.
  - Acceptance: `pnpm test`, `pnpm run lint`, and `pnpm run build` all pass cleanly.
  - Verify: `pnpm run lint && pnpm test && pnpm run build`
  - Files: [package.json, Dockerfile, .dockerignore]
