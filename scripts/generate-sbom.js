#!/usr/bin/env node
/**
 * SPDX-License-Identifier: MIT
 * SPDX-FileCopyrightText: 2024 Rubens Santos <rubenssegundo404@gmail.com>
 *
 * Generate Software Bill of Materials (SBOM) in CycloneDX format
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

try {
  // Read package.json
  const packagePath = join(projectRoot, 'package.json')
  const packageData = JSON.parse(readFileSync(packagePath, 'utf8'))

  // Generate SBOM
  const sbom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.4',
    serialNumber: `urn:uuid:${generateUUID()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [
        {
          vendor: 'conditional-paths-action',
          name: 'simple-sbom-generator',
          version: '1.0.0'
        }
      ],
      component: {
        type: 'application',
        'bom-ref': 'pkg:npm/conditional-paths-action@' + packageData.version,
        name: packageData.name,
        version: packageData.version,
        description: packageData.description || '',
        licenses: [
          {
            license: {
              name: packageData.license || 'MIT'
            }
          }
        ],
        purl: `pkg:npm/${packageData.name}@${packageData.version}`
      }
    },
    components: Object.entries(packageData.dependencies || {}).map(([name, version]) => ({
      type: 'library',
      'bom-ref': `pkg:npm/${name}@${version.replace(/^[\^~]/, '')}`,
      name,
      version: version.replace(/^[\^~]/, ''),
      purl: `pkg:npm/${name}@${version.replace(/^[\^~]/, '')}`,
      scope: 'required'
    }))
  }

  // Ensure dist directory exists
  const distDir = join(projectRoot, 'dist')
  mkdirSync(distDir, { recursive: true })

  // Write SBOM
  const sbomPath = join(distDir, 'sbom.json')
  writeFileSync(sbomPath, JSON.stringify(sbom, null, 2))

  console.log(`✅ SBOM generated: ${sbomPath}`)
  console.log(`📋 Components: ${sbom.components.length} dependencies`)
  console.log(`🔗 Format: CycloneDX v${sbom.specVersion}`)
} catch (error) {
  console.error('❌ SBOM generation failed:', error.message)
  process.exit(1)
}
