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
  | 'wenku8Novel'
  | 'wmanhuaComic'

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
    description: '适合直接录入或微调章节，不依赖外部来源抓取和来源 ID。',
    defaultOrigin: '',
    defaultTitleTemplate: '第 {n} 章'
  },
  {
    value: 'wenku8Novel',
    label: 'Wenku8 小说',
    description: '来源标识填写 Wenku8 小说页面地址或域名，并只维护小说 ID。',
    defaultOrigin: 'https://www.wenku8.net',
    defaultTitleTemplate: '第 {n} 章',
    preferredIdField: 'novelId'
  },
  {
    value: 'wmanhuaComic',
    label: 'WManhua 漫画',
    description: '来源标识填写 WManhua 漫画页面地址或域名，并只维护漫画 ID。',
    defaultOrigin: 'https://www.wmanhua.com',
    defaultTitleTemplate: '第 {n} 话',
    preferredIdField: 'comicId'
  }
]

const BOOK_CHAPTER_SOURCE_PROXY_TARGETS: Partial<Record<BookChapterSourcePreset, string>> = {
  wenku8Novel: 'wenku8',
  wmanhuaComic: 'wmanhua'
}

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
  const origin = nextSource.origin.trim()
  const preset = inferBookChapterSourcePreset(origin)

  if (preset === 'wmanhuaComic') {
    return {
      origin,
      comicId: nextSource.comicId.trim(),
      novelId: '',
      otherId: ''
    }
  }

  if (preset === 'wenku8Novel') {
    return {
      origin,
      comicId: '',
      novelId: nextSource.novelId.trim(),
      otherId: ''
    }
  }

  return {
    origin,
    comicId: '',
    novelId: '',
    otherId: ''
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

  if (normalizedOrigin.includes('wenku8')) {
    return 'wenku8Novel'
  }

  if (normalizedOrigin.includes('wmanhua')) {
    return 'wmanhuaComic'
  }

  return 'manual'
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

export function isAutoBookChapterSourcePreset(preset: BookChapterSourcePreset): boolean {
  return preset !== 'manual'
}

export function resolveBookChapterSourceUrl(source: BookChapterSourceConfig): string {
  const origin = source.origin.trim()
  if (!origin) {
    return ''
  }

  if (/^https?:\/\//i.test(origin)) {
    return origin
  }

  return `https://${origin}`
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

export async function buildBookChaptersFromSource(
  source: BookChapterSourceConfig,
  preset = inferBookChapterSourcePreset(source.origin)
): Promise<EditableBookChapter[]> {
  if (preset === 'wenku8Novel') {
    return buildWenku8BookChaptersFromSource(source)
  }

  if (preset === 'wmanhuaComic') {
    return buildWmanhuaBookChaptersFromSource(source)
  }

  return []
}

async function buildWenku8BookChaptersFromSource(
  source: BookChapterSourceConfig
): Promise<EditableBookChapter[]> {
  const normalizedSource = normalizeBookChapterSourceConfig(source)
  const novelId = normalizedSource.novelId.trim()
  if (!novelId) {
    return []
  }

  const bookUrl = resolveWenku8BookUrl(normalizedSource)
  const bookRequestUrl = resolveBookChapterRequestUrl(bookUrl, 'wenku8Novel')
  const bookResponse = await fetch(bookRequestUrl, {
    method: 'GET',
    credentials: 'omit'
  })

  if (!bookResponse.ok) {
    throw new Error(`Wenku8 book request failed: ${bookResponse.status}`)
  }

  const bookHtml = await decodeSourceHtml(bookResponse, 'wenku8Novel')
  const catalogUrl = resolveWenku8CatalogUrl(bookHtml, bookUrl)
  if (!catalogUrl) {
    return []
  }

  const catalogRequestUrl = resolveBookChapterRequestUrl(catalogUrl, 'wenku8Novel')
  const catalogResponse = await fetch(catalogRequestUrl, {
    method: 'GET',
    credentials: 'omit'
  })

  if (!catalogResponse.ok) {
    throw new Error(`Wenku8 catalog request failed: ${catalogResponse.status}`)
  }

  const catalogHtml = await decodeSourceHtml(catalogResponse, 'wenku8Novel')
  return extractWenku8CatalogChapters(catalogHtml, catalogUrl)
}

async function buildWmanhuaBookChaptersFromSource(
  source: BookChapterSourceConfig
): Promise<EditableBookChapter[]> {
  const normalizedSource = normalizeBookChapterSourceConfig(source)
  const comicId = normalizedSource.comicId.trim()
  if (!comicId) {
    return []
  }

  const comicUrl = resolveWmanhuaComicUrl(normalizedSource)
  const comicRequestUrl = resolveBookChapterRequestUrl(comicUrl, 'wmanhuaComic')
  const comicResponse = await fetch(comicRequestUrl, {
    method: 'POST',
    credentials: 'omit'
  })

  if (!comicResponse.ok) {
    throw new Error(`WManhua comic request failed: ${comicResponse.status}`)
  }

  const chapters = extractWmanhuaChapters(await comicResponse.json())
  if (chapters.length === 0) {
    return []
  }

  return chapters.map((chapter, index) => {
    const order = index + 1

    return {
      uid: createChapterUid(),
      id: order,
      order,
      size: Number(chapter.chapterNum || 0),
      title: chapter.chapterName,
      rule: `wmanhuaPath=${resolveWmanhuaChapterPath(normalizedSource, chapter.id)}`
    }
  })
}

function resolveBookChapterRequestUrl(
  sourceUrl: string,
  preset: BookChapterSourcePreset
): string {
  if (!sourceUrl) {
    return ''
  }

  const proxyTarget = BOOK_CHAPTER_SOURCE_PROXY_TARGETS[preset]
  if (!proxyTarget) {
    return sourceUrl
  }

  const parsedSourceUrl = new URL(sourceUrl)
  return `/proxy/${proxyTarget}${parsedSourceUrl.pathname}${parsedSourceUrl.search}`
}

async function decodeSourceHtml(
  response: Response,
  preset: BookChapterSourcePreset
): Promise<string> {
  if (preset !== 'wenku8Novel') {
    return response.text()
  }

  const buffer = await response.arrayBuffer()
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
  const charset = contentType.match(/charset=([^;]+)/)?.[1]?.trim().replace(/^"|"$/g, '')
  const decoder = new TextDecoder(charset || 'gb18030')
  return decoder.decode(buffer)
}

function resolveWenku8BookUrl(source: BookChapterSourceConfig): string {
  const sourceUrl = resolveBookChapterSourceUrl(source)
  const novelId = source.novelId.trim()
  if (!sourceUrl || !novelId) {
    return ''
  }

  return new URL(`/book/${novelId}.htm`, sourceUrl).toString()
}

function resolveWmanhuaComicUrl(source: BookChapterSourceConfig): string {
  const sourceUrl = resolveBookChapterSourceUrl(source)
  const comicId = source.comicId.trim()
  if (!sourceUrl || !comicId) {
    return ''
  }

  return new URL(`/comic/${comicId}`, sourceUrl).toString()
}

function resolveWmanhuaChapterPath(source: BookChapterSourceConfig, chapterId: string): string {
  const comicId = source.comicId.trim()
  if (!comicId || !chapterId) {
    return ''
  }

  return `/chapter/${comicId}-${chapterId}.html`
}

function resolveWenku8CatalogUrl(bookHtml: string, bookUrl: string): string {
  const catalogHref =
    Array.from(bookHtml.matchAll(/<a\b[^>]*href=(["'])(.*?)\1[^>]*>/gi))
      .map((match) => decodeHtmlEntities(match[2]?.trim() ?? ''))
      .find((href) => /\/novel\/[^"']+\/index\.htm$/i.test(href)) ?? ''

  return catalogHref ? new URL(catalogHref, bookUrl).toString() : ''
}

function extractWenku8CatalogChapters(
  catalogHtml: string,
  catalogUrl: string
): EditableBookChapter[] {
  const entries: Array<{ href: string; title: string; volumeTitle: string }> = []
  const tokenPattern =
    /<td\b[^>]*class=(["'])[^"']*\bvcss\b[^"']*\1[^>]*>([\s\S]*?)<\/td>|<a\b[^>]*href=(["'])(.*?)\3[^>]*>([\s\S]*?)<\/a>/gi
  let activeVolumeTitle = ''

  Array.from(catalogHtml.matchAll(tokenPattern)).forEach((match) => {
    const volumeContent = match[2]
    if (typeof volumeContent === 'string') {
      const nextVolumeTitle = normalizeChapterTitle(volumeContent)
      if (nextVolumeTitle) {
        activeVolumeTitle = nextVolumeTitle
      }
      return
    }

    const href = decodeHtmlEntities(match[4]?.trim() ?? '')
    const chapterTitle = normalizeChapterTitle(match[5] ?? '')
    if (!isWenku8ChapterLink(href, catalogUrl) || !isValidWenku8ChapterTitle(chapterTitle)) {
      return
    }

    entries.push({
      href,
      title: chapterTitle,
      volumeTitle: activeVolumeTitle
    })
  })

  return entries.map((entry, index) => {
    const order = index + 1
    const chapterPath = new URL(entry.href, catalogUrl).pathname

    return {
      uid: createChapterUid(),
      id: order,
      order,
      size: 0,
      title: joinWenku8ChapterTitle(entry.volumeTitle, entry.title),
      rule: `wenku8Path=${chapterPath}`
    }
  })
}

function isWenku8ChapterLink(href: string, catalogUrl: string): boolean {
  if (!href) {
    return false
  }

  const chapterUrl = new URL(href, catalogUrl)
  const catalogDirectory = new URL('.', catalogUrl).pathname

  if (!chapterUrl.pathname.startsWith(catalogDirectory)) {
    return false
  }

  const chapterFileName = chapterUrl.pathname.slice(catalogDirectory.length)
  return /^\d+\.htm$/i.test(chapterFileName)
}

function isValidWenku8ChapterTitle(title: string): boolean {
  if (!title || title.length > 80) {
    return false
  }

  return !['返回上一页', '返回书页', '上一页', '目录', '小说目录'].includes(title)
}

function joinWenku8ChapterTitle(volumeTitle: string, chapterTitle: string): string {
  if (!volumeTitle) {
    return chapterTitle
  }

  if (chapterTitle.includes(volumeTitle)) {
    return chapterTitle
  }

  return `${volumeTitle} ${chapterTitle}`
}

interface WmanhuaChapterEntry {
  chapterName: string
  chapterNum: number
  id: string
}

function extractWmanhuaChapters(payload: unknown): WmanhuaChapterEntry[] {
  if (!isRecord(payload) || Number(payload.code) !== 0 || !isRecord(payload.data)) {
    return []
  }

  const rawChapters = payload.data.chapters
  if (!Array.isArray(rawChapters)) {
    return []
  }

  return rawChapters
    .map(normalizeWmanhuaChapterEntry)
    .filter((chapter): chapter is WmanhuaChapterEntry => Boolean(chapter))
    .sort((current, next) => Number(current.id) - Number(next.id))
}

function normalizeWmanhuaChapterEntry(value: unknown): WmanhuaChapterEntry | null {
  if (!isRecord(value)) {
    return null
  }

  const id = String(value.id ?? '').trim()
  const chapterName = normalizeChapterTitle(String(value.chapterName ?? ''))
  const chapterNum = Number(value.chapterNum ?? 0)

  if (!id || !chapterName || !Number.isFinite(chapterNum)) {
    return null
  }

  return {
    chapterName,
    chapterNum: Math.max(0, Math.floor(chapterNum)),
    id
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeChapterTitle(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
}

export function getNextBookChapterOrder(
  chapters: Array<Pick<BookChapterItem, 'id' | 'order'>>
): number {
  const currentMax = chapters.reduce((maxValue, chapter, index) => {
    return Math.max(maxValue, Number(chapter.order || 0), Number(chapter.id || 0), index + 1)
  }, 0)

  return currentMax + 1
}
