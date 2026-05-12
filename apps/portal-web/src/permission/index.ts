const toPermissionKey = (permission: { resource: string; action: string }): string =>
  `${permission.resource}:${permission.action}`

export const PORTAL_ROUTE_PERMISSIONS = {
  home: {
    resource: 'portal-home',
    action: 'read'
  },
  workspace: {
    resource: 'portal-workspace',
    action: 'read'
  }
} as const

export const PORTAL_OPERATION_PERMISSIONS = {
  favorite: {
    resource: 'portal-favorite',
    action: 'write'
  },
  comment: {
    resource: 'portal-comment',
    action: 'write'
  },
  download: {
    resource: 'portal-download',
    action: 'read'
  }
} as const

export const PORTAL_PUBLIC_PERMISSIONS = [toPermissionKey(PORTAL_ROUTE_PERMISSIONS.home)]

export const PORTAL_MEMBER_PERMISSIONS = [
  toPermissionKey(PORTAL_ROUTE_PERMISSIONS.workspace),
  ...Object.values(PORTAL_OPERATION_PERMISSIONS).map(toPermissionKey)
]

export const ALL_PORTAL_PERMISSIONS = [...PORTAL_PUBLIC_PERMISSIONS, ...PORTAL_MEMBER_PERMISSIONS]
