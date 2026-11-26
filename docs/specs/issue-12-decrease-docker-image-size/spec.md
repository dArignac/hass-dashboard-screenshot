agy --conversation=bacf56ed-0a7b-4daf-932c-37284649e2ee

# Spec: Decrease Docker Image Size (#12)

## Objective

Reduce the Docker image size of `hass-dashboard-screenshot` as much as possible for the lightweight service it contains.
Currently, the runtime stage uses the monolithic `mcr.microsoft.com/playwright:v1.65.1` base image (~1.01 GB compressed download / ~2.6 GB uncompressed on disk), which bundles full builds of Chromium, Firefox, WebKit, ffmpeg, and redundant desktop windowing libraries. Because the service exclusively launches Chromium in headless mode, replacing the monolithic Playwright base image with a Debian slim runtime (`node:26-bookworm-slim`), installing only the headless shell variant of Chromium (`npx playwright install --only-shell chromium`), removing unnecessary video utilities (`ffmpeg`), preventing duplicate layer metadata overhead (`chown` in separate layer), and introducing a proper `.dockerignore` file achieves a ~68% reduction in compressed download size (~317 MB) and a ~66% reduction in uncompressed image size (~883 MB).

## Tech Stack

- **Base Images:**
  - Build stage: `node:26-alpine`
  - Runtime stage: `node:26-bookworm-slim`
- **Container Tooling:** Docker (multi-stage build), Buildx
- **Browser Runtime:** Playwright `chromium_headless_shell` (headless shell only)
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`, `.github/workflows/docker-publish.yml`)
- **Package Management:** `pnpm` (build stage), `npm` (production install in runner)

## Commands

- Run unit tests: `pnpm test`
- Typecheck: `pnpm run lint` (`tsc --noEmit`)
- Build TypeScript: `pnpm run build`
- Build Docker image locally: `docker build -t darignac/hass-dashboard-screenshot:local .`
- Measure uncompressed image size: `docker images darignac/hass-dashboard-screenshot:local`
- Test container execution and screenshot generation: `docker run --rm darignac/hass-dashboard-screenshot:local node -e "const { chromium } = require('playwright'); ..."`

## Project Structure

Files to be created or modified:

- `.dockerignore` (new: prevents copying `node_modules`, `dist`, `.git`, `tests`, `docs` into Docker build context)
- `Dockerfile` (modified: switch runner from `mcr.microsoft.com/playwright` to `node:26-bookworm-slim`, install only chromium OS dependencies and headless shell, use `node` non-root user, eliminate duplicate `chown` layer)
- `.github/workflows/docker-publish.yml` (modified: include `.dockerignore` in triggers `paths`)
- `docs/specs/issue-12-decrease-docker-image-size/spec.md` (this spec)
- `docs/specs/issue-12-decrease-docker-image-size/plan.md` (technical approach)
- `docs/specs/issue-12-decrease-docker-image-size/tasks.md` (vertical slices)

## Architectural Guard & Invariants

- **Functional Parity:** The screenshot service must maintain 100% functional parity. Headless Chromium must start with existing launch flags (`--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`, `--disable-gpu`) and capture PNG/JPEG screenshots of Home Assistant dashboards without regressions.
- **Security & Least Privilege:** The container must not run as `root`. The standard `node` non-root user (UID 1000) must own `/app` and `/ms-playwright` and execute the Node.js application.
- **Image Size Minimization:**
  - Avoid monolithic browser multi-packs (no WebKit, no Firefox, no unnecessary ffmpeg video decoders).
  - Use `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` during `npm install` to avoid redundant browser downloads, followed by explicit `npx playwright install --only-shell chromium`.
  - Avoid overlay filesystem layer bloat: eliminate redundant `RUN chown -R` layers by configuring directory permissions during directory creation and using `COPY --chown=node:node`.
  - Clean up package manager caches (`apt-get clean`, `rm -rf /var/lib/apt/lists/*`, `npm cache clean --force`, `rm -rf /root/.npm ~/.npm`).
- **Build Context Hygiene:** Maintain a clean `.dockerignore` to ensure host-specific directories (`node_modules`, `dist`, `.git`, etc.) are not sent to the Docker daemon.
- **Codebase Integrity:** Zero regressions in TypeScript compilation or existing unit tests (`pnpm test`, `pnpm run lint`, `pnpm run build` must continue to pass).

## Boundaries

- Always: Clean up apt and npm caches in the same RUN layer they are created; test container build and screenshot capture locally before pushing.
- Ask first: Changing Node.js major version or altering application configuration environment variables.
- Never: Re-introduce multi-browser bundles (Firefox/WebKit), run container process as root, leave uncompressed image > 1 GB or compressed image > 500 MB.

## Success Criteria

1. `.dockerignore` is created and prevents local files/artifacts from bloating the build context.
2. `Dockerfile` uses `node:26-bookworm-slim` for the runner stage and downloads only Chromium headless shell.
3. Uncompressed Docker image size is reduced below 900 MB (from ~2.6 GB) and compressed download size is under 350 MB (from ~1.01 GB).
4. Container runs under non-root `node` user and successfully captures screenshots using Playwright headless Chromium.
5. All CI checks, unit tests, linting, and build steps pass cleanly.
