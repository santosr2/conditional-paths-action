# Security Policy

## 🛡️ Overview

The Conditional Paths Action team takes security seriously. We appreciate the community's efforts to responsibly disclose vulnerabilities and work to address them promptly.

## 🔍 Supported Versions

We provide security updates for the following versions:

| Version | Supported | Node.js Compatibility | Status |
|---------|-----------|----------------------|--------|
| v1.x.x  | ✅ Yes | Node.js 22 (dev) / 24 (runtime) | **Current** - Full support |
| v0.x.x  | ❌ No  | Node.js 16/18 | **Legacy** - No longer supported |

### Runtime Environment Security

Our action supports dual Node.js compatibility with enhanced security validation:

- **GitHub Actions Runtime**: Node.js 24 (`using: node24`)
- **Development Environment**: Node.js 22 (tested in CI matrix)
- **CI/CD Validation**: Both versions tested with comprehensive security scans

## 🚨 Reporting Vulnerabilities

### Where to Report

**⚠️ DO NOT report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Instead, use one of these secure methods:

#### 1. GitHub Security Advisories (Preferred)

Report security vulnerabilities through [GitHub Security Advisories](https://github.com/santosr2/conditional-paths-action/security/advisories/new):

1. Go to the repository's Security tab
2. Click "Report a vulnerability"
3. Fill out the advisory form with details
4. Submit for private disclosure

#### 2. Email Disclosure

Send security reports to: **security@[repository-domain]**

Include:
- Detailed description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Suggested fix (if available)

## ⏱️ Response Timeline

| Timeframe | Action |
|-----------|--------|
| **24 hours** | Initial acknowledgment of report |
| **72 hours** | Initial assessment and severity classification |
| **7 days** | Detailed investigation and impact analysis |
| **30 days** | Fix development, testing, and release preparation |
| **Coordinated** | Public disclosure after fix is available |

## 🔒 Security Measures

### Active Security Scanning

Our repository implements comprehensive security measures:

#### 🛡️ Automated Security Scanning

- **[CodeQL Analysis](https://github.com/santosr2/conditional-paths-action/security/code-scanning)**: Static Application Security Testing (SAST)
- **Secret Scanning**: GitLeaks detection prevents credential leaks
- **Dependency Scanning**: Trivy vulnerability scanner for known CVEs
- **License Compliance**: SPDX validation and approved license checking

#### 📋 Supply Chain Security

- **SBOM Generation**: Complete Software Bill of Materials in CycloneDX format
- **Dependency Pinning**: Exact version pinning for all dependencies
- **SHA Pinning**: All GitHub Actions pinned by commit SHA
- **Vulnerability Monitoring**: Automated dependency vulnerability tracking

#### 🔐 Development Security

- **Pre-commit Hooks**: Security validation on every commit
- **Dual Node.js Testing**: Security validation across Node.js 22/24 matrix
- **Minimal Permissions**: Least-privilege principle in action.yml
- **Input Validation**: Comprehensive validation of all external inputs

### Security Configuration

#### Required Permissions

The action uses minimal required permissions:

```yaml
permissions:
  contents: read       # Required for repository access
  pull-requests: read  # Required for PR workflows only
```

#### Secure Defaults

- **No Network Access**: Action doesn't make outbound network calls (except GitHub API)
- **Read-Only Operations**: File system access is read-only for source files
- **Token Scope**: Uses provided GitHub token with minimal necessary permissions
- **Input Sanitization**: All user inputs are validated and sanitized

## 🎯 Vulnerability Categories

We treat the following as security vulnerabilities:

### High Priority

- **Code Execution**: Arbitrary code execution through action inputs
- **Credential Exposure**: Leakage of tokens, secrets, or sensitive data
- **Privilege Escalation**: Unauthorized access or elevated permissions
- **Path Traversal**: Access to files outside intended directories

### Medium Priority

- **Information Disclosure**: Exposure of non-sensitive internal information
- **DoS Vulnerabilities**: Resource exhaustion or infinite loops
- **Injection Attacks**: Command injection or script injection
- **Dependency Vulnerabilities**: High/Critical severity in dependencies

### Low Priority

- **Configuration Issues**: Insecure default configurations
- **Minor Information Leaks**: Limited exposure of non-sensitive data
- **Denial of Service**: Service disruption with minimal impact

## 🔧 Security Best Practices for Users

### Workflow Security

When using this action in your workflows:

#### ✅ Recommended

```yaml
- uses: santosr2/conditional-paths-action@v1.0.0  # Pin to specific version
  with:
    token: ${{ secrets.GITHUB_TOKEN }}  # Use provided token
    filters: |  # Define filters in workflow (transparent)
      src: 'src/**'
      docs: 'docs/**'
```

#### ❌ Not Recommended

```yaml
- uses: santosr2/conditional-paths-action@main  # Don't use branch references
  with:
    token: ${{ secrets.PERSONAL_TOKEN }}  # Avoid personal tokens if possible
    filters: '.github/secret-filters.yml'  # External files less transparent
```

### Input Validation

- **Filter Patterns**: Use specific, well-defined glob patterns
- **File Paths**: Avoid user-controlled file paths when possible
- **Token Usage**: Use the minimum token scope required for your workflow

### Monitoring

- **Action Usage**: Monitor action outputs in workflow logs
- **Repository Access**: Regularly review repository access and permissions
- **Dependency Updates**: Keep the action pinned to latest secure version

## 📊 Security Resources

### Public Security Information

- **[Security Tab](https://github.com/santosr2/conditional-paths-action/security)**: View security advisories and policies
- **[Dependency Graph](https://github.com/santosr2/conditional-paths-action/network/dependencies)**: Monitor supply chain
- **[Code Scanning](https://github.com/santosr2/conditional-paths-action/security/code-scanning)**: View CodeQL analysis results
- **[SBOM Viewer](https://santosr2.github.io/conditional-paths-action/sbom/)**: Interactive Software Bill of Materials

### Security Tooling

The following tools are integrated into our development process:

| Tool | Purpose | Frequency |
|------|---------|-----------|
| **CodeQL** | Static analysis for security vulnerabilities | Every commit |
| **GitLeaks** | Secret and credential detection | Every commit |
| **Trivy** | Container and dependency vulnerability scanning | Every commit |
| **pnpm audit** | Node.js dependency vulnerability checking | Pre-commit + CI |
| **SBOM Generator** | Supply chain transparency | Every build |
| **License Checker** | License compliance validation | Pre-commit + CI |

## 🤝 Security Community

### Contributing to Security

If you're interested in helping improve security:

- **Review Code**: Participate in code reviews with security focus
- **Test Security**: Help test new security measures and policies
- **Documentation**: Improve security documentation and guidance
- **Tooling**: Contribute to security tooling and automation

### Recognition

We recognize security contributors through:

- **Security Advisory Credits**: Credit in published security advisories
- **Contributors List**: Recognition in CONTRIBUTORS.md
- **GitHub Security Tab**: Listed in repository security credits

## 📞 Additional Resources

### External Security Resources

- **[GitHub Security Best Practices](https://docs.github.com/en/actions/security-guides)**
- **[OWASP Top 10](https://owasp.org/www-project-top-ten/)**
- **[CWE Database](https://cwe.mitre.org/)**
- **[CVE Database](https://cve.mitre.org/)**

### Emergency Contacts

For urgent security matters requiring immediate attention:

- **Critical Vulnerabilities**: Use GitHub Security Advisories for fastest response
- **Active Exploits**: Contact GitHub Support directly if actively being exploited
- **Supply Chain Issues**: Report through both our advisory system and upstream maintainers

---

**Thank you for helping keep the Conditional Paths Action and its users safe!** 🛡️

*Last Updated: 2024*
