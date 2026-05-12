import {
  AxiosHeaders,
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios'

import type { HttpClientOptions, RequestConfig } from '../types'

function isBusinessError(response: AxiosResponse<unknown>): boolean {
  const data = response.data as { code?: number }
  return (
    typeof data === 'object' && data !== null && typeof data.code === 'number' && data.code !== 0
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readTraceIdField(record: Record<string, unknown>): string | undefined {
  const directTraceId = record.traceId
  if (typeof directTraceId === 'string' && directTraceId.length > 0) {
    return directTraceId
  }

  const snakeTraceId = record.trace_id
  if (typeof snakeTraceId === 'string' && snakeTraceId.length > 0) {
    return snakeTraceId
  }

  const nestedData = record.data
  if (isRecord(nestedData)) {
    return readTraceIdField(nestedData)
  }

  return undefined
}

function resolveResponseTraceId(response?: AxiosResponse<unknown>): string | undefined {
  if (!response) {
    return undefined
  }

  const rawHeaders = response.headers as Record<string, unknown> | undefined
  const headerTraceId = rawHeaders?.['x-trace-id'] ?? rawHeaders?.['trace-id']
  if (typeof headerTraceId === 'string' && headerTraceId.length > 0) {
    return headerTraceId
  }

  const payload = response.data
  if (!isRecord(payload)) {
    return undefined
  }

  return readTraceIdField(payload)
}

function resolveHttpErrorMessage(error: AxiosError): string | undefined {
  const payload = error.response?.data
  if (typeof payload !== 'object' || payload === null) {
    return undefined
  }

  const message = (payload as { message?: unknown }).message
  return typeof message === 'string' && message.trim().length > 0 ? message.trim() : undefined
}

export function attachErrorInterceptor(instance: AxiosInstance, options: HttpClientOptions): void {
  // 多个 401 并发时复用同一个刷新请求，避免风暴。
  let refreshingPromise: Promise<string | undefined> | null = null

  instance.interceptors.response.use(
    (response) => {
      const responseTraceId = resolveResponseTraceId(response)
      if (responseTraceId) {
        options.onTraceResolved?.(responseTraceId)
      }

      if (isBusinessError(response)) {
        const data = response.data as { code: number; message?: string }
        const businessError = new Error(data.message ?? `Business error code: ${data.code}`)

        options.onBusinessError?.(response.data)
        throw businessError
      }

      return response
    },
    async (error: AxiosError) => {
      const status = error.response?.status
      const requestConfig = error.config as (InternalAxiosRequestConfig & RequestConfig) | undefined
      const requestHeaders = AxiosHeaders.from(requestConfig?.headers)
      const isAuthenticatedRequest = requestConfig?._resolvedAuthState === 'authenticated'
      const isOptionalAuthRequest = Boolean(requestConfig?.optionalAuth)
      const responseTraceId = resolveResponseTraceId(error.response)
      const message = resolveHttpErrorMessage(error)
      if (responseTraceId) {
        options.onTraceResolved?.(responseTraceId)
      }

      if (status === 401) {
        const canRefresh =
          Boolean(options.refreshToken) &&
          Boolean(requestConfig) &&
          isAuthenticatedRequest &&
          !requestConfig?._retryAuth

        if (canRefresh && requestConfig && options.refreshToken) {
          // 标记仅重试一次，防止 refresh 异常导致死循环。
          requestConfig._retryAuth = true

          try {
            if (!refreshingPromise) {
              refreshingPromise = options.refreshToken().finally(() => {
                refreshingPromise = null
              })
            }

            const nextToken = await refreshingPromise
            if (nextToken) {
              requestHeaders.set('Authorization', `Bearer ${nextToken}`)
              requestConfig.headers = requestHeaders
              requestConfig._resolvedAuthState = 'authenticated'
              return instance.request(requestConfig)
            }
          } catch {
            // 刷新失败统一走未授权回调，由上层决定跳转登录或清理状态。
          }
        }

        if (isOptionalAuthRequest) {
          // 失败一次后，跳过鉴权继续请求
          if (requestConfig && isAuthenticatedRequest) {
            requestConfig.skipAuth = true
            requestConfig._retryAuth = true
            requestConfig._resolvedAuthState = 'anonymous'
            requestHeaders.delete('Authorization')
            requestConfig.headers = requestHeaders
            return instance.request(requestConfig)
          }

          return Promise.reject(error)
        }

        options.onUnauthorized?.()
      } else if (status === 403) {
        options.onForbidden?.()
      } else {
        options.onServerError?.(status, message)
      }
      return Promise.reject(error)
    }
  )
}
