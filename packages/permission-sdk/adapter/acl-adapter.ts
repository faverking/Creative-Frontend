import type { PermissionAdapter, PermissionContext } from '../core/types'

function parsePermissionKey(permission: string): PermissionContext | null {
  const [resource, action] = permission.split(':')
  if (!resource || resource.length === 0) {
    return null
  }

  return {
    resource,
    action: action && action.length > 0 ? action : 'read'
  }
}

// ACL 实现：resource -> actions 的映射结构。
export class AclPermissionAdapter implements PermissionAdapter {
  private acl: Record<string, Set<string>>

  constructor(acl: Record<string, string[]> = {}) {
    this.acl = this.normalizeAcl(acl)
  }

  canAccess(context: PermissionContext): boolean {
    const actions = this.acl[context.resource]
    return actions ? actions.has(context.action) : false
  }

  setPermissions(permissions: string[]): void {
    const nextAcl: Record<string, string[]> = {}

    for (const permission of permissions) {
      const context = parsePermissionKey(permission)
      if (!context) {
        continue
      }

      nextAcl[context.resource] ??= []
      nextAcl[context.resource].push(context.action)
    }

    this.acl = this.normalizeAcl(nextAcl)
  }

  clearPermissions(): void {
    this.acl = {}
  }

  private normalizeAcl(source: Record<string, string[]>): Record<string, Set<string>> {
    return Object.fromEntries(
      Object.entries(source).map(([resource, actions]) => [resource, new Set(actions)])
    )
  }
}
