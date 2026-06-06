import type { AxiosAdapter } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import type { AppEnvConfig } from '@frontend/config'
import { LoginSdk, type AuthTokens, type LoginAdapter } from '@frontend/login-sdk'

import { setupAppHttpClient } from './http-client'

const TEST_ENV: AppEnvConfig = {
  appTitle: 'Portal',
  apiBaseUrl: '',
  apiPrefix: '/api/v1',
  adminWebBaseUrl: '',
  oauthProvider: 'google',
  ssoBaseUrl: '',
  monitorDsn: '',
  trackingAppId: '',
  aiApiBaseUrl: ''
}

function createAdapter(overrides: Partial<LoginAdapter> = {}): LoginAdapter {
  return {
    login: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
    ...overrides
  }
}

describe('setupAppHttpClient', () => {
  it('refreshes an expired access token before sending an authenticated request', async () => {
    const refreshToken = vi.fn(async (): Promise<AuthTokens> => {
      return {
        accessToken: 'fresh-token',
        refreshToken: 'next-refresh-token',
        expiresAt: Date.now() + 900_000
      }
    })
    const loginSdk = new LoginSdk(createAdapter({ refreshToken }))
    loginSdk.setTokens({
      accessToken: 'expired-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() - 1
    })

    let authorizationHeader: string | undefined
    const adapter: AxiosAdapter = async (config) => {
      authorizationHeader = String(config.headers?.Authorization ?? '')
      return {
        data: { code: 0, data: { ok: true } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      }
    }

    const client = setupAppHttpClient(TEST_ENV, loginSdk)
    const response = await client.get('/auth/me', {
      adapter,
      skipPermission: true
    })

    expect(response).toEqual({ ok: true })
    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(authorizationHeader).toBe('Bearer fresh-token')
  })
})
