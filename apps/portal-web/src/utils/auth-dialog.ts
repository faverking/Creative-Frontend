import type { RouteLocationNormalizedLoaded, RouteLocationRaw } from 'vue-router'

type AuthEntryType = 'login' | 'register'

const AUTH_DIALOG_NAME_SUFFIX_PATTERN = /-(login|register)$/

function resolveRouteName(route: RouteLocationNormalizedLoaded): string {
  return typeof route.name === 'string' ? route.name : ''
}

function resolveDetailBaseRouteName(route: RouteLocationNormalizedLoaded): string {
  const routeName = resolveRouteName(route)
  return routeName.replace(AUTH_DIALOG_NAME_SUFFIX_PATTERN, '')
}

function isDetailRouteName(routeName: string): boolean {
  return routeName.endsWith('-detail') || AUTH_DIALOG_NAME_SUFFIX_PATTERN.test(routeName)
}

export function resolveAuthRedirectPath(route: RouteLocationNormalizedLoaded): string {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/'
}

export function buildAuthDialogTabLocation(
  route: RouteLocationNormalizedLoaded,
  target: AuthEntryType
): RouteLocationRaw {
  const baseRouteName = resolveDetailBaseRouteName(route)
  const redirect = resolveAuthRedirectPath(route)

  if (isDetailRouteName(baseRouteName)) {
    return {
      name: `${baseRouteName}-${target}`,
      params: route.params,
      query: redirect !== '/' ? { redirect } : undefined
    }
  }

  return {
    name: target,
    query: redirect !== '/' ? { redirect } : undefined
  }
}

export function resolveAuthDialogCloseLocation(
  route: RouteLocationNormalizedLoaded
): RouteLocationRaw {
  const routeName = resolveRouteName(route)

  if (AUTH_DIALOG_NAME_SUFFIX_PATTERN.test(routeName)) {
    return {
      name: routeName.replace(AUTH_DIALOG_NAME_SUFFIX_PATTERN, ''),
      params: route.params
    }
  }

  return '/'
}

export function buildProtectedAuthDialogLocation(
  route: RouteLocationNormalizedLoaded,
  target: AuthEntryType = 'login'
): RouteLocationRaw {
  const baseRouteName = resolveDetailBaseRouteName(route)
  const redirect = route.fullPath

  if (isDetailRouteName(baseRouteName)) {
    return {
      name: `${baseRouteName}-${target}`,
      params: route.params,
      query: redirect !== '/' ? { redirect } : undefined
    }
  }

  return {
    name: target,
    query: redirect !== '/' ? { redirect } : undefined
  }
}
