import { AxiosHeaders, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

import type { RequestConfig } from '../types'

export function attachTraceInterceptor(
  instance: AxiosInstance,
  generateTraceId?: () => string
): void {
  instance.interceptors.request.use((config: InternalAxiosRequestConfig & RequestConfig) => {
    const headers = AxiosHeaders.from(config.headers)
    const traceId = config.traceId ?? generateTraceId?.()

    if (traceId) {
      headers.set('x-trace-id', traceId)
      config.traceId = traceId
    }

    // tenantId 作为多租户场景的跨服务透传字段。
    if (config.tenantId) {
      headers.set('x-tenant-id', config.tenantId)
    }

    config.headers = headers
    return config
  })
}
