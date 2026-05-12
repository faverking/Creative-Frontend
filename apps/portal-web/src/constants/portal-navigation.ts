import type { PortalBusinessType } from './portal-business'
import { PORTAL_BUSINESS_ITEMS } from './portal-business'
import type { PortalWorkspaceSection } from './workspace'
import { PORTAL_WORKSPACE_NAV_ITEMS } from './workspace'

export type PortalPrimaryNavKey = 'home' | PortalBusinessType

export type PortalPrimaryNavItem =
  | {
      key: 'home'
      label: string
      path: string
    }
  | {
      key: PortalBusinessType
      label: string
      routeName: string
    }

export interface PortalUtilityNavItem {
  iconName: 'favorite' | 'history' | 'message'
  key: PortalWorkspaceSection
  label: string
  routeName: string
  showIndicator?: boolean
}

export const PORTAL_PRIMARY_NAV_ITEMS = [
  {
    key: 'home',
    label: '首页',
    path: '/'
  },
  ...PORTAL_BUSINESS_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    routeName: item.moduleRouteName
  }))
] satisfies ReadonlyArray<PortalPrimaryNavItem>

export const PORTAL_UTILITY_NAV_ITEMS = PORTAL_WORKSPACE_NAV_ITEMS.map((item) => ({
  key: item.key,
  label: item.label,
  routeName: item.routeName,
  iconName: item.key === 'messages' ? 'message' : item.key === 'favorites' ? 'favorite' : 'history',
  showIndicator: item.key === 'messages'
})) satisfies ReadonlyArray<PortalUtilityNavItem>

export function resolvePortalPrimaryNavKey(
  routeName: string | null | undefined,
  routePath: string
): PortalPrimaryNavKey | null {
  if (routePath === '/') {
    return 'home'
  }

  if (!routeName) {
    return null
  }

  for (const item of PORTAL_BUSINESS_ITEMS) {
    if (routeName === item.moduleRouteName || routeName.startsWith(item.detailRouteName)) {
      return item.key
    }
  }

  return null
}
