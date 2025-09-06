import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'lib/',
        'examples/',
        '.github/',
        'scripts/',
        '*.config.*',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.bench.ts',
        // Exclude git wrapper from coverage - mainly external command calls
        'src/lib/git.ts'
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
        // Per-file thresholds for critical modules
        'src/lib/filter.ts': {
          branches: 90,
          functions: 100,
          lines: 95,
          statements: 95
        },
        'src/lib/action.ts': {
          branches: 70,
          functions: 100,
          lines: 75,
          statements: 75
        }
      },
      all: true,
      clean: true
    },
    include: ['__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'lib', '**/*.bench.ts'],
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    isolate: true,
    pool: 'forks'
  },
  esbuild: {
    target: 'es2022'
  }
})
