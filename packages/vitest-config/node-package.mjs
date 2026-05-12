import { defineConfig, mergeConfig } from 'vitest/config'

export function defineNodePackageVitestConfig(overrides = {}) {
  return mergeConfig(
    defineConfig({
      test: {
        environment: 'node',
        globals: true,
        include: ['**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/coverage/**']
      }
    }),
    overrides
  )
}
