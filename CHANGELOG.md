# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
