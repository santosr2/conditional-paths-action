/**
 * @fileoverview Git operations for detecting file changes.
 *
 * This module provides functions for interacting with git to detect file changes
 * in various scenarios: last commit, between refs, on HEAD, and since merge-base.
 * It handles repository fetching, reference resolution, and parsing of git diff output.
 */

import { getExecOutput } from '@actions/exec'
import * as core from '@actions/core'
import { File, ChangeStatus } from '../file.js'

/** The null SHA used by git to represent non-existent commits */
export const NULL_SHA = '0000000000000000000000000000000000000000'

/** Git reference to the current HEAD */
export const HEAD = 'HEAD'

/**
 * Gets file changes from the last commit.
 *
 * Uses `git log` to get the diff of the most recent commit.
 * This is useful for detecting what was changed in the latest commit.
 *
 * @returns Array of files changed in the last commit
 * @throws {Error} When git command fails
 */
export async function getChangesInLastCommit(): Promise<File[]> {
  core.startGroup(`Change detection in last commit`)
  let output = ''
  try {
    output = (
      await getExecOutput('git', [
        'log',
        '--format=',       // No commit message formatting
        '--no-renames',    // Don't detect renames for consistency
        '--name-status',   // Show file names and their change status
        '-z',              // Use null character as separator
        '-n',              // Limit to specified number of commits
        '1'                // Only the last commit
      ])
    ).stdout
  } finally {
    fixStdOutNullTermination()
    core.endGroup()
  }

  return parseGitDiffOutput(output)
}

/**
 * Gets file changes between two git references.
 *
 * Compares two git refs directly using `git diff base..head`.
 * Both refs are ensured to be available locally before comparison.
 *
 * @param base - Base reference (commit, branch, or tag)
 * @param head - Head reference (commit, branch, or tag)
 * @returns Array of files changed between the two references
 * @throws {Error} When references cannot be resolved or git command fails
 */
export async function getChanges(base: string, head: string): Promise<File[]> {
  const baseRef = await ensureRefAvailable(base)
  const headRef = await ensureRefAvailable(head)

  // Get differences between ref and HEAD
  core.startGroup(`Change detection ${base}..${head}`)
  let output = ''
  try {
    // Two dots '..' change detection - directly compares two versions
    output = (
      await getExecOutput('git', [
        'diff',
        '--no-renames',     // Don't detect renames for consistency
        '--name-status',    // Show file names and their change status
        '-z',               // Use null character as separator
        `${baseRef}..${headRef}`
      ])
    ).stdout
  } finally {
    fixStdOutNullTermination()
    core.endGroup()
  }

  return parseGitDiffOutput(output)
}

/**
 * Gets changes in the working directory and index compared to HEAD.
 *
 * This detects both staged and unstaged changes in the current working directory.
 * Useful for detecting local modifications before they are committed.
 *
 * @returns Array of files with changes on HEAD
 * @throws {Error} When git command fails
 */
export async function getChangesOnHead(): Promise<File[]> {
  // Get current changes - both staged and unstaged
  core.startGroup(`Change detection on HEAD`)
  let output = ''
  try {
    output = (await getExecOutput('git', ['diff', '--no-renames', '--name-status', '-z', 'HEAD']))
      .stdout
  } finally {
    fixStdOutNullTermination()
    core.endGroup()
  }

  return parseGitDiffOutput(output)
}

/**
 * Gets file changes since the merge-base between two references.
 *
 * This function finds the common ancestor (merge-base) between base and head,
 * then compares head against that common ancestor using `git diff base...head`.
 * If no merge-base exists, falls back to direct comparison.
 *
 * The function handles fetching commits as needed, progressively increasing
 * fetch depth until a merge-base is found or full history is fetched.
 *
 * @param base - Base reference to find merge-base with
 * @param head - Head reference to compare
 * @param initialFetchDepth - Initial number of commits to fetch
 * @returns Array of files changed since merge-base
 * @throws {Error} When references cannot be resolved or git commands fail
 */
