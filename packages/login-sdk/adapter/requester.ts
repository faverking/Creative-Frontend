import type { LoginRequestConfig, LoginRequester } from '../core/types'

interface RequestClient {
  request<T>(config: LoginRequestConfig): Promise<T>
}

export function createHttpClientRequester(getClient: () => RequestClient): LoginRequester {
  return async <T>(config: LoginRequestConfig): Promise<T> => {
    // 把 login-sdk 的认证请求统一委托给共享 HTTP 客户端，复用已有拦截器和错误处理。
    return getClient().request<T>(config)
  }
}
