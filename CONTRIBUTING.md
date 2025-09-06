# Contributing to Conditional Paths Action

Thank you for considering contributing to the Conditional Paths Action! This document provides comprehensive guidelines for contributors to help maintain code quality, security, and consistency across the project.

## 🎯 Overview

We welcome contributions of all kinds:
- 🐛 Bug fixes and issue reports
- ✨ New features and enhancements
- 📚 Documentation improvements
- 🧪 Test coverage improvements
- ⚡ Performance optimizations
- 🛡️ Security improvements

## 🛠️ Development Setup

### Prerequisites

This project uses [mise](https://mise.jdx.dev/) for consistent toolchain management across development and CI environments.

**Required Node.js Version**: **Node.js 22** for local development and CI compatibility.

> **Note on Dual Compatibility**: While we develop with Node.js 22, our CI pipeline validates the action against both Node.js 22 and 24 to ensure compatibility across development and runtime environments. The action runtime uses Node.js 24 (`using: node24` in action.yml).

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/santosr2/conditional-paths-action.git
cd conditional-paths-action

# Install toolchain (Node.js 22, pnpm 10, gitleaks, pre-commit)
mise install

# Install dependencies and setup pre-commit hooks
pnpm install

# Verify everything works
pnpm run ci
```

### Manual Setup (without mise)

If you prefer not to use mise:

```bash
# Ensure Node.js 22 and pnpm 10 are installed
node --version  # Should be v22.x.x
pnpm --version  # Should be 10.x.x

# Install dependencies
pnpm install

# Setup pre-commit hooks (optional but recommended)
pre-commit install
```

## 🔄 CI/CD Matrix Compatibility

**Important**: All changes are automatically tested against a **Node.js 22/24 compatibility matrix** to ensure:

- **Node.js 22**: Development environment and Dependabot compatibility
- **Node.js 24**: GitHub Actions runtime validation

Our CI pipeline validates:
- ✅ Unit tests on both Node.js versions
- ✅ Integration tests with real repository scenarios
- ✅ Security scans (CodeQL, GitLeaks, Trivy)
- ✅ Performance benchmarks
- ✅ SBOM generation and validation
- ✅ License compliance checks

The matrix uses `fail-fast: false` to ensure both versions are fully tested even if one fails.

## 🔧 Development Workflow

### Available Commands

```bash
# Development
pnpm run build            # Compile TypeScript to lib/
pnpm run package          # Build and bundle action for distribution
pnpm run dev              # Build and run tests in watch mode
pnpm run clean            # Clean build artifacts

# Testing
pnpm run test             # Run all tests
pnpm run test:coverage    # Run tests with coverage report (≥80% required)
pnpm run test:unit        # Run only unit tests
pnpm run test:integration # Run integration tests
pnpm run test:e2e         # Run end-to-end tests
pnpm run bench            # Run performance benchmarks

# Code Quality
pnpm run lint             # Lint code with ESLint
pnpm run lint:fix         # Fix linting issues automatically
pnpm run format           # Format code with Prettier
pnpm run format:check     # Check formatting without changes
pnpm run check            # TypeScript type checking

# Security & Compliance
pnpm run security-audit   # Run security vulnerability audit
pnpm run license-check    # Validate license compliance
pnpm run sbom             # Generate Software Bill of Materials

# Complete Validation
pnpm run ci               # Run complete CI pipeline locally
pnpm run validate         # Run format check + lint + typecheck
```

### Pre-commit Hooks

We use comprehensive pre-commit hooks to maintain code quality:

```bash
# Install hooks (done automatically with pnpm install)
pre-commit install

# Run hooks on all files
pre-commit run --all-files

# Run specific hooks
pre-commit run lint
pre-commit run test-coverage
```

**Active Pre-commit Hooks:**
- ✅ Code formatting (Prettier)
- ✅ Linting (ESLint with type checking)
- ✅ TypeScript compilation
- ✅ Test coverage validation (≥80%)
- ✅ License compliance checking
- ✅ Security audit (pnpm audit)
- ✅ SBOM validation
- ✅ YAML/JSON/TOML validation

## 🧪 Testing Strategy

### Test Types

**Unit Tests** (`__tests__/*.test.ts`)
- Test individual functions and classes
- Fast execution with comprehensive mocking
- Required for all new features

**Integration Tests** (`__tests__/integration.test.ts`)
- Test component interactions
- Use real file system operations
- Validate filter processing pipelines

**End-to-End Tests** (`__tests__/e2e.test.ts`)
- Test complete workflows with real git repositories
- Simulate various change detection scenarios
- Validate action behavior in realistic conditions

**Benchmark Tests** (`__tests__/benchmark.bench.ts`)
- Performance testing for critical paths
- Memory usage validation
- Regression prevention for performance

### Coverage Requirements

- **Minimum Coverage**: 80% across all categories
- **Coverage Enforcement**: Automated in CI and pre-commit hooks
- **Coverage Reports**: Generated locally and in CI

```bash
# Run tests with coverage
pnpm run test:coverage

# View coverage report
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

### Local Testing with act

Test the action locally using [act](https://github.com/nektos/act):

```bash
# Install act (if not already installed)
# macOS: brew install act
# Linux: curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Build the action first
pnpm run package

# Test basic functionality
act workflow_dispatch -W .github/workflows/examples/test-action-locally.yml

# Test specific jobs
act workflow_dispatch -W .github/workflows/examples/test-action-locally.yml -j test-basic-filters

# Use specific runner for Node.js compatibility
act -P ubuntu-latest=catthehacker/ubuntu:act-22.04
```

## 💻 Code Style & Standards

### TypeScript Configuration

We use the strictest possible TypeScript configuration:

- ✅ **Strict Mode**: All strict compiler options enabled
- ✅ **Latest Target**: ES2023 with ES2022 modules
- ✅ **Zero Tolerance**: No unused locals, parameters, or unreachable code
- ✅ **ESM First**: Full ECMAScript modules support

### Code Documentation

**TSDoc Required**: All public APIs must have comprehensive TSDoc comments:

```typescript
/**
 * Processes filter rules and matches them against changed files.
 *
 * @param files - Array of files to process
 * @param rules - Filter rules to apply
 * @returns Object mapping filter names to matching files
 *
 * @example
 * ```typescript
 * const results = processFilters(files, rules)
 * console.log(results.src) // Files matching 'src' filter
 * ```
 */
export function processFilters(files: File[], rules: FilterRules): FilterResults {
  // Implementation
}
```

**Inline Comments**: Add comments for complex logic, algorithms, or non-obvious code:

```typescript
// Use exponential backoff for git fetch operations to handle large repositories
const fetchDepth = Math.min(initialDepth * Math.pow(2, retryCount), MAX_FETCH_DEPTH)
```

### Naming Conventions

- **Functions/Variables**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE
- **Types/Interfaces**: PascalCase
- **Files**: kebab-case for modules, PascalCase for classes

## 🔒 Security Guidelines

### Security Requirements

- **No Hardcoded Secrets**: Never commit API keys, tokens, or passwords
- **Input Validation**: Validate all external inputs (GitHub API, file paths, etc.)
- **Minimal Permissions**: Use least-privilege principle in action.yml
- **Dependency Security**: Keep dependencies updated and scan for vulnerabilities

### Security Validation

Every change goes through comprehensive security validation:

```bash
# Run security audit locally
pnpm run security-audit

# Check for secrets
mise run security

# Validate licenses
pnpm run license-check

# Generate SBOM for supply chain transparency
pnpm run sbom
```

### License Headers

All TypeScript source files must include SPDX license headers:

```typescript
/*
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2024 conditional-paths-action contributors
 * [Full MIT license text...]
 */
```

## 🚀 Contribution Process

### 1. Before You Start

- 🔍 **Check Existing Issues**: Search for related issues or discussions
- 💬 **Discuss Large Changes**: Open a discussion for significant features
- 📋 **Follow Project Board**: Check the [project board](https://github.com/santosr2/conditional-paths-action/projects/1) for planned work

### 2. Development Process

```bash
# 1. Create a feature branch
git checkout -b feature/my-awesome-feature

# 2. Make your changes following the guidelines above

# 3. Run the complete validation pipeline
pnpm run ci

# 4. Test locally with act
pnpm run package
act workflow_dispatch -W .github/workflows/examples/test-action-locally.yml

# 5. Commit using conventional commits
git add .
git commit -m "feat: add awesome new feature"

# 6. Push and create a pull request
git push origin feature/my-awesome-feature
```

### 3. Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) for automated release management:

**Format**: `<type>[optional scope]: <description>`

**Types**:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring without feature changes
- `test`: Test improvements
- `chore`: Build process or auxiliary tool changes
- `perf`: Performance improvements
- `ci`: CI/CD pipeline changes

**Examples**:
```bash
git commit -m "feat: add support for custom ignore patterns"
git commit -m "fix: resolve memory leak in large repository processing"
git commit -m "docs: update API documentation for filter syntax"
git commit -m "perf: optimize glob pattern matching for large file sets"
```

### 4. Pull Request Guidelines

**PR Title**: Use conventional commit format
**PR Description**: Include:
- 📝 **Summary**: What changes you made and why
- 🧪 **Testing**: How you tested your changes
- ✅ **Checklist**: Ensure all requirements are met
- 🔗 **Issues**: Link to related issues using `fixes #123`

**PR Template Checklist**:
- [ ] Code follows the project's style guidelines
- [ ] Self-review of the code has been performed
- [ ] Code is commented, particularly in hard-to-understand areas
- [ ] Tests have been added/updated for new functionality
- [ ] All tests pass locally (`pnpm run test:coverage`)
- [ ] Security scan passes (`pnpm run security-audit`)
- [ ] Documentation has been updated if needed
- [ ] Changes work on both Node.js 22 and 24 (tested via CI)

## 🐛 Bug Reports

When reporting bugs, please include:

- **Environment**: Node.js version, OS, GitHub Actions runner details
- **Reproduction**: Minimal example to reproduce the issue
- **Expected vs Actual**: What should happen vs what actually happens
- **Logs**: Relevant error messages or debug output
- **Configuration**: Your filter configuration and workflow setup

Use the bug report template in [.github/ISSUE_TEMPLATE/](https://github.com/santosr2/conditional-paths-action/tree/main/.github/ISSUE_TEMPLATE).

## 💡 Feature Requests

For new features:

- **Use Discussions**: Start with a [discussion](https://github.com/santosr2/conditional-paths-action/discussions/categories/ideas) to gather feedback
- **Describe Use Case**: Explain the problem you're trying to solve
- **Propose Solution**: Suggest how the feature should work
- **Consider Alternatives**: What other approaches could work?

## 📚 Documentation Guidelines

### Documentation Structure

- **README.md**: High-level overview, quick start, examples
- **CONTRIBUTING.md**: This file - contributor guidelines
- **SECURITY.md**: Security policy and vulnerability reporting
- **examples/**: Real-world usage examples and test cases
- **docs/**: Generated API documentation (TypeDoc)

### Documentation Standards

- **Clear Examples**: Include working code examples
- **Step-by-Step**: Provide detailed setup instructions
- **Troubleshooting**: Include common issues and solutions
- **Keep Updated**: Update docs when changing functionality

## 🏷️ Release Process

Releases are automated using conventional commits:

1. **Conventional Commits**: Your commits automatically determine release type
2. **Release Please**: Automated PRs are created with changelogs
3. **CI Validation**: Full test suite runs on Node.js 22/24 matrix
4. **Security Validation**: SBOM generation and security scans
5. **GitHub Release**: Automatic release with changelog and assets

**Manual Release** (maintainers only):
```bash
# Create and push a semantic version tag
git tag v1.2.0
git push origin v1.2.0

# GitHub Actions automatically handles:
# - Creating the GitHub release
# - Updating major version tag (v1)
# - Attaching SBOM and assets
```

## 🤝 Community Guidelines

### Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/). Be respectful, inclusive, and constructive in all interactions.

### Where to Ask Questions

- **🐛 Bugs**: Use GitHub Issues with the bug template
- **💡 Features**: Start a Discussion in the Ideas category
- **❓ Usage Help**: Use GitHub Discussions in Q&A
- **💬 General Chat**: Discussions in General category

### Recognition

All contributors are recognized in our [CONTRIBUTORS.md](CONTRIBUTORS.md) file and README. Contributions include:
- Code contributions
- Documentation improvements
- Bug reports and testing
- Feature suggestions and feedback
- Community support and moderation

## 📞 Getting Help

**Stuck on setup?**
- Check our [Local Development examples](examples/)
- Review [act testing documentation](examples/act-commands.md)
- Ask in [GitHub Discussions](https://github.com/santosr2/conditional-paths-action/discussions)

**Found a security issue?**
- **Do NOT** create a public issue
- Follow our [Security Policy](SECURITY.md)
- Report through GitHub Security Advisories

**Want to contribute but not sure how?**
- Check ["good first issue"](https://github.com/santosr2/conditional-paths-action/labels/good%20first%20issue) labels
- Look at the [Project Board](https://github.com/santosr2/conditional-paths-action/projects/1)
- Join the [Discussions](https://github.com/santosr2/conditional-paths-action/discussions) to introduce yourself

## 🙏 Thank You!

Your contributions make this project better for everyone. Whether you're fixing a typo, adding a feature, or helping other users, every contribution is valued and appreciated.

Ready to contribute? **[Check out our good first issues!](https://github.com/santosr2/conditional-paths-action/labels/good%20first%20issue)**
