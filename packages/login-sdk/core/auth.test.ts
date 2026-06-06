import { describe, expect, it, vi } from 'vitest'

import { LoginSdk } from './auth'
import type { AuthTokens, LoginAdapter } from './types'

function createAdapter(overrides: Partial<LoginAdapter> = {}): LoginAdapter {
  return {
    login: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
    ...overrides
  }
}

describe('LoginSdk', () => {
  it('returns undefined when refresh is requested without a refresh token', async () => {
    const refreshToken = vi.fn(async (): Promise<AuthTokens> => {
      return {
        accessToken: 'fresh-token'
      }
    })
    const sdk = new LoginSdk(createAdapter({ refreshToken }))

    sdk.setToken('access-token')

    await expect(sdk.refreshToken()).resolves.toBeUndefined()
    expect(refreshToken).not.toHaveBeenCalled()
  })

  it('persists refreshed tokens when a refresh token is available', async () => {
    const refreshToken = vi.fn(async (token: string): Promise<AuthTokens> => {
      expect(token).toBe('refresh-token')
      return {
        accessToken: 'fresh-token',
        refreshToken: 'next-refresh-token',
        expiresAt: Date.now() + 900_000
      }
    })
    const sdk = new LoginSdk(createAdapter({ refreshToken }))

    sdk.setToken('expired-token', 'refresh-token')

    await expect(sdk.refreshToken()).resolves.toBe('fresh-token')
    expect(sdk.getToken()).toBe('fresh-token')
    expect(sdk.getRefreshToken()).toBe('next-refresh-token')
  })

  it('returns the current token when it is still valid', async () => {
    const refreshToken = vi.fn(async (): Promise<AuthTokens> => {
      return {
        accessToken: 'fresh-token'
      }
    })
    const sdk = new LoginSdk(createAdapter({ refreshToken }))

    sdk.setTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() + 900_000
    })

    await expect(sdk.getFreshToken()).resolves.toBe('access-token')
    expect(refreshToken).not.toHaveBeenCalled()
  })

  it('refreshes an expired token before returning a token for requests', async () => {
    const refreshToken = vi.fn(async (token: string): Promise<AuthTokens> => {
      expect(token).toBe('refresh-token')
      return {
        accessToken: 'fresh-token',
        refreshToken: 'next-refresh-token',
        expiresAt: Date.now() + 900_000
      }
    })
    const sdk = new LoginSdk(createAdapter({ refreshToken }))

    sdk.setTokens({
      accessToken: 'expired-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() - 1
    })

    await expect(sdk.getFreshToken()).resolves.toBe('fresh-token')
    expect(sdk.getToken()).toBe('fresh-token')
    expect(sdk.getRefreshToken()).toBe('next-refresh-token')
  })

  it('does not expose expired tokens when they cannot be refreshed', async () => {
    const refreshToken = vi.fn(async (): Promise<AuthTokens> => {
      return {
        accessToken: 'fresh-token'
      }
    })
    const sdk = new LoginSdk(createAdapter({ refreshToken }))

    sdk.setTokens({
      accessToken: 'expired-token',
      expiresAt: Date.now() - 1
    })

    await expect(sdk.getFreshToken()).resolves.toBeUndefined()
    expect(refreshToken).not.toHaveBeenCalled()
  })

  it('reports access tokens inside the refresh skew as expired', () => {
    const sdk = new LoginSdk(createAdapter())
    sdk.setTokens({
      accessToken: 'access-token',
      expiresAt: 130_000
    })

    expect(sdk.isAccessTokenExpired(100_000)).toBe(true)
  })
})
