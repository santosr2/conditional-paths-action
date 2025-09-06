# Examples

This directory contains examples and fixtures for testing the `conditional-paths-action` locally using [act](https://github.com/nektos/act).

## Directory Structure

- `simple/` - Basic usage examples with single filters
- `monorepo/` - Advanced monorepo filtering with complex patterns
- `fixtures/` - Sample repository structures and test payloads
- `events/` - GitHub webhook payloads for testing different triggers

## Prerequisites

1. **Install act**:
   ```bash
   # macOS
   brew install act

   # Linux/WSL
   curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
   ```

2. **Build the action**:
   ```bash
   pnpm install
   pnpm run build
   pnpm run package
   ```

## Running Examples

### Basic Usage
Test simple filter patterns:
```bash
act -W .github/workflows/examples/simple-usage.yml -j test-simple-filters -P ubuntu-latest=catthehacker/ubuntu:act-22.04
```

### Monorepo Testing
Test complex monorepo scenarios:
```bash
act -W .github/workflows/examples/monorepo-usage.yml -j test-monorepo-filters -P ubuntu-latest=catthehacker/ubuntu:act-22.04
```

### Matrix Testing
Test multiple configurations:
```bash
act -W .github/workflows/examples/matrix-usage.yml -P ubuntu-latest=catthehacker/ubuntu:act-22.04
```

### Pull Request Simulation
Test with PR context:
```bash
act -W .github/workflows/examples/pr-simulation.yml -j test-pr-filters -P ubuntu-latest=catthehacker/ubuntu:act-22.04 --eventpath examples/events/pull-request.json
```

## Example Filter Configurations

### Frontend/Backend Split
```yaml
frontend:
  - 'frontend/**'
  - 'shared/**'
  - 'package.json'

backend:
  - 'backend/**'
  - 'shared/**'
  - 'Dockerfile'
```

### Change Type Detection
```yaml
new-features:
  - added: 'src/**/*.ts'
  - added: 'features/**'

bug-fixes:
  - modified: 'src/**/*.ts'
  - modified: 'lib/**/*.js'

cleanup:
  - deleted: '**/*'
```

### Language-Specific Filters
```yaml
typescript:
  - '**/*.ts'
  - '**/*.tsx'
  - 'tsconfig*.json'

python:
  - '**/*.py'
  - 'requirements*.txt'
  - 'pyproject.toml'

go:
  - '**/*.go'
  - 'go.mod'
  - 'go.sum'
```

## Debugging

### Verbose Output
```bash
act -W .github/workflows/examples/simple-usage.yml -j test-simple-filters -P ubuntu-latest=catthehacker/ubuntu:act-22.04 -v
```

### Step-by-Step Execution
```bash
act -W .github/workflows/examples/simple-usage.yml -j test-simple-filters -P ubuntu-latest=catthehacker/ubuntu:act-22.04 --step
```

### Custom Event Payloads
```bash
act -W .github/workflows/examples/pr-simulation.yml -j test-pr-filters -P ubuntu-latest=catthehacker/ubuntu:act-22.04 --eventpath examples/events/custom-payload.json
```

## Testing Your Own Filters

1. Create a filter file in `examples/custom/`
2. Copy one of the example workflows to `.github/workflows/examples/`
3. Update the workflow to use your filter file
4. Run with act:

```bash
act -W .github/workflows/examples/your-workflow.yml -j your-job -P ubuntu-latest=catthehacker/ubuntu:act-22.04
```
