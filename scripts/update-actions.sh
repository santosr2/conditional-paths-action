#!/usr/bin/env bash

# GitHub Actions Updater Script
# Automatically updates all GitHub Actions in workflows to their latest versions with SHA pinning
# Usage: ./scripts/update-actions.sh [--dry-run] [--verbose]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
WORKFLOWS_DIR="${REPO_ROOT}/.github/workflows"
TEMP_DIR="/tmp/github-actions-updater-$$"
DRY_RUN=false
VERBOSE=false
# GitHub CLI will be used instead of direct API calls

# Usage information
usage() {
    cat << EOF
GitHub Actions Updater Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --dry-run       Show what would be updated without making changes
    --verbose       Enable verbose output
    --help         Show this help message

DESCRIPTION:
    This script automatically:
    1. Scans all workflow files in .github/workflows/
    2. Extracts unique GitHub Actions being used
    3. Fetches the latest release version and commit SHA for each action using GitHub CLI
    4. Updates workflow files with latest versions and SHA pinning
    5. Provides a summary of all updates made

PREREQUISITES:
    - GitHub CLI (gh) must be installed and authenticated
    - jq must be installed for JSON parsing

EXAMPLES:
    $0                    # Update all actions
    $0 --dry-run         # Show what would be updated
    $0 --verbose         # Detailed output during updates
    $0 --dry-run --verbose # Detailed dry-run output

EOF
}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    if [[ "$VERBOSE" == true ]]; then
        echo -e "${PURPLE}[DEBUG]${NC} $1"
    fi
}

log_update() {
    echo -e "${CYAN}[UPDATE]${NC} $1"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                log_info "Dry run mode enabled - no files will be modified"
                shift
                ;;
            --verbose)
                VERBOSE=true
                log_info "Verbose mode enabled"
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
}

# Setup temporary directory
setup_temp_dir() {
    mkdir -p "$TEMP_DIR"
    log_debug "Created temporary directory: $TEMP_DIR"

    # Cleanup on exit
    trap 'rm -rf "$TEMP_DIR"' EXIT
}

# Extract unique GitHub Actions from workflows
extract_actions() {
    log_info "Scanning workflow files for GitHub Actions..."

    local actions_file="$TEMP_DIR/actions.txt"

    # Find all workflow files and extract uses: statements
    find "$WORKFLOWS_DIR" -name "*.yml" -o -name "*.yaml" | while read -r file; do
        log_debug "Processing file: $file"

        # Extract uses: lines, exclude comments and local actions
        grep "^\s*uses:" "$file" | \
            grep -v "^\s*#" | \
            grep -v "uses: \./" | \
            sed 's/ *uses: *//g' | \
            sed 's/@.*//' | \
            sed 's|^\([^/]*/[^/]*\)/.*|\1|' >> "$actions_file" || true
    done

    # Sort and get unique actions
    if [[ -f "$actions_file" ]]; then
        sort "$actions_file" | uniq > "$TEMP_DIR/unique_actions.txt"
        local action_count
        action_count=$(wc -l < "$TEMP_DIR/unique_actions.txt")
        log_success "Found $action_count unique GitHub Actions"

        if [[ "$VERBOSE" == true ]]; then
            log_debug "Unique actions found:"
            cat "$TEMP_DIR/unique_actions.txt" | sed 's/^/  - /'
        fi
    else
        log_error "No actions found in workflow files"
        exit 1
    fi
}

# Get latest release info for an action using GitHub CLI
get_latest_release() {
    local repo="$1"
    local output_file="$2"

    log_debug "Fetching latest release for $repo using GitHub CLI"
    log_debug "Command: gh api repos/${repo}/releases/latest"

    # Use GitHub CLI to fetch latest release
    if ! gh api "repos/${repo}/releases/latest" > "$output_file" 2>/dev/null; then
        log_warning "Failed to fetch latest release for $repo"
        return 1
    fi

    return 0
}

# Get commit SHA for a specific tag using GitHub CLI
get_tag_sha() {
    local repo="$1"
    local tag="$2"
    local output_file="$3"

    log_debug "Fetching commit SHA for $repo @ $tag using GitHub CLI"
    log_debug "Command: gh api repos/${repo}/git/refs/tags/${tag}"

    # Use GitHub CLI to fetch tag reference
    if ! gh api "repos/${repo}/git/refs/tags/${tag}" > "$output_file" 2>/dev/null; then
        log_warning "Failed to fetch tag SHA for $repo @ $tag"
        return 1
    fi

    return 0
}

