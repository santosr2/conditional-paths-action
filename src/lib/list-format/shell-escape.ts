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
export function backslashEscape(value: string): string {
  return value.replace(/([^a-zA-Z0-9,._+:@%/-])/gm, '\\$1')
}

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
export function shellEscape(value: string): string {
  if (value === '') return value

  // Only safe characters - no escaping needed
  if (/^[a-zA-Z0-9,._+:@%/-]+$/m.test(value)) {
    return value
  }

  if (value.includes("'")) {
    // Only safe characters, single quotes and white-spaces - use double quotes
    if (/^[a-zA-Z0-9,._+:@%/'\s-]+$/m.test(value)) {
      return `"${value}"`
    }

    // Contains single quotes and other unsafe characters
    // Split by single quote and apply escaping recursively
    return value.split("'").map(shellEscape).join("\\'")
  }

  // Contains some unsafe characters but no single quote - use single quotes
  return `'${value}'`
}
