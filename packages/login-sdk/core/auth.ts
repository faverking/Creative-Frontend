import { TokenManager } from './token-manager'
import type {
  AuthTokens,
  LoginAdapter,
  LoginUser,
  PasswordLoginPayload,
  OAuthStartOptions
} from './types'

// 统一封装登录态管理：登录、OAuth 回调换票、刷新、退出、用户信息获取。
export class LoginSdk {
  constructor(
    private readonly adapter: LoginAdapter,
    private readonly tokenManager: TokenManager = new TokenManager()
  ) {}

  async login(redirectUrl?: string): Promise<void> {
    // 优先走 OAuth 启动入口，兼容仅实现 login 的旧适配器。
    if (this.adapter.startOAuthLogin) {
      await this.adapter.startOAuthLogin({
        redirectUri: redirectUrl
      })
      return
    }

    await this.adapter.login(redirectUrl)
  }

  async startOAuthLogin(options?: OAuthStartOptions): Promise<void> {
    if (this.adapter.startOAuthLogin) {
      await this.adapter.startOAuthLogin(options)
      return
    }

    await this.adapter.login(options?.redirectUri)
  }

  async loginWithPassword(payload: PasswordLoginPayload): Promise<AuthTokens> {
    if (!this.adapter.loginWithPassword) {
      throw new Error('Current login adapter does not support password login.')
    }

    const tokens = await this.adapter.loginWithPassword(payload)
    this.tokenManager.setTokens(tokens)
    return tokens
  }

  async exchangeOAuthCode(code: string, provider?: string): Promise<AuthTokens> {
    if (!this.adapter.exchangeOAuthCode) {
      throw new Error('Current login adapter does not support OAuth code exchange.')
    }

    const tokens = await this.adapter.exchangeOAuthCode(code, provider)
    this.tokenManager.setTokens(tokens)
    return tokens
  }

  async handleOAuthCallbackFromLocation(defaultProvider = 'google'): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false
    }

    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    if (!code) {
      return false
    }

    const provider = url.searchParams.get('provider') ?? defaultProvider
    await this.exchangeOAuthCode(code, provider)

    // 清理敏感参数，避免刷新页面重复换票。
    url.searchParams.delete('code')
    url.searchParams.delete('state')
    url.searchParams.delete('provider')
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`)

    return true
  }

  async logout(): Promise<void> {
    try {
      await this.adapter.logout(this.tokenManager.getRefreshToken())
    } finally {
      this.tokenManager.clearToken()
    }
  }

  getToken(): string | undefined {
    return this.tokenManager.getToken()
  }

  getRefreshToken(): string | undefined {
    return this.tokenManager.getRefreshToken()
  }

  getTokens(): AuthTokens | null {
    return this.tokenManager.getTokens()
  }

  setTokens(tokens: AuthTokens): void {
    this.tokenManager.setTokens(tokens)
  }

  setToken(accessToken: string, refreshToken?: string): void {
    this.tokenManager.setTokens({ accessToken, refreshToken })
  }

  clearToken(): void {
    this.tokenManager.clearToken()
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken())
  }

  isAccessTokenExpired(referenceTime = Date.now()): boolean {
    return this.tokenManager.isAccessTokenExpired(referenceTime)
  }

  async getFreshToken(): Promise<string | undefined> {
    const accessToken = this.getToken()
    if (!accessToken) {
      return undefined
    }

    if (!this.isAccessTokenExpired()) {
      return accessToken
    }

    try {
      return await this.refreshToken()
    } catch {
      return undefined
    }
  }

  async refreshToken(): Promise<string | undefined> {
    const refreshToken = this.tokenManager.getRefreshToken()
    if (!refreshToken || !this.adapter.refreshToken) {
      return undefined
    }

    const next = await this.adapter.refreshToken(refreshToken)
    this.tokenManager.setTokens(next)
    return next.accessToken
  }

  async getCurrentUser(): Promise<LoginUser | null> {
    if (!this.adapter.fetchCurrentUser) {
      return null
    }
    return this.adapter.fetchCurrentUser()
  }
}
