# Local Testing with act

This document provides instructions for testing the conditional-paths-action locally using [act](https://github.com/nektos/act).

## Prerequisites

1. Install act: https://github.com/nektos/act#installation
2. Have Docker running on your machine
3. Build the action: `pnpm run package`

## Basic Testing

### Test the Example Workflow

```bash
# Run the example workflow
act workflow_dispatch -W .github/workflows/examples/test-action-locally.yml

# Or run on push event simulation
act push -W .github/workflows/examples/test-action-locally.yml
```

### Test Specific Jobs

```bash
# Run only the basic filters test
act workflow_dispatch -W .github/workflows/examples/test-action-locally.yml -j test-basic-filters

# Run only the advanced filters test
act workflow_dispatch -W .github/workflows/examples/test-action-locally.yml -j test-advanced-filters

# Run only the file listing test
act workflow_dispatch -W .github/workflows/examples/test-action-locally.yml -j test-file-listing
```

## Custom Testing

### Create a Custom Test Workflow

Create `.github/workflows/custom-test.yml`:

```yaml
name: Custom Test
on: workflow_dispatch

jobs:
  my-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Test my filters
        uses: ./
        id: filter
        with:
          filters: |
            my-filter:
              - 'path/to/my/files/**'

      - name: Show results
        run: |
          echo "Changed: ${{ steps.filter.outputs.my-filter }}"
          echo "Count: ${{ steps.filter.outputs.my-filter_count }}"
```

Then run:
```bash
act workflow_dispatch -W .github/workflows/custom-test.yml
```

### Test with Different Events

```bash
# Test with pull_request event
act pull_request -W .github/workflows/examples/test-action-locally.yml

# Test with push to specific branch
act push -W .github/workflows/examples/test-action-locally.yml --eventpath test-event.json
```

Create `test-event.json` for custom event data:
```json
{
  "ref": "refs/heads/feature/new-feature",
  "repository": {
    "name": "conditional-paths-action",
    "default_branch": "main"
  }
}
```

## Debugging

### Verbose Output

```bash
act workflow_dispatch -W .github/workflows/examples/test-action-locally.yml --verbose
```

### Use Specific Runner Image

```bash
act workflow_dispatch -W .github/workflows/examples/test-action-locally.yml -P ubuntu-latest=catthehacker/ubuntu:act-latest
```

### Interactive Debugging

```bash
# Add --dryrun to see what would be executed
act workflow_dispatch -W .github/workflows/examples/test-action-locally.yml --dryrun

# Use --list to see available jobs
act workflow_dispatch -W .github/workflows/examples/test-action-locally.yml --list
```

## Environment Variables

Test with custom environment variables:

```bash
act workflow_dispatch -W .github/workflows/examples/test-action-locally.yml --env-file .env.test
```

Create `.env.test`:
```
GITHUB_TOKEN=your_token_here
CUSTOM_VAR=test_value
```

## Common Issues

### Permission Errors
If you get permission errors, ensure Docker has the necessary permissions and your user is in the docker group.

### Action Not Found
Make sure you've run `pnpm run package` to build the action before testing.

### Git History
The action requires git history to detect changes. act should automatically handle this, but if you encounter issues, ensure your local repository has commits to compare against.

## Performance Testing

Use the built-in benchmark workflow:

```bash
# Run performance benchmarks
pnpm run bench

# Or test with act
act workflow_dispatch -W .github/workflows/examples/performance-test.yml
```

## Next Steps

- Modify the example workflows to test your specific use cases
- Create additional test workflows in `.github/workflows/examples/`
- Use act in your CI/CD pipeline for pre-commit testing
