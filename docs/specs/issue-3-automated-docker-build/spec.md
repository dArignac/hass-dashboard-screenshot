# Spec: Automated Docker Build (#3)

## Objective

Configure automated Docker image building and publishing to Docker Hub via GitHub Actions whenever relevant application files are changed on the `main` branch.
The Docker image on Docker Hub is `darignac/hass-dashboard-screenshot`.
In addition, provide clear, comprehensive documentation and setup guidance on what needs to be configured in Docker Hub and GitHub repository secrets to enable automated publishing.

## Tech Stack

- **CI/CD:** GitHub Actions (`.github/workflows/docker-publish.yml`)
- **Docker Actions:**
  - `docker/setup-qemu-action` (for multi-platform emulation if needed)
  - `docker/setup-buildx-action` (for advanced caching and build features)
  - `docker/login-action` (for authenticating to Docker Hub)
  - `docker/metadata-action` (for generating tags such as `latest` and commit SHA)
  - `docker/build-push-action` (for building and pushing container images)
- **Container Registry:** Docker Hub (`darignac/hass-dashboard-screenshot`)
- **Testing & Linting:** `pnpm test`, `pnpm run lint`, `pnpm run build`

## Commands

- Run unit tests: `pnpm test`
- Typecheck: `pnpm run lint` (`tsc --noEmit`)
- Build project: `pnpm run build`
- Validate Dockerfile build locally: `docker build -t darignac/hass-dashboard-screenshot:local .`

## Project Structure

Files to be created or modified:
- `.github/workflows/docker-publish.yml` (new GitHub Actions workflow)
- `README.md` (updated with Docker Hub & CI setup instructions and Docker Hub badge/image reference)
- `docs/specs/issue-3-automated-docker-build/spec.md` (this spec)
- `docs/specs/issue-3-automated-docker-build/plan.md` (technical approach)
- `docs/specs/issue-3-automated-docker-build/tasks.md` (vertical slices)

## Architectural Guard & Invariants

- **Path Filtering:** The workflow must trigger only on push to `main` when relevant application files are modified (`src/**`, `Dockerfile`, `package.json`, `pnpm-lock.yaml`, `tsconfig*.json`, `.github/workflows/docker-publish.yml`). It must not trigger on changes strictly affecting documentation (`docs/**`, `*.md` except README if desired, etc.) unless relevant application files are also touched.
- **Pre-publish Validation:** Automated checks (tests and lint/typecheck) should pass as a job or step before building and pushing the Docker image, ensuring broken code is never published.
- **Workflow Dispatch:** Support manual triggering via `workflow_dispatch` to allow re-running builds without pushing empty commits.
- **Secure Credentials:** No secrets or credentials hardcoded. Workflow must consume `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` from GitHub Actions Secrets.
- **Docker Hub Documentation:** Clear, unambiguous guide in `README.md` detailing how to create a Docker Hub Personal Access Token (PAT) with `Read & Write` permissions and how to add `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` to GitHub repository secrets.
- **Codebase Integrity:** Zero regressions in existing codebase; `pnpm test`, `pnpm run lint`, and `pnpm run build` continue to succeed cleanly.

## Boundaries

- Always: Use official `docker/*` GitHub Actions, adhere to least privilege for tokens, validate YAML syntax.
- Ask first: Major changes to container architecture or base images.
- Never: Hardcode personal credentials, bypass CI checks before pushing image, use full Docker Hub account passwords (always require Personal Access Tokens).

## Success Criteria

1. `.github/workflows/docker-publish.yml` is created and adheres to GitHub Actions syntax standards.
2. The workflow triggers on push to `main` for changes in relevant application files, and supports `workflow_dispatch`.
3. The workflow runs test/lint verification, logs into Docker Hub using secrets, builds the Docker image, and tags/pushes `darignac/hass-dashboard-screenshot:latest` (plus git SHA).
4. `README.md` is updated with complete, step-by-step guidance on creating the Docker Hub PAT and setting up repository secrets in GitHub.
5. `pnpm test`, `pnpm run lint`, and `pnpm run build` pass without errors.
