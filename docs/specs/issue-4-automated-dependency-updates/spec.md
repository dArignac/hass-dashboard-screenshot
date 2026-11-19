# Spec: Automated Dependency Updates (#4)

## Objective

Establish an automated dependency update system for all software dependencies in the repository (Node.js packages via pnpm, Docker base images in `Dockerfile`, and GitHub Actions workflows).
Key requirements from Issue #4:
1. Cover all dependencies: Node packages, Docker images, and GitHub Actions.
2. Automate merging for non-major updates (patch and minor).
3. Enforce a 3-day minimum release age cooldown period to avoid compromised/untested packages.
4. Provide a clear PR description detailing all changed dependencies.
5. For major version changes, open separate PRs without auto-merging and assign them directly to `@dArignac`.
6. Validate all changes through automated CI testing (lint, unit tests, build) before auto-merge.
7. Provide clear repository configuration guidance in `README.md` for required GitHub settings.
8. Keep the solution native, simple, and maintainable (leveraging GitHub Dependabot and GitHub Actions).

## Tech Stack

- **Dependency Management:** GitHub Dependabot (`.github/dependabot.yml`)
  - Ecosystems: `npm` (with `pnpm`), `docker`, `github-actions`
- **Automation CI/CD:** GitHub Actions
  - `.github/workflows/dependabot-auto-merge.yml` (Dependabot metadata extraction, auto-approval, auto-merge, and assignee assignment)
  - `.github/workflows/ci.yml` (CI status checks on PRs: lint, unit test, TypeScript build, Docker build validation)
  - `dependabot/fetch-metadata@v2` (official GitHub action for Dependabot PR metadata)
  - GitHub CLI (`gh`) for auto-merge and assignee management
- **Repository Verification:** `pnpm test`, `pnpm run lint` (`tsc --noEmit`), `pnpm run build` (`tsc -p tsconfig.build.json`)

## Commands

- Run unit tests: `pnpm test`
- Typecheck / lint: `pnpm run lint`
- Build TypeScript: `pnpm run build`
- Validate Dependabot configuration syntax: YAML parser validation
- Validate GitHub Actions workflow syntax: YAML parser validation

## Project Structure

Files to be created or modified:
- `.github/dependabot.yml` (new Dependabot configuration)
- `.github/workflows/dependabot-auto-merge.yml` (new workflow for Dependabot auto-merge & assignee management)
- `.github/workflows/ci.yml` (new CI workflow for PR verification across lint, test, build, and docker)
- `README.md` (updated with Dependency Updates section and GitHub settings configuration instructions)
- `docs/specs/issue-4-automated-dependency-updates/spec.md` (this spec)
- `docs/specs/issue-4-automated-dependency-updates/plan.md` (technical approach)
- `docs/specs/issue-4-automated-dependency-updates/tasks.md` (vertical slices)

## Architectural Guard & Invariants

- **Zero External Third-Party App Constraints:** Leverage GitHub's built-in Dependabot without requiring external SaaS seats (like Mend) or external token storage.
- **Supply Chain Cooldown Guard (3-Day Minimum Release Age):** Every configured ecosystem must declare `cooldown: { default-days: 3 }` (or equivalent stability window) to ensure packages younger than 3 days are held back, defending against malicious zero-day package takeovers.
- **Semantic Versioning Boundary:**
  - Non-major updates (minor, patch, and digests) are grouped under `non-major` and automatically enabled for auto-merge once CI checks pass.
  - Major version updates must NEVER be automatically merged; they must be assigned to `@dArignac` for human review.
- **CI Quality Gate Before Auto-Merge:** No PR may be auto-merged without verified status checks. A dedicated `.github/workflows/ci.yml` must execute on `pull_request` ensuring `pnpm run lint`, `pnpm test`, and `pnpm run build` succeed cleanly.
- **Least Privilege Permissions:** Workflows must use explicitly scoped permissions (`contents: write`, `pull-requests: write`, `issues: write`).
- **Codebase Integrity:** Zero regressions in existing application source code (`src/`), test suite (`tests/`), and Docker configuration (`Dockerfile`).

## Boundaries

- Always: Use official GitHub actions (`dependabot/fetch-metadata@v2`), adhere to strict least-privilege token permissions, and validate YAML schemas.
- Ask first: Altering repository branch protection rules or adding external third-party dependency bots.
- Never: Bypass CI checks for automated merges, auto-merge major version bumps, or hardcode personal authentication credentials.

## Success Criteria

1. `.github/dependabot.yml` is created, covering `npm`, `docker`, and `github-actions` with 3-day cooldown and non-major grouping.
2. `.github/workflows/dependabot-auto-merge.yml` is created to handle PR inspection: auto-approving and auto-merging non-major updates, and assigning major updates to `@dArignac`.
3. `.github/workflows/ci.yml` runs lint, unit tests, and build on all pull requests, acting as the safety gate for auto-merge.
4. `README.md` documents the dependency update strategy and outlines the necessary GitHub repository settings ("Allow auto-merge" and "Allow GitHub Actions to create and approve pull requests").
5. Existing test suites, linters, and build commands (`pnpm test`, `pnpm run lint`, `pnpm run build`) pass without error.
