import type { RouteLocationRaw } from 'vue-router'

import {
  HOME_CONTENT_DETAIL_ROUTE_NAMES,
  HOME_CONTENT_MODULE_ROUTE_NAMES,
  type HOME_CONTENT_TYPE
} from '@/constants/portal-business'

function normalizeCount(value: number | undefined | null, fallback = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return fallback
  }

  return value
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function formatCompactCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 100000 ? 0 : 1).replace(/\.0$/, '')}k`
  }

  return `${value}`
}

export function resolvePortalContentDetailLocation(
  type: HOME_CONTENT_TYPE,
  id: string
): RouteLocationRaw {
  const normalizedId = id.trim()

  if (!normalizedId) {
    return '/'
  }

  return {
    name: HOME_CONTENT_DETAIL_ROUTE_NAMES[type],
    params: {
      id: normalizedId
    }
  }
}

export function resolvePortalContentModuleLocation(type: HOME_CONTENT_TYPE): RouteLocationRaw {
  return {
    name: HOME_CONTENT_MODULE_ROUTE_NAMES[type]
  }
}

export function formatPublishTimeLabel(value?: string): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (60 * 1000))

  if (diffMs >= 0 && diffMinutes < 1) {
    return '刚刚'
  }

  if (diffMs >= 0 && diffMinutes < 60) {
    return `${Math.max(diffMinutes, 1)}分钟前`
  }

  const diffHours = Math.floor(diffMs / (60 * 60 * 1000))
  if (diffMs >= 0 && diffHours < 24 && isSameLocalDay(now, date)) {
    return `${Math.max(diffHours, 1)}小时前`
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameLocalDay(yesterday, date)) {
    return '昨天'
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  if (date.getFullYear() === now.getFullYear()) {
    return `${month}-${day}`
  }

  return `${date.getFullYear()}-${month}-${day}`
}

export function formatUnixTimestampLabel(value?: number | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return ''
  }

  const timestamp = value < 1_000_000_000_000 ? value * 1000 : value
  return formatPublishTimeLabel(new Date(timestamp).toISOString())
}

export function resolveDisplayName(
  primaryName: string | undefined,
  fallbackName: string | undefined,
  emptyName = '匿名作者'
): string {
  return primaryName?.trim() || fallbackName?.trim() || emptyName
}

export function resolveMetricTags(
  counts: Array<{ label: string; value?: number | string }>,
  fallbackLabels: string[]
): Array<{ label: string }> {
  const metricTags = counts
    .filter((item) =>
      typeof item.value === 'string'
        ? item.value.trim().length > 0
        : typeof item.value === 'number' && Number.isFinite(item.value) && item.value >= 0
    )
    .map((item) => ({
      label: `${item.label} ${item.value}`
    }))

  if (metricTags.length > 0) {
    return metricTags
  }

  return fallbackLabels
    .map((label) => label.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((label) => ({ label }))
}

export function normalizeRichTextHtml(value: string | undefined | null, fallback = ''): string {
  const normalized = value?.trim()

  if (!normalized) {
    return fallback
  }

  if (/<[a-z][\s\S]*>/i.test(normalized)) {
    return normalized
  }

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('')
}

export function buildCssVarsStyle(
  variables: Record<string, string | undefined>
): Record<string, string> | undefined {
  const style: Record<string, string> = {}

  for (const [key, value] of Object.entries(variables)) {
    if (value) {
      style[key] = value
    }
  }

  return Object.keys(style).length > 0 ? style : undefined
}

export function normalizeCopyableUrl(value: string): string {
  const normalized = value.trim()

  if (!normalized || typeof window === 'undefined') {
    return normalized
  }

  if (/^(data:|blob:|mailto:|tel:)/i.test(normalized)) {
    return normalized
  }

  try {
    return new URL(normalized, window.location.origin).toString()
  } catch {
    return normalized
  }
}

export async function copyTextToClipboard(value: string): Promise<boolean> {
  const normalized = value.trim()

  if (typeof navigator === 'undefined' || !navigator.clipboard || !normalized) {
    return false
  }

  try {
    await navigator.clipboard.writeText(normalized)
    return true
  } catch {
    return false
  }
}

export function formatCountBadge(
  viewCount: number | undefined | null,
  suffix: string,
  fallback = `0 ${suffix}`
): string {
  const normalized = normalizeCount(viewCount, -1)

  if (normalized < 0) {
    return fallback
  }

  return `${formatCompactCount(normalized)} ${suffix}`
}
