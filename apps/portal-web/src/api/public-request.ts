import { getAppHttpClient } from '@frontend/app-runtime'
import type { RequestConfig } from '@frontend/request'

export interface PublicRequestQuery {
  [key: string]: string | number | boolean | undefined
}

export type ApiRequestErrorCode = 401 | 403 | 404 | 500

export interface ApiRequestResult<T> {
  data: T | null
  error: unknown | null
  errorCode: ApiRequestErrorCode | null
}

export const publicRequestConfig = {
  skipAuth: true,
  skipPermission: true
} as const

function resolvePublicRequestConfig(optionalAuth?: boolean): RequestConfig {
  if (optionalAuth) {
    return {
      optionalAuth: true,
      skipPermission: true
    }
  }

  return publicRequestConfig
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function resolveApiRequestErrorCode(error: unknown): ApiRequestErrorCode {
  if (isRecord(error)) {
    const directStatus = error.status
    if (typeof directStatus === 'number') {
      return normalizeStatusCode(directStatus)
    }

    const response = error.response
    if (isRecord(response) && typeof response.status === 'number') {
      return normalizeStatusCode(response.status)
    }
  }

  return 500
}

function normalizeStatusCode(status: number): ApiRequestErrorCode {
  if (status === 401 || status === 403 || status === 404) {
    return status
  }

  return 500
}

export async function safeGetPublic<T>(
  url: string,
  params?: PublicRequestQuery,
  optionalAuth?: boolean
): Promise<ApiRequestResult<T>> {
  try {
    const data = await getAppHttpClient().get<T>(url, {
      ...resolvePublicRequestConfig(optionalAuth),
      params
    })

    return {
      data,
      error: null,
      errorCode: null
    }
  } catch (error) {
    return {
      data: null,
      error,
      errorCode: resolveApiRequestErrorCode(error)
    }
  }
}
