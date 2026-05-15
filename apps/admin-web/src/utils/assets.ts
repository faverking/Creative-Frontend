import { runtimeConfig } from '@/constants'

function normalizePathWithQuery(path: string): string {
  const trimmedPath = path.trim()
  if (!trimmedPath) {
    return ''
  }

  if (/^https?:\/\//.test(trimmedPath)) {
    try {
      const url = new URL(trimmedPath)
      return `${url.pathname}${url.search}${url.hash}`
    } catch {
      return trimmedPath
    }
  }

  return trimmedPath
}

function normalizeApiPrefix(): string {
  const prefix = runtimeConfig.apiPrefix.trim() || '/api/v1'
  return `/${prefix.replace(/^\/+|\/+$/g, '')}`
}

export function resolveAssetUrl(path: string): string {
  if (!path) {
    return ''
  }

  if (/^https?:\/\//.test(path)) {
    return path
  }

  const baseUrl = runtimeConfig.apiBaseUrl.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath
}

export function resolvePersistedAssetPath(path: string): string {
  const normalizedSource = normalizePathWithQuery(path)
  if (!normalizedSource) {
    return ''
  }

  const normalizedPath = normalizedSource.startsWith('/')
    ? normalizedSource
    : `/${normalizedSource}`

  if (normalizedPath === '/api' || normalizedPath.startsWith('/api/')) {
    return normalizedPath
  }

  return `${normalizeApiPrefix()}${normalizedPath}`
}
