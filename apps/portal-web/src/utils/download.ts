import { runtimeConfig } from '@/constants/runtime'

const ILLEGAL_FILE_NAME_PATTERN = /[\\/:*?"<>|]+/g

function resolveKnownInternalOrigins(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  const origins = new Set<string>([window.location.origin])
  const apiBaseUrl = runtimeConfig.apiBaseUrl?.trim()

  if (apiBaseUrl) {
    try {
      origins.add(new URL(apiBaseUrl, window.location.origin).origin)
    } catch {
      // Ignore invalid runtime config here and fall back to the current origin.
    }
  }

  return Array.from(origins)
}

export function isInternalDownloadUrl(url: string): boolean {
  const normalizedUrl = url.trim()

  if (!normalizedUrl) {
    return false
  }

  if (
    normalizedUrl.startsWith('/') ||
    normalizedUrl.startsWith('./') ||
    normalizedUrl.startsWith('../') ||
    normalizedUrl.startsWith('blob:') ||
    normalizedUrl.startsWith('data:')
  ) {
    return true
  }

  if (typeof window === 'undefined') {
    return !/^https?:\/\//.test(normalizedUrl)
  }

  try {
    const resolvedUrl = new URL(normalizedUrl, window.location.origin)
    return resolveKnownInternalOrigins().includes(resolvedUrl.origin)
  } catch {
    return false
  }
}

export function normalizeDownloadFileName(
  value: string,
  fallback = 'download',
  extension?: string
): string {
  const normalizedBase =
    value
      .trim()
      .replace(ILLEGAL_FILE_NAME_PATTERN, '-')
      .replace(/\s+/g, ' ')
      .replace(/[. ]+$/g, '') || fallback

  if (!extension) {
    return normalizedBase
  }

  const normalizedExtension = extension.replace(/^\./, '')

  return normalizedBase.toLowerCase().endsWith(`.${normalizedExtension.toLowerCase()}`)
    ? normalizedBase
    : `${normalizedBase}.${normalizedExtension}`
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const objectUrl = window.URL.createObjectURL(blob)
  const link = window.document.createElement('a')

  link.href = objectUrl
  link.download = fileName
  link.rel = 'noopener'
  link.style.display = 'none'
  window.document.body.append(link)
  link.click()
  link.remove()

  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl)
  }, 1000)
}

export function triggerUrlDownload(url: string, fileName?: string): void {
  const normalizedUrl = url.trim()

  if (typeof window === 'undefined' || !normalizedUrl) {
    return
  }

  if (!isInternalDownloadUrl(normalizedUrl)) {
    openUrlInNewTab(normalizedUrl)
    return
  }

  const link = window.document.createElement('a')

  link.href = normalizedUrl
  if (fileName) {
    link.download = fileName
  }
  link.rel = 'noopener'
  link.style.display = 'none'

  window.document.body.append(link)
  link.click()
  link.remove()
}

function openUrlInNewTab(url: string): void {
  if (typeof window === 'undefined' || !url.trim()) {
    return
  }

  const openedWindow = window.open(url, '_blank', 'noopener,noreferrer')

  if (openedWindow) {
    return
  }

  const link = window.document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.style.display = 'none'
  window.document.body.append(link)
  link.click()
  link.remove()
}
