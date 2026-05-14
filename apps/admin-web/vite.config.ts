import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

const appRoot = fileURLToPath(new URL('.', import.meta.url))
const MONO_REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url)).replaceAll('\\', '/')
const ELEMENT_PLUS_PREFIXES = [
  '/node_modules/element-plus/',
  '/node_modules/@element-plus/',
  '/node_modules/dayjs/',
  '/node_modules/async-validator/',
  '/node_modules/@floating-ui/',
  '/node_modules/@popperjs/core/',
  '/node_modules/@sxzz/popperjs-es/',
  '/node_modules/@ctrl/tinycolor/',
  '/node_modules/lodash-unified/',
  '/node_modules/memoize-one/',
  '/node_modules/normalize-wheel-es/'
]
const FRAMEWORK_PREFIXES = [
  '/node_modules/vue/',
  '/node_modules/@vue/',
  '/node_modules/vue-router/',
  '/node_modules/pinia/'
]
const PORTAL_SHARED_PREFIXES = [`${MONO_REPO_ROOT}/packages/`, '/node_modules/@frontend/']

function normalizeModuleId(id: string): string {
  return id.replaceAll('\\', '/')
}

function includesAny(id: string, fragments: string[]): boolean {
  return fragments.some((fragment) => id.includes(fragment))
}

function resolvePortalManualChunk(id: string): string | undefined {
  const normalizedId = normalizeModuleId(id)

  if (includesAny(normalizedId, FRAMEWORK_PREFIXES)) {
    return 'framework'
  }

  if (includesAny(normalizedId, ELEMENT_PLUS_PREFIXES)) {
    return 'element-plus'
  }

  if (normalizedId.includes('/node_modules/')) {
    return 'vendor'
  }

  if (includesAny(normalizedId, PORTAL_SHARED_PREFIXES)) {
    return 'portal-shared'
  }

  return undefined
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, appRoot, '')

  return {
    base: env.VITE_APP_BASE || '/',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: resolvePortalManualChunk
        }
      }
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '^/(api|proxy)': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (pxr, tor) => {
              // 代理日志
              const protocol = pxr.protocol
              const host = pxr.getHeader('host')
              const path = pxr.path
              console.log(tor.method + ': ' + tor.url + ' to: ' + protocol + '//' + host + path)
            })
          }
        }
      }
    }
  }
})
