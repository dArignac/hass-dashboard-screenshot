# Plan: Decrease Docker Image Size (#12)

## Technical Approach

### 1. Build Context Optimization (`.dockerignore`)

Currently, no `.dockerignore` file exists in the repository. As a result:
- The entire repository directory (including local `node_modules` ~100MB, local `dist/`, `.git/`, test artifacts, logs, etc.) is sent as build context to the Docker daemon.
- If local artifacts exist, `COPY . .` in the build stage might pull in stale or host-specific node_modules or artifacts.

**Action:**
Create `.dockerignore` ignoring:
- `node_modules`
- `dist`
- `.git`
- `.agents`
- `docs`
- `tests`
- `.env` and `.env.*`
- `*.log`
- `npm-debug.log*`, `pnpm-debug.log*`

Update `.github/workflows/docker-publish.yml` to track `.dockerignore` in the `paths` trigger list.

---

### 2. Dockerfile Optimization (`Dockerfile`)

#### Stage 1: Build Stage (`base`, `deps`, `build`)
Keep the multi-stage build using `node:26-alpine` and `pnpm` with corepack to produce clean `dist/` compilation artifacts.

#### Stage 2: Runner Stage (`runner`)
Replace `FROM mcr.microsoft.com/playwright:v1.65.1 AS runner` with `FROM node:26-bookworm-slim AS runner`.

**Key Architectural Changes in Runner Stage:**
1. **Base Image:** Switch to `node:26-bookworm-slim`.
2. **Chromium OS Dependencies:** Install minimal Chromium system dependencies using `npx -y playwright@1.65.1 install-deps chromium`, followed immediately by `apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /root/.npm` within the same layer.
3. **Directory Permissions & User Setup:** Pre-create `/ms-playwright` and `/app` and assign ownership to `node:node` in the same step. Switch to `USER node` for all subsequent operations.
4. **Browser Installation:**
   - Run `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --omit=dev --ignore-scripts` to install production npm dependencies without triggering automatic multi-browser downloads.
   - Run `npx playwright install --only-shell chromium` to download strictly `chromium_headless_shell` (~125 MB download / ~280 MB uncompressed) instead of full Chromium, WebKit, and Firefox.
   - Delete unnecessary FFmpeg binaries: `rm -rf /ms-playwright/ffmpeg* ~/.npm && npm cache clean --force`.
5. **Application Artifacts:**
   - Copy compiled application `dist/` from the build stage using `COPY --chown=node:node --from=build /app/dist ./dist`.
6. **Execution:**
   - Maintain `EXPOSE 8080` and `CMD ["node", "dist/index.js"]`.

---

### 3. Layer Bloat Prevention

In Docker overlay filesystems, running `chown -R` across existing files in a subsequent layer duplicates every file in that directory into a new layer.
By:
1. Creating `/ms-playwright` and `/app` owned by `node:node` before downloading browsers or dependencies.
2. Running subsequent install and copy steps as `USER node` or with `COPY --chown=node:node`.
We eliminate over 319 MB of duplicated layer overhead.

---

### 4. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Missing shared libraries for Chromium on Debian slim | Container fails to launch browser | We use Playwright's verified `install-deps chromium` script and tested browser launch & screenshot capture inside the built container. |
| Non-root user permission issues writing to `/ms-playwright` or `/app` | Runtime crash on startup | Pre-assign directory ownership to `node:node` before switching to `USER node`. |
| Playwright version skew | Runtime error when loading browser | Pin the playwright version in `install-deps` to match `package.json` (`1.65.1`). |
| Missing fonts for Home Assistant rendering | Distorted text/icons in screenshots | Debian slim + `install-deps chromium` includes `fonts-liberation`, `fonts-noto-color-emoji`, and standard fontconfig libraries. |

---

### 5. Verification Checkpoints

1. **Static Analysis & Linting:**
   - `pnpm run lint` passes without errors.
   - `pnpm test` passes all 22 unit tests.
   - `pnpm run build` succeeds cleanly.
2. **Docker Build:**
   - `docker build -t darignac/hass-dashboard-screenshot:local .` completes successfully.
3. **Image Size Measurement:**
   - Uncompressed size verified with `docker images`: must be under 900 MB (target: ~883 MB vs ~2.6 GB original).
   - Compressed size verified with `docker save ... | gzip | wc -c`: must be under 350 MB (target: ~317 MB vs ~1,010 MB original).
4. **Runtime Functional Verification:**
   - Execute a headless Playwright Chromium screenshot capture inside the container to confirm browser launches and captures image without errors.
   - Run `docker run --rm -d -p 8080:8080 -e HA_URL=... -e HA_TOKEN=... darignac/hass-dashboard-screenshot:local` and verify health / process startup.
