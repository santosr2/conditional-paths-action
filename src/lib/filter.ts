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
 * @fileoverview Filter system for matching files against pattern rules.
 *
 * This module provides the core filtering functionality that matches changed files
 * against user-defined glob patterns and change type rules. It supports complex
 * filter configurations with multiple patterns, change type restrictions, and
 * different logical quantifiers (AND/OR matching).
 */

import * as jsyaml from 'js-yaml'
import picomatch from 'picomatch'
import type { File } from '../file.js'
import { ChangeStatus } from '../file.js'

/**
 * Type definition of object we expect to load from YAML configuration.
 * Maps filter names to their rule definitions.
 */
interface FilterYaml {
  [name: string]: FilterItemYaml
}

/**
 * Represents a single filter rule item in YAML format.
 * Can be:
 * - A simple string pattern (e.g., "src/**")
 * - An object with change types as keys (e.g., {"added|modified": "src/**"})
 * - An array of filter items (supports YAML anchors/references)
 */
type FilterItemYaml =
  | string // Filename pattern, e.g. "path/to/*.js"
  | { [changeTypes: string]: string | string[] } // Change status and filename, e.g. added|modified: "path/to/*.js"
  | FilterItemYaml[] // Supports referencing another rule via YAML anchor

/** Picomatch options used in all matchers */
const MatchOptions = {
  /** Include files/directories that start with a dot */
  dot: true
}

/**
 * Internal representation of one item in named filter rule.
 * Created as simplified form of data in FilterItemYaml after parsing.
 */
interface FilterRuleItem {
  /** Required change status of the matched files (undefined means any status) */
  status?: ChangeStatus[]
  /** Function to test if a filename matches the pattern */
  isMatch: (str: string) => boolean
}

/**
 * Enumerates the possible logic quantifiers that can be used when determining
 * if a file is a match with multiple patterns.
 *
 * The YAML configuration property that is parsed into one of these values is
 * 'predicate-quantifier' on the top level of the configuration object of the
 * action.
 *
 * The default is to use 'some' which used to be the hardcoded behavior prior to
 * the introduction of the new mechanism.
 *
 * @see https://en.wikipedia.org/wiki/Quantifier_(logic)
 */
export enum PredicateQuantifier {
  /**
   * When choosing 'every' in the config it means that files will only get matched
   * if all the patterns are satisfied by the path of the file, not just at least one of them.
   */
  EVERY = 'every',
  /**
   * When choosing 'some' in the config it means that files will get matched as long as there is
   * at least one pattern that matches them. This is the default behavior if you don't
   * specify anything as a predicate quantifier.
   */
  SOME = 'some'
}

/**
 * Configuration object used to customize filter behavior.
 */
export type FilterConfig = {
  /** Determines whether patterns use AND (every) or OR (some) logic */
  readonly predicateQuantifier: PredicateQuantifier
}

/**
 * An array of strings (at runtime) that contains the valid/accepted values for
 * the configuration parameter 'predicate-quantifier'.
 */
export const SUPPORTED_PREDICATE_QUANTIFIERS = Object.values(PredicateQuantifier)

/**
 * Type guard to check if a value is a valid PredicateQuantifier.
 *
 * @param x - Value to check
 * @returns true if x is a valid PredicateQuantifier enum value
 */
export function isPredicateQuantifier(x: unknown): x is PredicateQuantifier {
  return SUPPORTED_PREDICATE_QUANTIFIERS.includes(x as PredicateQuantifier)
}

/**
 * Results of applying filters to a set of files.
 * Maps filter names to arrays of files that matched the filter rules.
 */
export interface FilterResults {
  [key: string]: File[]
}

/**
 * Main filter class that handles parsing YAML filter rules and matching files against them.
 *
 * The Filter class supports:
 * - Glob pattern matching using picomatch
 * - Change type filtering (added, modified, deleted, etc.)
 * - Multiple patterns per filter with AND/OR logic
 * - YAML anchor references for rule reuse
 *
 * @example
 * ```typescript
 * const filter = new Filter(`
 *   src:
 *     - 'src/**'
 *     - '!**\/*.test.ts'
 *   docs:
 *     - added|modified: '*.md'
 * `)
 *
 * const results = filter.match(files)
 * console.log(results.src) // Files matching src filter
 * ```
 */
export class Filter {
  /** Internal storage for parsed filter rules */
  rules: { [key: string]: FilterRuleItem[] } = {}

