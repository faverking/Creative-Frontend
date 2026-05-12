// permission-sdk 负责“能不能访问 / 能不能操作”的判定模型。
// 它不关心用户是谁，也不关心登录来源，只消费上层喂进来的权限上下文。

// core：权限引擎、路由守卫、指令这些跨框架也稳定成立的能力。
export { PermissionEngine } from './core/permission-engine'
export { createRouteGuard, resolveRoutePermissionContext } from './core/route-guard'
export { createPermissionDirective } from './core/directive'
export type { PermissionAdapter, PermissionContext, PermissionValue } from './core/types'
export type { CreateRouteGuardOptions } from './core/route-guard'

// plugin：把权限引擎和 v-permission 指令挂进 Vue。
export { createPermissionPlugin, usePermissionEngine } from './plugin/index'

// adapter：支持 ACL / RBAC 等不同权限表达模型，但对外统一收口到 PermissionEngine。
export { AclPermissionAdapter } from './adapter/acl-adapter'
export { createAclPermissionEngine } from './adapter/acl-factory'
export { RbacPermissionAdapter } from './adapter/rbac-adapter'
export { createRbacPermissionEngine } from './adapter/rbac-factory'
