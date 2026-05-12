import { PermissionEngine } from '../core/permission-engine'

import { RbacPermissionAdapter } from './rbac-adapter'

// 统一组装 RBAC 权限引擎，应用层只需要传权限集合。
export function createRbacPermissionEngine(permissions: string[] = []): PermissionEngine {
  return new PermissionEngine(new RbacPermissionAdapter(permissions))
}
