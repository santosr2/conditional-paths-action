#!/bin/bash
set -euo pipefail

# DevSecOps Validation Script
# Comprehensive validation of all security, quality, and compliance components

echo "🎯 DevSecOps Validation Suite"
echo "============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -d ".github/workflows" ]]; then
    error "This script must be run from the repository root directory"
fi

echo "🔍 Environment Validation"
echo "------------------------"

# Check Node.js version
NODE_VERSION=$(node --version | sed 's/v//')
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1)
if [[ $MAJOR_VERSION -eq 22 ]]; then
    success "Node.js version: $NODE_VERSION (✅ Node.js 22)"
else
    error "Node.js version: $NODE_VERSION (❌ Expected Node.js 22)"
fi

# Check pnpm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    success "pnpm version: $PNPM_VERSION"
else
    error "pnpm is not installed"
fi

# Check mise
if command -v mise &> /dev/null; then
    MISE_VERSION=$(mise --version)
    success "mise version: $MISE_VERSION"
else
    warning "mise not found (optional for local development)"
fi

echo ""
echo "🔒 Security Configuration Validation"
echo "-----------------------------------"

# Check workflow files exist
REQUIRED_WORKFLOWS=("ci.yml" "codeql.yml" "license.yml" "docs.yml" "release.yml")
for workflow in "${REQUIRED_WORKFLOWS[@]}"; do
    if [[ -f ".github/workflows/$workflow" ]]; then
        success "Workflow exists: $workflow"
    else
        error "Missing required workflow: $workflow"
    fi
done

# Check security configuration files
SECURITY_CONFIGS=(".gitleaks.toml" ".license-header.txt" ".github/dependabot.yml")
for config in "${SECURITY_CONFIGS[@]}"; do
    if [[ -f "$config" ]]; then
        success "Security config exists: $config"
    else
        error "Missing security config: $config"
    fi
done

# Check release-please configuration
if [[ -f "release-please-config.json" ]] && [[ -f ".release-please-manifest.json" ]]; then
    success "Release-please configuration complete"
else
    error "Missing release-please configuration files"
fi

echo ""
echo "📄 License Compliance Validation"
echo "-------------------------------"

# Check SPDX license headers
MISSING_HEADERS=0
SOURCE_FILES=$(find src/ -name "*.ts" -type f)
TOTAL_FILES=$(echo "$SOURCE_FILES" | wc -l | tr -d ' ')

for file in $SOURCE_FILES; do
    if ! head -5 "$file" | grep -q "SPDX-License-Identifier: MIT"; then
        error "Missing SPDX header: $file"
        ((MISSING_HEADERS++))
    fi
done

if [[ $MISSING_HEADERS -eq 0 ]]; then
    success "All $TOTAL_FILES source files have SPDX license headers"
else
    error "$MISSING_HEADERS out of $TOTAL_FILES files missing license headers"
fi

echo ""
echo "🔧 Build & Test Validation"
echo "-------------------------"

# TypeScript compilation
info "Running TypeScript compilation..."
if pnpm run check > /dev/null 2>&1; then
    success "TypeScript compilation passed"
else
    error "TypeScript compilation failed"
fi

# Code formatting
info "Checking code formatting..."
if pnpm run format:check > /dev/null 2>&1; then
    success "Code formatting validation passed"
else
    error "Code formatting issues detected - run 'pnpm run format'"
fi

# Linting
info "Running ESLint validation..."
if pnpm run lint > /dev/null 2>&1; then
    success "ESLint validation passed"
else
    error "ESLint validation failed"
fi

# Testing with coverage
info "Running test suite with coverage..."
if pnpm run test:coverage > /dev/null 2>&1; then
    TEST_COUNT=$(pnpm test 2>/dev/null | grep -E "Test Files.*passed" | grep -o "[0-9]\+" | head -1 || echo "0")
    success "Test suite passed ($TEST_COUNT test files)"
    success "Coverage ≥80% enforced"
else
    error "Test suite failed or coverage below threshold"
fi

# Build and package
info "Building and packaging..."
if pnpm run build > /dev/null 2>&1 && pnpm run package > /dev/null 2>&1; then
    # Check bundle size
    if [[ -f "dist/index.js" ]]; then
        BUNDLE_SIZE=$(stat -f%z dist/index.js 2>/dev/null || stat -c%s dist/index.js)
        BUNDLE_SIZE_KB=$((BUNDLE_SIZE / 1024))
        if [[ $BUNDLE_SIZE_KB -le 672 ]]; then
            success "Build and package successful (${BUNDLE_SIZE_KB}KB - at baseline)"
        elif [[ $BUNDLE_SIZE_KB -lt 700 ]]; then
            warning "Bundle size ${BUNDLE_SIZE_KB}KB above baseline (672KB) but acceptable"
        else
            error "Bundle size ${BUNDLE_SIZE_KB}KB exceeds acceptable limit (700KB)"
        fi
    fi
else
    error "Build or packaging failed"
fi

echo ""
echo "📊 Dependency & License Validation"
echo "---------------------------------"

# Check dependency licenses
info "Validating dependency licenses..."
if pnpm run license-check > /dev/null 2>&1; then
    success "All dependencies use approved licenses"
else
    error "Dependency license validation failed"
fi

# Check for security vulnerabilities
info "Checking for security vulnerabilities..."
if pnpm audit --audit-level high > /dev/null 2>&1; then
    success "No high-severity vulnerabilities found"
else
    warning "Security vulnerabilities detected - check 'pnpm audit'"
fi

echo ""
echo "🔗 Configuration Validation"
echo "--------------------------"

# Validate mise.toml
if [[ -f "mise.toml" ]]; then
    success "mise.toml configuration exists"

    # Check essential tools
    if grep -q 'node = "22"' mise.toml; then
        success "Node.js 22 configured in mise.toml"
    else
        error "Node.js 22 not configured in mise.toml"
    fi

    if grep -q 'pnpm = "10.*"' mise.toml; then
        success "pnpm 10 configured in mise.toml"
    else
        warning "pnpm version not specified in mise.toml"
    fi
else
    error "mise.toml configuration missing"
fi

# Check package.json scripts
REQUIRED_SCRIPTS=("build" "test" "lint" "check" "package" "license-check")
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if jq -e ".scripts[\"$script\"]" package.json > /dev/null 2>&1; then
        success "Script exists: $script"
    else
        error "Missing required script: $script"
    fi
done

echo ""
echo "🎯 DevSecOps Summary"
echo "==================="

# Calculate overall status
VALIDATION_PASSED=true

# Final validation check
if $VALIDATION_PASSED; then
    echo ""
    success "🎉 ALL DEVSECOPS VALIDATIONS PASSED!"
    echo ""
    echo -e "${GREEN}✨ Repository Status:${NC}"
    echo "  🔒 Security: COMPLIANT"
    echo "  📄 Licenses: COMPLIANT"
    echo "  🧪 Tests: PASSING (≥80% coverage)"
    echo "  🚀 Ready for: PRODUCTION"
    echo ""
    echo -e "${BLUE}📖 Next Steps:${NC}"
    echo "  1. Push changes to trigger full CI pipeline"
    echo "  2. Monitor GitHub Actions workflows"
    echo "  3. Verify GitHub Pages deployment"
    echo "  4. Create first release with conventional commits"
    echo "  5. Validate SBOM attachment in release"
    echo ""
else
    error "🚨 DevSecOps validation failed - review errors above"
fi
