# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-11-26

### Changed
- Migrated Docker production runner stage from monolithic `mcr.microsoft.com/playwright` to `node:26-bookworm-slim`, drastically reducing Docker image size (#12).
- Configured minimal browser installation to download strictly `chromium_headless_shell` (`npx playwright install --only-shell chromium`), omitting unused Firefox, WebKit, and FFmpeg binaries.
- Configured container to execute as non-root `node` user with pre-configured directory permissions, eliminating duplicate overlay filesystem layers and saving over 319 MB of layer duplication.
- Reduced uncompressed image size from ~2.6 GB to ~883 MB (~66% reduction) and compressed image size from ~1,010 MB to ~317 MB (~68% reduction).

### Added
- Added `.dockerignore` to streamline Docker build context transfer (< 5 KB vs ~99 MB).
- Included `.dockerignore` in `.github/workflows/docker-publish.yml` path triggers.

## [0.3.0] - 2026-11-19

### Added
- Automated dependency update system via GitHub Dependabot (`.github/dependabot.yml`) for `npm`, `docker`, and `github-actions` ecosystems (#4).
- 3-day stability cooldown period across all ecosystems to protect against malicious supply-chain releases.
- Automated grouping of non-major updates (minor and patch) into single PRs with detailed dependency change summaries.
- Pull request CI quality gate workflow (`.github/workflows/ci.yml`) running linting, unit tests, TypeScript build, and Docker build test.
- Dependabot auto-merge and assignment workflow (`.github/workflows/dependabot-auto-merge.yml`) that automatically approves and merges non-major updates while assigning major version changes directly to `@dArignac`.
- Documentation in `README.md` covering automated dependency update operations and required GitHub repository settings ("Allow auto-merge", workflow permissions).

## [0.2.0] - 2026-11-15

### Added
- Automated Docker build and publishing workflow via GitHub Actions (`.github/workflows/docker-publish.yml`) triggered on push to `main` for relevant application files and via `workflow_dispatch` (#3).
- Step-by-step setup documentation in `README.md` for generating a Docker Hub Personal Access Token (PAT) and configuring GitHub repository secrets (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`).
- Updated Docker CLI and Docker Compose configurations (`docker-compose.yml.example`) to reference pre-built image `darignac/hass-dashboard-screenshot:latest`.

## [0.1.0] - 2026-11-15

### Added
- Initial implementation of Home Assistant Dashboard Screenshot Service (#1).
- Recursive Shadow DOM kiosk injector (`applyKioskMode`) in `src/browser.ts` traversing nested web components (`home-assistant` -> `ha-drawer` -> `hui-root`) to hide top header, action toolbar, and navigation drawer on real Home Assistant instances.
- Zod-based configuration parser validating required and optional environment variables (`src/config.ts`).
- In-memory thread-safe image buffer and health metrics storage (`src/storage.ts`).
- Playwright Chromium headless automation with Home Assistant `hassTokens` authentication injection and custom CSS kiosk mode (`src/browser.ts`, `src/auth.ts`).
- Resilient background periodic capture scheduler (`src/scheduler.ts`).
- Minimal HTTP server exposing `GET /`, `GET /screenshot.png`, `GET /screenshot.jpeg`, and `GET /health` (`src/server.ts`).
- Lifecycle management and graceful shutdown handling (`src/index.ts`).
- Multi-stage unprivileged `Dockerfile`, `docker-compose.yml.example`, `.env.example`, and setup documentation (`README.md`).
- Vitest unit and integration test suite with mock server coverage (`tests/`).
