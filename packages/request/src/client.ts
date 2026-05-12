import axios from 'axios'

import { attachAuthInterceptor } from './interceptors/auth'
import { attachErrorInterceptor } from './interceptors/error'
import { attachPermissionInterceptor } from './interceptors/permission'
import { attachTraceInterceptor } from './interceptors/trace'
import { attachUnwrapInterceptor } from './interceptors/unwrap'
import type { HttpClient, HttpClientOptions } from './types'

export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  const instance = axios.create({
    baseURL: options.baseURL,
    timeout: options.timeout ?? 10000
  })

  // 请求阶段补 trace、鉴权和权限元信息；响应阶段先处理错误，再统一解包。
  attachTraceInterceptor(instance, options.generateTraceId)
  attachAuthInterceptor(instance, options.getToken)
  attachPermissionInterceptor(instance, options.permissionChecker)
  attachErrorInterceptor(instance, options)
  attachUnwrapInterceptor(instance, options.onUnwrapResolved)

  return instance as HttpClient
}
