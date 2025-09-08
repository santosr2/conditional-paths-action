<div align="center">

# Conditional Paths Action

<!-- Core Functionality -->
[![GitHub release](https://img.shields.io/github/v/release/santosr2/conditional-paths-action?style=flat-square&logo=github)](https://github.com/santosr2/conditional-paths-action/releases/latest)
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Conditional%20Paths%20Action-blue?style=flat-square&logo=github)](https://github.com/marketplace/actions/conditional-paths-action)

<!-- Quality & Security -->
[![CI Pipeline](https://github.com/santosr2/conditional-paths-action/actions/workflows/ci.yml/badge.svg)](https://github.com/santosr2/conditional-paths-action/actions/workflows/ci.yml)
[![CodeQL Security](https://github.com/santosr2/conditional-paths-action/actions/workflows/codeql.yml/badge.svg)](https://github.com/santosr2/conditional-paths-action/actions/workflows/codeql.yml)
[![License Compliance](https://github.com/santosr2/conditional-paths-action/actions/workflows/license.yml/badge.svg)](https://github.com/santosr2/conditional-paths-action/actions/workflows/license.yml)
[![Coverage](https://img.shields.io/badge/coverage-84%25-brightgreen?style=flat-square)](https://github.com/santosr2/conditional-paths-action/actions)

<!-- Node.js Compatibility Matrix -->
[![Node.js 22](https://img.shields.io/badge/Node.js-22%20dev%2FCI-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Node.js 24](https://img.shields.io/badge/Node.js-24%20runtime-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Compatibility Matrix](https://img.shields.io/badge/matrix-Node.js%2022%2F24-blue?style=flat-square)](https://github.com/santosr2/conditional-paths-action/actions/workflows/ci.yml)

<!-- Technology Stack -->
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![ESM](https://img.shields.io/badge/ESM-ES2022-yellow?style=flat-square&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

<!-- Documentation & Transparency -->
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue?style=flat-square)](https://santosr2.github.io/conditional-paths-action/docs/)
[![Performance](https://img.shields.io/badge/performance-reports-brightgreen?style=flat-square)](https://santosr2.github.io/conditional-paths-action/performance/)
[![SBOM](https://img.shields.io/badge/SBOM-CycloneDX%20v1.4-orange?style=flat-square)](https://santosr2.github.io/conditional-paths-action/sbom/)
[![Discussions](https://img.shields.io/badge/discussions-Q%26A-blue?style=flat-square&logo=github)](https://github.com/santosr2/conditional-paths-action/discussions)

<!-- DevSecOps -->
[![DevSecOps](https://img.shields.io/badge/DevSecOps-shift%20left-blue?style=flat-square)](https://github.com/santosr2/conditional-paths-action/security)
[![Supply Chain](https://img.shields.io/badge/supply%20chain-transparent-green?style=flat-square)](https://santosr2.github.io/conditional-paths-action/sbom/)
[![Pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?style=flat-square&logo=pre-commit)](https://github.com/pre-commit/pre-commit)

</div>

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

## 🔗 Node.js Compatibility Matrix

This action supports **dual Node.js compatibility** to maximize compatibility across different environments:

### ✅ Supported Versions

| Environment | Node.js Version | Status | Purpose |
|-------------|----------------|--------|---------|
| **GitHub Actions Runtime** | **Node.js 24** | ✅ Primary | Action execution in workflows |
| **Local Development** | **Node.js 22** | ✅ Supported | Development and testing |
| **CI/CD Pipeline** | **Node.js 22** | ✅ Tested | Dependabot compatibility |

### 🔄 Matrix Validation

**All workflows (CI, security scans, documentation generation, performance benchmarks, and SBOM generation) are validated on a Node.js 22/24 compatibility matrix.** This ensures the action works reliably across both development and runtime environments.

Our CI pipeline runs comprehensive testing across:
- **Node.js 22**: Development, CI, and Dependabot compatibility
- **Node.js 24**: GitHub Actions runtime validation
- **Matrix Strategy**: `fail-fast: false` ensures both versions are fully tested

```yaml
strategy:
  fail-fast: false
  matrix:
    node-version: [22, 24]  # Full compatibility matrix
```

This approach provides maximum compatibility while leveraging the latest GitHub Actions runtime capabilities.

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

# Build the action first
pnpm run package

# Test basic scenarios
act workflow_dispatch -W .github/workflows/examples/test-action-locally.yml

# Test specific jobs
act workflow_dispatch -W .github/workflows/examples/test-action-locally.yml -j test-basic-filters

# Test with verbose output for debugging
act workflow_dispatch -W .github/workflows/examples/test-action-locally.yml --verbose

# Use specific runner image for Node.js compatibility
act -P ubuntu-latest=catthehacker/ubuntu:act-22.04
```

For detailed local testing examples, see our [examples directory](examples/) and [act-commands.md](examples/act-commands.md).
</details>

## 📚 Documentation

Complete documentation is available in our organized documentation structure:

### 🔗 Documentation Links

- **[📖 API Reference](https://santosr2.github.io/conditional-paths-action/docs/)** - Complete TypeScript API documentation generated with TypeDoc
- **[📁 Examples Collection](examples/)** - Real-world usage patterns, test cases, and local testing examples
- **[🚀 Local Development](CONTRIBUTING.md#development-setup)** - Setup guide for contributors and local development
- **[🔄 Migration Guide](MIGRATION.md)** - Upgrading from previous versions and breaking changes

### 📋 Available Documentation

Our documentation covers all aspects of using and contributing to this action:
- Complete filter syntax and pattern matching
- Advanced configuration options and use cases
- Performance optimization tips and benchmarks
- Security best practices and compliance
- Local testing with act and troubleshooting guides

## ⚡ Performance

Performance metrics and benchmarks are continuously monitored and available at **[/performance](https://santosr2.github.io/conditional-paths-action/performance/)**:

### 🎯 Key Metrics

- **Bundle Size**: 672KB optimized for GitHub Actions runtime
- **Cold Start**: ~117K operations/sec for rapid sequential operations
- **Filter Processing**: 46K+ operations/sec for complex pattern matching
- **Memory Usage**: <50MB peak for typical monorepo workloads
- **Large Scale**: Handles 10K+ files efficiently in monorepo environments

### 📊 Continuous Monitoring

Performance is automatically tracked through:
- **Automated Benchmarks**: Run on every commit and release
- **Bundle Analysis**: Size tracking with historical trends
- **Memory Profiling**: Peak usage monitoring across different scenarios
- **Real-world Testing**: Matrix testing across Node.js 22/24 environments

## 🔒 Security

This repository maintains the highest security standards with comprehensive automated scanning and transparent reporting:

### 🛡️ Active Security Measures

- **[CodeQL Analysis](https://github.com/santosr2/conditional-paths-action/security/code-scanning)** - Automated SAST vulnerability detection
- **Secret Scanning** - GitLeaks integration prevents credential leaks
- **Dependency Scanning** - Trivy scanner monitors for known CVEs
- **License Compliance** - Validates all dependencies against approved licenses
- **SBOM Generation** - Complete software supply chain transparency
- **Container Security** - SHA-pinned actions with minimal permissions

### 🚨 Reporting Vulnerabilities

Please report security issues through our **[Security Policy](SECURITY.md)**. Do not create public issues for security vulnerabilities.

### 🔍 Security Resources

- **[🛡️ Security Advisories](https://github.com/santosr2/conditional-paths-action/security/advisories)** - Published vulnerability reports
- **[📊 Security Dashboard](https://github.com/santosr2/conditional-paths-action/security)** - Real-time security status
- **[🔗 Dependency Graph](https://github.com/santosr2/conditional-paths-action/network/dependencies)** - Supply chain visibility

## 📋 Software Bill of Materials (SBOM)

We provide complete **supply chain transparency** through automatically generated SBOMs in industry-standard format:

### 🎯 What is an SBOM?

A Software Bill of Materials (SBOM) is a comprehensive inventory of all components, libraries, and dependencies used in this action. It provides:

- **🔍 Supply Chain Transparency** - Know exactly what's running in your workflows
- **⚖️ License Compliance** - Verify all dependencies meet your organization's requirements
- **🛡️ Security Auditing** - Track and respond to vulnerabilities in dependencies
- **📋 Regulatory Compliance** - Meet emerging software supply chain requirements

### 📊 Access SBOM

- **[🌐 Interactive SBOM Viewer](https://santosr2.github.io/conditional-paths-action/sbom/)** - Web interface for browsing components
- **[📁 Download SBOM](dist/sbom.json)** - Machine-readable CycloneDX v1.4 format
- **✅ Verify Integrity** - All SBOMs are cryptographically validated

### 🔧 SBOM Format & Compatibility

We use the industry-standard **CycloneDX v1.4** format, compatible with:
- SPDX tools and validators
- Dependency-Track and other SBOM analysis platforms
- Government and enterprise compliance frameworks
- Open-source supply chain security tools

The SBOM is automatically generated during our build process and updated with every release, ensuring complete accuracy and freshness.

## 💬 Community & Discussions

Join our vibrant community for support, feature requests, and collaboration:

### 🗣️ [GitHub Discussions](https://github.com/santosr2/conditional-paths-action/discussions)

Our Discussions are organized into focused categories:

| Category | Purpose | Use For |
|----------|---------|---------|
| **[💡 Q&A](https://github.com/santosr2/conditional-paths-action/discussions/categories/q-a)** | Get help and support | Usage questions, troubleshooting, best practices |
| **[🚀 Ideas](https://github.com/santosr2/conditional-paths-action/discussions/categories/ideas)** | Propose new features | Feature requests, enhancement suggestions |
| **[📢 Announcements](https://github.com/santosr2/conditional-paths-action/discussions/categories/announcements)** | Stay updated | Release notes, important updates, roadmap |
| **[🎉 Show and Tell](https://github.com/santosr2/conditional-paths-action/discussions/categories/show-and-tell)** | Share your usage | Success stories, creative implementations, tutorials |

### 📋 [Project Board](https://github.com/santosr2/conditional-paths-action/projects/1)

Track development progress and roadmap through our automated project board:

- **🔄 Automated Workflow**: Issues and PRs are automatically added and moved through columns
- **📊 Progress Tracking**: Clear visibility into what's being worked on and what's coming next
- **🎯 Roadmap Visibility**: See planned features and improvements
- **🤝 Contributor Coordination**: Understand where help is needed most

The board automatically syncs with:
- New issues → Added to "Todo" column
- In-progress PRs → Moved to "In Progress" column
- Merged PRs → Moved to "Done" column
- Released features → Archived

## 🤝 Contributing

We welcome contributions from developers of all skill levels! Please see our comprehensive **[CONTRIBUTING.md](CONTRIBUTING.md)** for guidelines.

### 🛠️ Development Setup

This project uses **[mise](https://mise.jdx.dev/)** for consistent toolchain management across development and CI environments:

```bash
# Clone the repository
git clone https://github.com/santosr2/conditional-paths-action.git
cd conditional-paths-action

# Install development toolchain (Node.js 22, pnpm 10)
mise install

# Install dependencies and setup pre-commit hooks
pnpm install

# Run the complete validation pipeline
pnpm run ci
```

### 🧪 Local Testing

Test your changes locally before submitting:

```bash
# Build and package the action
pnpm run package

# Run comprehensive test suite
pnpm run test:coverage  # ≥80% coverage required

# Test with act (local GitHub Actions runner)
act workflow_dispatch -W .github/workflows/examples/test-action-locally.yml

# Run performance benchmarks
pnpm run bench
```

### 🔍 Development Requirements

- **Node.js 22**: Required for local development (managed by mise)
- **Compatibility Testing**: All changes tested against Node.js 22/24 matrix
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Security**: Pre-commit hooks enforce security and license compliance
- **Documentation**: TSDoc required for all public APIs

## 👥 Contributors

Thanks to all the amazing people who have contributed to this project! 🙌

<div align="center">
<a href="https://github.com/santosr2/conditional-paths-action/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=santosr2/conditional-paths-action&max=100&columns=10" alt="Contributors" />
</a>
</div>

See our complete **[Contributors Hall of Fame](CONTRIBUTORS.md)** for detailed recognition and contribution statistics.

## 📄 License

This project is licensed under the **[MIT License](LICENSE)** - see the file for details.

---

<div align="center">

⭐ **Found this action helpful?** Give it a star and share it with your team!

[![GitHub stars](https://img.shields.io/github/stars/santosr2/conditional-paths-action?style=social)](https://github.com/santosr2/conditional-paths-action/stargazers)
[![Follow @santosr2](https://img.shields.io/github/followers/santosr2?style=social&label=Follow)](https://github.com/santosr2)

**[📖 View Documentation](https://santosr2.github.io/conditional-paths-action/docs/)** •
**[⚡ Performance Reports](https://santosr2.github.io/conditional-paths-action/performance/)** •
**[🔒 Security Dashboard](https://github.com/santosr2/conditional-paths-action/security)** •
**[💬 Join Discussions](https://github.com/santosr2/conditional-paths-action/discussions)**

</div>
