import 'axios'

import type { RequestPermissionMeta, ResolvedAuthState } from './types'

declare module 'axios' {
  interface AxiosRequestConfig {
    permission?: RequestPermissionMeta
    tenantId?: string
    traceId?: string
    optionalAuth?: boolean
    skipAuth?: boolean
    skipPermission?: boolean
    _retryAuth?: boolean
    _resolvedAuthState?: ResolvedAuthState
  }
}

export {}
