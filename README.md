# Conditional Paths Action

<!-- Core Functionality -->
[![GitHub release](https://img.shields.io/github/v/release/santosr2/conditional-paths-action?style=flat-square&logo=github)](https://github.com/santosr2/conditional-paths-action/releases/latest)
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Conditional%20Paths%20Action-blue?style=flat-square&logo=github)](https://github.com/marketplace/actions/conditional-paths-action)

<!-- Quality & Security -->
[![CI Pipeline](https://github.com/santosr2/conditional-paths-action/actions/workflows/ci.yml/badge.svg)](https://github.com/santosr2/conditional-paths-action/actions/workflows/ci.yml)
[![CodeQL Security](https://github.com/santosr2/conditional-paths-action/actions/workflows/codeql.yml/badge.svg)](https://github.com/santosr2/conditional-paths-action/actions/workflows/codeql.yml)
[![License Compliance](https://github.com/santosr2/conditional-paths-action/actions/workflows/license.yml/badge.svg)](https://github.com/santosr2/conditional-paths-action/actions/workflows/license.yml)
[![Coverage](https://img.shields.io/badge/coverage-84%25-brightgreen?style=flat-square)](https://github.com/santosr2/conditional-paths-action/actions)

<!-- Technology Stack -->
[![Node.js 22](https://img.shields.io/badge/Node.js-22-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

<!-- Documentation & Transparency -->
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue?style=flat-square)](https://santosr2.github.io/conditional-paths-action/docs/)
[![Performance](https://img.shields.io/badge/performance-reports-brightgreen?style=flat-square)](https://santosr2.github.io/conditional-paths-action/performance/)
[![SBOM](https://img.shields.io/badge/SBOM-CycloneDX%20v1.4-orange?style=flat-square)](https://santosr2.github.io/conditional-paths-action/sbom/)

<!-- DevSecOps -->
[![DevSecOps](https://img.shields.io/badge/DevSecOps-shift%20left-blue?style=flat-square)](https://github.com/santosr2/conditional-paths-action/security)
[![Supply Chain](https://img.shields.io/badge/supply%20chain-transparent-green?style=flat-square)](https://santosr2.github.io/conditional-paths-action/sbom/)
[![Pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?style=flat-square&logo=pre-commit)](https://github.com/pre-commit/pre-commit)

> [!NOTE]
> This action builds upon [dorny/paths-filter](https://github.com/dorny/paths-filter), forked from [commit de90cc6](https://github.com/dorny/paths-filter/commit/de90cc6fb38fc0963ad72b210f1f284cd68cea36). Special thanks to Dorny and all contributors for laying the groundwork for this enhanced version.

A powerful [GitHub Action](https://github.com/features/actions) that enables conditional execution of workflow steps and jobs based on the files modified by pull requests, feature branches, or recent commits.

**⚡ Why Use This Action?**

- **Save Time & Resources**: Run slow tasks like integration tests or deployments only for changed components
- **Perfect for Monorepos**: Ideal for multi-package repositories where you only want to build/test affected packages
- **Flexible Detection**: Works with pull requests, feature branches, and long-lived branches
- **Rich Output Formats**: Get file lists in JSON, CSV, shell, or escaped formats
- **Advanced Filtering**: Support for glob patterns, change types (added/modified/deleted), and predicate quantifiers

> [!Note]
> GitHub's built-in [path filters](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#onpushpull_requestpaths) don't work at the job or step level, making this action essential for conditional workflow execution.

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

## 🔐 Required Permissions

This action requires specific permissions depending on the workflow trigger:

```yaml
permissions:
  pull-requests: read  # Required for pull_request events
  contents: read       # Required for repository access
```

**Note**: For `pull_request` workflows, only `pull-requests: read` is required as the action uses the GitHub API for faster performance.

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

<details>
<summary><strong>🔥 Quick Start - Minimal Usage</strong></summary>

```yaml
name: Conditional Workflow
on: [push, pull_request]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: read
    steps:
      - uses: santosr2/conditional-paths-action@v1
        id: changes
        with:
          filters: |
            src: 'src/**'
            docs: 'docs/**'

      - name: Build if source changed
        if: steps.changes.outputs.src == 'true'
        run: npm run build

      - name: Deploy docs if changed
        if: steps.changes.outputs.docs == 'true'
        run: npm run deploy-docs
```
</details>

<details>
<summary><strong>⚙️ Advanced Usage with Matrix and Permissions</strong></summary>

```yaml
name: Monorepo CI
on: [push, pull_request]

jobs:
  changes:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: read
      contents: read
    outputs:
      packages: ${{ steps.filter.outputs.changes }}
      frontend: ${{ steps.filter.outputs.frontend }}
      backend: ${{ steps.filter.outputs.backend }}
    steps:
      - uses: santosr2/conditional-paths-action@v1
        id: filter
        with:
          filters: |
            frontend: 'packages/frontend/**'
            backend: 'packages/backend/**'
            shared: 'packages/shared/**'

  test-packages:
    needs: changes
    if: ${{ needs.changes.outputs.packages != '[]' }}
    strategy:
      matrix:
        package: ${{ fromJSON(needs.changes.outputs.packages) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test ${{ matrix.package }}
        run: npm test --workspace=${{ matrix.package }}

  deploy-frontend:
    needs: changes
    if: needs.changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Frontend
        run: npm run deploy:frontend
```
</details>

<details>
<summary><strong>🧪 Local Testing with act</strong></summary>

```bash
# Install act
brew install act  # macOS
# or curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Test basic scenarios
act -W .github/workflows/examples/simple-usage.yml -j test-simple-filters -P ubuntu-latest=catthehacker/ubuntu:act-22.04

# Test monorepo workflows
act -W .github/workflows/examples/monorepo-usage.yml -j test-monorepo-filters -P ubuntu-latest=catthehacker/ubuntu:act-22.04

# Test with verbose output
act -W .github/workflows/examples/matrix-usage.yml -P ubuntu-latest=catthehacker/ubuntu:act-22.04 -v

# Use environment file for secrets (create .env first)
act --env-file .env -W .github/workflows/examples/simple-usage.yml
```

For detailed local testing examples, see our [examples directory](examples/) and [LOCAL-DEVELOPMENT.md](LOCAL-DEVELOPMENT.md).
</details>

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

- ✅ **Node >= 22 Runtime** - Updated to latest GitHub Actions runtime
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

## 📚 Documentation

Complete documentation is available in the [`/docs`](docs/) directory:

- **[API Reference](docs/api/)** - Detailed TypeScript API documentation
- **[Examples Collection](examples/)** - Real-world usage patterns and test cases
- **[Local Development](LOCAL-DEVELOPMENT.md)** - Setup and development workflow
- **[Migration Guide](MIGRATION.md)** - Upgrading from previous versions

## ⚡ Performance

Performance metrics and benchmarks are available at [`/performance`](https://santosr2.github.io/conditional-paths-action/performance):

- **Bundle Size**: 669KB optimized for GitHub Actions runtime
- **Cold Start**: ~200ms average initialization time
- **Filter Processing**: 42K+ operations/sec for simple patterns
- **Memory Usage**: <50MB peak for typical workloads

Performance is continuously monitored through automated benchmarks on every commit.

## 🔒 Security

This repository maintains high security standards with multiple automated scanning layers:

### Active Security Measures
- **[CodeQL Analysis](https://github.com/santosr2/conditional-paths-action/security/code-scanning)** - Automated vulnerability detection
- **Secret Scanning** - Prevents accidental credential leaks
- **Dependency Scanning** - Monitors for known vulnerabilities
- **License Compliance** - Validates all dependencies against approved licenses
- **SBOM Generation** - Full transparency of software supply chain

### Reporting Vulnerabilities
Please report security issues through our [Security Policy](SECURITY.md). Do not create public issues for vulnerabilities.

### Security Resources
- **[Security Advisories](https://github.com/santosr2/conditional-paths-action/security/advisories)**
- **[Vulnerability Reports](https://github.com/santosr2/conditional-paths-action/security)**
- **[Supply Chain Security](https://github.com/santosr2/conditional-paths-action/network/dependencies)**

## 📋 Software Bill of Materials (SBOM)

We provide complete transparency into our software supply chain through automatically generated SBOMs:

### What is an SBOM?
A Software Bill of Materials (SBOM) is a comprehensive inventory of all components, libraries, and dependencies used in this action. It provides:
- **Supply Chain Transparency** - Know exactly what's running in your workflows
- **License Compliance** - Verify all dependencies meet your organization's requirements
- **Security Auditing** - Track and respond to vulnerabilities in dependencies
- **Regulatory Compliance** - Meet emerging software supply chain requirements

### Access SBOM
- **[View SBOM Online](https://santosr2.github.io/conditional-paths-action/sbom)** - Web interface for browsing components
- **[Download SBOM](dist/sbom.json)** - Machine-readable CycloneDX format
- **Verify Integrity** - All SBOMs are cryptographically signed

### SBOM Format
We use the industry-standard **CycloneDX v1.4** format, compatible with:
- SPDX tools and validators
- Dependency-Track and other SBOM analysis platforms
- Government and enterprise compliance tools
- Open-source supply chain security tools

The SBOM is automatically generated during our build process and updated with every release.

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
mise install    # Installs Node 22 and pnpm 10
pnpm install     # Install dependencies
```

## 🧪 Local Testing with act

This action includes comprehensive examples and workflows designed for local testing with [act](https://nektosact.com/). This allows you to test the action behavior locally before pushing changes.

### Setup

1. **Install act**: Follow the [installation guide](https://nektosact.com/installation/)
2. **Install dependencies**:
   ```bash
   pnpm install
   pre-commit install
   ```

### Quick Test Examples

```bash
# Test basic filtering functionality
act -W .github/workflows/examples/simple-usage.yml -j test-simple-filters

# Test monorepo scenarios with conditional jobs
act -W .github/workflows/examples/monorepo-usage.yml -j test-monorepo-filters

# Test matrix scenarios (quantifiers, bases, change types)
act -W .github/workflows/examples/matrix-usage.yml

# Use specific runner image for consistency
act -P ubuntu-latest=catthehacker/ubuntu:act-24.04
```

### Available Examples

- **`examples/simple/`** - Basic usage patterns with common filters
- **`examples/monorepo/`** - Advanced monorepo filtering with change type constraints
- **`examples/fixtures/`** - Sample repository structures for testing
- **`.github/workflows/examples/`** - Complete workflow examples compatible with act

### Development Workflow

```bash
# Run all quality checks
pnpm run all

# Run performance benchmarks
pnpm run bench

# Test with act locally
act -W .github/workflows/examples/simple-usage.yml

# Package for distribution
pnpm run package
```

See [examples/README.md](examples/README.md) for detailed local testing documentation.

### Security & Maintenance

**SHA-pinning Update Strategy:**
Third-party GitHub Actions are pinned by commit SHA for security. To update:

1. Check for new releases on the action's repository
2. Update the SHA and version comment in workflow files
3. Test the workflow before merging

**Dependency Updates:**
Dependabot automatically creates PRs for dependency updates with grouped PRs for related changes (dev dependencies, production dependencies, and type definitions).

## 🛡️ DevSecOps & Security

This project implements comprehensive DevSecOps practices with security integrated at every step of the development lifecycle.

### 🔒 Security Features

- **Static Application Security Testing (SAST)**: CodeQL analysis on every commit
- **Secret Scanning**: GitLeaks detection prevents credential leaks
- **Dependency Vulnerability Scanning**: Trivy scanner checks for known CVEs
- **License Compliance**: Automated SPDX header enforcement and dependency validation
- **Supply Chain Security**: Complete SBOM (Software Bill of Materials) generation
- **Container Security**: SHA-pinned GitHub Actions with minimal permissions

### 📊 Transparency & Compliance

- **[📚 API Documentation](https://santosr2.github.io/conditional-paths-action/docs/)** - Complete TypeDoc documentation
- **[⚡ Performance Reports](https://santosr2.github.io/conditional-paths-action/performance/)** - Bundle analysis and benchmarks
- **[🔒 SBOM Viewer](https://santosr2.github.io/conditional-paths-action/sbom/)** - Interactive Software Bill of Materials
- **[🛡️ Security Dashboard](https://github.com/santosr2/conditional-paths-action/security)** - Vulnerability and compliance status

### 🔄 Automated Quality Gates

Every commit goes through comprehensive validation:

1. **Security Scanning** - Vulnerabilities, secrets, and compliance checks
2. **Code Quality** - TypeScript compilation, ESLint, and Prettier formatting
3. **Testing** - 80%+ coverage requirement with unit, integration, and E2E tests
4. **License Validation** - SPDX headers and dependency license compliance
5. **SBOM Generation** - Supply chain transparency documentation
6. **Performance Analysis** - Bundle size and memory usage monitoring

### 📋 Development Commands

```bash
# Security & Compliance
mise run security          # Run GitLeaks secret detection
mise run license-check     # Validate license compliance
mise run sbom             # Generate Software Bill of Materials

# Quality Gates
mise run all-checks       # Run complete validation pipeline
mise run release-check    # Pre-release validation

# DevSecOps Validation
mise run validate-devsecops # Complete DevSecOps validation suite
mise run security-audit    # Comprehensive security audit

# Documentation
mise run docs             # Generate TypeDoc documentation
mise run docs-serve       # Serve docs locally at http://localhost:8080
```

### 🏗️ Release Process

Releases are fully automated using conventional commits:

1. **Conventional Commits**: Use `feat:`, `fix:`, `docs:`, etc. for automatic categorization
2. **Automated PRs**: release-please creates release PRs with changelogs
3. **Secure Releases**: SBOM attachment, security validation, major tag updates
4. **Integration Testing**: Released versions tested automatically

See [How to cut a release](#) for detailed instructions.

## 👥 Contributors

Thanks to all the amazing people who have contributed to this project! 🙌

<div align="center">
<a href="https://github.com/santosr2/conditional-paths-action/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=santosr2/conditional-paths-action&max=100&columns=10" alt="Contributors" />
</a>
</div>

See our complete [Contributors Hall of Fame](CONTRIBUTORS.md) for detailed recognition and contribution stats.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

⭐ **Found this action helpful?** Give it a star and share it with your team!

[![GitHub stars](https://img.shields.io/github/stars/santosr2/conditional-paths-action?style=social)](https://github.com/santosr2/conditional-paths-action/stargazers)

</div>
