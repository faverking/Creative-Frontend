import { LoginSdk } from '../core/auth'
import { TokenManager } from '../core/token-manager'

import { SsoAdapter } from './sso-adapter'

export interface CreateSsoLoginSdkOptions {
  baseUrl?: string
  storageKey?: string
}

// 统一组装 SSO 登录链路，保持和 OAuth 工厂一致的应用接入方式。
export function createSsoLoginSdk(options: CreateSsoLoginSdkOptions = {}): LoginSdk {
  const tokenManager = new TokenManager(options.storageKey)
  const adapter = new SsoAdapter(options.baseUrl ?? '')

  return new LoginSdk(adapter, tokenManager)
}
