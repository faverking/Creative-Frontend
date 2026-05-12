import type { LoginSdk, LoginUser } from '@frontend/login-sdk'
import type { PermissionEngine } from '@frontend/permission-sdk'

import {
  ADMIN_HOME_PERMISSIONS,
  OVERVIEW_PERMISSION,
  USER_HOME_PERMISSIONS,
  filterHomePermissionsByRoles,
  normalizePermissionRole
} from './index'

// 角色到权限点的兜底映射：后端未直接返回 permissions 时使用。
const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  super_admin: [...ADMIN_HOME_PERMISSIONS],
  admin: [...ADMIN_HOME_PERMISSIONS],
  editor: [...USER_HOME_PERMISSIONS],
  user: [...USER_HOME_PERMISSIONS]
}

export type PermissionUserResolvedHandler = (user: LoginUser | null) => void

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function derivePermissionList(user: LoginUser | null): string[] {
  if (!user) {
    return [OVERVIEW_PERMISSION]
  }

  const roles = toStringArray(user.roles)

  // 优先使用后端返回的细粒度 permissions。
  const directPermissions = filterHomePermissionsByRoles(
    toStringArray((user as LoginUser & { permissions?: unknown }).permissions),
    roles
  )
  if (directPermissions.length > 0) {
    return Array.from(new Set(directPermissions))
  }

  const rolePermissions = roles.flatMap(
    (role) => ROLE_PERMISSION_MAP[normalizePermissionRole(role)] ?? []
  )
  if (rolePermissions.length > 0) {
    return Array.from(new Set(rolePermissions))
  }

  // 完全无权限信息时至少保留“概览”访问能力，避免页面全拦截。
  return [OVERVIEW_PERMISSION]
}

// 拉取当前用户并同步权限；支持把同一次请求结果透传给用户状态管理。
export async function syncPermissionState(
  loginSdk: LoginSdk,
  permissionEngine: PermissionEngine,
  onUserResolved?: PermissionUserResolvedHandler
): Promise<void> {
  const user = await loginSdk.getCurrentUser().catch(() => null)
  onUserResolved?.(user)
  permissionEngine.setPermissions(derivePermissionList(user))
}

// 统一清空权限缓存。
export function clearPermissionState(permissionEngine: PermissionEngine): void {
  permissionEngine.clearPermissions()
}
