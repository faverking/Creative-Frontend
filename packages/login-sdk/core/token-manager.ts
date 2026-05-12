import type { AuthTokens } from './types'
import { normalizeStoredAuthTokens } from './token-payload'

const DEFAULT_STORAGE_KEY = 'monoapp-auth-tokens'
const REFRESH_SKEW_MS = 30_000

// 负责 token 的内存态 + localStorage 双写，同时提供同步会话快照读取入口。
export class TokenManager {
  private tokens: AuthTokens | null

  constructor(private readonly storageKey: string = DEFAULT_STORAGE_KEY) {
    this.tokens = TokenManager.readStoredTokens(this.storageKey)
  }

  static readStoredTokens(storageKey: string = DEFAULT_STORAGE_KEY): AuthTokens | null {
    if (!TokenManager.hasStorage()) {
      return null
    }

    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) {
        return null
      }

      return normalizeStoredAuthTokens(JSON.parse(raw))
    } catch {
      return null
    }
  }

  static hasAccessToken(storageKey: string = DEFAULT_STORAGE_KEY): boolean {
    const tokens = TokenManager.readStoredTokens(storageKey)
    return typeof tokens?.accessToken === 'string' && tokens.accessToken.length > 0
  }

  static isAccessTokenExpired(
    referenceTime = Date.now(),
    storageKey: string = DEFAULT_STORAGE_KEY
  ): boolean {
    const tokens = TokenManager.readStoredTokens(storageKey)
    if (!tokens?.accessToken) {
      return true
    }

    if (typeof tokens.expiresAt !== 'number' || !Number.isFinite(tokens.expiresAt)) {
      return false
    }

    // 提前 30 秒进入“即将过期”窗口，给刷新请求留出网络缓冲。
    return tokens.expiresAt <= referenceTime + REFRESH_SKEW_MS
  }

  static hasValidAccessToken(storageKey: string = DEFAULT_STORAGE_KEY): boolean {
    return (
      TokenManager.hasAccessToken(storageKey) &&
      !TokenManager.isAccessTokenExpired(undefined, storageKey)
    )
  }

  getToken(): string | undefined {
    return this.tokens?.accessToken
  }

  getRefreshToken(): string | undefined {
    return this.tokens?.refreshToken
  }

  getTokens(): AuthTokens | null {
    return this.tokens ? { ...this.tokens } : null
  }

  setTokens(tokens: AuthTokens): void {
    this.tokens = {
      tokenType: 'Bearer',
      ...tokens
    }
    this.persistTokens(this.tokens)
  }

  clearToken(): void {
    this.tokens = null
    this.persistTokens(null)
  }

  private static hasStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  }

  private persistTokens(tokens: AuthTokens | null): void {
    if (!TokenManager.hasStorage()) {
      return
    }

    if (!tokens) {
      window.localStorage.removeItem(this.storageKey)
      return
    }

    window.localStorage.setItem(this.storageKey, JSON.stringify(tokens))
  }
}
