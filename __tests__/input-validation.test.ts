/**
 * @fileoverview Unit tests for input validation module.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as core from '@actions/core'
import {
  getInputs,
  ExportFormatSchema,
  PredicateQuantifierSchema
} from '../src/lib/input-validation.js'

// Mock @actions/core
vi.mock('@actions/core')

describe('Input Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Schema Validation', () => {
    it('should validate export format schema', () => {
      expect(ExportFormatSchema.parse('none')).toBe('none')
      expect(ExportFormatSchema.parse('csv')).toBe('csv')
      expect(ExportFormatSchema.parse('json')).toBe('json')
      expect(ExportFormatSchema.parse('shell')).toBe('shell')
      expect(ExportFormatSchema.parse('escape')).toBe('escape')

      expect(() => ExportFormatSchema.parse('invalid')).toThrow()
    })

    it('should validate predicate quantifier schema', () => {
      expect(PredicateQuantifierSchema.parse('some')).toBe('some')
      expect(PredicateQuantifierSchema.parse('every')).toBe('every')

      expect(() => PredicateQuantifierSchema.parse('all')).toThrow()
      expect(() => PredicateQuantifierSchema.parse('any')).toThrow()
    })
  })

  describe('getInputs', () => {
    it('should read and validate all inputs with defaults', () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: 'test:\n  - "**"'
        }
        return inputs[name] || ''
      })

      const result = getInputs()

      expect(result).toEqual({
        workingDirectory: undefined,
        token: undefined,
        ref: undefined,
        base: undefined,
        filters: 'test:\n  - "**"',
        listFiles: 'none',
        initialFetchDepth: 100,
        predicateQuantifier: 'some'
      })
    })

    it('should parse all provided inputs', () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          'working-directory': '/custom/dir',
          token: 'github-token',
          ref: 'feature-branch',
          base: 'main',
          filters: './filters.yml',
          'list-files': 'json',
          'initial-fetch-depth': '50',
          'predicate-quantifier': 'every'
        }
        return inputs[name] || ''
      })

      const result = getInputs()

      expect(result).toEqual({
        workingDirectory: '/custom/dir',
        token: 'github-token',
        ref: 'feature-branch',
        base: 'main',
        filters: './filters.yml',
        listFiles: 'json',
        initialFetchDepth: 50,
        predicateQuantifier: 'every'
      })
    })

    it('should throw error for missing required filters', () => {
      vi.mocked(core.getInput).mockImplementation((name: string, options?: any) => {
        if (name === 'filters' && options?.required) {
          throw new Error('Input required and not supplied: filters')
        }
        return ''
      })

      expect(() => getInputs()).toThrow()
    })

    it('should throw error for invalid list-files format', () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: 'test:\n  - "**"',
          'list-files': 'invalid-format'
        }
        return inputs[name] || ''
      })

      expect(() => getInputs()).toThrow('Invalid action inputs')
    })

    it('should throw error for invalid predicate-quantifier', () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: 'test:\n  - "**"',
          'predicate-quantifier': 'invalid'
        }
        return inputs[name] || ''
      })

      expect(() => getInputs()).toThrow('Invalid action inputs')
    })

    it('should throw error for invalid initial-fetch-depth', () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: 'test:\n  - "**"',
          'initial-fetch-depth': 'not-a-number'
        }
        return inputs[name] || ''
      })

      expect(() => getInputs()).toThrow()
    })

    it('should throw error for negative initial-fetch-depth', () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: 'test:\n  - "**"',
          'initial-fetch-depth': '-10'
        }
        return inputs[name] || ''
      })

      expect(() => getInputs()).toThrow('Invalid action inputs')
    })

    it('should handle empty strings as undefined for optional fields', () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        if (name === 'filters') return 'test:\n  - "**"'
        return ''
      })

      const result = getInputs()

      expect(result.workingDirectory).toBeUndefined()
      expect(result.token).toBeUndefined()
      expect(result.ref).toBeUndefined()
      expect(result.base).toBeUndefined()
    })

    it('should use default values when inputs are empty', () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        if (name === 'filters') return 'test:\n  - "**"'
        return ''
      })

      const result = getInputs()

      expect(result.listFiles).toBe('none')
      expect(result.initialFetchDepth).toBe(100)
      expect(result.predicateQuantifier).toBe('some')
    })

    it('should handle all valid export formats', () => {
      const formats = ['none', 'csv', 'json', 'shell', 'escape']

      formats.forEach(format => {
        vi.mocked(core.getInput).mockImplementation((name: string) => {
          const inputs: Record<string, string> = {
            filters: 'test:\n  - "**"',
            'list-files': format
          }
          return inputs[name] || ''
        })

        const result = getInputs()
        expect(result.listFiles).toBe(format)
      })
    })

    it('should handle both predicate quantifiers', () => {
      const quantifiers = ['some', 'every']

      quantifiers.forEach(quantifier => {
        vi.mocked(core.getInput).mockImplementation((name: string) => {
          const inputs: Record<string, string> = {
            filters: 'test:\n  - "**"',
            'predicate-quantifier': quantifier
          }
          return inputs[name] || ''
        })

        const result = getInputs()
        expect(result.predicateQuantifier).toBe(quantifier)
      })
    })

    it('should provide detailed error messages for validation failures', () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: 'test:\n  - "**"',
          'list-files': 'invalid',
          'predicate-quantifier': 'wrong'
        }
        return inputs[name] || ''
      })

      expect(() => getInputs()).toThrow(/Invalid action inputs/)
    })
  })
})
