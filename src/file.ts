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
 * @fileoverview File-related types and enums for the Paths Filter action.
 *
 * This module defines the core data structures used to represent files and their
 * modification status throughout the action's workflow.
 */

/**
 * Represents a file with its modification status.
 *
 * This interface is used throughout the action to track files that have been
 * changed in the repository, along with the type of change that occurred.
 */
export interface File {
  /** The path/name of the file relative to the repository root */
  filename: string
  /** The type of change that occurred to this file */
  status: ChangeStatus
}

/**
 * Enumeration of possible file change statuses.
 *
 * These values correspond to git diff status codes and GitHub API file statuses,
 * providing a consistent way to represent different types of file modifications.
 */
export enum ChangeStatus {
  /** File was newly created */
  Added = 'added',
  /** File was copied from another file */
  Copied = 'copied',
  /** File was removed */
  Deleted = 'deleted',
  /** File content was changed */
  Modified = 'modified',
  /** File was moved/renamed */
  Renamed = 'renamed',
  /** File has merge conflicts (unmerged state) */
  Unmerged = 'unmerged'
}
