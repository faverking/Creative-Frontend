import type { PermissionAdapter, PermissionContext } from './types'

// 权限引擎：对外提供统一判定入口，适配不同权限模型。
export class PermissionEngine {
  constructor(private readonly adapter: PermissionAdapter) {}

  canAccess(context: PermissionContext): Promise<boolean> {
    return Promise.resolve(this.adapter.canAccess(context))
  }

  can(context: PermissionContext): Promise<boolean> {
    return this.canAccess(context)
  }

  async canAny(contexts: PermissionContext[]): Promise<boolean> {
    for (const context of contexts) {
      if (await this.canAccess(context)) {
        return true
      }
    }

    return false
  }

  async canAll(contexts: PermissionContext[]): Promise<boolean> {
    for (const context of contexts) {
      if (!(await this.canAccess(context))) {
        return false
      }
    }

    return true
  }

  setPermissions(permissions: string[]): void {
    this.adapter.setPermissions?.(permissions)
  }

  clearPermissions(): void {
    this.adapter.clearPermissions?.()
  }
}
