import type { PermissionContext, PermissionValue } from './types'

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function parsePermissionValue(value: string): Partial<PermissionContext> {
  const [resource, action] = value.split(':')
  return {
    resource,
    action: action && action.length > 0 ? action : 'read'
  }
}

// 统一把字符串权限和对象权限归一成标准 PermissionContext。
export function normalizePermissionContext(
  value: PermissionValue,
  fallback: Partial<PermissionContext> = {}
): PermissionContext | null {
  const source = typeof value === 'string' ? parsePermissionValue(value) : (value ?? {})

  const resource = asString(source.resource) ?? asString(fallback.resource)
  if (!resource) {
    return null
  }

  return {
    resource,
    action: asString(source.action) ?? asString(fallback.action) ?? 'read',
    userId: asString(source.userId) ?? asString(fallback.userId),
    tenantId: asString(source.tenantId) ?? asString(fallback.tenantId)
  }
}
