# Tasks: Issue #4 - Automated Dependency Updates

- [x] Task 1: Create Dependabot Configuration with 3-Day Cooldown and Grouping
  - Description: Create `.github/dependabot.yml` covering `npm`, `docker`, and `github-actions` ecosystems. Configure daily schedule, 3-day cooldown (`cooldown: { default-days: 3 }`), and group non-major updates (`patterns: ["*"]`, `update-types: ["minor", "patch"]`).
  - Acceptance: Valid Dependabot YAML file adhering to schema specifications.
  - Verify: Syntax and schema validation of `.github/dependabot.yml`.
  - Files: [.github/dependabot.yml]

- [x] Task 2: Create Pull Request CI Quality Gate Workflow
  - Description: Create `.github/workflows/ci.yml` running lint (`pnpm run lint`), unit tests (`pnpm test`), compilation (`pnpm run build`), and Docker image build test on `pull_request` and `push` to `main`.
  - Acceptance: Valid GitHub Actions workflow file that runs status checks on pull requests.
  - Verify: Syntax validation of `.github/workflows/ci.yml` and local execution of lint, test, build.
  - Files: [.github/workflows/ci.yml]

- [x] Task 3: Create Dependabot Auto-Merge & Assignee Workflow
  - Description: Create `.github/workflows/dependabot-auto-merge.yml` triggered on Dependabot pull requests. Use `dependabot/fetch-metadata@v2` to auto-approve and enable auto-merge for non-major updates (`gh pr merge --auto --squash`), and assign major updates to `@dArignac` (`gh pr edit --add-assignee dArignac`).
  - Acceptance: Valid GitHub Actions workflow file with correct permissions (`contents: write`, `pull-requests: write`, `issues: write`) and conditional actions.
  - Verify: Syntax and structure review of `.github/workflows/dependabot-auto-merge.yml`.
  - Files: [.github/workflows/dependabot-auto-merge.yml]

- [x] Task 4: Document Dependency Update Automation and GitHub Settings in README
  - Description: Update `README.md` with instructions on how automated dependency updates work, the 3-day security cooldown, and required GitHub repository settings ("Allow auto-merge" and "Allow GitHub Actions to create and approve pull requests").
  - Acceptance: Clear, actionable documentation in `README.md`.
  - Verify: Markdown review of `README.md`.
  - Files: [README.md]

- [x] Task 5: Project Consistency and Integrity Verification
  - Description: Run full test suite, linting, and build to ensure zero regressions across application code.
  - Acceptance: `pnpm test`, `pnpm run lint`, and `pnpm run build` all pass with code 0.
  - Verify: `pnpm test && pnpm run lint && pnpm run build`
  - Files: [package.json, src/, tests/]
