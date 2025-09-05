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
    filename: string;
    /** The type of change that occurred to this file */
    status: ChangeStatus;
}
/**
 * Enumeration of possible file change statuses.
 *
 * These values correspond to git diff status codes and GitHub API file statuses,
 * providing a consistent way to represent different types of file modifications.
 */
export declare enum ChangeStatus {
    /** File was newly created */
    Added = "added",
    /** File was copied from another file */
    Copied = "copied",
    /** File was removed */
    Deleted = "deleted",
    /** File content was changed */
    Modified = "modified",
    /** File was moved/renamed */
    Renamed = "renamed",
    /** File has merge conflicts (unmerged state) */
    Unmerged = "unmerged"
}
