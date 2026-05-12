export interface PermissionContext {
  resource: string
  action: string
  userId?: string
  tenantId?: string
}

export type PermissionValue = string | Partial<PermissionContext> | null | undefined

export interface PermissionAdapter {
  canAccess(context: PermissionContext): boolean | Promise<boolean>
  // 登录后动态注入权限集合，兼容后端直接返回的 permission key 列表。
  setPermissions?(permissions: string[]): void
  // 退出登录或鉴权失败后清空权限缓存。
  clearPermissions?(): void
}
