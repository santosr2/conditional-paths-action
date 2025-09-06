/**
 * @fileoverview Integration tests for the complete action workflow.
 * Tests the interaction between multiple modules working together.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { runPathsFilterAction } from '../src/lib/action.js'
import * as git from '../src/lib/git.js'

// Mock external dependencies
vi.mock('@actions/core')
vi.mock('@actions/github')
vi.mock('../src/lib/git.js')

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset GitHub context
    Object.defineProperty(github, 'context', {
      value: {
        eventName: 'push',
        ref: 'refs/heads/feature-branch',
        repo: {
          owner: 'test-owner',
          repo: 'test-repo'
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

  describe('runPathsFilterAction', () => {
    it('should process push event with local git changes', async () => {
      // Setup mocks
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          token: '',
          filters: 'src:\n  - "src/**/*.ts"',
          'list-files': 'json',
          'initial-fetch-depth': '10',
          'predicate-quantifier': 'some'
        }
        return inputs[name] || ''
      })

      vi.mocked(git.getCurrentRef).mockResolvedValue('feature-branch')
      vi.mocked(git.getShortName).mockImplementation((ref: string | undefined) => ref)
      vi.mocked(git.getChangesSinceMergeBase).mockResolvedValue([
        { filename: 'src/main.ts', status: 'modified' as any },
        { filename: 'src/lib/action.ts', status: 'added' as any }
      ])

      // Execute action
      await runPathsFilterAction()

      // Verify outputs
      expect(core.setOutput).toHaveBeenCalledWith('src', true)
      expect(core.setOutput).toHaveBeenCalledWith('src_count', 2)
      expect(core.setOutput).toHaveBeenCalledWith(
        'src_files',
        '["src/main.ts","src/lib/action.ts"]'
      )
      expect(core.setOutput).toHaveBeenCalledWith('changes', '["src"]')
    })

    it('should handle pull request event with GitHub API', async () => {
      // Setup GitHub context for PR
      Object.defineProperty(github, 'context', {
        value: {
          eventName: 'pull_request',
          repo: {
            owner: 'test-owner',
            repo: 'test-repo'
          },
          payload: {
            pull_request: {
              number: 123,
              base: { sha: 'base-sha' }
            },
            repository: {
              default_branch: 'main'
            }
          }
        },
        writable: true
      })

      // Setup mocks
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          token: 'github-token',
          filters: 'docs:\n  - "**/*.md"\ntests:\n  - "**/*.test.ts"',
          'list-files': 'csv'
        }
        return inputs[name] || ''
      })

      // Mock GitHub API client
      const mockOctokit = {
        paginate: {
          iterator: vi.fn().mockImplementation(function* () {
            yield {
              status: 200,
              data: [
                { filename: 'README.md', status: 'modified' },
                { filename: 'docs/guide.md', status: 'added' },
                { filename: '__tests__/filter.test.ts', status: 'modified' }
              ]
            }
          })
        },
        rest: {
          pulls: {
            listFiles: {
              endpoint: {
                merge: vi.fn()
              }
            }
          }
        }
      }

      vi.mocked(github.getOctokit).mockReturnValue(mockOctokit as any)

      // Execute action
      await runPathsFilterAction()

      // Verify outputs
      expect(core.setOutput).toHaveBeenCalledWith('docs', true)
      expect(core.setOutput).toHaveBeenCalledWith('docs_count', 2)
      expect(core.setOutput).toHaveBeenCalledWith('docs_files', 'README.md,docs/guide.md')
      expect(core.setOutput).toHaveBeenCalledWith('tests', true)
      expect(core.setOutput).toHaveBeenCalledWith('tests_count', 1)
      expect(core.setOutput).toHaveBeenCalledWith('changes', '["docs","tests"]')
    })

    it('should handle complex filter configurations with change types', async () => {
      // Setup mocks
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: `
backend:
  - added|modified: "src/**/*.ts"
  - deleted: "src/**/*.js"
frontend:
  - "public/**"
  - "!public/vendor/**"`,
          'list-files': 'shell',
          'predicate-quantifier': 'some'
        }
        return inputs[name] || ''
      })

      vi.mocked(git.getCurrentRef).mockResolvedValue('feature-branch')
      vi.mocked(git.getShortName).mockImplementation((ref: string | undefined) => ref)
      vi.mocked(git.getChangesSinceMergeBase).mockResolvedValue([
        { filename: 'src/api/server.ts', status: 'added' as any },
        { filename: 'src/old.js', status: 'deleted' as any },
        { filename: 'public/index.html', status: 'modified' as any },
        { filename: 'public/vendor/lib.js', status: 'added' as any }
      ])

      // Execute action
      await runPathsFilterAction()

      // Verify backend filter matches both patterns
      expect(core.setOutput).toHaveBeenCalledWith('backend', true)
      expect(core.setOutput).toHaveBeenCalledWith('backend_count', 2)

      // Verify frontend filter - all files are included in the shell output
      expect(core.setOutput).toHaveBeenCalledWith('frontend', true)
      expect(core.setOutput).toHaveBeenCalledWith('frontend_count', 4)
    })

    it('should handle predicate-quantifier "every" correctly', async () => {
      // Setup mocks
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: `
strict-match:
  - "**/*.ts"
  - "src/**"`,
          'predicate-quantifier': 'every'
        }
        return inputs[name] || ''
      })

      vi.mocked(git.getCurrentRef).mockResolvedValue('feature-branch')
      vi.mocked(git.getShortName).mockImplementation((ref: string | undefined) => ref)
      vi.mocked(git.getChangesSinceMergeBase).mockResolvedValue([
        { filename: 'src/main.ts', status: 'modified' as any }, // Matches both patterns
        { filename: 'lib/helper.ts', status: 'added' as any } // Only matches first pattern
      ])

      // Execute action
      await runPathsFilterAction()

      // Only src/main.ts should match (satisfies both patterns)
      expect(core.setOutput).toHaveBeenCalledWith('strict-match', true)
      expect(core.setOutput).toHaveBeenCalledWith('strict-match_count', 1)
    })

    it('should handle invalid inputs gracefully', async () => {
      // Test invalid list-files format
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: 'test:\n  - "**"',
          'list-files': 'invalid-format'
        }
        return inputs[name] || ''
      })

      await runPathsFilterAction()

      expect(core.setFailed).toHaveBeenCalledWith(
        "Input parameter 'list-files' is set to invalid value 'invalid-format'"
      )
    })

    it('should handle missing configuration file', async () => {
      // Setup mocks
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: '/path/to/missing/config.yml'
        }
        return inputs[name] || ''
      })

      // Execute and expect error
      await expect(runPathsFilterAction()).rejects.toThrow(
        "Configuration file '/path/to/missing/config.yml' not found"
      )
    })

    it('should handle local HEAD changes detection', async () => {
      // Setup mocks
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          base: 'HEAD',
          filters: 'unstaged:\n  - "**"',
          'list-files': 'none'
        }
        return inputs[name] || ''
      })

      vi.mocked(git.getChangesOnHead).mockResolvedValue([
        { filename: 'src/uncommitted.ts', status: 'modified' as any }
      ])

      // Execute action
      await runPathsFilterAction()

      // Verify HEAD comparison was used
      expect(git.getChangesOnHead).toHaveBeenCalled()
      expect(core.setOutput).toHaveBeenCalledWith('unstaged', true)
      expect(core.setOutput).toHaveBeenCalledWith('unstaged_count', 1)
    })

    it('should handle initial push with NULL_SHA', async () => {
      // Setup GitHub context for initial push
      Object.defineProperty(github, 'context', {
        value: {
          eventName: 'push',
          ref: 'refs/heads/new-branch',
          repo: {
            owner: 'test-owner',
            repo: 'test-repo'
          },
          payload: {
            before: '0000000000000000000000000000000000000000',
            repository: {
              default_branch: 'main'
            }
          }
        },
        writable: true
      })

      // Setup mocks
      vi.mocked(core.getInput).mockImplementation((name: string) => {
        const inputs: Record<string, string> = {
          filters: 'all:\n  - "**"'
        }
        return inputs[name] || ''
      })

      vi.mocked(git.getCurrentRef).mockResolvedValue('new-branch')
      vi.mocked(git.getShortName).mockImplementation((ref: string | undefined) => ref)
      vi.mocked(git.isGitSha).mockReturnValue(false)
      vi.mocked(git.getChangesSinceMergeBase).mockResolvedValue([
        { filename: 'src/new-file.ts', status: 'added' as any }
      ])

      // Execute action
      await runPathsFilterAction()

      // Verify merge-base detection was used
      expect(git.getChangesSinceMergeBase).toHaveBeenCalledWith('main', 'refs/heads/new-branch', 10)
      expect(core.setOutput).toHaveBeenCalledWith('all', true)
    })
  })
})
