import type { AppEnvConfig } from '@frontend/config'
import type { LoginSdk } from '@frontend/login-sdk'
import { createHttpClient, type HttpClient, type UnwrapResolvedHandler } from '@frontend/request'

// http-client 负责把“环境配置 + 登录态 + 全局错误处理”装配成应用可直接使用的 HttpClient。
// 设计意图是：请求细节统一下沉，业务 API 层只关心接口和数据。

export interface SetupAppHttpClientOptions {
  onTraceResolved?: (traceId: string) => void
  onUnauthorized?: () => void
  onForbidden?: () => void
  onServerError?: (status?: number, message?: string) => void
  onBusinessError?: (payload: unknown) => void
  onUnwrapResolved?: UnwrapResolvedHandler
}

let httpClient: HttpClient | null = null

// baseUrl 在这里统一拼装，避免每个应用重复处理 apiBaseUrl / apiPrefix。
function createApiBaseUrl(env: AppEnvConfig): string {
  const base = env.apiBaseUrl.replace(/\/+$/, '')
  const prefix = env.apiPrefix && env.apiPrefix.length > 0 ? env.apiPrefix : '/'
  const normalizedPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`
  return `${base}${normalizedPrefix}`
}

export function resolveBusinessErrorMessage(payload: unknown): string {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    typeof (payload as { message?: unknown }).message === 'string' &&
    (payload as { message: string }).message.trim().length > 0
  ) {
    return (payload as { message: string }).message.trim()
  }

  return '请求失败，请稍后重试。'
}

export function resolveHttpErrorMessage(status?: number, message?: string): string {
  if (typeof message === 'string' && message.trim().length > 0) {
    return message.trim()
  }

  if (typeof status === 'number' && status >= 500) {
    return `服务暂时不可用（${status}），请稍后重试。`
  }

  if (typeof status === 'number') {
    return `请求处理失败（${status}），请稍后重试。`
  }

  return '网络异常，请检查连接后重试。'
}

export function setupAppHttpClient(
  env: AppEnvConfig,
  loginSdk: LoginSdk,
  options: SetupAppHttpClientOptions = {}
): HttpClient {
  // createHttpClient 负责通用拦截器，这里负责把应用所需回调和登录能力接进去。
  const client = createHttpClient({
    baseURL: createApiBaseUrl(env),
    getToken: () => loginSdk.getFreshToken(),
    refreshToken: () => loginSdk.refreshToken(),
    onTraceResolved: options.onTraceResolved,
    onUnauthorized: options.onUnauthorized,
    onForbidden: options.onForbidden,
    onServerError: options.onServerError,
    onBusinessError: options.onBusinessError,
    onUnwrapResolved: options.onUnwrapResolved
  })

  httpClient = client
  return client
}

export function getAppHttpClient(): HttpClient {
  // 故意在未初始化时抛错，避免业务层悄悄用到一个不完整的客户端。
  if (!httpClient) {
    throw new Error('HTTP client is not initialized. Call setupAppHttpClient first.')
  }

  return httpClient
}