export async function getChangesSinceMergeBase(
  base: string,
  head: string,
  initialFetchDepth: number
): Promise<File[]> {
  let baseRef: string | undefined
  let headRef: string | undefined

  /**
   * Checks if a merge-base exists between baseRef and headRef.
   * @returns true if merge-base exists, false otherwise
   */
  async function hasMergeBase(): Promise<boolean> {
    if (baseRef === undefined || headRef === undefined) {
      return false
    }
    return (
      (await getExecOutput('git', ['merge-base', baseRef, headRef], { ignoreReturnCode: true }))
        .exitCode === 0
    )
  }

  let noMergeBase = false
  core.startGroup(`Searching for merge-base ${base}...${head}`)
  try {
    baseRef = await getLocalRef(base)
    headRef = await getLocalRef(head)

    if (!(await hasMergeBase())) {
      // Fetch initial commits for both refs
      await getExecOutput('git', [
        'fetch',
        '--no-tags',
        `--depth=${initialFetchDepth}`,
        'origin',
        base,
        head
      ])

      // Update local refs after fetch
      if (baseRef === undefined || headRef === undefined) {
        baseRef = baseRef ?? (await getLocalRef(base))
        headRef = headRef ?? (await getLocalRef(head))

        // Try fetching tags if refs still not found
        if (baseRef === undefined || headRef === undefined) {
          await getExecOutput('git', ['fetch', '--tags', '--depth=1', 'origin', base, head], {
            ignoreReturnCode: true // returns exit code 1 if tags on remote were updated - we can safely ignore it
          })
          baseRef = baseRef ?? (await getLocalRef(base))
          headRef = headRef ?? (await getLocalRef(head))

          if (baseRef === undefined) {
            throw new Error(
              `Could not determine what is ${base} - fetch works but it's not a branch, tag or commit SHA`
            )
          }
          if (headRef === undefined) {
            throw new Error(
              `Could not determine what is ${head} - fetch works but it's not a branch, tag or commit SHA`
            )
          }
        }
      }

      // Progressively fetch more commits until merge-base is found
      let depth = initialFetchDepth
      let lastCommitCount = await getCommitCount()
      while (!(await hasMergeBase())) {
        depth = Math.min(depth * 2, Number.MAX_SAFE_INTEGER)
        await getExecOutput('git', ['fetch', `--deepen=${depth}`, 'origin', base, head])
        const commitCount = await getCommitCount()

        if (commitCount === lastCommitCount) {
          core.info('No more commits were fetched')
          core.info('Last attempt will be to fetch full history')
          await getExecOutput('git', ['fetch'])
          if (!(await hasMergeBase())) {
            noMergeBase = true
          }
          break
        }
        lastCommitCount = commitCount
      }
    }
  } finally {
    core.endGroup()
  }

  // Three dots '...' change detection - finds merge-base and compares against it
  let diffArg = `${baseRef}...${headRef}`
  if (noMergeBase) {
    core.warning(
      'No merge base found - change detection will use direct <commit>..<commit> comparison'
    )
    diffArg = `${baseRef}..${headRef}`
  }

  // Get changes introduced on ref compared to base
  core.startGroup(`Change detection ${diffArg}`)
  let output = ''
  try {
    output = (await getExecOutput('git', ['diff', '--no-renames', '--name-status', '-z', diffArg]))
      .stdout
  } finally {
    fixStdOutNullTermination()
    core.endGroup()
  }

  return parseGitDiffOutput(output)
}

/**
 * Parses git diff output into File objects.
 *
 * Git diff with -z and --name-status outputs data in the format:
 * STATUS\0FILENAME\0STATUS\0FILENAME\0...
 *
 * This function splits the output and maps git status characters to ChangeStatus enum values.
 *
 * @param output - Raw git diff output with null-separated values
 * @returns Array of parsed File objects
 */
export function parseGitDiffOutput(output: string): File[] {
  const tokens = output.split('\u0000').filter(s => s.length > 0)
  const files: File[] = []

  for (let i = 0; i + 1 < tokens.length; i += 2) {
    const statusKey = tokens[i]
    const filename = tokens[i + 1]

    // tokens[i] and tokens[i + 1] are guaranteed to exist by the loop condition
    if (statusKey && filename) {
      const status = statusMap[statusKey]
      if (status !== undefined) {
        files.push({
          status,
          filename
        })
      }
    }
  }
  return files
}

/**
 * Lists all files tracked by git as "added" files.
 *
 * This is used for initial commits or when there's no base reference to compare against.
 * All tracked files are treated as newly added.
 *
 * @returns Array of all tracked files marked as Added
 * @throws {Error} When git command fails
 */
export async function listAllFilesAsAdded(): Promise<File[]> {
  core.startGroup('Listing all files tracked by git')
  let output = ''
  try {
    output = (await getExecOutput('git', ['ls-files', '-z'])).stdout
  } finally {
    fixStdOutNullTermination()
    core.endGroup()
  }

  return output
    .split('\u0000')
    .filter(s => s.length > 0)
    .map(path => ({
      status: ChangeStatus.Added,
      filename: path
    }))
}

/**
 * Gets the current git reference (branch, tag, or commit SHA).
 *
 * Attempts to determine the current ref in this order:
 * 1. Current branch name
 * 2. Exact tag name (if HEAD points to a tag)
 * 3. Current commit SHA
 *
 * @returns Current git reference as a string
 * @throws {Error} When git commands fail
 */
export async function getCurrentRef(): Promise<string> {
  core.startGroup(`Get current git ref`)
  try {
    // Try to get current branch name
    const branch = (await getExecOutput('git', ['branch', '--show-current'])).stdout.trim()
    if (branch) {
      return branch
    }

    // Try to get exact tag name
    const describe = await getExecOutput('git', ['describe', '--tags', '--exact-match'], {
      ignoreReturnCode: true
    })
    if (describe.exitCode === 0) {
      return describe.stdout.trim()
    }

    // Fallback to commit SHA
    return (await getExecOutput('git', ['rev-parse', HEAD])).stdout.trim()
  } finally {
    core.endGroup()
  }
}

