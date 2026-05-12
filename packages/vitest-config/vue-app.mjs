import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig, mergeConfig } from 'vitest/config'

export function defineVueAppVitestConfig(configUrl, overrides = {}) {
  const baseUrl = typeof configUrl === 'string' ? new URL(configUrl) : configUrl

  return mergeConfig(
    defineConfig({
      plugins: [vue()],
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', baseUrl))
        }
      },
      test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/*.test.ts']
      }
    }),
    overrides
  )
}
