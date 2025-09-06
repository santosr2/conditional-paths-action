# Conditional Paths Action

[![GitHub release](https://img.shields.io/github/v/release/santosr2/conditional-paths-action?display_name=tag&sort=semver)](https://github.com/santosr2/conditional-paths-action/releases)
[![CI](https://github.com/santosr2/conditional-paths-action/actions/workflows/ci.yml/badge.svg)](https://github.com/santosr2/conditional-paths-action/actions/workflows/ci.yml)
[![CodeQL](https://github.com/santosr2/conditional-paths-action/actions/workflows/codeql.yml/badge.svg)](https://github.com/santosr2/conditional-paths-action/actions/workflows/codeql.yml)
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Conditional%20Paths%20Action-blue?logo=github)](https://github.com/marketplace/actions/conditional-paths-action)

> [!NOTE]
> This project is forked from [paths-filer](https://github.com/dorny/paths-filter) - [Commit](https://github.com/dorny/paths-filter/commit/de90cc6fb38fc0963ad72b210f1f284cd68cea36)
> Appreciate Dorny and contributors for the wonderful work

A powerful [GitHub Action](https://github.com/features/actions) that enables conditional execution of workflow steps and jobs based on the files modified by pull requests, feature branches, or recent commits.

**⚡ Why Use This Action?**

- **Save Time & Resources**: Run slow tasks like integration tests or deployments only for changed components
- **Perfect for Monorepos**: Ideal for multi-package repositories where you only want to build/test affected packages
- **Flexible Detection**: Works with pull requests, feature branches, and long-lived branches
- **Rich Output Formats**: Get file lists in JSON, CSV, shell, or escaped formats
- **Advanced Filtering**: Support for glob patterns, change types (added/modified/deleted), and predicate quantifiers

> **Note**: GitHub's built-in [path filters](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#onpushpull_requestpaths) don't work at the job or step level, making this action essential for conditional workflow execution.

## 🚀 Quick Start

```yaml
- uses: santosr2/conditional-paths-action@v1
  id: changes
  with:
    filters: |
      src:
        - 'src/**'
      docs:
        - 'docs/**'
        - '*.md'

# Run only if source code changed
- name: Build and Test
  if: steps.changes.outputs.src == 'true'
  run: npm run build && npm test

# Run only if documentation changed
- name: Deploy Docs
  if: steps.changes.outputs.docs == 'true'
  run: npm run deploy:docs
```

## 📋 Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `filters` | Path to YAML file or inline YAML string defining path filters | ✅ Yes | |
| `token` | GitHub token for API access (pull requests only) | ❌ No | `${{ github.token }}` |
| `base` | Git reference to compare against | ❌ No | Repository default branch |
| `ref` | Git reference to detect changes from | ❌ No | `${{ github.ref }}` |
| `working-directory` | Relative path where repository was checked out | ❌ No | |
| `list-files` | Output format for matched files: `none`, `csv`, `json`, `shell`, `escape` | ❌ No | `none` |
| `initial-fetch-depth` | Initial number of commits to fetch for comparison | ❌ No | `100` |
| `predicate-quantifier` | Pattern matching mode: `some` (OR) or `every` (AND) | ❌ No | `some` |

## 📤 Outputs

For each filter named `{filter-name}`, the action provides:

| Output | Type | Description |
|--------|------|-------------|
| `{filter-name}` | `string` | `'true'` if any files match the filter, `'false'` otherwise |
| `{filter-name}_count` | `number` | Count of files matching the filter |
| `{filter-name}_files` | `string` | List of matching files (when `list-files` is enabled) |
| `changes` | `string` | JSON array of all filter names with matches |

## 🎯 Supported Workflows

### Pull Requests

- **Triggers**: `pull_request`, `pull_request_target`
- **Detection**: Against PR base branch using GitHub API
- **Permissions**: Requires `pull-requests: read`
- **Advantage**: Fast, no need to checkout code

### Feature Branches

- **Triggers**: `push` or any event
- **Detection**: Against merge-base with specified base branch
- **Requirements**: Repository must be checked out
- **Use Case**: Feature branch workflows

### Long-lived Branches

- **Triggers**: `push` to main/develop
- **Detection**: Against previous commit on same branch
- **Use Case**: Continuous integration on main branches

### Local Changes

- **Trigger**: Any event with `base: HEAD`
- **Detection**: Staged and unstaged local changes
- **Use Case**: Pre-commit checks, code formatting

## 📖 Examples

### Conditional Job Execution

```yaml
jobs:
  changes:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: read
    outputs:
      backend: ${{ steps.filter.outputs.backend }}
      frontend: ${{ steps.filter.outputs.frontend }}
    steps:
      - uses: santosr2/conditional-paths-action@v1
        id: filter
        with:
          filters: |
            backend:
              - 'api/**'
              - 'services/**'
            frontend:
              - 'web/**'
              - 'components/**'

  backend-tests:
    needs: changes
    if: ${{ needs.changes.outputs.backend == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Backend Tests
        run: npm run test:backend

  frontend-tests:
    needs: changes
    if: ${{ needs.changes.outputs.frontend == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Frontend Tests
        run: npm run test:frontend
```

### Matrix Jobs for Monorepos

```yaml
jobs:
  changes:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: read
    outputs:
      packages: ${{ steps.filter.outputs.changes }}
    steps:
      - uses: santosr2/conditional-paths-action@v1
        id: filter
        with:
          filters: |
            package-a: 'packages/a/**'
            package-b: 'packages/b/**'
            package-c: 'packages/c/**'

  build:
    needs: changes
    if: ${{ needs.changes.outputs.packages != '[]' }}
    strategy:
      matrix:
        package: ${{ fromJSON(needs.changes.outputs.packages) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build ${{ matrix.package }}
        run: npm run build --workspace=${{ matrix.package }}
```

### Advanced File Processing

```yaml
- uses: santosr2/conditional-paths-action@v1
  id: filter
  with:
    list-files: json
    filters: |
      typescript:
        - added|modified: '**/*.{ts,tsx}'
      docs:
        - added|modified: '**/*.md'

- name: Type Check Changed Files
  if: steps.filter.outputs.typescript == 'true'
  run: |
    files=$(echo '${{ steps.filter.outputs.typescript_files }}' | jq -r '.[]')
    npx tsc --noEmit $files

- name: Lint Documentation
  if: steps.filter.outputs.docs == 'true'
  run: npx markdownlint ${{ steps.filter.outputs.docs_files }}
```

### Pattern Matching Modes

```yaml
- uses: santosr2/conditional-paths-action@v1
  with:
    # Use 'every' mode to require ALL patterns to match
    predicate-quantifier: 'every'
    filters: |
      source-only:
        - 'src/**'           # Must be in src/
        - '!**/*.md'         # Must NOT be markdown
        - '!**/*.json'       # Must NOT be JSON
```

## 🔧 Filter Syntax

### Basic Patterns

```yaml
filters: |
  frontend:
    - 'src/web/**'
    - 'components/**'
  backend:
    - 'api/**'
    - 'services/**'
```

### Change Type Detection

```yaml
filters: |
  new-files:
    - added: '**'
  modified-source:
    - modified: 'src/**'
  removed-tests:
    - deleted: '**/*.test.js'
  source-changes:
    - added|modified: 'src/**'
```

### External Filter Files

```yaml
- uses: santosr2/conditional-paths-action@v1
  with:
    filters: .github/filters.yml
```

### YAML Anchors for Reusability

```yaml
- uses: santosr2/conditional-paths-action@v1
  with:
    filters: |
      shared: &shared
        - 'lib/**'
        - 'utils/**'
      frontend:
        - *shared
        - 'web/**'
      backend:
        - *shared
        - 'api/**'
```

## 🏢 Real-World Usage

This action is trusted by major projects:

- **[Sentry](https://sentry.io/)** - [backend.yml](https://github.com/getsentry/sentry/blob/main/.github/workflows/backend.yml)
- **[GoogleChrome/web.dev](https://web.dev/)** - [lint-workflow.yml](https://github.com/GoogleChrome/web.dev/blob/main/.github/workflows/lint-workflow.yml)
- **[FreshBooks](https://freshbooks.com)** - [Python CI/CD Pipeline](https://dev.to/freshbooks/configuring-python-linting-to-be-part-of-cicd-using-github-actions-1731)

## ⚠️ Important Notes

- **Path Expressions**: Uses [picomatch](https://github.com/micromatch/picomatch) library with `dot: true` option
- **Quoting**: Always quote patterns that start with `*` (e.g., `'*.js'`)
- **Local Execution**: Use `act -P ubuntu-latest=nektos/act-environments-ubuntu:18.04` for local testing
- **Performance**: For pull requests, the action uses GitHub API for faster execution

## 🆕 What's New in v1

- ✅ **Node 20 Runtime** - Updated to latest GitHub Actions runtime
- ✅ **`predicate-quantifier`** - Choose between `some` (OR) and `every` (AND) matching
- ✅ **Enhanced File Lists** - New `csv` format and improved `shell`/`escape` formats
- ✅ **Better Matrix Support** - Improved `changes` output for dynamic matrix jobs
- ✅ **Picomatch Engine** - More powerful and consistent glob matching

For detailed changes, see [CHANGELOG.md](CHANGELOG.md).

## 📚 API Reference

### Filter Configuration

Filters can be defined inline or in external files:

```yaml
# Inline YAML
filters: |
  docs: '**/*.md'
  src: 'src/**'

# External file
filters: .github/filters.yml
```

### Advanced Options

| Pattern Type | Example | Description |
|--------------|---------|-------------|
| **Basic Glob** | `src/**` | All files in src directory |
| **Extensions** | `**/*.{ts,js}` | TypeScript and JavaScript files |
| **Negation** | `!**/*.test.js` | Exclude test files |
| **Change Type** | `added\|modified: src/**` | Only added/modified files in src |

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

This project uses [mise](https://mise.jdx.dev/) to manage toolchain versions for consistent development and CI environments.

```bash
# Clone the repository
git clone https://github.com/santosr2/conditional-paths-action.git
cd conditional-paths-action

# Install development toolchain (Node.js, pnpm)
mise install

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build and package the action
pnpm build && pnpm package

# Run all checks (type checking, linting, tests)
pnpm run check && pnpm run lint && pnpm test
```

**Available Commands:**

- `pnpm run build` - Compile TypeScript to JavaScript
- `pnpm run package` - Bundle the action for distribution
- `pnpm run check` - Type check with TypeScript
- `pnpm run lint` - Lint code with ESLint
- `pnpm run format` - Format code with Prettier
- `pnpm run test` - Run unit tests with Jest
- `pnpm run test:coverage` - Run tests with coverage report

**CI/CD:**
The project uses modern GitHub Actions with mise integration for consistent toolchain management across all environments. All third-party actions are pinned by commit SHA for supply chain security.

### Release Process

**How to cut a release:**

```bash
# Create and push a semver tag
git tag v1.1.0
git push origin v1.1.0

# The release workflow will automatically:
# - Validate the semver format
# - Run full test suite and build
# - Create GitHub release with changelog
# - Update major version tag (v1)
```

**How to set up locally with mise:**

```bash
git clone https://github.com/santosr2/conditional-paths-action.git
cd conditional-paths-action
mise install    # Installs Node 20 and pnpm 10
pnpm install     # Install dependencies
```

### Security & Maintenance

**SHA-pinning Update Strategy:**
Third-party GitHub Actions are pinned by commit SHA for security. To update:

1. Check for new releases on the action's repository
2. Update the SHA and version comment in workflow files
3. Test the workflow before merging

**Dependency Updates:**
Dependabot automatically creates PRs for dependency updates with grouped PRs for related changes (dev dependencies, production dependencies, and type definitions).

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🔗 Related Actions

- [test-reporter](https://github.com/dorny/test-reporter) - Display test results directly in GitHub

---

⭐ **Found this action helpful?** Give it a star and share it with your team!
