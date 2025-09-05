/**
 * @fileoverview Shell escaping utilities for safe command-line usage.
 *
 * This module provides functions to escape file paths and strings for safe usage
 * in shell commands, supporting both backslash escaping and shell-friendly quoting.
 */
/**
 * Escapes a string using backslash escaping for shell usage.
 *
 * Every character except a small subset of definitely safe characters is escaped
 * with a backslash. This ensures the string can be safely used as a shell argument.
 *
 * Safe characters (not escaped): a-z, A-Z, 0-9, comma, period, underscore, plus,
 * colon, at-sign, percent, forward slash, and hyphen.
 *
 * @param value - String to escape
 * @returns Backslash-escaped string safe for shell usage
 *
 * @example
 * ```typescript
 * backslashEscape('file with spaces.txt') // Returns: file\ with\ spaces.txt
 * backslashEscape('normal-file.js')       // Returns: normal-file.js (unchanged)
 * ```
 */
export declare function backslashEscape(value: string): string;
/**
 * Escapes a filename for usage as a shell argument using quotes when needed.
 *
 * Applies a "human readable" approach with as few escape characters as possible.
 * The function chooses the most appropriate escaping method:
 *
 * 1. If the string contains only safe characters, returns as-is
 * 2. If it contains single quotes but otherwise safe chars, uses double quotes
 * 3. If it contains single quotes and unsafe chars, uses recursive escaping
 * 4. Otherwise, wraps in single quotes
 *
 * @param value - String to escape for shell usage
 * @returns Shell-escaped string that can be safely used as a command argument
 *
 * @example
 * ```typescript
 * shellEscape('simple-file.txt')        // Returns: simple-file.txt
 * shellEscape('file with spaces.txt')   // Returns: 'file with spaces.txt'
 * shellEscape("file with 'quotes'.txt") // Returns: "file with 'quotes'.txt"
 * shellEscape('complex"mixed\'chars')   // Returns: complex"mixed\'chars (recursively escaped)
 * ```
 */
export declare function shellEscape(value: string): string;
//# sourceMappingURL=shell-escape.d.ts.map
