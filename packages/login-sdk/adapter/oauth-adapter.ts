import type {
  AuthTokens,
  LoginAdapter,
  LoginRequestConfig,
  LoginRequester,
  LoginUser,
  OAuthStartOptions,
  PasswordLoginPayload
} from '../core/types'

import { normalizeAuthTokensPayload } from '../core/token-payload'

interface OAuthAdapterOptions {
  baseUrl: string
  apiPrefix?: string
  provider?: string
  requester: LoginRequester
  getRefreshToken?: () => string | undefined
  getAccessToken?: () => string | undefined
}

interface ApiEnvelope<T> {
  code?: number
  message?: string
  data?: T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const list = value.filter((item): item is string => typeof item === 'string')
  return list.length > 0 ? list : undefined
}

function toHeaderRecord(value?: HeadersInit): Record<string, string> {
  return Object.fromEntries(new Headers(value ?? {}).entries())
}

export class OauthAdapter implements LoginAdapter {
  private readonly provider: string
  private readonly apiPrefix: string
  private readonly requester: LoginRequester

  constructor(private readonly options: OAuthAdapterOptions) {
    this.provider = options.provider ?? 'google'
    this.apiPrefix = options.apiPrefix ?? '/api/v1'
    this.requester = options.requester
  }

  async login(redirectUrl?: string): Promise<void> {
    await this.startOAuthLogin({
      redirectUri: redirectUrl
    })
  }

  async startOAuthLogin(options?: OAuthStartOptions): Promise<void> {
    if (typeof window === 'undefined') {
      return
    }

    const provider = options?.provider ?? this.provider
    const fallbackUrl = this.composeApiUrl(`/auth/oauth/${provider}/url`)

    try {
      // 优先走后端返回的授权地址，失败时回退到默认地址。
      const payload = await this.request<Record<string, unknown>>(`/auth/oauth/${provider}/url`, {
        method: 'GET'
      })

      const oauthUrl =
        asString(payload.url) ?? asString(payload.authorizeUrl) ?? asString(payload.oauthUrl)
      window.location.assign(oauthUrl ?? fallbackUrl)
    } catch {
      window.location.assign(fallbackUrl)
    }
  }

  async loginWithPassword(payload: PasswordLoginPayload): Promise<AuthTokens> {
    const response = await this.request<Record<string, unknown>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    return this.parseTokens(response)
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await this.request<Record<string, unknown>>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    })

    return this.parseTokens(response)
  }

  async logout(refreshToken?: string): Promise<void> {
    const nextRefreshToken = refreshToken ?? this.options.getRefreshToken?.()
    if (!nextRefreshToken) {
      return
    }

    await this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: nextRefreshToken })
    })
  }

  async fetchCurrentUser(): Promise<LoginUser | null> {
    const response = await this.request<Record<string, unknown>>('/auth/me', {
      method: 'GET',
      headers: this.createAuthHeaders()
    })

    if (!isRecord(response)) {
      return null
    }

    // 后端当前返回 { user, roles, status }，同时兼容旧的平铺结构。
    const userSource = isRecord(response.user) ? response.user : response
    const id = asString(userSource.id)
    const name = asString(userSource.name)
    if (!id || !name) {
      return null
    }

    return {
      id,
      name,
      email: asString(userSource.email),
      roles: asStringArray(response.roles) ?? asStringArray(userSource.roles),
      permissions: asStringArray(response.permissions) ?? asStringArray(userSource.permissions),
      status: asString(response.status) ?? asString(userSource.status)
    }
  }

  async exchangeOAuthCode(code: string, provider?: string): Promise<AuthTokens> {
    const targetProvider = provider ?? this.provider
    const response = await this.request<Record<string, unknown>>(
      `/auth/oauth/${targetProvider}/callback?code=${encodeURIComponent(code)}`,
      {
        method: 'GET'
      }
    )

    return this.parseTokens(response)
  }

  private createAuthHeaders(): HeadersInit {
    const accessToken = this.options.getAccessToken?.()
    if (!accessToken) {
      return {
        Accept: 'application/json'
      }
    }

    return {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`
    }
  }

  private composeApiUrl(path: string): string {
    const normalizedBase = this.options.baseUrl.replace(/\/+$/, '')
    const normalizedPrefix = this.apiPrefix.startsWith('/') ? this.apiPrefix : `/${this.apiPrefix}`
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${normalizedBase}${normalizedPrefix}${normalizedPath}`
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...toHeaderRecord(init.headers)
    }

    const payload = await this.requester<ApiEnvelope<T> | T>(
      this.toRequestConfig(path, init, headers)
    )
    return this.unwrapEnvelope(payload)
  }

  private toRequestConfig(
    path: string,
    init: RequestInit,
    headers: Record<string, string>
  ): LoginRequestConfig {
    const hasAuthorizationHeader = new Headers(headers).has('Authorization')

    return {
      url: path,
      method: init.method,
      data: init.body,
      headers,
      signal: init.signal ?? undefined,
      // 登录、刷新等公开接口不应该被全局鉴权头污染；当前用户查询则保留认证能力。
      skipAuth: !hasAuthorizationHeader,
      skipPermission: true
    }
  }

  private unwrapEnvelope<T>(payload: ApiEnvelope<T> | T): T {
    if (!isRecord(payload)) {
      return payload as T
    }

    if (typeof payload.code !== 'number') {
      return payload as T
    }

    if (payload.code !== 0) {
      throw new Error(asString(payload.message) ?? `Business error code: ${payload.code}`)
    }

    return (payload.data ?? {}) as T
  }

  private parseTokens(payload: Record<string, unknown>): AuthTokens {
    return normalizeAuthTokensPayload(payload)
  }
}
