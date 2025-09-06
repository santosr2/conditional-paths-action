/**
 * @fileoverview Unit tests for the main entry point.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as core from '@actions/core'

// Mock @actions/core
vi.mock('@actions/core')

// Mock the action module
vi.mock('../src/lib/action.js', () => ({
  runPathsFilterAction: vi.fn()
}))

describe('Main Entry Point', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should execute the action successfully', async () => {
    const { runPathsFilterAction } = await import('../src/lib/action.js')
    vi.mocked(runPathsFilterAction).mockResolvedValue(undefined)

    // Import and execute main
    await import('../src/main.js')

    // Give event loop a chance to process
    await new Promise(resolve => setImmediate(resolve))

    expect(runPathsFilterAction).toHaveBeenCalled()
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('should handle errors from the action', async () => {
    const { runPathsFilterAction } = await import('../src/lib/action.js')
    const errorMessage = 'Test error message'
    vi.mocked(runPathsFilterAction).mockRejectedValue(new Error(errorMessage))

    // Clear module cache to re-import
    vi.resetModules()

    // Re-mock after reset
    vi.mock('@actions/core')
    vi.mock('../src/lib/action.js', () => ({
      runPathsFilterAction: vi.fn().mockRejectedValue(new Error(errorMessage))
    }))

    // Import and execute main
    await import('../src/main.js')

    // Give event loop a chance to process
    await new Promise(resolve => setImmediate(resolve))

    expect(core.setFailed).toHaveBeenCalledWith(errorMessage)
  })

  it('should handle non-Error objects thrown from the action', async () => {
    const { runPathsFilterAction } = await import('../src/lib/action.js')
    const errorValue = 'String error'
    vi.mocked(runPathsFilterAction).mockRejectedValue(errorValue)

    // Clear module cache to re-import
    vi.resetModules()

    // Re-mock after reset
    vi.mock('@actions/core')
    vi.mock('../src/lib/action.js', () => ({
      runPathsFilterAction: vi.fn().mockRejectedValue('String error')
    }))

    // Import and execute main
    await import('../src/main.js')

    // Give event loop a chance to process
    await new Promise(resolve => setImmediate(resolve))

    expect(core.setFailed).toHaveBeenCalledWith(errorValue)
  })

  it('should handle null/undefined errors gracefully', async () => {
    const { runPathsFilterAction } = await import('../src/lib/action.js')
    vi.mocked(runPathsFilterAction).mockRejectedValue(undefined)

    // Clear module cache to re-import
    vi.resetModules()

    // Re-mock after reset
    vi.mock('@actions/core')
    vi.mock('../src/lib/action.js', () => ({
      runPathsFilterAction: vi.fn().mockRejectedValue(undefined)
    }))

    // Import and execute main
    await import('../src/main.js')

    // Give event loop a chance to process
    await new Promise(resolve => setImmediate(resolve))

    expect(core.setFailed).toHaveBeenCalledWith('undefined')
  })
})
