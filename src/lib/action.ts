/*
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2024 conditional-paths-action contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * @fileoverview Core action logic for the Paths Filter GitHub Action.
 *
 * This module contains the main business logic for detecting changed files and applying
 * filters to determine which paths have been modified. It handles various GitHub workflow
 * trigger types (pull requests, pushes, etc.) and integrates with both the GitHub API
 * and local git commands to gather file change information.
 */

import * as fs from 'fs'
import * as core from '@actions/core'
import * as github from '@actions/github'
// Define interface for GitHub API file object
import type { PushEvent, PullRequestEvent } from '@octokit/webhooks-types'

import {
  isPredicateQuantifier,
  Filter,
  PredicateQuantifier,
  SUPPORTED_PREDICATE_QUANTIFIERS
} from './filter.js'
import type { FilterConfig, FilterResults } from './filter.js'
import type { File } from '../file.js'
import { ChangeStatus } from '../file.js'
import * as git from './git.js'
import { backslashEscape, shellEscape } from './list-format/shell-escape.js'
import { csvEscape } from './list-format/csv-escape.js'

/** Supported output formats for file lists */
type ExportFormat = 'none' | 'csv' | 'json' | 'shell' | 'escape'

/** Interface for GitHub API file object from pull request files endpoint */
interface GitHubApiFile {
  filename: string
  status: string
  previous_filename?: string
}

/**
 * Main entry point for the paths filter action.
 *
 * Orchestrates the entire workflow: reads inputs, validates configuration, detects changed files,
 * applies filters, and exports results to GitHub Action outputs.
 *
 * @throws {Error} When invalid configuration is provided or required inputs are missing
 * @returns Promise that resolves when the action completes successfully
 */
export async function runPathsFilterAction(): Promise<void> {
  // Read and validate all input parameters
  const workingDirectory = core.getInput('working-directory', { required: false })
  if (workingDirectory && workingDirectory.length > 0) {
    process.chdir(workingDirectory)
  }

  const token = core.getInput('token', { required: false })
  const ref = core.getInput('ref', { required: false })
  const base = core.getInput('base', { required: false })
  const filtersInput = core.getInput('filters', { required: true })
  const filtersYaml = isPathInput(filtersInput)
    ? getConfigFileContent(filtersInput)
    : filtersInput
  const listFiles = core.getInput('list-files', { required: false }).toLowerCase() || 'none'
  const initialFetchDepth =
    parseInt(core.getInput('initial-fetch-depth', { required: false })) || 10
  const predicateQuantifier =
    core.getInput('predicate-quantifier', { required: false }) || PredicateQuantifier.SOME

  // Validate input parameters
  if (!isExportFormat(listFiles)) {
    core.setFailed(`Input parameter 'list-files' is set to invalid value '${listFiles}'`)
    return
  }

  if (!isPredicateQuantifier(predicateQuantifier)) {
    const predicateQuantifierInvalidErrorMsg =
      `Input parameter 'predicate-quantifier' is set to invalid value ` +
      `'${predicateQuantifier}'. Valid values: ${SUPPORTED_PREDICATE_QUANTIFIERS.join(', ')}`
    throw new Error(predicateQuantifierInvalidErrorMsg)
  }
  const filterConfig: FilterConfig = { predicateQuantifier }

  // Execute the main workflow
  const filter = new Filter(filtersYaml, filterConfig)
  const files = await getChangedFiles(token, base, ref, initialFetchDepth)
  core.info(`Detected ${files.length} changed files`)
  const results = filter.match(files)
  exportResults(results, listFiles)
}

/**
 * Determines if the input string is a file path rather than inline YAML content.
 *
 * @param text - The input string to check
 * @returns true if the text appears to be a file path, false if it's inline YAML
 */
function isPathInput(text: string): boolean {
  return !(text.includes('\n') || text.includes(':'))
}

/**
 * Reads and validates a configuration file.
 *
 * @param configPath - Path to the configuration file
 * @returns The file contents as a UTF-8 string
 * @throws {Error} When the file doesn't exist or isn't a regular file
 */
