# Tasks: Issue #3 - Automated Docker Build

- [x] Task 1: Create GitHub Actions Workflow for Automated Testing and Docker Publishing
  - Description: Create `.github/workflows/docker-publish.yml` with triggers on push to `main` (filtered by relevant application paths) and `workflow_dispatch`. Define `test` job (lint, test, build) and `docker` job (Docker buildx, Docker Hub login with secrets, tagging with latest and short sha, build-and-push with cache).
  - Acceptance: Valid GitHub Actions workflow file exists with proper triggers, secrets usage, and steps.
  - Verify: Syntax validation and structural review of `.github/workflows/docker-publish.yml`.
  - Files: [.github/workflows/docker-publish.yml]

- [x] Task 2: Document Docker Hub Setup and GitHub Secrets Guidance in README
  - Description: Add a comprehensive guide to `README.md` explaining how to configure Docker Hub (creating a Personal Access Token with Read & Write permissions) and how to configure GitHub repository secrets (`DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`). Update usage examples to reference `darignac/hass-dashboard-screenshot:latest`.
  - Acceptance: `README.md` contains clear, actionable instructions for Docker Hub and GitHub repository secrets configuration.
  - Verify: Markdown review and link validation.
  - Files: [README.md]

- [x] Task 3: Project Verification and Consistency Check
  - Description: Run full test suite, linting, and build to ensure no regressions. Verify that paths filter in the workflow covers all relevant files.
  - Acceptance: `pnpm test`, `pnpm run lint`, and `pnpm run build` all pass with code 0.
  - Verify: `pnpm test && pnpm run lint && pnpm run build`
  - Files: [.github/workflows/docker-publish.yml, README.md]
