/**
 * @fileoverview Core action logic for the Paths Filter GitHub Action.
 *
 * This module contains the main business logic for detecting changed files and applying
 * filters to determine which paths have been modified. It handles various GitHub workflow
 * trigger types (pull requests, pushes, etc.) and integrates with both the GitHub API
 * and local git commands to gather file change information.
 */
/**
 * Main entry point for the paths filter action.
 *
 * Orchestrates the entire workflow: reads inputs, validates configuration, detects changed files,
 * applies filters, and exports results to GitHub Action outputs.
 *
 * @throws {Error} When invalid configuration is provided or required inputs are missing
 * @returns Promise that resolves when the action completes successfully
 */
export declare function runPathsFilterAction(): Promise<void>;
//# sourceMappingURL=action.d.ts.map