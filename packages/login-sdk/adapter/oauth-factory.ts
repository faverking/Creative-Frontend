import { LoginSdk } from '../core/auth'
import { TokenManager } from '../core/token-manager'
import type { LoginRequester } from '../core/types'

import { OauthAdapter } from './oauth-adapter'

export interface CreateOauthLoginSdkOptions {
  baseUrl: string
  apiPrefix?: string
  provider?: string
  requester: LoginRequester
  storageKey?: string
}

// 统一组装 OAuth 登录链路，避免应用层重复拼接 TokenManager 和 token getter。
export function createOauthLoginSdk(options: CreateOauthLoginSdkOptions): LoginSdk {
  const tokenManager = new TokenManager(options.storageKey)
  const adapter = new OauthAdapter({
    baseUrl: options.baseUrl,
    apiPrefix: options.apiPrefix,
    provider: options.provider,
    requester: options.requester,
    getAccessToken: () => tokenManager.getToken(),
    getRefreshToken: () => tokenManager.getRefreshToken()
  })

  return new LoginSdk(adapter, tokenManager)
}
