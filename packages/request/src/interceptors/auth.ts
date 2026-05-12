import { AxiosHeaders, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

import type { RequestConfig } from '../types'

function markAnonymous(
  config: InternalAxiosRequestConfig & RequestConfig,
  headers: AxiosHeaders,
  normalizeSkipAuth = false
): InternalAxiosRequestConfig & RequestConfig {
  if (normalizeSkipAuth) {
    config.skipAuth = true
  }

  headers.delete('Authorization')
  config.headers = headers
  config._resolvedAuthState = 'anonymous'
  return config
}

function markAuthenticated(
  config: InternalAxiosRequestConfig & RequestConfig,
  headers: AxiosHeaders,
  authorization?: string
): InternalAxiosRequestConfig & RequestConfig {
  if (authorization) {
    headers.set('Authorization', authorization)
  }

  config.headers = headers
  config._resolvedAuthState = 'authenticated'
  return config
}

export function attachAuthInterceptor(
  instance: AxiosInstance,
  getToken?: () => string | undefined | Promise<string | undefined>
): void {
  instance.interceptors.request.use(async (config: InternalAxiosRequestConfig & RequestConfig) => {
    const headers = AxiosHeaders.from(config.headers)

    if (config.skipAuth) {
      return markAnonymous(config, headers)
    }

    // 显式传入 Authorization 时以调用方为准，不做覆盖。
    if (headers.get('Authorization')) {
      return markAuthenticated(config, headers)
    }

    const token = getToken ? await getToken() : undefined
    if (!token) {
      return markAnonymous(config, headers, Boolean(config.optionalAuth))
    }

    return markAuthenticated(config, headers, `Bearer ${token}`)
  })
}
