/**
 * @fileoverview Input validation and parsing for the Paths Filter action.
 *
 * This module provides Zod-based schema validation for GitHub Action inputs,
 * ensuring type safety and proper error handling for all configuration parameters.
 */
import { z } from 'zod';
/** Schema for validating export format options */
export declare const ExportFormatSchema: z.ZodEnum<["none", "csv", "json", "shell", "escape"]>;
/** Valid export format types for file lists */
export type ExportFormat = z.infer<typeof ExportFormatSchema>;
/** Schema for validating predicate quantifier options */
export declare const PredicateQuantifierSchema: z.ZodEnum<["some", "every"]>;
/** Valid predicate quantifier types for pattern matching */
export type PredicateQuantifier = z.infer<typeof PredicateQuantifierSchema>;
/** Complete schema for validating all action inputs */
export declare const InputSchema: z.ZodObject<{
    /** Relative path where the repository was checked out */
    workingDirectory: z.ZodOptional<z.ZodString>;
    /** GitHub token for API access */
    token: z.ZodOptional<z.ZodString>;
    /** Git reference to detect changes from */
    ref: z.ZodOptional<z.ZodString>;
    /** Git reference to compare against */
    base: z.ZodOptional<z.ZodString>;
    /** Path filters configuration (YAML string or file path) */
    filters: z.ZodString;
    /** Format for outputting matched file lists */
    listFiles: z.ZodDefault<z.ZodEnum<["none", "csv", "json", "shell", "escape"]>>;
    /** Initial number of commits to fetch for merge-base detection */
    initialFetchDepth: z.ZodDefault<z.ZodNumber>;
    /** Logic quantifier for multiple pattern matching */
    predicateQuantifier: z.ZodDefault<z.ZodEnum<["some", "every"]>>;
}, "strip", z.ZodTypeAny, {
    filters: string;
    listFiles: "none" | "csv" | "json" | "shell" | "escape";
    initialFetchDepth: number;
    predicateQuantifier: "every" | "some";
    token?: string | undefined;
    ref?: string | undefined;
    base?: string | undefined;
    workingDirectory?: string | undefined;
}, {
    filters: string;
    token?: string | undefined;
    ref?: string | undefined;
    base?: string | undefined;
    workingDirectory?: string | undefined;
    listFiles?: "none" | "csv" | "json" | "shell" | "escape" | undefined;
    initialFetchDepth?: number | undefined;
    predicateQuantifier?: "every" | "some" | undefined;
}>;
/** Type representing validated action inputs */
export type ActionInputs = z.infer<typeof InputSchema>;
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
export declare function getInputs(): ActionInputs;
//# sourceMappingURL=input-validation.d.ts.map