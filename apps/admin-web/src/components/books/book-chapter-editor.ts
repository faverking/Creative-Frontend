import type { BookChapterItem } from '@/api/content'

export interface EditableBookChapter extends BookChapterItem {
  uid: string
}

export interface BookChapterSourceConfig {
  origin: string
  comicId: string
  novelId: string
  otherId: string
}

export type BookChapterSourcePreset =
  | 'manual'
  | 'bilibiliComic'
  | 'novelCatalog'
  | 'externalSource'
  | 'custom'

export interface BookChapterSourceOption {
  value: BookChapterSourcePreset
  label: string
  description: string
  defaultOrigin: string
  defaultTitleTemplate: string
  preferredIdField?: keyof Omit<BookChapterSourceConfig, 'origin'>
}

export const BOOK_CHAPTER_SOURCE_OPTIONS: BookChapterSourceOption[] = [
  {
    value: 'manual',
    label: '手动维护',
    description: '适合直接录入或微调章节，不依赖外部来源标识。',
    defaultOrigin: '',
    defaultTitleTemplate: '第 {n} 章'
  },
  {
    value: 'bilibiliComic',
    label: 'Bilibili 漫画',
    description: '优先使用漫画 ID，后续若接入抓取服务，可按这个来源直接同步章节。',
    defaultOrigin: 'bilibili-comic',
    defaultTitleTemplate: '第 {n} 话',
    preferredIdField: 'comicId'
  },
  {
    value: 'novelCatalog',
    label: '小说目录源',
    description: '优先使用小说 ID，适合后续接小说目录拉取或章节增量同步。',
    defaultOrigin: 'novel-catalog',
    defaultTitleTemplate: '第 {n} 章',
    preferredIdField: 'novelId'
  },
  {
    value: 'externalSource',
    label: '其他漫画站',
    description: '保留给其他站点或脚本任务，通常配合其他 ID 与自定义 origin 使用。',
    defaultOrigin: 'external-comic-site',
    defaultTitleTemplate: '第 {n} 话',
    preferredIdField: 'otherId'
  },
  {
    value: 'custom',
    label: '自定义来源',
    description: '当前来源不是预置类型时，可继续保留自定义标识与外部 ID。',
    defaultOrigin: 'custom-source',
    defaultTitleTemplate: '第 {n} 章'
  }
]

export function createBookChapterSourceConfig(): BookChapterSourceConfig {
  return {
    origin: '',
    comicId: '',
    novelId: '',
    otherId: ''
  }
}

export function cloneBookChapterSourceConfig(
  source: Partial<BookChapterSourceConfig> | undefined
): BookChapterSourceConfig {
  return {
    origin: source?.origin ?? '',
    comicId: source?.comicId ?? '',
    novelId: source?.novelId ?? '',
    otherId: source?.otherId ?? ''
  }
}

export function normalizeBookChapterSourceConfig(
  source: Partial<BookChapterSourceConfig> | undefined
): BookChapterSourceConfig {
  const nextSource = cloneBookChapterSourceConfig(source)

  return {
    origin: nextSource.origin.trim(),
    comicId: nextSource.comicId.trim(),
    novelId: nextSource.novelId.trim(),
    otherId: nextSource.otherId.trim()
  }
}

export function createChapterUid(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createEmptyChapter(nextOrder: number): EditableBookChapter {
  return {
    uid: createChapterUid(),
    id: nextOrder,
    order: nextOrder,
    size: 0,
    title: '',
    rule: ''
  }
}

export function cloneEditableBookChapters(chapters: BookChapterItem[]): EditableBookChapter[] {
  return chapters.map((chapter, index) => ({
    uid: createChapterUid(),
    id: Number(chapter.id || index + 1),
    order: Number(chapter.order || index + 1),
    size: Number(chapter.size || 0),
    title: chapter.title ?? '',
    rule: chapter.rule ?? ''
  }))
}

export function inferBookChapterSourcePreset(origin: string): BookChapterSourcePreset {
  const normalizedOrigin = origin.trim().toLowerCase()
  if (!normalizedOrigin) {
    return 'manual'
  }

  const matchedOption = BOOK_CHAPTER_SOURCE_OPTIONS.find(
    (option) => option.defaultOrigin && option.defaultOrigin === normalizedOrigin
  )

  return matchedOption?.value ?? 'custom'
}

export function getBookChapterSourceOption(
  preset: BookChapterSourcePreset
): BookChapterSourceOption {
  return (
    BOOK_CHAPTER_SOURCE_OPTIONS.find((option) => option.value === preset) ??
    BOOK_CHAPTER_SOURCE_OPTIONS[0]
  )
}

export function resolveBookChapterSourceId(
  source: BookChapterSourceConfig,
  preset = inferBookChapterSourcePreset(source.origin)
): string {
  const normalizedSource = normalizeBookChapterSourceConfig(source)
  const preferredField = getBookChapterSourceOption(preset).preferredIdField

  if (preferredField && normalizedSource[preferredField]) {
    return normalizedSource[preferredField]
  }

  return normalizedSource.comicId || normalizedSource.novelId || normalizedSource.otherId || ''
}

function createChapterRule(
  source: BookChapterSourceConfig,
  order: number,
  preset: BookChapterSourcePreset
): string {
  const normalizedSource = normalizeBookChapterSourceConfig(source)
  const parts = [`origin=${normalizedSource.origin || preset}`, `order=${order}`]

  if (normalizedSource.comicId) {
    parts.push(`comicId=${normalizedSource.comicId}`)
  }

  if (normalizedSource.novelId) {
    parts.push(`novelId=${normalizedSource.novelId}`)
  }

  if (normalizedSource.otherId) {
    parts.push(`otherId=${normalizedSource.otherId}`)
  }

  return parts.join('; ')
}

export interface GenerateBookChapterDraftsOptions {
  count: number
  startOrder: number
  size: number
  titleTemplate?: string
}

// 后续如果接后端批量抓取接口，只需要替换这里的草稿生成规则即可。
export function buildGeneratedBookChapters(
  source: BookChapterSourceConfig,
  options: GenerateBookChapterDraftsOptions
): EditableBookChapter[] {
  const normalizedSource = normalizeBookChapterSourceConfig(source)
  const preset = inferBookChapterSourcePreset(normalizedSource.origin)
  const sourceOption = getBookChapterSourceOption(preset)
  const sourceId = resolveBookChapterSourceId(normalizedSource, preset)
  const titleTemplate = (options.titleTemplate?.trim() || sourceOption.defaultTitleTemplate).trim()
  const count = Math.max(0, Math.floor(options.count))
  const startOrder = Math.max(1, Math.floor(options.startOrder))
  const size = Math.max(0, Math.floor(options.size))

  return Array.from({ length: count }, (_, index) => {
    const order = startOrder + index
    const title = titleTemplate
      .replaceAll('{n}', String(order))
      .replaceAll('{sourceId}', sourceId || String(order))

    return {
      uid: createChapterUid(),
      id: order,
      order,
      size,
      title,
      rule: createChapterRule(normalizedSource, order, preset)
    }
  })
}

export function getNextBookChapterOrder(
  chapters: Array<Pick<BookChapterItem, 'id' | 'order'>>
): number {
  const currentMax = chapters.reduce((maxValue, chapter, index) => {
    return Math.max(maxValue, Number(chapter.order || 0), Number(chapter.id || 0), index + 1)
  }, 0)

  return currentMax + 1
}
