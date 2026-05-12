import { AxiosHeaders, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

import type { RequestConfig, RequestPermissionMeta } from '../types'

export function attachPermissionInterceptor(
  instance: AxiosInstance,
  permissionChecker?: (meta: RequestPermissionMeta) => boolean | Promise<boolean>
): void {
  instance.interceptors.request.use(async (config: InternalAxiosRequestConfig & RequestConfig) => {
    if (config.skipPermission || !config.permission) {
      return config
    }

    if (permissionChecker) {
      const allowed = await permissionChecker(config.permission)
      if (!allowed) {
        throw new Error(
          `Permission denied: ${config.permission.resource ?? 'unknown'}:${config.permission.action ?? 'unknown'}`
        )
      }
    }

    // 将权限元信息透传到请求头，方便后端日志审计与细粒度鉴权。
    const headers = AxiosHeaders.from(config.headers)
    if (config.permission.resource) {
      headers.set('x-resource', config.permission.resource)
    }
    if (config.permission.action) {
      headers.set('x-action', config.permission.action)
    }

    config.headers = headers
    return config
  })
}
