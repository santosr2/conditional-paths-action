/**
 * @fileoverview Unit tests for the action module.
 * Tests core action logic and GitHub Actions integration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { runPathsFilterAction } from '../src/lib/action.js'
import * as git from '../src/lib/git.js'
import * as fs from 'fs'

// Mock all external dependencies
vi.mock('@actions/core')
vi.mock('@actions/github')
vi.mock('../src/lib/git.js')
vi.mock('fs')

describe('Action Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default GitHub context
    Object.defineProperty(github, 'context', {
      value: {
        eventName: 'push',
        ref: 'refs/heads/main',
        repo: {
          owner: 'owner',
          repo: 'repo'
        },
        payload: {
          repository: {
            default_branch: 'main'
          }
        }
      },
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Input Validation', () => {
    it('should validate list-files parameter', async () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: 'test:\n  - "**"',
          'list-files': 'invalid'
        }
        return inputs[name] || ''
      })

      await runPathsFilterAction()

      expect(core.setFailed).toHaveBeenCalledWith(
        "Input parameter 'list-files' is set to invalid value 'invalid'"
      )
    })

    it('should validate predicate-quantifier parameter', async () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: 'test:\n  - "**"',
          'predicate-quantifier': 'invalid'
        }
        return inputs[name] || ''
      })

      await expect(runPathsFilterAction()).rejects.toThrowError(
        /Input parameter 'predicate-quantifier' is set to invalid value 'invalid'/
      )
    })

    it('should handle file path input for filters', async () => {
      const filterContent = 'test:\n  - "**/*.ts"'

      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: './filters.yml'
        }
        return inputs[name] || ''
      })

      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.lstatSync).mockReturnValue({
        isFile: () => true
      } as any)
      vi.mocked(fs.readFileSync).mockReturnValue(filterContent)

      vi.mocked(git.getCurrentRef).mockResolvedValue('main')
      vi.mocked(git.getShortName).mockImplementation((ref: string | undefined) => ref)
      vi.mocked(git.getChangesSinceMergeBase).mockResolvedValue([])

      await runPathsFilterAction()

      expect(fs.readFileSync).toHaveBeenCalledWith('./filters.yml', { encoding: 'utf8' })
    })

    it('should handle inline YAML input for filters', async () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: 'test:\n  - "**/*.ts"'
        }
        return inputs[name] || ''
      })

      vi.mocked(git.getCurrentRef).mockResolvedValue('main')
      vi.mocked(git.getShortName).mockImplementation((ref: string | undefined) => ref)
      vi.mocked(git.getChangesSinceMergeBase).mockResolvedValue([])

      await runPathsFilterAction()

      expect(fs.readFileSync).not.toHaveBeenCalled()
    })

    it('should throw error for non-existent filter file', async () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: '/path/to/missing.yml'
        }
        return inputs[name] || ''
      })

      vi.mocked(fs.existsSync).mockReturnValue(false)

      await expect(runPathsFilterAction()).rejects.toThrow(
        "Configuration file '/path/to/missing.yml' not found"
      )
    })

    it('should throw error if filter path is not a file', async () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: '/path/to/directory'
        }
        return inputs[name] || ''
      })

      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.lstatSync).mockReturnValue({
        isFile: () => false
      } as any)

      await expect(runPathsFilterAction()).rejects.toThrow("'/path/to/directory' is not a file.")
    })
  })

  describe('Working Directory', () => {
    it('should change to working directory if specified', async () => {
      const originalChdir = process.chdir
      const mockChdir = vi.fn()
      process.chdir = mockChdir

      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          'working-directory': '/custom/path',
          filters: 'test:\n  - "**"'
        }
        return inputs[name] || ''
      })

      vi.mocked(git.getCurrentRef).mockResolvedValue('main')
      vi.mocked(git.getShortName).mockImplementation((ref: string | undefined) => ref)
      vi.mocked(git.getChangesSinceMergeBase).mockResolvedValue([])

      await runPathsFilterAction()

      expect(mockChdir).toHaveBeenCalledWith('/custom/path')

      process.chdir = originalChdir
    })
  })

  describe('Output Generation', () => {
    const setupBasicMocks = (listFiles = 'none') => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: 'src:\n  - "src/**"\ndocs:\n  - "docs/**"',
          'list-files': listFiles
        }
        return inputs[name] || ''
      })

      vi.mocked(git.getCurrentRef).mockResolvedValue('main')
      vi.mocked(git.getShortName).mockImplementation((ref: string | undefined) => ref)
    }

    it('should generate correct outputs for matching filters', async () => {
      setupBasicMocks('json')

      vi.mocked(git.getChangesSinceMergeBase).mockResolvedValue([
        { filename: 'src/main.ts', status: 'modified' as any },
        { filename: 'docs/readme.md', status: 'added' as any }
      ])

      await runPathsFilterAction()

      // Check boolean outputs
      expect(core.setOutput).toHaveBeenCalledWith('src', true)
      expect(core.setOutput).toHaveBeenCalledWith('docs', true)

      // Check count outputs
      expect(core.setOutput).toHaveBeenCalledWith('src_count', 1)
      expect(core.setOutput).toHaveBeenCalledWith('docs_count', 1)

      // Check file list outputs
      expect(core.setOutput).toHaveBeenCalledWith('src_files', '["src/main.ts"]')
      expect(core.setOutput).toHaveBeenCalledWith('docs_files', '["docs/readme.md"]')

      // Check changes output
      expect(core.setOutput).toHaveBeenCalledWith('changes', '["src","docs"]')
    })

    it('should generate correct outputs for non-matching filters', async () => {
      setupBasicMocks()

      vi.mocked(git.getChangesSinceMergeBase).mockResolvedValue([
        { filename: 'test/main.test.ts', status: 'added' as any }
      ])

      await runPathsFilterAction()

      expect(core.setOutput).toHaveBeenCalledWith('src', false)
      expect(core.setOutput).toHaveBeenCalledWith('docs', false)
      expect(core.setOutput).toHaveBeenCalledWith('src_count', 0)
      expect(core.setOutput).toHaveBeenCalledWith('docs_count', 0)
      expect(core.setOutput).toHaveBeenCalledWith('changes', '[]')
    })

    it('should handle CSV output format', async () => {
      setupBasicMocks('csv')

      vi.mocked(git.getChangesSinceMergeBase).mockResolvedValue([
        { filename: 'src/file with spaces.ts', status: 'added' as any },
        { filename: 'src/file,with,commas.ts', status: 'added' as any }
      ])

      await runPathsFilterAction()

      expect(core.setOutput).toHaveBeenCalledWith(
        'src_files',
        '"src/file with spaces.ts","src/file,with,commas.ts"'
      )
    })

    it('should handle shell output format', async () => {
      setupBasicMocks('shell')

      vi.mocked(git.getChangesSinceMergeBase).mockResolvedValue([
        { filename: 'src/file with spaces.ts', status: 'added' as any },
        { filename: "src/file'with'quotes.ts", status: 'added' as any }
      ])

      await runPathsFilterAction()

      expect(core.setOutput).toHaveBeenCalledWith('src_files', expect.stringContaining('src/file'))
    })

    it('should handle escape output format', async () => {
      setupBasicMocks('escape')

      vi.mocked(git.getChangesSinceMergeBase).mockResolvedValue([
        { filename: 'src/file with spaces.ts', status: 'added' as any }
      ])

      await runPathsFilterAction()

      expect(core.setOutput).toHaveBeenCalledWith(
        'src_files',
        expect.stringContaining('src/file\\ with\\ spaces.ts')
      )
    })

    it('should not output file lists when list-files is none', async () => {
      setupBasicMocks('none')

      vi.mocked(git.getChangesSinceMergeBase).mockResolvedValue([
        { filename: 'src/main.ts', status: 'added' as any }
      ])

      await runPathsFilterAction()

      expect(core.setOutput).toHaveBeenCalledWith('src', true)
      expect(core.setOutput).toHaveBeenCalledWith('src_count', 1)
      expect(core.setOutput).not.toHaveBeenCalledWith('src_files', expect.anything())
    })

    it('should handle filter name conflict with "changes" output', async () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: 'changes:\n  - "**"'
        }
        return inputs[name] || ''
      })

      vi.mocked(git.getCurrentRef).mockResolvedValue('main')
      vi.mocked(git.getShortName).mockImplementation((ref: string | undefined) => ref)
      vi.mocked(git.getChangesSinceMergeBase).mockResolvedValue([
        { filename: 'test.ts', status: 'added' as any }
      ])

      await runPathsFilterAction()

      // Should set filter output but not override with changes array
      expect(core.setOutput).toHaveBeenCalledWith('changes', true)
      expect(core.setOutput).toHaveBeenCalledWith('changes_count', 1)
      expect(core.info).toHaveBeenCalledWith(
        'Cannot set changes output variable - name already used by filter output'
      )
    })
  })

  describe('HEAD Change Detection', () => {
    it('should detect uncommitted changes when base is HEAD', async () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          base: 'HEAD',
          filters: 'unstaged:\n  - "**"'
        }
        return inputs[name] || ''
      })

      vi.mocked(git.getChangesOnHead).mockResolvedValue([
        { filename: 'uncommitted.ts', status: 'modified' as any }
      ])

      await runPathsFilterAction()

      expect(git.getChangesOnHead).toHaveBeenCalled()
      expect(core.setOutput).toHaveBeenCalledWith('unstaged', true)
    })

    it('should warn when ref is specified with HEAD base', async () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          base: 'HEAD',
          ref: 'some-ref',
          filters: 'test:\n  - "**"'
        }
        return inputs[name] || ''
      })

      vi.mocked(git.getChangesOnHead).mockResolvedValue([])

      await runPathsFilterAction()

      expect(core.warning).toHaveBeenCalledWith(
        "'ref' input parameter is ignored when 'base' is set to HEAD"
      )
    })
  })

  describe('Default Values', () => {
    it('should use default values for optional inputs', async () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        if (name === 'filters') return 'test:\n  - "**"'
        return ''
      })

      vi.mocked(git.getCurrentRef).mockResolvedValue('main')
      vi.mocked(git.getShortName).mockImplementation((ref: string | undefined) => ref)
      vi.mocked(git.getChangesSinceMergeBase).mockResolvedValue([])

      await runPathsFilterAction()

      // Should use default values without errors
      expect(core.setFailed).not.toHaveBeenCalled()
    })

    it('should use default initial-fetch-depth of 10', async () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: 'test:\n  - "**"'
        }
        return inputs[name] || ''
      })

      vi.mocked(git.getCurrentRef).mockResolvedValue('feature')
      vi.mocked(git.getShortName).mockImplementation((ref: string | undefined) => ref)
      vi.mocked(git.getChangesSinceMergeBase).mockResolvedValue([])

      await runPathsFilterAction()

      expect(git.getChangesSinceMergeBase).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        10 // Default initial-fetch-depth
      )
    })

    it('should use custom initial-fetch-depth when specified', async () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: 'test:\n  - "**"',
          'initial-fetch-depth': '50'
        }
        return inputs[name] || ''
      })

      vi.mocked(git.getCurrentRef).mockResolvedValue('feature')
      vi.mocked(git.getShortName).mockImplementation((ref: string | undefined) => ref)
      vi.mocked(git.getChangesSinceMergeBase).mockResolvedValue([])

      await runPathsFilterAction()

      expect(git.getChangesSinceMergeBase).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        50
      )
    })

    it('should default predicate-quantifier to "some"', async () => {
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: 'test:\n  - "**/*.ts"\n  - "**/*.js"'
        }
        return inputs[name] || ''
      })

      vi.mocked(git.getCurrentRef).mockResolvedValue('main')
      vi.mocked(git.getShortName).mockImplementation((ref: string | undefined) => ref)
      vi.mocked(git.getChangesSinceMergeBase).mockResolvedValue([
        { filename: 'test.ts', status: 'added' as any }
      ])

      await runPathsFilterAction()

      // With 'some' quantifier, one matching pattern is enough
      expect(core.setOutput).toHaveBeenCalledWith('test', true)
    })
  })
})
