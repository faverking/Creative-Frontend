import { existsSync } from 'node:fs'

const required = ['apps/admin-web/package.json', 'pnpm-workspace.yaml', 'packages/theme/src/index.ts']
const missing = required.filter((entry) => !existsSync(entry))

if (missing.length > 0) {
  console.error('Missing required scaffold files:', missing)
  process.exit(1)
}

console.log('Workspace scaffold verification passed.')
