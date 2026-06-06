import { describe, expect, it, vi } from 'vitest'

import { normalizeAuthTokensPayload, normalizeStoredAuthTokens } from './token-payload'

function createJwt(payload: Record<string, unknown>): string {
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/u, '')
  return `header.${encodedPayload}.signature`
}

describe('token payload normalization', () => {
  it('parses Nest auth token durations into expiresAt', () => {
    const now = 1_700_000_000_000
    const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(now)

    expect(
      normalizeAuthTokensPayload({
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: '15m'
        }
      })
    ).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: undefined,
      expiresAt: now + 15 * 60 * 1000,
      tokenType: 'Bearer'
    })

    dateNowSpy.mockRestore()
  })

  it('restores persisted tokens even when expiresIn was stored as a duration string', () => {
    const now = 1_700_000_000_000
    const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(now)

    expect(
      normalizeStoredAuthTokens({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: '7d'
      })
    ).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: undefined,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000,
      tokenType: 'Bearer'
    })

    dateNowSpy.mockRestore()
  })

  it('uses the JWT exp claim when auth responses omit explicit expiry fields', () => {
    const accessToken = createJwt({
      exp: 1_700_001_200
    })

    expect(
      normalizeAuthTokensPayload({
        accessToken,
        refreshToken: 'refresh-token'
      })
    ).toEqual({
      accessToken,
      refreshToken: 'refresh-token',
      expiresIn: undefined,
      expiresAt: 1_700_001_200_000,
      tokenType: 'Bearer'
    })
  })

  it('restores persisted JWT expiry from the access token exp claim', () => {
    const accessToken = createJwt({
      exp: 1_700_001_800
    })

    expect(
      normalizeStoredAuthTokens({
        accessToken,
        refreshToken: 'refresh-token'
      })
    ).toEqual({
      accessToken,
      refreshToken: 'refresh-token',
      expiresIn: undefined,
      expiresAt: 1_700_001_800_000,
      tokenType: 'Bearer'
    })
  })
})
