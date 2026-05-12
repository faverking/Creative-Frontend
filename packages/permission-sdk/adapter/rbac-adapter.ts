import type { PermissionAdapter, PermissionContext } from '../core/types'

// RBAC 实现：以 resource:action 字符串集合做权限判定。
export class RbacPermissionAdapter implements PermissionAdapter {
  private readonly permissionSet: Set<string>

  constructor(permissions: string[] = []) {
    this.permissionSet = new Set(permissions)
  }

  canAccess(context: PermissionContext): boolean {
    return this.permissionSet.has(`${context.resource}:${context.action}`)
  }

  setPermissions(permissions: string[]): void {
    this.permissionSet.clear()
    for (const permission of permissions) {
      this.permissionSet.add(permission)
    }
  }

  clearPermissions(): void {
    this.permissionSet.clear()
  }
}