# Process each action to get latest version info
process_actions() {
    log_info "Fetching latest release information for each action..."

    local actions_info_file="$TEMP_DIR/actions_info.json"
    echo "[]" > "$actions_info_file"

    while IFS= read -r repo; do
        [[ -z "$repo" ]] && continue

        log_debug "Processing action: $repo"

        local release_file="$TEMP_DIR/release_${repo//\//_}.json"
        local tag_file="$TEMP_DIR/tag_${repo//\//_}.json"

        # Get latest release
        if get_latest_release "$repo" "$release_file"; then
            local tag_name
            tag_name=$(jq -r '.tag_name' "$release_file" 2>/dev/null || echo "")

            if [[ -n "$tag_name" && "$tag_name" != "null" ]]; then
                # Get commit SHA for this tag
                if get_tag_sha "$repo" "$tag_name" "$tag_file"; then
                    local commit_sha
                    commit_sha=$(jq -r '.object.sha' "$tag_file" 2>/dev/null || echo "")

                    if [[ -n "$commit_sha" && "$commit_sha" != "null" ]]; then
                        # Add to actions info
                        local temp_file="$TEMP_DIR/temp_actions_info.json"
                        jq --arg repo "$repo" \
                           --arg version "$tag_name" \
                           --arg sha "$commit_sha" \
                           '. += [{"repo": $repo, "version": $version, "sha": $sha}]' \
                           "$actions_info_file" > "$temp_file" && mv "$temp_file" "$actions_info_file"

                        log_success "✓ $repo: $tag_name ($commit_sha)"
                    else
                        log_warning "✗ $repo: Failed to get commit SHA for $tag_name"
                    fi
                else
                    log_warning "✗ $repo: Failed to fetch tag SHA"
                fi
            else
                log_warning "✗ $repo: No valid tag name found"
            fi
        else
            log_warning "✗ $repo: Failed to fetch latest release"
        fi

        # Small delay to avoid rate limiting
        sleep 0.1
    done < "$TEMP_DIR/unique_actions.txt"

    # Show summary
    local successful_count
    successful_count=$(jq length "$actions_info_file")
    log_info "Successfully processed $successful_count actions"
}

# Update workflow files
update_workflows() {
    log_info "Updating workflow files..."

    local actions_info_file="$TEMP_DIR/actions_info.json"
    local updated_files=0
    local total_updates=0

    # Create backup directory if not dry run
    if [[ "$DRY_RUN" == false ]]; then
        local backup_dir="$TEMP_DIR/backup"
        mkdir -p "$backup_dir"
        log_debug "Created backup directory: $backup_dir"
    fi

    # Process each workflow file
    find "$WORKFLOWS_DIR" -name "*.yml" -o -name "*.yaml" | while read -r workflow_file; do
        local file_updated=false
        local temp_workflow="$TEMP_DIR/$(basename "$workflow_file")"
        cp "$workflow_file" "$temp_workflow"

        log_debug "Processing workflow: $workflow_file"

        # Process each action
        jq -r '.[] | "\(.repo) \(.version) \(.sha)"' "$actions_info_file" | while read -r repo version sha; do
            [[ -z "$repo" ]] && continue

            # Look for this action in the current workflow (including sub-actions)
            if grep -q "uses: $repo" "$temp_workflow"; then
                log_debug "Found $repo in $workflow_file"

                # Find all lines with this repo (to handle sub-actions like codeql-action/init, codeql-action/analyze)
                while IFS= read -r current_line; do
                    if [[ ! "$current_line" =~ $sha ]]; then
                        # Update needed
                        local indentation
                        indentation=$(echo "$current_line" | sed 's/[^ ].*//')
                        local action_path
                        action_path=$(echo "$current_line" | sed 's/.*uses: \([^@]*\)@.*/\1/')
                        local new_line="${indentation}uses: $action_path@$sha # $version"

                        if [[ "$DRY_RUN" == true ]]; then
                            log_update "[DRY-RUN] Would update in $(basename "$workflow_file"):"
                            log_update "  Old: $(echo "$current_line" | xargs)"
                            log_update "  New: $(echo "$new_line" | xargs)"
                        else
                            # Perform the actual update - escape special characters in sed
                            local escaped_old
                            escaped_old=$(printf '%s\n' "$current_line" | sed 's/[\[\].*^$()+?{|]/\\&/g')
                            local escaped_new
                            escaped_new=$(printf '%s\n' "$new_line" | sed 's/[\[\].*^$()+?{|]/\\&/g')
                            sed -i.bak "s|$escaped_old|$new_line|g" "$temp_workflow"
                            file_updated=true
                            log_update "Updated $action_path to $version in $(basename "$workflow_file")"
                        fi

                        ((total_updates++)) || true
                    else
                        local action_path
                        action_path=$(echo "$current_line" | sed 's/.*uses: \([^@]*\)@.*/\1/')
                        log_debug "$action_path is already up to date in $workflow_file"
                    fi
                done < <(grep "uses: $repo" "$temp_workflow")
            fi
        done

        # Apply changes if file was updated and not dry run
        if [[ "$file_updated" == true && "$DRY_RUN" == false ]]; then
            # Backup original
            cp "$workflow_file" "$backup_dir/$(basename "$workflow_file").bak"
            # Apply updates
            mv "$temp_workflow" "$workflow_file"
            ((updated_files++)) || true
            log_success "Updated $(basename "$workflow_file")"
        fi
    done

    # Summary
    if [[ "$DRY_RUN" == true ]]; then
        log_info "Dry run completed. Would make $total_updates updates across workflow files."
    else
        log_success "Updated $updated_files workflow files with $total_updates action updates"
        if [[ $updated_files -gt 0 ]]; then
            log_info "Backups saved in: $backup_dir"
        fi
    fi
}

