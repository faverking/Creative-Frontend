import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const appConfigs = [
  {
    name: 'portal-web',
    dir: 'apps/portal-web',
    prefix: 'PORTAL',
    appBase: '/',
    defaultAppTitle: 'portal-web',
    defaultTrackingAppId: 'portal-web',
    extraKeys: {
      VITE_ADMIN_WEB_BASE_URL: ['PORTAL_ADMIN_WEB_BASE_URL', undefined, '/admin/']
    }
  },
  {
    name: 'admin-web',
    dir: 'apps/admin-web',
    prefix: 'ADMIN',
    appBase: '/admin/',
    defaultAppTitle: 'admin-web',
    defaultTrackingAppId: 'admin-web',
    extraKeys: {
      VITE_ADMIN_AI_EXPERIMENT_ENABLED: ['ADMIN_AI_EXPERIMENT_ENABLED', undefined, 'false'],
      VITE_TESTAI_API_KEY: ['ADMIN_TESTAI_API_KEY', undefined, ''],
      VITE_TESTAI_API_BASE_URL: [
        'ADMIN_TESTAI_API_BASE_URL',
        undefined,
        'https://api.openai.com/v1'
      ],
      VITE_TESTAI_MODEL: ['ADMIN_TESTAI_MODEL', undefined, ''],
      VITE_TESTAI_API_MODEL_COMPOSE: ['ADMIN_TESTAI_API_MODEL_COMPOSE', undefined, '']
    }
  }
]

const sharedKeys = {
  VITE_API_BASE_URL: 'API_BASE_URL',
  VITE_SSO_BASE_URL: 'SSO_BASE_URL',
  VITE_AI_API_BASE_URL: 'AI_API_BASE_URL',
  VITE_MONITOR_DSN: 'MONITOR_DSN',
  VITE_TRACKING_APP_ID: 'TRACKING_APP_ID',
  VITE_API_PREFIX: 'API_PREFIX',
  VITE_OAUTH_PROVIDER: 'OAUTH_PROVIDER'
}

function readEnvFile(file) {
  if (!existsSync(file)) {
    throw new Error(`Missing app production env file: ${file}`)
  }

  return readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) {
        return env
      }

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
      if (!match) {
        return env
      }

      env[match[1]] = parseEnvValue(match[2])
      return env
    }, {})
}

function parseEnvValue(rawValue) {
  const value = rawValue.trim()
  const quote = value[0]
  if ((quote === '"' || quote === "'") && value.endsWith(quote)) {
    return value.slice(1, -1)
  }
  return value
}

function pick(...values) {
  return values.find((value) => typeof value === 'string' && value.length > 0)
}

function resolveValue(appConfig, envFile, viteKey, fallback) {
  const suffix = sharedKeys[viteKey]
  return pick(
    process.env[`${appConfig.prefix}_${suffix}`],
    process.env[`FRONTEND_${suffix}`],
    envFile[viteKey],
    fallback
  )
}

function writeEnvFile(file, values) {
  const lines = Object.entries(values).map(([key, value]) => `${key}=${JSON.stringify(value)}`)
  writeFileSync(file, `${lines.join('\n')}\n`, 'utf8')
}

for (const appConfig of appConfigs) {
  const sourceFile = `${appConfig.dir}/.env.production`
  const targetFile = `${appConfig.dir}/.env.production.local`
  const sourceEnv = readEnvFile(sourceFile)

  const apiBaseUrl = resolveValue(appConfig, sourceEnv, 'VITE_API_BASE_URL')
  if (!apiBaseUrl) {
    throw new Error(
      `Missing ${appConfig.name} API base URL. Set ${appConfig.prefix}_API_BASE_URL, FRONTEND_API_BASE_URL, or ${sourceFile} VITE_API_BASE_URL.`
    )
  }

  const resolved = {
    VITE_APP_TITLE: pick(sourceEnv.VITE_APP_TITLE, appConfig.defaultAppTitle),
    VITE_APP_BASE: appConfig.appBase,
    VITE_API_BASE_URL: apiBaseUrl,
    VITE_SSO_BASE_URL: resolveValue(appConfig, sourceEnv, 'VITE_SSO_BASE_URL', apiBaseUrl),
    VITE_MONITOR_DSN: resolveValue(appConfig, sourceEnv, 'VITE_MONITOR_DSN', 'disabled'),
    VITE_TRACKING_APP_ID: resolveValue(
      appConfig,
      sourceEnv,
      'VITE_TRACKING_APP_ID',
      appConfig.defaultTrackingAppId
    ),
    VITE_AI_API_BASE_URL: resolveValue(appConfig, sourceEnv, 'VITE_AI_API_BASE_URL', apiBaseUrl),
    VITE_API_PREFIX: resolveValue(appConfig, sourceEnv, 'VITE_API_PREFIX', '/api/v1'),
    VITE_OAUTH_PROVIDER: resolveValue(appConfig, sourceEnv, 'VITE_OAUTH_PROVIDER', 'google')
  }

  for (const [viteKey, [appEnvKey, frontendEnvKey, fallback]] of Object.entries(
    appConfig.extraKeys
  )) {
    resolved[viteKey] = pick(
      appEnvKey ? process.env[appEnvKey] : undefined,
      frontendEnvKey ? process.env[frontendEnvKey] : undefined,
      sourceEnv[viteKey],
      fallback
    )
  }

  writeEnvFile(targetFile, resolved)
  console.log(`Generated ${targetFile}`)
}
