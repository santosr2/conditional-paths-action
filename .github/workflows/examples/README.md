# GitHub Actions Examples

This directory contains example workflows demonstrating various usage patterns of the conditional-paths-action. All workflows are designed to be testable locally using [act](https://github.com/nektos/act).

## 🚀 Running Examples Locally

### Prerequisites

Install act for local GitHub Actions testing:

```bash
# Via mise (recommended - already configured in this project)
mise install

# Or via brew (macOS/Linux)
brew install act

# Or via curl
curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

### Quick Start

```bash
# Install dependencies
mise install
pnpm install

# Test a specific workflow
act push -W .github/workflows/examples/basic-usage.yml

# Test with specific event
act pull_request -W .github/workflows/examples/monorepo-selective.yml

# List available events for a workflow
act -l -W .github/workflows/examples/advanced-patterns.yml
```

### Example Commands

```bash
# Test basic usage example
act push -W .github/workflows/examples/basic-usage.yml

# Test monorepo selective CI
act push -W .github/workflows/examples/monorepo-selective.yml --artifact-server-path=/tmp/artifacts

# Test advanced patterns with pull request event
act pull_request -W .github/workflows/examples/advanced-patterns.yml

# Run with secrets (if needed)
act push -W .github/workflows/examples/basic-usage.yml --secret-file .secrets

# Dry run to see what would execute
act push -W .github/workflows/examples/basic-usage.yml --dry-run
```

## 📋 Available Examples

### 1. Basic Usage (`basic-usage.yml`)

**Purpose:** Demonstrates fundamental conditional execution based on file changes.

**Features:**
- Simple filter patterns
- Conditional job execution
- Basic frontend/backend/docs separation

**Use Case:** Small to medium projects with clear separation of concerns.

**Test locally:**
```bash
act push -W .github/workflows/examples/basic-usage.yml
```

---

### 2. Monorepo Selective CI (`monorepo-selective.yml`)

**Purpose:** Shows sophisticated monorepo CI optimization.

**Features:**
- Package-specific change detection
- Dependency-aware job triggering
- Cross-cutting concern handling
- JSON file list output

**Use Case:** Large monorepos with multiple apps, packages, and services.

**Test locally:**
```bash
act push -W .github/workflows/examples/monorepo-selective.yml
```

---

### 3. Advanced Filter Patterns (`advanced-patterns.yml`)

**Purpose:** Demonstrates complex filtering scenarios and change analysis.

**Features:**
- Change type specific filters (`added`, `modified`, `deleted`)
- Content-based pattern matching
- Complex negations and combinations
- Smart CI pipeline selection

**Use Case:** Enterprise projects requiring sophisticated CI logic.

**Test locally:**
```bash
act push -W .github/workflows/examples/advanced-patterns.yml
```

## 🎯 Testing Strategy

### Act Configuration

Create `.actrc` file in project root:

```bash
# Use specific platform
-P ubuntu-latest=catthehacker/ubuntu:act-latest

# Set default event
--defaultbranch main

# Artifact server for file outputs
--artifact-server-path /tmp/act-artifacts
```

### Mock Data Setup

For realistic testing, create sample changed files:

```bash
# Create some test files to simulate changes
mkdir -p src/components test-changes
touch src/components/Button.tsx
touch docs/api.md
echo "Sample change" > package.json

# Test the action
act push -W .github/workflows/examples/basic-usage.yml
```

### Debug Mode

Enable debug output for troubleshooting:

```bash
# Full debug output
act push -W .github/workflows/examples/basic-usage.yml --verbose

# With step debugging
act push -W .github/workflows/examples/basic-usage.yml --verbose --dry-run
```

## 🔧 Customizing Examples

### Modifying Filters

Edit the `filters` input in any example:

```yaml
filters: |
  your-filter:
    - 'your/path/**'
    - 'added: new/files/**'
    - '!excluded/**'
```

### Adding Secrets

Create `.secrets` file for local testing:

```env
GITHUB_TOKEN=your_token_here
NPM_TOKEN=your_npm_token
```

Use with act:
```bash
act push -W .github/workflows/examples/basic-usage.yml --secret-file .secrets
```

### Environment Variables

Pass environment variables:

```bash
act push -W .github/workflows/examples/basic-usage.yml \
  --env NODE_ENV=production \
  --env DEBUG=true
```

## 📚 Additional Resources

- [act Documentation](https://github.com/nektos/act)
- [GitHub Actions Events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows)
- [conditional-paths-action Documentation](../../../README.md)

## 🐛 Troubleshooting

### Common Issues

1. **Action not found**: Ensure you're in the project root and the action is built:
   ```bash
   pnpm run package
   ```

2. **Missing dependencies**: Install all required tools:
   ```bash
   mise install
   pnpm install
   ```

3. **Permission issues**: Make sure act has proper permissions:
   ```bash
   sudo act push -W .github/workflows/examples/basic-usage.yml
   ```

4. **Docker issues**: Update to latest act and docker images:
   ```bash
   brew upgrade act
   docker pull catthehacker/ubuntu:act-latest
   ```

### Getting Help

- Check act logs with `--verbose` flag
- Review GitHub Actions documentation
- Open an issue in this repository
- Test workflows in real GitHub environment for comparison
