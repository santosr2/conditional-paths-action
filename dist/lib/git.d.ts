/**
 * @fileoverview Git operations for detecting file changes.
 *
 * This module provides functions for interacting with git to detect file changes
 * in various scenarios: last commit, between refs, on HEAD, and since merge-base.
 * It handles repository fetching, reference resolution, and parsing of git diff output.
 */
import { File } from '../file.js';
/** The null SHA used by git to represent non-existent commits */
export declare const NULL_SHA = "0000000000000000000000000000000000000000";
/** Git reference to the current HEAD */
export declare const HEAD = "HEAD";
/**
 * Gets file changes from the last commit.
 *
 * Uses `git log` to get the diff of the most recent commit.
 * This is useful for detecting what was changed in the latest commit.
 *
 * @returns Array of files changed in the last commit
 * @throws {Error} When git command fails
 */
export declare function getChangesInLastCommit(): Promise<File[]>;
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
export declare function getChanges(base: string, head: string): Promise<File[]>;
/**
 * Gets changes in the working directory and index compared to HEAD.
 *
 * This detects both staged and unstaged changes in the current working directory.
 * Useful for detecting local modifications before they are committed.
 *
 * @returns Array of files with changes on HEAD
 * @throws {Error} When git command fails
 */
export declare function getChangesOnHead(): Promise<File[]>;
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
export declare function getChangesSinceMergeBase(base: string, head: string, initialFetchDepth: number): Promise<File[]>;
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
export declare function parseGitDiffOutput(output: string): File[];
/**
 * Lists all files tracked by git as "added" files.
 *
 * This is used for initial commits or when there's no base reference to compare against.
 * All tracked files are treated as newly added.
 *
 * @returns Array of all tracked files marked as Added
 * @throws {Error} When git command fails
 */
export declare function listAllFilesAsAdded(): Promise<File[]>;
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
export declare function getCurrentRef(): Promise<string>;
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
export declare function getShortName(ref: string | undefined): string | undefined;
/**
 * Checks if a string looks like a git SHA-1 hash.
 *
 * @param ref - String to check
 * @returns true if the string matches the format of a 40-character SHA-1 hash
 */
export declare function isGitSha(ref: string): boolean;
//# sourceMappingURL=git.d.ts.map
