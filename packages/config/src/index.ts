import type { AppEnvConfig, EnvSource, EnvValue } from './types'

const requiredEnvKeys = [
  'VITE_APP_TITLE',
  'VITE_API_BASE_URL',
  'VITE_SSO_BASE_URL',
  'VITE_MONITOR_DSN',
  'VITE_TRACKING_APP_ID',
  'VITE_AI_API_BASE_URL'
] as const

function readImportMetaEnv(): EnvSource {
  // 兼容 Vite 运行时和测试环境；Vite 内置的 DEV/PROD 标记是 boolean。
  const meta = import.meta as ImportMeta & { env?: EnvSource }
  return meta.env ?? {}
}

function readString(value: EnvValue): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function readBoolean(value: EnvValue): boolean | undefined {
  if (typeof value === 'boolean') {
    return value
  }

  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return undefined
}

function pickRequired(env: EnvSource, key: (typeof requiredEnvKeys)[number]): string {
  const value = readString(env[key])
  if (!value) {
    throw new Error(`Missing required env var: ${key}`)
  }
  return value
}

function pickWithDefault(env: EnvSource, key: string, defaultValue: string): string {
  const value = readString(env[key])
  return value ?? defaultValue
}

function isProxyRuntimeEnv(env: EnvSource): boolean {
  const mode = readString(env.MODE)
  const isDevFlag = readBoolean(env.DEV)

  // 开发和测试环境统一走 Vite dev server 代理，运行时不应直连真实后端域名。
  return isDevFlag === true || mode === 'development' || mode === 'test'
}

function resolveApiBaseUrl(env: EnvSource): string {
  const configuredBaseUrl = pickRequired(env, 'VITE_API_BASE_URL')
  return isProxyRuntimeEnv(env) ? '' : configuredBaseUrl
}

export function loadEnvConfig(source: EnvSource = readImportMetaEnv()): AppEnvConfig {
  return {
    appTitle: pickRequired(source, 'VITE_APP_TITLE'),
    apiBaseUrl: resolveApiBaseUrl(source),
    apiPrefix: pickWithDefault(source, 'VITE_API_PREFIX', '/api/v1'),
    adminWebBaseUrl: pickWithDefault(source, 'VITE_ADMIN_WEB_BASE_URL', ''),
    oauthProvider: pickWithDefault(source, 'VITE_OAUTH_PROVIDER', 'google'),
    ssoBaseUrl: pickRequired(source, 'VITE_SSO_BASE_URL'),
    monitorDsn: pickRequired(source, 'VITE_MONITOR_DSN'),
    trackingAppId: pickRequired(source, 'VITE_TRACKING_APP_ID'),
    aiApiBaseUrl: pickRequired(source, 'VITE_AI_API_BASE_URL')
  }
}

export type { AppEnvConfig, EnvSource }
