import { afterEach, describe, expect, it, vi } from 'vitest'

import { TokenManager } from '../core/token-manager'

import { createSsoLoginSdk } from './sso-factory'

interface StorageState {
  [key: string]: string | undefined
}

function createWindowStub(initialState: StorageState = {}) {
  const state: StorageState = { ...initialState }
  const assign = vi.fn()

  return {
    window: {
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
      },
      location: {
        href: 'https://app.example.com/current',
        assign
      }
    },
    assign
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createSsoLoginSdk', () => {
  it('creates a sdk with shared token storage and sso redirects', async () => {
    const { window, assign } = createWindowStub()
    vi.stubGlobal('window', window)

    const sdk = createSsoLoginSdk({
      baseUrl: 'https://sso.example.com',
      storageKey: 'sso-factory-test'
    })

    sdk.setToken('access-token', 'refresh-token')
    expect(TokenManager.readStoredTokens('sso-factory-test')).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: undefined,
      expiresIn: undefined,
      tokenType: 'Bearer'
    })

    await sdk.login('https://app.example.com/dashboard')
    await sdk.logout()

    expect(assign).toHaveBeenNthCalledWith(
      1,
      'https://sso.example.com/login?redirect=https%3A%2F%2Fapp.example.com%2Fdashboard'
    )
    expect(assign).toHaveBeenNthCalledWith(2, 'https://sso.example.com/logout')
  })
})
