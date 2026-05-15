import { onScopeDispose, toValue, watchEffect, type MaybeRefOrGetter } from 'vue'

import { runtimeConfig } from '@/constants'

function normalizeTitleSegment(value: string | null | undefined): string {
  return value?.trim().replace(/\s+/g, ' ') ?? ''
}

export function formatAdminDocumentTitle(value: string | null | undefined): string {
  const title = normalizeTitleSegment(value)
  return title ? `${title} | ${runtimeConfig.appTitle}` : runtimeConfig.appTitle
}

function applyDocumentTitle(value: string | null | undefined): void {
  if (typeof document === 'undefined') {
    return
  }

  document.title = formatAdminDocumentTitle(value)
}

export function useDocumentTitle(title: MaybeRefOrGetter<string | null | undefined>): void {
  const stop = watchEffect(() => {
    applyDocumentTitle(toValue(title))
  })

  onScopeDispose(() => {
    stop()
    applyDocumentTitle('')
  })
}
