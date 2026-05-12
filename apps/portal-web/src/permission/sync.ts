import type { LoginSdk, LoginUser } from '@frontend/login-sdk'
import type { PermissionEngine } from '@frontend/permission-sdk'

import {
  ALL_PORTAL_PERMISSIONS,
  PORTAL_MEMBER_PERMISSIONS,
  PORTAL_PUBLIC_PERMISSIONS
} from './index'

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  super_admin: ALL_PORTAL_PERMISSIONS,
  admin: ALL_PORTAL_PERMISSIONS,
  user: PORTAL_MEMBER_PERMISSIONS
}

export type PermissionUserResolvedHandler = (user: LoginUser | null) => void

function normalizeRole(role: string): string {
  return role.trim().toLowerCase().replace(/-/g, '_')
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function withPublicPermissions(permissions: string[]): string[] {
  return Array.from(new Set([...PORTAL_PUBLIC_PERMISSIONS, ...permissions]))
}

function derivePermissionList(user: LoginUser | null): string[] {
  if (!user) {
    return [...PORTAL_PUBLIC_PERMISSIONS]
  }

  const directPermissions = toStringArray(
    (user as LoginUser & { permissions?: unknown }).permissions
  )
  if (directPermissions.length > 0) {
    return withPublicPermissions(directPermissions)
  }

  const rolePermissions = (user.roles ?? []).flatMap(
    (role) => ROLE_PERMISSION_MAP[normalizeRole(role)] ?? []
  )
  if (rolePermissions.length > 0) {
    return withPublicPermissions(rolePermissions)
  }

  return [...PORTAL_PUBLIC_PERMISSIONS]
}

export function applyPublicPermissionState(permissionEngine: PermissionEngine): void {
  permissionEngine.setPermissions([...PORTAL_PUBLIC_PERMISSIONS])
}

export async function syncPermissionState(
  loginSdk: LoginSdk,
  permissionEngine: PermissionEngine,
  onUserResolved?: PermissionUserResolvedHandler
): Promise<void> {
  const user = await loginSdk.getCurrentUser().catch(() => null)
  onUserResolved?.(user)
  permissionEngine.setPermissions(derivePermissionList(user))
}

export function clearPermissionState(permissionEngine: PermissionEngine): void {
  applyPublicPermissionState(permissionEngine)
}