  /**
   * Creates instance of Filter and loads rules from YAML if provided.
   *
   * @param yaml - Optional YAML string containing filter definitions
   * @param filterConfig - Optional configuration for filter behavior
   */
  constructor(
    yaml?: string,
    readonly filterConfig?: FilterConfig
  ) {
    if (yaml) {
      this.load(yaml)
    }
  }

  /**
   * Load rules from YAML string.
   *
   * Parses the YAML and converts it into internal FilterRuleItem format.
   * Supports complex rule definitions with change type restrictions and
   * pattern arrays.
   *
   * @param yaml - YAML string containing filter definitions
   * @throws {Error} When YAML is invalid or has incorrect format
   */
  load(yaml: string): void {
    if (!yaml) {
      return
    }

    const doc = jsyaml.load(yaml) as FilterYaml
    if (typeof doc !== 'object') {
      this.throwInvalidFormatError('Root element is not an object')
    }

    for (const [key, item] of Object.entries(doc)) {
      this.rules[key] = this.parseFilterItemYaml(item)
    }
  }

  /**
   * Matches files against all loaded filter rules.
   *
   * @param files - Array of files to test against the filters
   * @returns Object mapping filter names to arrays of matching files
   */
  match(files: File[]): FilterResults {
    const result: FilterResults = {}
    for (const [key, patterns] of Object.entries(this.rules)) {
      result[key] = files.filter(file => this.isMatch(file, patterns))
    }
    return result
  }

  /**
   * Tests if a file matches a set of filter rule patterns.
   *
   * Uses the configured predicate quantifier to determine whether patterns
   * are combined with AND (every) or OR (some) logic.
   *
   * @param file - File to test
   * @param patterns - Array of filter rule patterns to test against
   * @returns true if the file matches according to the configured logic
   */
  private isMatch(file: File, patterns: FilterRuleItem[]): boolean {
    const aPredicate = (rule: Readonly<FilterRuleItem>): boolean => {
      return (
        (rule.status === undefined || rule.status.includes(file.status)) &&
        rule.isMatch(file.filename)
      )
    }
    if (this.filterConfig?.predicateQuantifier === PredicateQuantifier.EVERY) {
      return patterns.every(aPredicate)
    } else {
      return patterns.some(aPredicate)
    }
  }

  /**
   * Parses a filter item from YAML format into internal representation.
   *
   * Handles different YAML formats:
   * - String patterns: "src/**"
   * - Change type objects: {"added|modified": "src/**"}
   * - Arrays of patterns: ["src/**", "!**\/*.test.ts"]
   *
   * @param item - Filter item in YAML format
   * @returns Array of parsed filter rule items
   * @throws {Error} When item format is invalid
   */
  private parseFilterItemYaml(item: FilterItemYaml): FilterRuleItem[] {
    if (Array.isArray(item)) {
      return flat(item.map(i => this.parseFilterItemYaml(i)))
    }

    if (typeof item === 'string') {
      return [{ isMatch: picomatch(item, MatchOptions) }]
    }

    if (typeof item === 'object') {
      return Object.entries(item).map(([key, pattern]) => {
        if (typeof key !== 'string' || (typeof pattern !== 'string' && !Array.isArray(pattern))) {
          this.throwInvalidFormatError(
            `Expected [key:string]= pattern:string | string[], but [${key}:${typeof key}]= ${pattern}:${typeof pattern} found`
          )
        }
        return {
          status: key
            .split('|')
            .map(x => x.trim())
            .filter(x => x.length > 0)
            .map(x => x.toLowerCase()) as ChangeStatus[],
          isMatch: picomatch(pattern, MatchOptions)
        }
      })
    }

    this.throwInvalidFormatError(`Unexpected element type '${typeof item}'`)
  }

  /**
   * Throws a formatted error for invalid filter YAML format.
   *
   * @param message - Specific error message describing the issue
   * @throws {Error} Always throws with formatted message
   */
  private throwInvalidFormatError(message: string): never {
    throw new Error(`Invalid filter YAML format: ${message}.`)
  }
}

/**
 * Creates a new array with all sub-array elements concatenated.
 *
 * In future could be replaced by Array.prototype.flat (supported on Node.js 11+).
 * This implementation provides compatibility with older Node.js versions.
 *
 * @param arr - Array of arrays to flatten
 * @returns Flattened array with all elements
 */
function flat<T>(arr: T[][]): T[] {
  return arr.reduce((acc, val) => acc.concat(val), [])
}
