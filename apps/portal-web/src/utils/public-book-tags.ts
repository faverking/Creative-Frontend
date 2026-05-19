export interface PublicBookStyleLike {
  name?: string | null
}

export interface PublicBookDisplayTagOptions {
  tags?: Array<string | null | undefined>
  styles?: PublicBookStyleLike[]
  excludedLabels?: Array<string | null | undefined>
  limit?: number
}

export function normalizePublicBookTagLabel(value: string): string {
  return value.trim().toLocaleLowerCase()
}

export function uniquePublicBookTagLabels(values: Array<string | null | undefined>): string[] {
  const labels: string[] = []
  const seenKeys = new Set<string>()

  values.forEach((value) => {
    const label = value?.trim() ?? ''
    const labelKey = normalizePublicBookTagLabel(label)

    if (!labelKey || seenKeys.has(labelKey)) {
      return
    }

    seenKeys.add(labelKey)
    labels.push(label)
  })

  return labels
}

export function resolvePublicBookDisplayTagLabels({
  tags,
  styles,
  excludedLabels,
  limit
}: PublicBookDisplayTagOptions): string[] {
  const excludedKeys = new Set(
    (excludedLabels ?? [])
      .map((label) => normalizePublicBookTagLabel(label?.trim() ?? ''))
      .filter(Boolean)
  )
  const labels = uniquePublicBookTagLabels([
    ...(tags ?? []),
    ...(styles ?? []).map((style) => style.name)
  ]).filter((label) => !excludedKeys.has(normalizePublicBookTagLabel(label)))

  return typeof limit === 'number' ? labels.slice(0, limit) : labels
}
