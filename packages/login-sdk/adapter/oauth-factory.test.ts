import { afterEach, describe, expect, it, vi } from 'vitest'

import { TokenManager } from '../core/token-manager'
import type { LoginRequestConfig, LoginRequester } from '../core/types'

import { createOauthLoginSdk } from './oauth-factory'

interface StorageState {
  [key: string]: string | undefined
}

function stubWindowWithStorage(initialState: StorageState = {}): void {
  const state: StorageState = { ...initialState }

  // 用轻量 stub 模拟浏览器存储，验证工厂创建的 adapter 和 sdk 共用同一份 token 状态。
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

describe('createOauthLoginSdk', () => {
  it('wires adapter auth headers to the same token manager as the sdk', async () => {
    stubWindowWithStorage()

    const requester: LoginRequester = async <T>(config: LoginRequestConfig): Promise<T> => {
      if (config.url === '/auth/login') {
        return {
          code: 0,
          data: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token'
          }
        } as T
      }

      expect(config.url).toBe('/auth/me')
      const authorization = config.headers?.Authorization ?? config.headers?.authorization
      expect(authorization).toBe('Bearer access-token')

      return {
        code: 0,
        data: {
          user: {
            id: 'user-1',
            name: '内容管理员'
          },
          roles: ['admin'],
          status: 'active'
        }
      } as T
    }

    const sdk = createOauthLoginSdk({
      baseUrl: 'http://localhost:3000',
      requester,
      storageKey: 'oauth-factory-test'
    })

    await sdk.loginWithPassword({
      account: 'editor@example.com',
      password: 'secret'
    })

    expect(sdk.getToken()).toBe('access-token')
    expect(TokenManager.readStoredTokens('oauth-factory-test')?.refreshToken).toBe('refresh-token')

    await expect(sdk.getCurrentUser()).resolves.toEqual({
      id: 'user-1',
      name: '内容管理员',
      email: undefined,
      roles: ['admin'],
      permissions: undefined,
      status: 'active'
    })
  })
})
