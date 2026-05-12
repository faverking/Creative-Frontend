import { normalizeAuthTokensPayload, type AuthTokens } from '@frontend/login-sdk'
import type { HttpClient } from '@frontend/request'

// auth-api 提供认证侧最常见、最容易重复的接口封装：
// - 当前用户信息
// - 注册并拿回 token
// 目的是让应用层少写一层“薄但重复”的请求代码。

export interface RegisterPayload {
  email: string
  name: string
  password: string
}

export interface RegisterUserProfile {
  id: string
  email: string
  name: string
  roles?: string[]
  status?: string
}

export interface RegisterResult {
  user: RegisterUserProfile
  tokens: AuthTokens
}

export interface AuthApi {
  getCurrentUser(): ReturnType<HttpClient['get']>
  register(payload: RegisterPayload): Promise<RegisterResult>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const items = value.filter((item): item is string => typeof item === 'string')
  return items.length > 0 ? items : undefined
}

function normalizeRegisterUserProfile(payload: unknown): RegisterUserProfile {
  if (
    !isRecord(payload) ||
    !isString(payload.id) ||
    !isString(payload.email) ||
    !isString(payload.name)
  ) {
    throw new Error('Register response is missing user profile fields.')
  }

  return {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    roles: asStringArray(payload.roles),
    status: isString(payload.status) ? payload.status : undefined
  }
}

function normalizeRegisterResult(payload: unknown): RegisterResult {
  if (!isRecord(payload) || !isRecord(payload.user)) {
    throw new Error('Register response is missing user payload.')
  }

  return {
    user: normalizeRegisterUserProfile(payload.user),
    tokens: normalizeAuthTokensPayload(payload)
  }
}

export function createAuthApi(getHttpClient: () => HttpClient): AuthApi {
  return {
    // me 接口通常用于会话恢复或页面初始化，因此默认跳过权限校验。
    getCurrentUser() {
      return getHttpClient().get('/auth/me', {
        skipPermission: true
      })
    },

    async register(payload: RegisterPayload): Promise<RegisterResult> {
      // 注册本身发生在未登录状态，因此同时跳过 auth / permission 拦截。
      const result = await getHttpClient().post<Record<string, unknown>>(
        '/auth/register',
        payload,
        {
          skipAuth: true,
          skipPermission: true
        }
      )

      return normalizeRegisterResult(result)
    }
  }
}
