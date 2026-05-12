import {
  ARTICLE_STATUS_ENUMS,
  ARTICLE_THEME_OPTIONS,
  BUSINESS_LABELS_BY_TARGET_TYPE,
  IMAGE_THEME_OPTIONS,
  TOPIC_SECTION_OPTIONS,
  TOPIC_SERIES_OPTIONS,
  USER_ROLE_LABEL_MAP,
  type ArticleStatus,
  type ContentThemeOption,
  type UserRoleValue
} from '@/constants'

const DATE_TIME_LOCALE = 'zh-CN'
const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour12: false
}

// 页面展示统一走这里，避免每个页面各自处理 Date 和文案回退。
export function formatDateTime(value?: string | number | Date | null): string {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString(DATE_TIME_LOCALE, DATE_TIME_OPTIONS)
}

export function formatOptionLabel(
  options: ContentThemeOption[],
  value: number | null | undefined,
  fallback = '-'
): string {
  if (value === undefined || value === null) {
    return fallback
  }

  return options.find((option) => option.value === value)?.label ?? fallback
}

export function formatArticleStatusLabel(status: ArticleStatus): string {
  return ARTICLE_STATUS_ENUMS[status] ?? status
}

export function formatArticleThemeLabel(value: number | null | undefined): string {
  return formatOptionLabel(ARTICLE_THEME_OPTIONS, value)
}

export function formatImageThemeLabel(value: number | null | undefined): string {
  return formatOptionLabel(IMAGE_THEME_OPTIONS, value)
}

export function formatTopicSeriesLabel(value: number | null | undefined): string {
  return formatOptionLabel(TOPIC_SERIES_OPTIONS, value)
}

export function formatTopicSectionLabel(value: number | null | undefined): string {
  return formatOptionLabel(TOPIC_SECTION_OPTIONS, value)
}

export function formatBusinessLabelByTargetType(
  value: keyof typeof BUSINESS_LABELS_BY_TARGET_TYPE
): string {
  return BUSINESS_LABELS_BY_TARGET_TYPE[value]
}

function normalizeUserRole(role: string): UserRoleValue | string {
  return role.trim().toLowerCase().replace(/-/g, '_')
}

export function getUserRoleLabel(role: string | null | undefined): string {
  if (!role) {
    return USER_ROLE_LABEL_MAP.user
  }

  const normalizedRole = normalizeUserRole(role)
  return USER_ROLE_LABEL_MAP[normalizedRole as UserRoleValue] ?? role.trim()
}
