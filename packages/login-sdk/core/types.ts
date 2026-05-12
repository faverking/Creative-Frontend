export interface LoginUser {
  id: string
  name: string
  email?: string
  roles?: string[]
  permissions?: string[]
  status?: string
}

// 登录态 token 统一模型：同时兼容过期秒数与绝对过期时间。
export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
  expiresAt?: number
  tokenType?: string
}

export interface PasswordLoginPayload {
  account: string
  password: string
}

export interface OAuthStartOptions {
  provider?: string
  redirectUri?: string
}

export interface LoginRequestConfig {
  url: string
  method?: string
  data?: unknown
  headers?: Record<string, string>
  skipAuth?: boolean
  skipPermission?: boolean
  signal?: AbortSignal
}

export type LoginRequester = <T>(config: LoginRequestConfig) => Promise<T>

// 适配器协议：对齐 OAuth / SSO / 账号密码等不同登录实现。
export interface LoginAdapter {
  login(redirectUrl?: string): Promise<void>
  logout(refreshToken?: string): Promise<void>
  refreshToken?(refreshToken: string): Promise<AuthTokens>
  fetchCurrentUser?(): Promise<LoginUser | null>
  loginWithPassword?(payload: PasswordLoginPayload): Promise<AuthTokens>
  exchangeOAuthCode?(code: string, provider?: string): Promise<AuthTokens>
  startOAuthLogin?(options?: OAuthStartOptions): Promise<void>
}