function getConfigFileContent(configPath: string): string {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file '${configPath}' not found`)
  }

  if (!fs.lstatSync(configPath).isFile()) {
    throw new Error(`'${configPath}' is not a file.`)
  }

  return fs.readFileSync(configPath, { encoding: 'utf8' })
}

/**
 * Detects changed files based on the workflow trigger type and input parameters.
 *
 * This function handles different scenarios:
 * - Local changes (base=HEAD): Detects uncommitted changes
 * - Pull Request events: Uses GitHub API or git diff against base branch
 * - Push events: Compares against previous commit or merge-base
 *
 * @param token - GitHub token for API access
 * @param base - Base reference for comparison
 * @param ref - Head reference for comparison
 * @param initialFetchDepth - Number of commits to fetch initially for merge-base detection
 * @returns Array of changed files with their modification status
 * @throws {Error} When unable to determine base branch or required token is missing
 */
async function getChangedFiles(
  token: string,
  base: string,
  ref: string,
  initialFetchDepth: number
): Promise<File[]> {
  // Handle local changes scenario
  if (base === git.HEAD) {
    if (ref && ref.length > 0) {
      core.warning(`'ref' input parameter is ignored when 'base' is set to HEAD`)
    }
    return await git.getChangesOnHead()
  }

  // Handle pull request events
  const prEvents = [
    'pull_request',
    'pull_request_review',
    'pull_request_review_comment',
    'pull_request_target'
  ]
  if (prEvents.includes(github.context.eventName)) {
    if (ref && ref.length > 0) {
      core.warning(`'ref' input parameter is ignored when 'base' is set to HEAD`)
    }
    if (base && base.length > 0) {
      core.warning(
        `'base' input parameter is ignored when action is triggered by pull request event`
      )
    }
    const pr = github.context.payload.pull_request as PullRequestEvent
    if (token && token.length > 0) {
      return await getChangedFilesFromApi(token, pr)
    }
    if (github.context.eventName === 'pull_request_target') {
      // pull_request_target runs in base branch context, so we need a token to access PR files
      throw new Error(
        `'token' input parameter is required if action is triggered by 'pull_request_target' event`
      )
    }
    core.info('Github token is not available - changes will be detected using git diff')
    const baseSha = (github.context.payload.pull_request as unknown as { base?: { sha?: string } } | undefined)?.base?.sha
    const defaultBranch = github.context.payload.repository?.['default_branch'] as
      | string
      | undefined
    const currentRef = await git.getCurrentRef()
    const resolvedBase = base ?? baseSha ?? defaultBranch
    if (!resolvedBase) {
      throw new Error('Unable to determine base branch for comparison')
    }
    return await git.getChanges(resolvedBase, currentRef)
  } else {
    // Handle other events (push, workflow_dispatch, etc.)
    return getChangedFilesFromGit(base, ref, initialFetchDepth)
  }
}

/**
 * Detects changed files using local git commands.
 *
 * Handles various git-based change detection scenarios:
 * - Comparison against specific commit SHA
 * - Comparison against merge-base with another branch
 * - Detection of changes in the last commit
 * - Initial push detection
 *
 * @param base - Base reference for comparison
 * @param head - Head reference for comparison
 * @param initialFetchDepth - Number of commits to fetch initially
 * @returns Array of changed files with their modification status
 * @throws {Error} When unable to determine base or head references
 */
async function getChangedFilesFromGit(
  base: string,
  head: string,
  initialFetchDepth: number
): Promise<File[]> {
  const defaultBranch = github.context.payload.repository?.['default_branch'] as string | undefined

  const beforeSha =
    github.context.eventName === 'push' ? (github.context.payload as PushEvent).before : null

  const currentRef = await git.getCurrentRef()

  const resolvedHead = git.getShortName(head || github.context.ref || currentRef)
  const resolvedBase = git.getShortName(base || defaultBranch)

  if (!resolvedHead) {
    throw new Error(
      "This action requires 'head' input to be configured, 'ref' to be set in the event payload or branch/tag checked out in current git repository"
    )
  }

  if (!resolvedBase) {
    throw new Error(
      "This action requires 'base' input to be configured or 'repository.default_branch' to be set in the event payload"
    )
  }

  const isBaseSha = git.isGitSha(resolvedBase)
  const isBaseSameAsHead = resolvedBase === resolvedHead

  // Compare against specific commit or previous commit on same branch
  if (isBaseSha || isBaseSameAsHead) {
    const baseSha = isBaseSha ? resolvedBase : beforeSha
    if (!baseSha) {
      core.warning(
        `'before' field is missing in event payload - changes will be detected from last commit`
      )
      if (resolvedHead !== currentRef) {
        core.warning(`Ref ${resolvedHead} is not checked out - results might be incorrect!`)
      }
      return await git.getChangesInLastCommit()
    }

    // Handle initial push (no previous commits)
    if (baseSha === git.NULL_SHA) {
      if (defaultBranch && resolvedBase !== defaultBranch) {
        core.info(
          `First push of a branch detected - changes will be detected against the default branch ${defaultBranch}`
        )
        return await git.getChangesSinceMergeBase(defaultBranch, resolvedHead, initialFetchDepth)
      } else {
        core.info('Initial push detected - all files will be listed as added')
        if (resolvedHead !== currentRef) {
          core.warning(`Ref ${resolvedHead} is not checked out - results might be incorrect!`)
        }
        return await git.listAllFilesAsAdded()
      }
    }

    core.info(`Changes will be detected between ${baseSha} and ${resolvedHead}`)
    return await git.getChanges(baseSha, resolvedHead)
  }

  // Compare using merge-base with another branch
  core.info(`Changes will be detected between ${resolvedBase} and ${resolvedHead}`)
  return await git.getChangesSinceMergeBase(resolvedBase, resolvedHead, initialFetchDepth)
}

/**
 * Fetches changed files from GitHub API for pull request events.
 *
 * Uses the GitHub REST API to get a list of files changed in a pull request.
 * This method is more efficient than git commands for PR events as it doesn't
 * require checking out the repository.
 *
 * @param token - GitHub token for API authentication
 * @param pullRequest - Pull request event payload
 * @returns Array of changed files with their modification status
 * @throws {Error} When API request fails or returns non-200 status
 */
async function getChangedFilesFromApi(
  token: string,
  pullRequest: PullRequestEvent
): Promise<File[]> {
  core.startGroup(`Fetching list of changed files for PR#${pullRequest.number} from Github API`)
  try {
    const client = github.getOctokit(token)
    const per_page = 100
    const files: File[] = []

    core.info(`Invoking listFiles(pull_number: ${pullRequest.number}, per_page: ${per_page})`)
    for await (const response of client.paginate.iterator(
      client.rest.pulls.listFiles.endpoint.merge({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: pullRequest.number,
        per_page
      })
    )) {
      if (response.status !== 200) {
        throw new Error(
          `Fetching list of changed files from GitHub API failed with error code ${response.status}`
        )
      }
      core.info(`Received ${response.data.length} items`)

      for (const row of response.data as GitHubApiFile[]) {
        core.info(`[${row.status}] ${row.filename}`)

        // Handle file renames by splitting them into separate add/delete operations
        // This ensures consistent behavior with git diff output
        if (row.status === 'renamed') {
          files.push({
            filename: row.filename,
            status: ChangeStatus.Added
          })
          files.push({
            // GitHub API includes previous_filename for renamed files
            filename: row.previous_filename ?? '',
            status: ChangeStatus.Deleted
          })
        } else {
          // Normalize GitHub API status to match git diff output
          const status =
            row.status === 'removed' ? ChangeStatus.Deleted : (row.status as ChangeStatus)
          files.push({
            filename: row.filename,
            status
          })
        }
      }
    }

    return files
  } finally {
    core.endGroup()
  }
}

