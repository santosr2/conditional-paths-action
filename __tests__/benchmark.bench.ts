/**
 * @fileoverview Performance benchmarks for the conditional-paths-action.
 * Tests core functionality performance to ensure no regressions.
 */

import { bench, describe } from 'vitest'
import { Filter } from '../src/lib/filter.js'
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
    const filter = new Filter(simpleFiltersYaml, { predicateQuantifier: 'some' })
    filter.match(testFiles)
  })

  bench('complex filter matching - 10 files', () => {
    const filter = new Filter(complexFiltersYaml, { predicateQuantifier: 'some' })
    filter.match(testFiles)
  })

  bench('simple filter matching - 1000 files', () => {
    const filter = new Filter(simpleFiltersYaml, { predicateQuantifier: 'some' })
    filter.match(largeFileSet)
  })

  bench('complex filter matching - 1000 files', () => {
    const filter = new Filter(complexFiltersYaml, { predicateQuantifier: 'some' })
    filter.match(largeFileSet)
  })

  bench('filter creation and YAML parsing', () => {
    new Filter(complexFiltersYaml, { predicateQuantifier: 'some' })
  })

  bench('filter matching with "every" quantifier', () => {
    const filter = new Filter(simpleFiltersYaml, { predicateQuantifier: 'every' })
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
      { predicateQuantifier: 'some' }
    )
    filter.match([])
  })

  bench('single pattern match against multiple files', () => {
    const filter = new Filter(`test:\n  - "src/**/*.ts"`, { predicateQuantifier: 'some' })
    const files = testPaths.map(filename => ({ filename, status: ChangeStatus.Modified }))
    filter.match(files)
  })

  bench('multiple patterns against single file', () => {
    const filtersYaml = patterns.map((pattern, i) => `filter${i}:\n  - "${pattern}"`).join('\n')
    const filter = new Filter(filtersYaml, { predicateQuantifier: 'some' })
    filter.match([{ filename: 'src/main.ts', status: ChangeStatus.Modified }])
  })
})
