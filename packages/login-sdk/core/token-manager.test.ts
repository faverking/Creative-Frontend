import { afterEach, describe, expect, it, vi } from 'vitest'

import { TokenManager } from './token-manager'

interface StorageState {
  [key: string]: string | undefined
}

function stubWindowWithStorage(initialState: StorageState = {}): void {
  const state: StorageState = { ...initialState }

  // 用轻量 stub 模拟浏览器存储，保证测试覆盖同步快照读取路径。
  vi.stubGlobal('window', {
    localStorage: {
      getItem(key: string) {
        return state[key] ?? null
      },
      setItem(key: string, value: string) {
        state[key] = value
      },
      removeItem(key: string) {
        delete state[key]
      }
    }
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('TokenManager', () => {
  it('reads and normalizes stored tokens from localStorage', () => {
    stubWindowWithStorage({
      'monoapp-auth-tokens': JSON.stringify({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: 1_700_000_000_000
      })
    })

    expect(TokenManager.readStoredTokens()).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: 1_700_000_000_000,
      expiresIn: undefined,
      tokenType: 'Bearer'
    })
  })

  it('returns false when there is no readable access token snapshot', () => {
    stubWindowWithStorage({
      'monoapp-auth-tokens': '{"refreshToken":"refresh-only"}'
    })

    expect(TokenManager.hasAccessToken()).toBe(false)
  })

  it('treats tokens inside the refresh skew window as expired', () => {
    stubWindowWithStorage({
      'monoapp-auth-tokens': JSON.stringify({
        accessToken: 'access-token',
        expiresAt: 130_000
      })
    })

    expect(TokenManager.isAccessTokenExpired(100_000)).toBe(true)
  })

  it('treats tokens without expiresAt as still refreshable', () => {
    stubWindowWithStorage({
      'monoapp-auth-tokens': JSON.stringify({
        accessToken: 'access-token'
      })
    })

    expect(TokenManager.isAccessTokenExpired(100_000)).toBe(false)
  })
})
