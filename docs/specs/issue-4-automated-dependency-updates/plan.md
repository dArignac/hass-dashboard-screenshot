# Plan: Automated Dependency Updates (#4)

## Technical Approach

### 1. Dependabot Configuration (`.github/dependabot.yml`)

Configure GitHub Dependabot to track all three dependency ecosystems present in the repository:

1. **`npm` ecosystem:**
   - Package manager: npm/pnpm
   - Directory: `/`
   - Schedule: `interval: "daily"`
   - Cooldown: `cooldown: { default-days: 3 }`
     - Ensures dependencies are at least 3 days old before opening a PR to mitigate compromised supply-chain releases.
   - Grouping:
     - Group `non-major`:
       - `patterns: ["*"]`
       - `update-types: ["minor", "patch"]`
     - Bundles all safe minor and patch updates into a single PR with comprehensive change tables. Major updates will fall outside this group and open as individual PRs.

2. **`docker` ecosystem:**
   - Tracks base and runner container images in `Dockerfile` (`node:26-alpine`, `mcr.microsoft.com/playwright:v1.65.1`).
   - Directory: `/`
   - Schedule: `interval: "daily"`
   - Cooldown: `cooldown: { default-days: 3 }`
   - Grouping:
     - Group `non-major`:
       - `patterns: ["*"]`
       - `update-types: ["minor", "patch"]`

3. **`github-actions` ecosystem:**
   - Tracks GitHub Action steps in `.github/workflows/` (e.g. `actions/checkout`, `actions/setup-node`, `docker/setup-buildx-action`, etc.).
   - Directory: `/`
   - Schedule: `interval: "daily"`
   - Cooldown: `cooldown: { default-days: 3 }`
   - Grouping:
     - Group `non-major`:
       - `patterns: ["*"]`
       - `update-types: ["minor", "patch"]`

---

### 2. Pull Request Continuous Integration (`.github/workflows/ci.yml`)

Currently, `.github/workflows/docker-publish.yml` only runs on pushes to `main`. To ensure automated merges are safe, pull requests must be validated by CI before merging.

Define `.github/workflows/ci.yml`:
- **Triggers:**
  - `pull_request`: on branches `[main]`
  - `push`: on branches `[main]`
  - `workflow_dispatch`
- **Jobs:**
  - `lint-and-test`:
    - Checks out code with `actions/checkout@v4`
    - Sets up pnpm (`pnpm/action-setup@v4`)
    - Sets up Node.js with cache: `pnpm`
    - Runs `pnpm install --frozen-lockfile` (fallback to `pnpm install` if lockfile updated by Dependabot)
    - Runs `pnpm run lint` (`tsc --noEmit`)
    - Runs `pnpm test` (Vitest)
    - Runs `pnpm run build` (`tsc -p tsconfig.build.json`)
  - `docker-build-check`:
    - Validates Dockerfile compilation: `docker build -t test-image:local .`

---

### 3. Dependabot Automation Workflow (`.github/workflows/dependabot-auto-merge.yml`)

Create `.github/workflows/dependabot-auto-merge.yml` triggered on Dependabot pull requests:
- **Trigger:**
  - `pull_request_target`: `types: [opened, synchronize, reopened, ready_for_review]`
- **Filter:** `if: github.actor == 'dependabot[bot]'`
- **Permissions:**
  - `contents: write`
  - `pull-requests: write`
  - `issues: write`
- **Steps:**
  1. `actions/checkout@v4` (if needed for scripts, or omit for pure API calls)
  2. `dependabot/fetch-metadata@v2` to retrieve:
     - `steps.metadata.outputs.update-type` (`version-update:semver-major`, `version-update:semver-minor`, `version-update:semver-patch`)
     - `steps.metadata.outputs.dependency-group` (e.g. `non-major`)
  3. **Auto-approve & Enable Auto-merge for non-major updates:**
     - Condition: `steps.metadata.outputs.dependency-group == 'non-major' || (steps.metadata.outputs.update-type != 'version-update:semver-major' && steps.metadata.outputs.update-type != '')`
     - Action:
       ```bash
       gh pr review --approve "$PR_URL"
       gh pr merge --auto --squash "$PR_URL"
       ```
  4. **Assign Major Updates to `@dArignac`:**
     - Condition: `steps.metadata.outputs.update-type == 'version-update:semver-major' && steps.metadata.outputs.dependency-group != 'non-major'`
     - Action:
       ```bash
       gh pr edit "$PR_URL" --add-assignee "dArignac"
       ```

---

### 4. Repository Documentation & Settings Guidance (`README.md`)

Add a clear section in `README.md` detailing:
1. **Automated Dependency Updates Overview:**
   - Dependabot schedule, 3-day stability cooldown policy, and grouping behavior.
   - Non-major updates are tested, auto-approved, and auto-merged via GitHub Actions.
   - Major updates open separate PRs and are assigned to `@dArignac`.
2. **GitHub Repository Settings Configuration:**
   - **Allow auto-merge:** Enable in **Settings > General > Pull Requests > Allow auto-merge**.
   - **Actions Permissions:** Enable **Allow GitHub Actions to create and approve pull requests** in **Settings > Actions > General > Workflow permissions**.
   - **Branch Protection / Rulesets:** Recommend requiring the `Lint, Test & Build` status check from `ci.yml` before merging to `main`.

---

### 5. Verification Checkpoints

1. Syntax validation of `.github/dependabot.yml`, `.github/workflows/dependabot-auto-merge.yml`, and `.github/workflows/ci.yml`.
2. Unit tests, linting, and build pass cleanly (`pnpm test`, `pnpm run lint`, `pnpm run build`).
3. Verification that all criteria from Issue #4 are satisfied without extra external services or tokens.