/**
 * Extracts the short name from a git reference.
 *
 * Removes common git ref prefixes to get clean reference names:
 * - refs/heads/main -> main
 * - refs/tags/v1.0 -> v1.0
 * - refs/remotes/origin/feature -> feature
 *
 * @param ref - Full git reference or undefined
 * @returns Short reference name or undefined if input is undefined
 */
export function getShortName(ref: string | undefined): string | undefined {
  if (!ref) return undefined

  const heads = 'refs/heads/'
  const tags = 'refs/tags/'

  if (ref.startsWith(heads)) return ref.slice(heads.length)
  if (ref.startsWith(tags)) return ref.slice(tags.length)

  return ref
}

/**
 * Checks if a string looks like a git SHA-1 hash.
 *
 * @param ref - String to check
 * @returns true if the string matches the format of a 40-character SHA-1 hash
 */
export function isGitSha(ref: string): boolean {
  return /^[a-z0-9]{40}$/.test(ref)
}

/**
 * Checks if a commit exists in the local repository.
 *
 * @param ref - Git reference to check
 * @returns true if the commit exists locally
 */
async function hasCommit(ref: string): Promise<boolean> {
  return (
    (await getExecOutput('git', ['cat-file', '-e', `${ref}^{commit}`], { ignoreReturnCode: true }))
      .exitCode === 0
  )
}

/**
 * Gets the total number of commits in the repository.
 *
 * @returns Number of commits across all branches
 */
async function getCommitCount(): Promise<number> {
  const output = (await getExecOutput('git', ['rev-list', '--count', '--all'])).stdout
  const count = parseInt(output)
  return isNaN(count) ? 0 : count
}

/**
 * Resolves a short reference name to a full local git reference.
 *
 * Attempts to find the reference in this order:
 * 1. As a commit SHA (if it looks like one)
 * 2. As a remote branch (refs/remotes/origin/name)
 * 3. As any other matching reference
 *
 * @param shortName - Short reference name to resolve
 * @returns Full git reference or undefined if not found
 */
async function getLocalRef(shortName: string): Promise<string | undefined> {
  if (isGitSha(shortName)) {
    return (await hasCommit(shortName)) ? shortName : undefined
  }

  const output = (await getExecOutput('git', ['show-ref', shortName], { ignoreReturnCode: true }))
    .stdout
  const refs = output
    .split(/\r?\n/g)
    .map(l => l.match(/refs\/(?:(?:heads)|(?:tags)|(?:remotes\/origin))\/(.*)$/))
    .filter(match => match !== null && match[1] === shortName)
    .map(match => match?.[0] ?? '') // match can't be null here but compiler doesn't understand that

  if (refs.length === 0) {
    return undefined
  }

  // Prefer remote refs over local ones
  const remoteRef = refs.find(ref => ref.startsWith('refs/remotes/origin/'))
  if (remoteRef) {
    return remoteRef
  }

  return refs[0]
}

/**
 * Ensures a git reference is available locally, fetching from origin if needed.
 *
 * Tries to resolve the reference locally first. If not found, attempts to fetch
 * it from the origin remote using various strategies (branches, tags).
 *
 * @param name - Reference name to ensure is available
 * @returns Full git reference that is guaranteed to exist locally
 * @throws {Error} When reference cannot be fetched or resolved
 */
async function ensureRefAvailable(name: string): Promise<string> {
  core.startGroup(`Ensuring ${name} is fetched from origin`)
  try {
    let ref = await getLocalRef(name)

    if (ref === undefined) {
      // Try fetching as a branch
      await getExecOutput('git', ['fetch', '--depth=1', '--no-tags', 'origin', name])
      ref = await getLocalRef(name)

      if (ref === undefined) {
        // Try fetching as a tag
        await getExecOutput('git', ['fetch', '--depth=1', '--tags', 'origin', name])
        ref = await getLocalRef(name)

        if (ref === undefined) {
          throw new Error(
            `Could not determine what is ${name} - fetch works but it's not a branch, tag or commit SHA`
          )
        }
      }
    }

    return ref
  } finally {
    core.endGroup()
  }
}

/**
 * Fixes stdout null termination issues with git commands.
 *
 * Some git commands use NULL as delimiters and output is printed to stdout.
 * We need to ensure the next thing written to stdout starts on a new line,
 * otherwise GitHub Actions output commands like ::set-output wouldn't work properly.
 */
function fixStdOutNullTermination(): void {
  // Previous command uses NULL as delimiters and output is printed to stdout.
  // We have to make sure next thing written to stdout will start on new line.
  // Otherwise things like ::set-output wouldn't work.
  core.info('')
}

/**
 * Mapping of git diff status characters to ChangeStatus enum values.
 *
 * Git uses single characters to represent file change types:
 * - A: Added (new file)
 * - C: Copied (file copied from another)
 * - D: Deleted (file removed)
 * - M: Modified (file content changed)
 * - R: Renamed (file moved/renamed)
 * - U: Unmerged (file has merge conflicts)
 */
const statusMap: Record<string, ChangeStatus | undefined> = {
  A: ChangeStatus.Added,
  C: ChangeStatus.Copied,
  D: ChangeStatus.Deleted,
  M: ChangeStatus.Modified,
  R: ChangeStatus.Renamed,
  U: ChangeStatus.Unmerged
}
