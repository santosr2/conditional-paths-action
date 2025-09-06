# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 3.x.x   | :white_check_mark: |
| 2.x.x   | :x:                |
| 1.x.x   | :x:                |

## Reporting a Vulnerability

Please report security vulnerabilities through GitHub's [Security Advisory feature](https://github.com/santosr2/conditional-paths-action/security/advisories/new).

DO NOT create public GitHub issues for security vulnerabilities.

### What to include in your report

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

### What to expect

- We will acknowledge receipt of your vulnerability report within 3 working days
- We will send a more detailed response within 7 working days indicating the next steps in handling your report
- We will keep you informed of the progress towards a fix and full announcement
- We may ask for additional information or guidance

## Preferred Languages

We prefer all communications to be in English.

## Automated Security Checks

This repository implements multiple layers of automated security scanning:

### Active Security Measures
- **CodeQL Analysis** - Automated vulnerability detection for TypeScript/JavaScript
- **Secret Scanning** - Prevents accidental credential leaks in commits
- **Dependency Scanning** - Monitors dependencies for known vulnerabilities
- **License Compliance** - Validates all dependencies against approved open-source licenses
- **SBOM Generation** - Provides complete transparency of our software supply chain

### Supply Chain Security
- **Dependency Pinning** - All GitHub Actions pinned to specific commit SHAs
- **SBOM (Software Bill of Materials)** - CycloneDX format available at `/dist/sbom.json`
- **License Verification** - All dependencies validated against MIT, ISC, BSD, and Apache licenses
- **Pre-commit Security Hooks** - License and SBOM validation on every commit

## Policy

We follow the principle of [Coordinated Vulnerability Disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure).
