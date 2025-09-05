/**
 * @fileoverview Filter system for matching files against pattern rules.
 *
 * This module provides the core filtering functionality that matches changed files
 * against user-defined glob patterns and change type rules. It supports complex
 * filter configurations with multiple patterns, change type restrictions, and
 * different logical quantifiers (AND/OR matching).
 */
import { File, ChangeStatus } from '../file.js';
/**
 * Internal representation of one item in named filter rule.
 * Created as simplified form of data in FilterItemYaml after parsing.
 */
interface FilterRuleItem {
    /** Required change status of the matched files (undefined means any status) */
    status?: ChangeStatus[];
    /** Function to test if a filename matches the pattern */
    isMatch: (str: string) => boolean;
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
export declare enum PredicateQuantifier {
    /**
     * When choosing 'every' in the config it means that files will only get matched
     * if all the patterns are satisfied by the path of the file, not just at least one of them.
     */
    EVERY = "every",
    /**
     * When choosing 'some' in the config it means that files will get matched as long as there is
     * at least one pattern that matches them. This is the default behavior if you don't
     * specify anything as a predicate quantifier.
     */
    SOME = "some"
}
/**
 * Configuration object used to customize filter behavior.
 */
export type FilterConfig = {
    /** Determines whether patterns use AND (every) or OR (some) logic */
    readonly predicateQuantifier: PredicateQuantifier;
};
/**
 * An array of strings (at runtime) that contains the valid/accepted values for
 * the configuration parameter 'predicate-quantifier'.
 */
export declare const SUPPORTED_PREDICATE_QUANTIFIERS: PredicateQuantifier[];
/**
 * Type guard to check if a value is a valid PredicateQuantifier.
 *
 * @param x - Value to check
 * @returns true if x is a valid PredicateQuantifier enum value
 */
export declare function isPredicateQuantifier(x: unknown): x is PredicateQuantifier;
/**
 * Results of applying filters to a set of files.
 * Maps filter names to arrays of files that matched the filter rules.
 */
export interface FilterResults {
    [key: string]: File[];
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
export declare class Filter {
    readonly filterConfig?: FilterConfig | undefined;
    /** Internal storage for parsed filter rules */
    rules: {
        [key: string]: FilterRuleItem[];
    };
    /**
     * Creates instance of Filter and loads rules from YAML if provided.
     *
     * @param yaml - Optional YAML string containing filter definitions
     * @param filterConfig - Optional configuration for filter behavior
     */
    constructor(yaml?: string, filterConfig?: FilterConfig | undefined);
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
    load(yaml: string): void;
    /**
     * Matches files against all loaded filter rules.
     *
     * @param files - Array of files to test against the filters
     * @returns Object mapping filter names to arrays of matching files
     */
    match(files: File[]): FilterResults;
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
    private isMatch;
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
    private parseFilterItemYaml;
    /**
     * Throws a formatted error for invalid filter YAML format.
     *
     * @param message - Specific error message describing the issue
     * @throws {Error} Always throws with formatted message
     */
    private throwInvalidFormatError;
}
export {};
//# sourceMappingURL=filter.d.ts.map