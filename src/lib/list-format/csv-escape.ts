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
 * @fileoverview CSV escaping utilities for safe CSV output generation.
 *
 * This module provides functions to escape strings for safe usage in CSV format,
 * following RFC 4180 standards for CSV data formatting.
 */

/**
 * Escapes a string for safe usage in CSV format.
 *
 * The function follows RFC 4180 CSV standards:
 * - Safe characters (a-z, A-Z, 0-9, period, underscore, plus, colon,
 *   at-sign, percent, forward slash, hyphen) are left unescaped
 * - Strings containing unsafe characters are wrapped in double quotes
 * - Double quotes within the string are escaped by doubling them ("")
 *
 * @param value - String to escape for CSV usage
 * @returns CSV-escaped string safe for use in CSV files
 *
 * @see {@link https://tools.ietf.org/html/rfc4180} RFC 4180 CSV specification
 *
 * @example
 * ```typescript
 * csvEscape('simple-file.txt')      // Returns: simple-file.txt
 * csvEscape('file with spaces.txt') // Returns: "file with spaces.txt"
 * csvEscape('file "with" quotes')   // Returns: "file ""with"" quotes"
 * csvEscape('')                     // Returns: (empty string)
 * ```
 */
export function csvEscape(value: string): string {
  if (value === '') return value

  // Only safe characters - no escaping needed
  if (/^[a-zA-Z0-9._+:@%/-]+$/m.test(value)) {
    return value
  }

  // RFC 4180: If double-quotes are used to enclose fields, then a double-quote
  // appearing inside a field must be escaped by preceding it with another double quote
  return `"${value.replace(/"/g, '""')}"`
}
