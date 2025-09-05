/**
 * @fileoverview Entry point for the Paths Filter GitHub Action.
 * This module serves as the main entry point that initializes the action and handles top-level error cases.
 */

import * as core from '@actions/core'
import { runPathsFilterAction } from './lib/action.js'

/**
 * Main entry point for the GitHub Action.
 *
 * Executes the paths filter action and handles any unhandled errors by setting the action as failed.
 * This function is the top-level error boundary for the entire action execution.
 *
 * @returns Promise that resolves when the action completes successfully
 * @throws Does not throw - all errors are caught and reported to GitHub Actions via core.setFailed()
 */
async function main(): Promise<void> {
  try {
    await runPathsFilterAction()
  } catch (error) {
    // Convert any error to a string message for GitHub Actions
    const message = error instanceof Error ? error.message : String(error)
    core.setFailed(message)
  }
}

// Execute the main function immediately
// Using void operator to explicitly ignore the Promise return value
void main()
