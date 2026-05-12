interface BrowserLocationLike {
  pathname: string
  search?: string
  hash?: string
}

function readImportMetaBaseUrl(): string {
  const meta = import.meta as ImportMeta & { env?: { BASE_URL?: string } }
  return typeof meta.env?.BASE_URL === 'string' ? meta.env.BASE_URL : '/'
}

export function normalizeAppBasePath(basePath: string = readImportMetaBaseUrl()): string {
  const value = basePath.trim()
  if (!value || value === '.') {
    return '/'
  }

  const cleanPath = value.split(/[?#]/, 1)[0] ?? '/'
  const withLeadingSlash = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`

  if (withLeadingSlash === '/') {
    return '/'
  }

  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

export function resolveAppRoutePathFromLocation(
  location: BrowserLocationLike,
  basePath: string = readImportMetaBaseUrl()
): string {
  const base = normalizeAppBasePath(basePath)
  const pathname = location.pathname.startsWith('/') ? location.pathname : `/${location.pathname}`
  let routePath = pathname

  if (base !== '/') {
    const baseWithoutTrailingSlash = base.slice(0, -1)

    if (pathname === baseWithoutTrailingSlash || pathname === base) {
      routePath = '/'
    } else if (pathname.startsWith(base)) {
      routePath = `/${pathname.slice(base.length)}`
    }
  }

  return `${routePath}${location.search ?? ''}${location.hash ?? ''}`
}

export function resolveBrowserPathForAppRoute(
  routePath: string,
  basePath: string = readImportMetaBaseUrl()
): string {
  const base = normalizeAppBasePath(basePath)
  const trimmedRoutePath = routePath.trim()
  const normalizedRoutePath = trimmedRoutePath.startsWith('/')
    ? trimmedRoutePath
    : `/${trimmedRoutePath || ''}`

  if (base === '/') {
    return normalizedRoutePath || '/'
  }

  const baseWithoutTrailingSlash = base.slice(0, -1)
  if (normalizedRoutePath === baseWithoutTrailingSlash || normalizedRoutePath.startsWith(base)) {
    return normalizedRoutePath
  }

  if (normalizedRoutePath === '/') {
    return base
  }

  return `${baseWithoutTrailingSlash}${normalizedRoutePath}`
}
