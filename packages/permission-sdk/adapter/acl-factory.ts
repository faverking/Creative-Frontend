import { PermissionEngine } from '../core/permission-engine'

import { AclPermissionAdapter } from './acl-adapter'

// 统一组装 ACL 权限引擎，保持应用接入方式和其他 SDK 工厂一致。
export function createAclPermissionEngine(acl: Record<string, string[]> = {}): PermissionEngine {
  return new PermissionEngine(new AclPermissionAdapter(acl))
}
