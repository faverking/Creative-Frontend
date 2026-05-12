export const MANAGE_ROUTE_PERMISSIONS = {
  overview: {
    resource: 'home-overview',
    action: 'read'
  },
  manage: {
    resource: 'home-manage',
    action: 'read'
  },
  adminOverview: {
    resource: 'home-admin-overview',
    action: 'read'
  },
  adminManage: {
    resource: 'home-admin-manage',
    action: 'read'
  },
  books: {
    resource: 'home-books',
    action: 'read'
  },
  topics: {
    resource: 'home-topics',
    action: 'read'
  },
  images: {
    resource: 'home-images',
    action: 'read'
  },
  articles: {
    resource: 'home-articles',
    action: 'read'
  }
} as const

export const OVERVIEW_PERMISSION = `${MANAGE_ROUTE_PERMISSIONS.overview.resource}:${MANAGE_ROUTE_PERMISSIONS.overview.action}`
export const MANAGE_PERMISSION = `${MANAGE_ROUTE_PERMISSIONS.manage.resource}:${MANAGE_ROUTE_PERMISSIONS.manage.action}`
export const ADMIN_OVERVIEW_PERMISSION = `${MANAGE_ROUTE_PERMISSIONS.adminOverview.resource}:${MANAGE_ROUTE_PERMISSIONS.adminOverview.action}`
export const ADMIN_MANAGE_PERMISSION = `${MANAGE_ROUTE_PERMISSIONS.adminManage.resource}:${MANAGE_ROUTE_PERMISSIONS.adminManage.action}`
export const ADMIN_MANAGE_ALLOWED_ROLES = ['admin', 'super_admin'] as const
export const USER_HOME_PERMISSIONS = [
  OVERVIEW_PERMISSION,
  MANAGE_PERMISSION,
  `${MANAGE_ROUTE_PERMISSIONS.books.resource}:${MANAGE_ROUTE_PERMISSIONS.books.action}`,
  `${MANAGE_ROUTE_PERMISSIONS.topics.resource}:${MANAGE_ROUTE_PERMISSIONS.topics.action}`,
  `${MANAGE_ROUTE_PERMISSIONS.images.resource}:${MANAGE_ROUTE_PERMISSIONS.images.action}`,
  `${MANAGE_ROUTE_PERMISSIONS.articles.resource}:${MANAGE_ROUTE_PERMISSIONS.articles.action}`
] as const
export const ADMIN_HOME_PERMISSIONS = [ADMIN_OVERVIEW_PERMISSION, ADMIN_MANAGE_PERMISSION] as const
export const USER_HOME_LANDING_PATH = '/home/overview'
export const ADMIN_HOME_LANDING_PATH = '/home/admin/overview'

export function normalizePermissionRole(role: string): string {
  return role.trim().toLowerCase().replace(/-/g, '_')
}

export function hasAdminManageRouteAccessByRoles(
  roles: readonly string[] | null | undefined
): boolean {
  return (roles ?? []).some((role) =>
    ADMIN_MANAGE_ALLOWED_ROLES.includes(
      normalizePermissionRole(role) as (typeof ADMIN_MANAGE_ALLOWED_ROLES)[number]
    )
  )
}

export function resolveHomeLandingPathByRoles(roles: readonly string[] | null | undefined): string {
  return hasAdminManageRouteAccessByRoles(roles) ? ADMIN_HOME_LANDING_PATH : USER_HOME_LANDING_PATH
}

export function filterHomePermissionsByRoles(
  permissions: readonly string[],
  roles: readonly string[] | null | undefined
): string[] {
  const allowedPermissions = hasAdminManageRouteAccessByRoles(roles)
    ? new Set<string>(ADMIN_HOME_PERMISSIONS)
    : new Set<string>(USER_HOME_PERMISSIONS)

  return permissions.filter((permission) => allowedPermissions.has(permission))
}
