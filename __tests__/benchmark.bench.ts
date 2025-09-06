/**
 * @fileoverview Performance benchmarks for the conditional-paths-action.
 * Tests core functionality performance to ensure no regressions.
 */

import { bench, describe } from 'vitest'
import { Filter, PredicateQuantifier } from '../src/lib/filter.js'
import { csvEscape } from '../src/lib/list-format/csv-escape.js'
import { shellEscape } from '../src/lib/list-format/shell-escape.js'
import { ChangeStatus } from '../src/file.js'

describe('Filter Performance', () => {
  const testFiles = [
    { filename: 'src/components/Button.tsx', status: ChangeStatus.Modified },
    { filename: 'src/components/Input.tsx', status: ChangeStatus.Added },
    { filename: 'src/utils/helpers.ts', status: ChangeStatus.Modified },
    { filename: 'tests/Button.test.tsx', status: ChangeStatus.Added },
    { filename: 'tests/Input.test.tsx', status: ChangeStatus.Modified },
    { filename: 'docs/api/button.md', status: ChangeStatus.Added },
    { filename: 'docs/guide.md', status: ChangeStatus.Modified },
    { filename: 'package.json', status: ChangeStatus.Modified },
    { filename: 'README.md', status: ChangeStatus.Modified },
    { filename: '.github/workflows/ci.yml', status: ChangeStatus.Added }
  ]

  const simpleFiltersYaml = `
frontend:
  - "src/**/*.{ts,tsx}"
tests:
  - "tests/**/*"
  - "**/*.test.{ts,tsx}"
docs:
  - "docs/**"
  - "*.md"
config:
  - "package.json"
  - ".github/**"
`

  const complexFiltersYaml = `
frontend:
  - "src/**/*.{ts,tsx}"
  - "!src/**/*.test.{ts,tsx}"
  - added|modified: "src/components/**"
backend:
  - "api/**/*.ts"
  - "server/**/*.js"
  - added: "**/*.sql"
tests:
  - "**/*.test.{ts,tsx,js}"
  - "**/*.spec.{ts,tsx,js}"
  - "tests/**"
docs:
  - "docs/**/*.md"
  - "*.md"
  - "!node_modules/**"
config:
  - "package.json"
  - "tsconfig*.json"
  - ".github/**/*.{yml,yaml}"
  - "Dockerfile*"
  - added|modified: "*.config.{js,ts}"
`

  const largeFileSet = Array.from({ length: 1000 }, (_, i) => ({
    filename: `src/file${i}.ts`,
    status:
      i % 3 === 0 ? ChangeStatus.Added : i % 3 === 1 ? ChangeStatus.Modified : ChangeStatus.Deleted
  }))

  bench('simple filter matching - 10 files', () => {
    const filter = new Filter(simpleFiltersYaml, { predicateQuantifier: PredicateQuantifier.SOME })
    filter.match(testFiles)
  })

  bench('complex filter matching - 10 files', () => {
    const filter = new Filter(complexFiltersYaml, { predicateQuantifier: PredicateQuantifier.SOME })
    filter.match(testFiles)
  })

  bench('simple filter matching - 1000 files', () => {
    const filter = new Filter(simpleFiltersYaml, { predicateQuantifier: PredicateQuantifier.SOME })
    filter.match(largeFileSet)
  })

  bench('complex filter matching - 1000 files', () => {
    const filter = new Filter(complexFiltersYaml, { predicateQuantifier: PredicateQuantifier.SOME })
    filter.match(largeFileSet)
  })

  bench('filter creation and YAML parsing', () => {
    new Filter(complexFiltersYaml, { predicateQuantifier: PredicateQuantifier.SOME })
  })

  bench('filter matching with "every" quantifier', () => {
    const filter = new Filter(simpleFiltersYaml, { predicateQuantifier: PredicateQuantifier.EVERY })
    filter.match(testFiles)
  })
})

describe('File List Formatting Performance', () => {
  const filenames = [
    'simple-file.ts',
    'file with spaces.js',
    'file,with,commas.csv',
    'file"with"quotes.txt',
    "file'with'single-quotes.sh",
    'file\\with\\backslashes.bat',
    'file$with$special.env',
    'very-long-filename-that-might-be-common-in-modern-projects-with-descriptive-names.component.spec.ts'
  ]

  const largeFilenameSet = Array.from(
    { length: 1000 },
    (_, i) => `src/components/feature-${i}/very-long-component-name-${i}.tsx`
  )

  bench('CSV escape - small set', () => {
    filenames.forEach(csvEscape)
  })

  bench('CSV escape - large set', () => {
    largeFilenameSet.forEach(csvEscape)
  })

  bench('Shell escape - small set', () => {
    filenames.forEach(shellEscape)
  })

  bench('Shell escape - large set', () => {
    largeFilenameSet.forEach(shellEscape)
  })

  bench('CSV format complete list', () => {
    filenames.map(csvEscape).join(',')
  })

  bench('Shell format complete list', () => {
    filenames.map(shellEscape).join(' ')
  })
})

