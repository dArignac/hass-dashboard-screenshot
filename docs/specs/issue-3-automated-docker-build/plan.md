# Plan: Automated Docker Build (#3)

## Technical Approach

### 1. GitHub Actions Workflow Design (`.github/workflows/docker-publish.yml`)

The workflow will automate building and pushing the Docker image to Docker Hub (`darignac/hass-dashboard-screenshot`).

#### Triggers:
- `push`:
  - Branches: `['main']`
  - Paths:
    - `src/**`
    - `Dockerfile`
    - `package.json`
    - `pnpm-lock.yaml`
    - `tsconfig*.json`
    - `.github/workflows/docker-publish.yml`
- `workflow_dispatch`: allows manual triggering from GitHub UI.

#### Jobs:
1. **`test` Job:**
   - Runs on `ubuntu-latest`.
   - Checks out code with `actions/checkout@v4`.
   - Sets up Node.js with `actions/setup-node@v4` (Node 22 / matching package requirements).
   - Installs pnpm using `pnpm/action-setup@v4`.
   - Installs dependencies (`pnpm install --frozen-lockfile`).
   - Runs linting / typecheck: `pnpm run lint`.
   - Runs unit tests: `pnpm test`.
   - Runs build: `pnpm run build`.

2. **`docker` Job (depends on `test`):**
   - Runs on `ubuntu-latest`.
   - Checks out code with `actions/checkout@v4`.
   - Sets up Docker Buildx with `docker/setup-buildx-action@v3`.
   - Authenticates to Docker Hub using `docker/login-action@v3`:
     - `username: ${{ secrets.DOCKERHUB_USERNAME }}`
     - `password: ${{ secrets.DOCKERHUB_TOKEN }}`
   - Extracts Docker metadata using `docker/metadata-action@v5`:
     - Images: `darignac/hass-dashboard-screenshot`
     - Tags:
       - `type=raw,value=latest,enable={{is_default_branch}}`
       - `type=sha,format=short`
   - Builds and pushes the image using `docker/build-push-action@v6`:
     - Context: `.`
     - Push: `true`
     - Tags: `${{ steps.meta.outputs.tags }}`
     - Labels: `${{ steps.meta.outputs.labels }}`
     - Cache: using GitHub Actions cache (`type=gha`) for fast builds.

### 2. Docker Hub & GitHub Secrets Setup Guidance (`README.md`)

Add a dedicated documentation section in `README.md` ("CI/CD & Automated Docker Builds"):
1. **Docker Hub Setup:**
   - Log in to [Docker Hub](https://hub.docker.com/).
   - Go to **Account Settings** -> **Security** -> **Personal access tokens**.
   - Click **Generate new token**.
   - Provide a description (e.g. `GitHub Actions hass-dashboard-screenshot`).
   - Set Access Permissions to **Read & Write** (required to push images to `darignac/hass-dashboard-screenshot`).
   - Copy the generated Access Token.
2. **GitHub Repository Secrets Configuration:**
   - Navigate to the GitHub repository: **Settings** -> **Secrets and variables** -> **Actions**.
   - Click **New repository secret**.
   - Add `DOCKERHUB_USERNAME` with the Docker Hub username (`darignac`).
   - Add `DOCKERHUB_TOKEN` with the Personal Access Token generated in Docker Hub.
3. **Usage with Docker Hub Image:**
   - Update `docker run` and `docker-compose.yml` examples in `README.md` to reference `darignac/hass-dashboard-screenshot:latest` instead of a local-only image tag.

### 3. Verification Checkpoints

1. Syntax verification of `.github/workflows/docker-publish.yml` using Node or YAML parsers.
2. Prettier/linting and unit tests pass (`pnpm test && pnpm run lint && pnpm run build`).
3. Verification that Docker Hub documentation is clear and accurate.
