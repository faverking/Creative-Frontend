import { describe, expect, it } from 'vitest'

import { loadEnvConfig } from './index'

describe('loadEnvConfig', () => {
  it('throws readable error when required field missing', () => {
    expect(() =>
      loadEnvConfig({
        VITE_APP_TITLE: 'Admin',
        VITE_API_BASE_URL: 'https://api.example.com'
      })
    ).toThrow('Missing required env var: VITE_SSO_BASE_URL')
  })

  it('maps development mode api base url to same-origin proxy path', () => {
    const config = loadEnvConfig({
      MODE: 'development',
      DEV: true,
      VITE_APP_TITLE: 'Admin',
      VITE_API_BASE_URL: 'http://localhost:3000',
      VITE_SSO_BASE_URL: 'http://localhost:3000',
      VITE_MONITOR_DSN: 'dsn',
      VITE_TRACKING_APP_ID: 'tracking',
      VITE_AI_API_BASE_URL: 'https://ai.example.com'
    })

    expect(config.apiBaseUrl).toBe('')
    expect(config.adminWebBaseUrl).toBe('')
    expect(config.apiPrefix).toBe('/api/v1')
    expect(config.oauthProvider).toBe('google')
  })

  it('maps test mode api base url to same-origin proxy path', () => {
    const config = loadEnvConfig({
      MODE: 'test',
      VITE_APP_TITLE: 'Admin',
      VITE_API_BASE_URL: 'https://api.example.com',
      VITE_SSO_BASE_URL: 'https://sso.example.com',
      VITE_MONITOR_DSN: 'dsn',
      VITE_TRACKING_APP_ID: 'tracking',
      VITE_AI_API_BASE_URL: 'https://ai.example.com'
    })

    expect(config.apiBaseUrl).toBe('')
  })

  it('keeps configured api base url outside proxy runtime environments', () => {
    const config = loadEnvConfig({
      MODE: 'production',
      VITE_APP_TITLE: 'Admin',
      VITE_API_BASE_URL: 'https://api.example.com',
      VITE_SSO_BASE_URL: 'https://sso.example.com',
      VITE_MONITOR_DSN: 'dsn',
      VITE_TRACKING_APP_ID: 'tracking',
      VITE_AI_API_BASE_URL: 'https://ai.example.com'
    })

    expect(config.appTitle).toBe('Admin')
    expect(config.apiBaseUrl).toBe('https://api.example.com')
    expect(config.apiPrefix).toBe('/api/v1')
    expect(config.oauthProvider).toBe('google')
  })

  it('reads admin web base url when configured', () => {
    const config = loadEnvConfig({
      MODE: 'production',
      VITE_APP_TITLE: 'Portal',
      VITE_API_BASE_URL: 'https://api.example.com',
      VITE_ADMIN_WEB_BASE_URL: 'https://admin.example.com',
      VITE_SSO_BASE_URL: 'https://sso.example.com',
      VITE_MONITOR_DSN: 'dsn',
      VITE_TRACKING_APP_ID: 'tracking',
      VITE_AI_API_BASE_URL: 'https://ai.example.com'
    })

    expect(config.adminWebBaseUrl).toBe('https://admin.example.com')
  })
})
