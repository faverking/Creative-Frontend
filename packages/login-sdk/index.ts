// login-sdk 负责“身份认证”本身，不负责权限、路由或页面状态。
// 入口按 core / plugin / adapter 分层导出，目的是把：
// - 领域能力
// - Vue 注入层
// - 第三方登录适配
// 明确拆开。

// core：登录域模型与 token 管理。
export { LoginSdk } from './core/auth'
export { TokenManager } from './core/token-manager'
export { UserService } from './core/user-service'
export { normalizeAuthTokensPayload } from './core/token-payload'
export type {
  AuthTokens,
  LoginAdapter,
  LoginRequestConfig,
  LoginRequester,
  LoginUser,
  OAuthStartOptions,
  PasswordLoginPayload
} from './core/types'

// plugin：把 sdk 注入 Vue 应用，供页面和 composable 通过 inject 使用。
export { createLoginPlugin, useLoginSdk } from './plugin/index'

// adapter：适配不同登录后端或协议，避免把 OAuth / SSO 细节放进 core。
export { OauthAdapter } from './adapter/oauth-adapter'
export { createOauthLoginSdk } from './adapter/oauth-factory'
export { createHttpClientRequester } from './adapter/requester'
export { SsoAdapter } from './adapter/sso-adapter'
export { createSsoLoginSdk } from './adapter/sso-factory'
export type { CreateOauthLoginSdkOptions } from './adapter/oauth-factory'
export type { CreateSsoLoginSdkOptions } from './adapter/sso-factory'