describe('Pattern Matching Performance', () => {
  // Benchmark picomatch pattern compilation and matching
  const patterns = [
    'src/**/*.ts',
    '**/*.{ts,tsx,js,jsx}',
    'src/**/!(*.test).ts',
    '**/node_modules/**',
    '!**/dist/**',
    'src/components/*/index.{ts,tsx}',
    '**/{package,tsconfig}.json'
  ]

  const testPaths = [
    'src/main.ts',
    'src/components/Button/Button.tsx',
    'src/components/Button/Button.test.tsx',
    'src/utils/helpers.ts',
    'node_modules/react/index.js',
    'dist/index.js',
    'tests/integration/app.test.ts',
    'src/components/Input/index.tsx',
    'package.json',
    'tsconfig.json'
  ]

  bench('pattern compilation', () => {
    const filter = new Filter(
      `
test:
  - "${patterns[0]}"
  - "${patterns[1]}"
  - "${patterns[2]}"
`,
      { predicateQuantifier: PredicateQuantifier.SOME }
    )
    filter.match([])
  })

  bench('single pattern match against multiple files', () => {
    const filter = new Filter(`test:\n  - "src/**/*.ts"`, {
      predicateQuantifier: PredicateQuantifier.SOME
    })
    const files = testPaths.map(filename => ({ filename, status: ChangeStatus.Modified }))
    filter.match(files)
  })

  bench('multiple patterns against single file', () => {
    const filtersYaml = patterns.map((pattern, i) => `filter${i}:\n  - "${pattern}"`).join('\n')
    const filter = new Filter(filtersYaml, { predicateQuantifier: PredicateQuantifier.SOME })
    filter.match([{ filename: 'src/main.ts', status: ChangeStatus.Modified }])
  })
})

describe('Memory and Scale Performance', () => {
  // Test performance with very large file sets (realistic for large monorepos)
  const megaFileSet = Array.from({ length: 10000 }, (_, i) => ({
    filename: `src/packages/pkg-${Math.floor(i / 100)}/components/Component${i % 100}.tsx`,
    status:
      i % 4 === 0
        ? ChangeStatus.Added
        : i % 4 === 1
          ? ChangeStatus.Modified
          : i % 4 === 2
            ? ChangeStatus.Deleted
            : ChangeStatus.Copied
  }))

  const monorepoFilters = `
apps:
  - "apps/**"
packages:
  - "packages/**"
  - "!packages/**/node_modules/**"
  - "!packages/**/dist/**"
components:
  - "**/components/**/*.{ts,tsx}"
  - "**/ui/**/*.{ts,tsx}"
tests:
  - "**/*.test.{ts,tsx,js}"
  - "**/__tests__/**"
  - "**/spec/**"
docs:
  - "**/*.md"
  - "**/docs/**"
  - "!node_modules/**"
config:
  - "**/package.json"
  - "**/tsconfig*.json"
  - "**/*.config.{js,ts,mjs}"
  - ".github/**"
`

  bench('monorepo filter matching - 10K files', () => {
    const filter = new Filter(monorepoFilters, { predicateQuantifier: PredicateQuantifier.SOME })
    filter.match(megaFileSet)
  })

  bench('filter creation - complex monorepo config', () => {
    new Filter(monorepoFilters, { predicateQuantifier: PredicateQuantifier.SOME })
  })

  bench('every quantifier - large file set', () => {
    const filter = new Filter(monorepoFilters, { predicateQuantifier: PredicateQuantifier.EVERY })
    filter.match(megaFileSet.slice(0, 1000)) // Smaller set for every quantifier
  })
})

describe('Cold Start Performance', () => {
  // Simulate GitHub Actions cold start scenarios
  bench('action initialization simulation', () => {
    // This simulates the typical initialization path
    const filter = new Filter(
      `
frontend:
  - "src/frontend/**"
  - "packages/ui/**"
backend:
  - "src/backend/**"
  - "api/**"
  - "server/**"
`,
      { predicateQuantifier: PredicateQuantifier.SOME }
    )

    const typicalChanges = [
      { filename: 'src/frontend/App.tsx', status: ChangeStatus.Modified },
      { filename: 'src/backend/routes.ts', status: ChangeStatus.Added },
      { filename: 'package.json', status: ChangeStatus.Modified }
    ]

    const results = filter.match(typicalChanges)
    // Simulate output processing
    Object.keys(results).forEach(key => {
      const files = results[key] || []
      files.map((f: { filename: string }) => f.filename).join(',')
    })
  })

  bench('rapid sequential filter operations', () => {
    const configs = [
      'filter1:\n  - "src/**"',
      'filter2:\n  - "tests/**"',
      'filter3:\n  - "docs/**"'
    ]

    const testFile = [{ filename: 'src/main.ts', status: ChangeStatus.Modified }]

    configs.forEach(config => {
      const filter = new Filter(config, { predicateQuantifier: PredicateQuantifier.SOME })
      filter.match(testFile)
    })
  })
})
