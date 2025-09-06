# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### ✨ Features

- Complete DevSecOps transformation with comprehensive CI/CD pipeline
- Node.js 22 runtime with mise toolchain management
- SBOM generation with CycloneDX v1.4 format
- License compliance automation with SPDX headers
- GitHub Pages documentation with TypeDoc API docs
- Performance monitoring and bundle analysis reports
- Release automation with conventional commits and release-please

### 🔒 Security

- Static Application Security Testing (SAST) with CodeQL
- Secret scanning with GitLeaks configuration
- Dependency vulnerability scanning with Trivy
- SHA-pinned GitHub Actions with minimal permissions
- Supply chain transparency with Software Bill of Materials

### 🛠️ Developer Experience

- Enhanced development environment with mise configuration
- Pre-commit hooks for quality assurance
- Automated dependency updates with intelligent Dependabot grouping
- Comprehensive test coverage (≥80% enforced)
- Quality gates with automated license header enforcement

### 📚 Documentation

- Interactive SBOM viewer at GitHub Pages /sbom endpoint
- Performance reports at GitHub Pages /performance endpoint
- Complete API documentation at GitHub Pages /docs endpoint
- Enhanced README with comprehensive DevSecOps badge collection

## [1.0.0] - 2024-12-06

### 🎉 Initial Release

- TypeScript GitHub Action for conditional path filtering
- Support for glob patterns and change type detection
- Multiple output formats (JSON, CSV, shell, escaped)
- Comprehensive test suite with unit, integration, and E2E tests
- Modern ESM module system with Node.js 22 support
- MIT license with full SPDX compliance

### Previous Changelog

This project builds upon [dorny/paths-filter](https://github.com/dorny/paths-filter).
See the [original changelog](https://github.com/dorny/paths-filter/blob/master/CHANGELOG.md) for previous development history.

[Unreleased]: https://github.com/santosr2/conditional-paths-action/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/santosr2/conditional-paths-action/releases/tag/v1.0.0