# Generate summary report
generate_report() {
    log_info "Generating update report..."

    local report_file="$REPO_ROOT/github-actions-update-report.md"
    local actions_info_file="$TEMP_DIR/actions_info.json"

    cat > "$report_file" << EOF
# GitHub Actions Update Report

Generated on: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Script version: 1.0.0

## Summary

- **Total actions processed**: $(jq length "$actions_info_file")
- **Mode**: $(if [[ "$DRY_RUN" == true ]]; then echo "Dry run"; else echo "Live update"; fi)
- **Timestamp**: $(date -Iseconds)

## Updated Actions

| Action Repository | Latest Version | Commit SHA | Status |
|-------------------|----------------|------------|---------|
EOF

    # Add action details to report
    jq -r '.[] | "\(.repo) | \(.version) | `\(.sha)` | ✅ Updated |"' "$actions_info_file" >> "$report_file"

    cat >> "$report_file" << EOF

## Notes

- All actions are now pinned to their latest release commit SHA for security
- Version tags are included as comments for readability
- Backup files are created during updates (when not in dry-run mode)

## Next Steps

1. Review the changes in your workflow files
2. Test the updated workflows in a feature branch
3. Commit the updates once verified

---

*Report generated by GitHub Actions Updater Script*
EOF

    log_success "Report generated: $report_file"
}

# Main execution function
main() {
    log_info "🚀 GitHub Actions Updater Script v1.0.0"
    log_info "Repository: $REPO_ROOT"

    # Parse arguments
    parse_args "$@"

    # Setup
    setup_temp_dir

    # Check if workflows directory exists
    if [[ ! -d "$WORKFLOWS_DIR" ]]; then
        log_error "Workflows directory not found: $WORKFLOWS_DIR"
        exit 1
    fi

    # Check required tools
    local missing_tools=()
    for tool in gh jq grep sed; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install missing tools and try again"
        if [[ " ${missing_tools[*]} " =~ " gh " ]]; then
            log_error "GitHub CLI installation: https://cli.github.com/"
            log_error "After installation, authenticate with: gh auth login"
        fi
        exit 1
    fi

    # Check GitHub CLI authentication
    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI is not authenticated"
        log_error "Please run: gh auth login"
        exit 1
    fi

    # Execute main workflow
    extract_actions
    process_actions
    update_workflows
    generate_report

    # Final summary
    log_success "🎉 GitHub Actions update process completed!"

    if [[ "$DRY_RUN" == false ]]; then
        log_info "Next steps:"
        log_info "1. Review changes: git diff .github/workflows/"
        log_info "2. Test workflows: Create a PR and verify CI passes"
        log_info "3. Commit updates: git add . && git commit -m 'chore: update GitHub Actions to latest versions'"
    else
        log_info "Re-run without --dry-run to apply the updates"
    fi
}

# Execute main function with all arguments
main "$@"
