import type { CSSProperties } from 'vue'

import {
  type PortalModuleCategoryOption,
  type PortalModuleFilterTone
} from '@/constants/public-modules'

export function parseOptionalPositiveIntegerQueryValue(value: unknown): number | undefined {
  if (Array.isArray(value)) {
    return parseOptionalPositiveIntegerQueryValue(value[0])
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined
  }

  const parsed = Number.parseInt(`${value}`, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export function serializeOptionalPositiveIntegerQueryValue(
  value: number | undefined
): string | undefined {
  return typeof value === 'number' && value > 0 ? `${value}` : undefined
}

export function resolvePortalModuleCategoryTone<TValue extends number | string>(
  categories: readonly PortalModuleCategoryOption<TValue>[],
  value: TValue | undefined,
  fallback: PortalModuleFilterTone = 'neutral'
): PortalModuleFilterTone {
  const matchedCategory = categories.find((category) => category.value === value)
  return matchedCategory?.tone ?? fallback
}

export function createPortalModuleTagToneStyle(tone: PortalModuleFilterTone): CSSProperties {
  return {
    '--portal-module-card-tag-bg': `var(--portal-module-filter-category-${tone}-bg)`,
    '--portal-module-card-tag-border': `var(--portal-module-filter-category-${tone}-border)`,
    '--portal-module-card-tag-accent': `var(--portal-module-filter-category-${tone}-accent)`
  }
}
