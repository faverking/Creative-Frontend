import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

export interface ApiEnvelope<T> {
  code?: number
  message?: string
  data?: T
  traceId?: string
}

export type ApiPayload<T> = ApiEnvelope<T> | T
export type UnwrapResolvedHandler = <T>(payload: T, response: AxiosResponse<ApiPayload<T>>) => void
export type ResolvedAuthState = 'anonymous' | 'authenticated'

// 请求权限元信息：用于前端门禁校验和后端透传审计。
export interface RequestPermissionMeta {
  resource?: string
  action?: string
}

export interface RequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  permission?: RequestPermissionMeta
  tenantId?: string
  traceId?: string
  optionalAuth?: boolean
  skipAuth?: boolean
  skipPermission?: boolean
  _retryAuth?: boolean
  _resolvedAuthState?: ResolvedAuthState
}

export interface HttpClient extends Omit<
  AxiosInstance,
  | 'request'
  | 'get'
  | 'delete'
  | 'head'
  | 'options'
  | 'post'
  | 'put'
  | 'patch'
  | 'postForm'
  | 'putForm'
  | 'patchForm'
> {
  request<T = unknown, D = unknown>(config: RequestConfig<D>): Promise<T>
  get<T = unknown, D = unknown>(url: string, config?: RequestConfig<D>): Promise<T>
  delete<T = unknown, D = unknown>(url: string, config?: RequestConfig<D>): Promise<T>
  head<T = unknown, D = unknown>(url: string, config?: RequestConfig<D>): Promise<T>
  options<T = unknown, D = unknown>(url: string, config?: RequestConfig<D>): Promise<T>
  post<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T>
  put<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T>
  patch<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T>
  postForm<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T>
  putForm<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T>
  patchForm<T = unknown, D = unknown>(url: string, data?: D, config?: RequestConfig<D>): Promise<T>
}

export interface HttpClientOptions {
  baseURL?: string
  timeout?: number
  getToken?: () => string | undefined | Promise<string | undefined>
  refreshToken?: () => Promise<string | undefined>
  permissionChecker?: (meta: RequestPermissionMeta) => boolean | Promise<boolean>
  generateTraceId?: () => string
  onTraceResolved?: (traceId: string) => void
  onUnauthorized?: () => void
  onForbidden?: () => void
  onServerError?: (status?: number, message?: string) => void
  onBusinessError?: (data: unknown) => void
  onUnwrapResolved?: UnwrapResolvedHandler
}
