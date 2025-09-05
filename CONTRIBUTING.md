# Contributing to Conditional Paths Action

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## We Develop with Github

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## We Use [Github Flow](https://guides.github.com/introduction/flow/index.html)

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `master`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Development Process

### Prerequisites

- Node.js 20.x
- pnpm 8.15.0 or later

### Setup

```bash
# Clone the repository
git clone https://github.com/santosr2/conditional-paths-action.git
cd conditional-paths-action

# Install dependencies
pnpm install

# Run tests
pnpm test

# Run linting
pnpm lint

# Build the action
pnpm build
pnpm package
```

### Testing

We use Vitest for testing. Tests are located in the `__tests__` directory.

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Code Style

- We use ESLint and Prettier for code formatting
- Run `pnpm format` to format your code
- Run `pnpm lint` to check for linting errors
- Pre-commit hooks will automatically format and lint your code

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `perf:` A code change that improves performance
- `test:` Adding missing tests or correcting existing tests
- `build:` Changes that affect the build system or external dependencies
- `ci:` Changes to our CI configuration files and scripts
- `chore:` Other changes that don't modify src or test files

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using Github's [issues](https://github.com/santosr2/conditional-paths-action/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/santosr2/conditional-paths-action/issues/new); it's that easy!

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## License

By contributing, you agree that your contributions will be licensed under its MIT License.
