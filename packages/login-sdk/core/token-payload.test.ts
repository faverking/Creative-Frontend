import { describe, expect, it, vi } from 'vitest'

import { normalizeAuthTokensPayload, normalizeStoredAuthTokens } from './token-payload'

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
})