/**
 * Exports filter results to GitHub Action outputs.
 *
 * For each filter, sets the following outputs:
 * - {filter_name}: 'true' if any files match, 'false' otherwise
 * - {filter_name}_count: Number of matching files
 * - {filter_name}_files: List of matching files (when list-files format is enabled)
 * - changes: JSON array of all filter names that matched
 *
 * @param results - Filter results mapped by filter name
 * @param format - Output format for file lists
 */
function exportResults(results: FilterResults, format: ExportFormat): void {
  core.info('Results:')
  const changes = []
  for (const [key, files] of Object.entries(results)) {
    const value = files.length > 0
    core.startGroup(`Filter ${key} = ${value}`)
    if (files.length > 0) {
      changes.push(key)
      core.info('Matching files:')
      for (const file of files) {
        core.info(`${file.filename} [${file.status}]`)
      }
    } else {
      core.info('Matching files: none')
    }

    // Set standard outputs for each filter
    core.setOutput(key, value)
    core.setOutput(`${key}_count`, files.length)
    if (format !== 'none') {
      const filesValue = serializeExport(files, format)
      core.setOutput(`${key}_files`, filesValue)
    }
    core.endGroup()
  }

  // Set the changes output (list of all matching filter names)
  if (!Object.prototype.hasOwnProperty.call(results, 'changes')) {
    const changesJson = JSON.stringify(changes)
    core.info(`Changes output set to ${changesJson}`)
    core.setOutput('changes', changesJson)
  } else {
    core.info('Cannot set changes output variable - name already used by filter output')
  }
}

/**
 * Serializes file list to the specified export format.
 *
 * @param files - Array of files to serialize
 * @param format - Target format for serialization
 * @returns Serialized string in the specified format
 */
function serializeExport(files: File[], format: ExportFormat): string {
  const fileNames = files.map(file => file.filename)
  switch (format) {
    case 'csv':
      return fileNames.map(csvEscape).join(',')
    case 'json':
      return JSON.stringify(fileNames)
    case 'escape':
      return fileNames.map(backslashEscape).join(' ')
    case 'shell':
      return fileNames.map(shellEscape).join(' ')
    default:
      return ''
  }
}

/**
 * Type guard to check if a string is a valid export format.
 *
 * @param value - String to check
 * @returns true if value is a valid ExportFormat
 */
function isExportFormat(value: string): value is ExportFormat {
  return ['none', 'csv', 'shell', 'json', 'escape'].includes(value)
}
