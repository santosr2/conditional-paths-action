# Basic Usage Examples

## Simple Filter Configuration

```yaml
name: Conditional Build
on: [push, pull_request]

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.filter.outputs.frontend }}
      backend: ${{ steps.filter.outputs.backend }}
      docs: ${{ steps.filter.outputs.docs }}
    steps:
      - uses: actions/checkout@v4
      - uses: santosr2/conditional-paths-action@v3
        id: filter
        with:
          filters: |
            frontend:
              - 'src/frontend/**'
              - 'public/**'
            backend:
              - 'src/backend/**'
              - 'api/**'
            docs:
              - '*.md'
              - 'docs/**'

  frontend:
    needs: changes
    if: needs.changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Frontend
        run: |
          echo "Building frontend..."
          npm run build:frontend

  backend:
    needs: changes
    if: needs.changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Backend
        run: |
          echo "Building backend..."
          npm run build:backend
```

## Advanced Filter Configuration

```yaml
name: Advanced Conditional Builds
on: [push, pull_request]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      services: ${{ steps.filter.outputs.changes }}
      microservice-a: ${{ steps.filter.outputs.microservice-a }}
      microservice-b: ${{ steps.filter.outputs.microservice-b }}
      shared: ${{ steps.filter.outputs.shared }}
    steps:
      - uses: actions/checkout@v4
      - uses: santosr2/conditional-paths-action@v3
        id: filter
        with:
          list-files: json
          predicate-quantifier: some
          filters: |
            microservice-a:
              - added|modified: 'services/microservice-a/**'
              - 'shared/lib/**'
            microservice-b:
              - added|modified: 'services/microservice-b/**'
              - 'shared/lib/**'
            shared:
              - 'shared/**'
              - '.github/workflows/**'
            config:
              - '*.json'
              - '*.yaml'
              - '*.yml'

  deploy-microservices:
    needs: detect-changes
    if: contains(fromJSON(needs.detect-changes.outputs.services), 'microservice-a') || contains(fromJSON(needs.detect-changes.outputs.services), 'microservice-b')
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: ${{ fromJSON(needs.detect-changes.outputs.services) }}
    steps:
      - uses: actions/checkout@v4
      - name: Deploy ${{ matrix.service }}
        run: |
          echo "Deploying ${{ matrix.service }}..."
```

## Monorepo with Package Dependencies

```yaml
name: Monorepo Build
on: [push, pull_request]

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      packages: ${{ steps.filter.outputs.changes }}
      core-changed: ${{ steps.filter.outputs.core }}
      utils-changed: ${{ steps.filter.outputs.utils }}
    steps:
      - uses: actions/checkout@v4
      - uses: santosr2/conditional-paths-action@v3
        id: filter
        with:
          filters: |
            core:
              - 'packages/core/**'
            utils:
              - 'packages/utils/**'
            web-app:
              - 'packages/web-app/**'
              - 'packages/core/**'  # rebuild if core changes
            mobile-app:
              - 'packages/mobile-app/**'
              - 'packages/core/**'  # rebuild if core changes
            docs:
              - 'packages/docs/**'
              - 'README.md'

  test-and-build:
    needs: changes
    if: needs.changes.outputs.packages != '[]'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: ${{ fromJSON(needs.changes.outputs.packages) }}
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Test ${{ matrix.package }}
        run: pnpm --filter "@repo/${{ matrix.package }}" test

      - name: Build ${{ matrix.package }}
        run: pnpm --filter "@repo/${{ matrix.package }}" build
```
