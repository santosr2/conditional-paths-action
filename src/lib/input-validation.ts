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
 * @fileoverview Input validation and parsing for the Paths Filter action.
 *
 * This module provides Zod-based schema validation for GitHub Action inputs,
 * ensuring type safety and proper error handling for all configuration parameters.
 */

import { z } from 'zod'
import * as core from '@actions/core'

/** Schema for validating export format options */
export const ExportFormatSchema = z.enum(['none', 'csv', 'json', 'shell', 'escape'])

/** Valid export format types for file lists */
export type ExportFormat = z.infer<typeof ExportFormatSchema>

/** Schema for validating predicate quantifier options */
export const PredicateQuantifierSchema = z.enum(['some', 'every'])

/** Valid predicate quantifier types for pattern matching */
export type PredicateQuantifier = z.infer<typeof PredicateQuantifierSchema>

/** Complete schema for validating all action inputs */
export const InputSchema = z.object({
  /** Relative path where the repository was checked out */
  workingDirectory: z.string().optional(),
  /** GitHub token for API access */
  token: z.string().optional(),
  /** Git reference to detect changes from */
  ref: z.string().optional(),
  /** Git reference to compare against */
  base: z.string().optional(),
  /** Path filters configuration (YAML string or file path) */
  filters: z.string().min(1, 'Filters configuration is required'),
  /** Format for outputting matched file lists */
  listFiles: ExportFormatSchema.default('none'),
  /** Initial number of commits to fetch for merge-base detection */
  initialFetchDepth: z.number().positive().default(100),
  /** Logic quantifier for multiple pattern matching */
  predicateQuantifier: PredicateQuantifierSchema.default('some')
})

/** Type representing validated action inputs */
export type ActionInputs = z.infer<typeof InputSchema>

/**
 * Reads and validates all action inputs from the GitHub Actions environment.
 *
 * This function:
 * 1. Reads raw input values from the GitHub Actions environment
 * 2. Converts string inputs to appropriate types (numbers, etc.)
 * 3. Validates all inputs against the defined schema
 * 4. Returns type-safe, validated input objects
 *
 * @returns Validated action inputs with proper types
 * @throws {Error} When inputs are invalid or missing required values
 *
 * @example
 * ```typescript
 * try {
 *   const inputs = getInputs()
 *   console.log(inputs.filters) // Type-safe string access
 *   console.log(inputs.initialFetchDepth) // Type-safe number access
 * } catch (error) {
 *   console.error('Invalid inputs:', error.message)
 * }
 * ```
 */
export function getInputs(): ActionInputs {
  try {
    // Read raw inputs from GitHub Actions environment
    const rawInputs = {
      workingDirectory: core.getInput('working-directory') || undefined,
      token: core.getInput('token') || undefined,
      ref: core.getInput('ref') || undefined,
      base: core.getInput('base') || undefined,
      filters: core.getInput('filters', { required: true }),
      listFiles: (core.getInput('list-files') || 'none') as ExportFormat,
      initialFetchDepth: parseInt(core.getInput('initial-fetch-depth') || '100'),
      predicateQuantifier: (core.getInput('predicate-quantifier') || 'some') as PredicateQuantifier
    }

    // Validate and return typed inputs
    return InputSchema.parse(rawInputs)
  } catch (error) {
    // Provide user-friendly error messages for validation failures
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map(issue => `- ${issue.path.join('.')}: ${issue.message}`)
        .join('\n')
      throw new Error(`Invalid action inputs:\n${issues}`)
    }
    throw error
  }
}
