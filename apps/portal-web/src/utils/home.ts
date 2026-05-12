import { HOME_CONTENT_LABELS, type HOME_CONTENT_TYPE } from '@/constants/portal-business'
import { formatCountBadge } from '@/utils/content'

export function formatQuickEntryCountLabel(count: number, unit: string): string {
  return `${count}${unit}`
}

export function formatArticleViewCountBadge(
  viewCount: number | undefined | null,
  fallback = '0 阅读'
): string {
  return formatCountBadge(viewCount, '阅读', fallback)
}

export function formatFeaturedMetaLabel(
  type: HOME_CONTENT_TYPE | undefined,
  recommendLabel?: string
): string {
  const typeLabel = HOME_CONTENT_LABELS[type ?? 'article']
  const normalizedRecommendLabel = recommendLabel?.trim() || ''

  return normalizedRecommendLabel
    ? `✦ ${typeLabel} · ${normalizedRecommendLabel}`
    : `✦ ${typeLabel}`
}

export function formatFeaturedDescription(kicker?: string, summary?: string): string {
  const normalizedKicker = kicker?.trim() || ''
  const normalizedSummary = summary?.trim() || ''

  if (!normalizedKicker) {
    return normalizedSummary
  }

  if (!normalizedSummary || normalizedSummary === normalizedKicker) {
    return normalizedKicker
  }

  if (normalizedSummary.includes(normalizedKicker)) {
    return normalizedSummary
  }

  return `${normalizedKicker} · ${normalizedSummary}`
}

export function createToneTagList<TTone extends string>(
  labels: string[],
  tones: readonly TTone[],
  limit = 4
): Array<{ label: string; tone: TTone }> {
  return labels
    .map((label) => label.trim())
    .filter(Boolean)
    .slice(0, limit)
    .map((label, index) => ({
      label,
      tone: tones[index % tones.length]
    }))
}
