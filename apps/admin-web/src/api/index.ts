import { ElMessage } from 'element-plus'

import {
  createAuthApi,
  getAppHttpClient,
  resolveAppRoutePathFromLocation,
  resolveBrowserPathForAppRoute,
  resolveBusinessErrorMessage,
  resolveHttpErrorMessage,
  setupAppHttpClient,
  type SetupAppHttpClientOptions
} from '@frontend/app-runtime'
import type { AppEnvConfig } from '@frontend/config'
import type { LoginSdk } from '@frontend/login-sdk'
import type { HttpClient } from '@frontend/request'

import { clearAuthState } from '@/auth/runtime'

export type SetupHttpClientOptions = SetupAppHttpClientOptions

function redirectToLogin(): void {
  if (typeof window === 'undefined') {
    return
  }

  const redirect = resolveAppRoutePathFromLocation(window.location, import.meta.env.BASE_URL)
  const target = resolveBrowserPathForAppRoute(
    `/login?redirect=${encodeURIComponent(redirect)}`,
    import.meta.env.BASE_URL
  )
  window.location.assign(target)
}

export function setupHttpClient(
  env: AppEnvConfig,
  loginSdk: LoginSdk,
  options: SetupHttpClientOptions = {}
): HttpClient {
  return setupAppHttpClient(env, loginSdk, {
    ...options,
    onUnauthorized: () => {
      clearAuthState()
      options.onUnauthorized?.()
      redirectToLogin()
    },
    onForbidden: () => {
      options.onForbidden?.()
      ElMessage.error('暂无权限执行当前操作。')
    },
    onServerError: (status, message) => {
      options.onServerError?.(status, message)
      ElMessage.error(resolveHttpErrorMessage(status, message))
    },
    onBusinessError: (payload) => {
      options.onBusinessError?.(payload)
      ElMessage.error(resolveBusinessErrorMessage(payload))
    }
  })
}

export const getHttpClient = getAppHttpClient
export const authApi = createAuthApi(() => getAppHttpClient())
