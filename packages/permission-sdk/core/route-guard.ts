import type { NavigationGuard, NavigationGuardReturn, RouteLocationNormalized } from 'vue-router'

import { normalizePermissionContext } from './context'
import { PermissionEngine } from './permission-engine'
import type { PermissionContext, PermissionValue } from './types'

interface RoutePermissionMeta {
  permission?: PermissionValue
  resource?: string
  action?: string
  userId?: string
  tenantId?: string
}

export interface CreateRouteGuardOptions {
  engine: PermissionEngine
  resolveContext?: (to: RouteLocationNormalized) => PermissionContext | null
  onDenied?: (args: {
    to: RouteLocationNormalized
    from: RouteLocationNormalized
    context: PermissionContext
  }) => NavigationGuardReturn | Promise<NavigationGuardReturn>
}

// 从当前目标路由匹配链中解析权限元信息，子路由优先，兼容旧的 resource/action 写法。
export function resolveRoutePermissionContext(
  to: RouteLocationNormalized
): PermissionContext | null {
  for (const record of [...to.matched].reverse()) {
    const meta = record.meta as RoutePermissionMeta
    const context = normalizePermissionContext(meta.permission, {
      resource: meta.resource,
      action: meta.action,
      userId: meta.userId,
      tenantId: meta.tenantId
    })

    if (context) {
      return context
    }
  }

  return null
}

export function createRouteGuard(
  engineOrOptions: PermissionEngine | CreateRouteGuardOptions
): NavigationGuard {
  const options =
    engineOrOptions instanceof PermissionEngine ? { engine: engineOrOptions } : engineOrOptions

  return async (to, from) => {
    const context = options.resolveContext?.(to) ?? resolveRoutePermissionContext(to)
    if (!context) {
      return true
    }

    const allowed = await options.engine.canAccess(context)
    if (allowed) {
      return true
    }

    if (options.onDenied) {
      return options.onDenied({ to, from, context })
    }

    return { path: '/403' }
  }
}
