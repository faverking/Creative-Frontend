import type { PublicBookChapterItemResponse, PublicBookDetailResponse } from '@/api/public-detail'

export type BookReaderMode = 'comic' | 'novel'
export type BookReaderSourceType = 'unsupported' | 'wenku8Novel' | 'wmanhuaComic' | 'mangaCopyComic'

export interface BookReaderSourceResolution {
  mode: BookReaderMode
  proxyUrl: string
  sourcePath: string
  sourceType: BookReaderSourceType
}

export interface BookReaderChapterContent {
  items: BookReaderChapterContentItem[]
  paragraphs: string[]
  title: string
}

export type BookReaderChapterContentItem =
  | {
      text: string
      type: 'paragraph'
    }
  | {
      alt: string
      enhance?: boolean
      loading: 'lazy'
      requestHeaders?: Record<string, string>
      src: string
      type: 'image'
    }

const WENKU8_PATH_PATTERN = /^\/novel\/(\d+)\/(\d+)\/(\d+)\.htm$/i
const WENKU8_RULE_PATTERN = /(?:^|;\s*)wenku8Path=([^;]+)/i
const WENKU8_PROXY_PREFIX = '/proxy/wenku8'
const WMANHUA_PATH_PATTERN = /^\/chapter\/(\d+)-(\d+)\.html$/i
const WMANHUA_RULE_PATTERN = /(?:^|;\s*)wmanhuaPath=([^;]+)/i
const WMANHUA_PROXY_PREFIX = '/proxy/wmanhua'
const MANGA_COPY_CHAPTER_ID_PATTERN = /^[A-Za-z0-9_-]+$/
const MANGA_COPY_CHAPTER_ID_RULE_PATTERN = /(?:^|;\s*)mangaCopyChapterId=([^;]+)/i
const MANGA_COPY_COMIC_ID_RULE_PATTERN = /(?:^|;\s*)mangaCopyComicId=([^;]+)/i
const MANGA_COPY_API_PROXY_PREFIX = '/proxy/mangacopy-api'
const MANGA_COPY_API_VERSION = '2025.08.08'

export function resolveBookReaderSource(
  detail: PublicBookDetailResponse,
  chapter: PublicBookChapterItemResponse
): BookReaderSourceResolution {
  const wenku8Path = resolveWenku8ChapterPath(chapter.rule, detail.novelId)
  if (wenku8Path) {
    return {
      mode: 'novel',
      proxyUrl: resolveWenku8ChapterProxyUrl(wenku8Path),
      sourcePath: wenku8Path,
      sourceType: 'wenku8Novel'
    }
  }

  const wmanhuaPath = resolveWmanhuaChapterPath(chapter.rule, detail.comicId)
  if (wmanhuaPath) {
    return {
      mode: 'comic',
      proxyUrl: resolveWmanhuaChapterProxyUrl(wmanhuaPath),
      sourcePath: wmanhuaPath,
      sourceType: 'wmanhuaComic'
    }
  }

  const mangaCopyChapter = resolveMangaCopyChapterIdentity(chapter.rule, detail.comicId)
  if (mangaCopyChapter) {
    return {
      mode: 'comic',
      proxyUrl: resolveMangaCopyChapterProxyUrl(mangaCopyChapter),
      sourcePath: `${mangaCopyChapter.comicId}/${mangaCopyChapter.chapterId}`,
      sourceType: 'mangaCopyComic'
    }
  }

  const origin = detail.origin?.trim().toLocaleLowerCase() ?? ''
  if (origin.includes('mangacopy')) {
    return {
      mode: 'comic',
      proxyUrl: '',
      sourcePath: '',
      sourceType: 'mangaCopyComic'
    }
  }

  if (origin.includes('wmanhua')) {
    return {
      mode: 'comic',
      proxyUrl: '',
      sourcePath: '',
      sourceType: 'wmanhuaComic'
    }
  }

  if (origin.includes('wenku8') || Boolean(detail.novelId?.trim())) {
    return {
      mode: 'novel',
      proxyUrl: '',
      sourcePath: '',
      sourceType: 'wenku8Novel'
    }
  }

  return {
    mode: detail.part === 1 ? 'comic' : 'novel',
    proxyUrl: '',
    sourcePath: '',
    sourceType: 'unsupported'
  }
}

export function resolveWenku8ChapterPath(
  rule: string | undefined,
  novelId: string | undefined
): string {
  const normalizedNovelId = novelId?.trim() ?? ''
  if (!rule?.trim() || !normalizedNovelId) {
    return ''
  }

  const rawPath = rule.match(WENKU8_RULE_PATTERN)?.[1]?.trim() ?? ''
  if (!rawPath) {
    return ''
  }

  let path = rawPath
  try {
    path = decodeURIComponent(rawPath)
  } catch {
    path = rawPath
  }

  const match = path.match(WENKU8_PATH_PATTERN)
  if (!match || match[2] !== normalizedNovelId) {
    return ''
  }

  return path
}

export function resolveWenku8ChapterProxyUrl(path: string): string {
  return `${WENKU8_PROXY_PREFIX}${path}`
}

export function resolveWmanhuaChapterPath(
  rule: string | undefined,
  comicId: string | undefined
): string {
  const normalizedComicId = comicId?.trim() ?? ''
  if (!rule?.trim() || !normalizedComicId) {
    return ''
  }

  const rawPath = rule.match(WMANHUA_RULE_PATTERN)?.[1]?.trim() ?? ''
  if (!rawPath) {
    return ''
  }

  let path = rawPath
  try {
    path = decodeURIComponent(rawPath)
  } catch {
    path = rawPath
  }

  const match = path.match(WMANHUA_PATH_PATTERN)
  if (!match || match[1] !== normalizedComicId) {
    return ''
  }

  return path
}

export function resolveWmanhuaChapterProxyUrl(path: string): string {
  return `${WMANHUA_PROXY_PREFIX}${path}`
}

export interface MangaCopyChapterIdentity {
  chapterId: string
  comicId: string
}

export function resolveMangaCopyChapterIdentity(
  rule: string | undefined,
  fallbackComicId: string | undefined
): MangaCopyChapterIdentity | null {
  if (!rule?.trim()) {
    return null
  }

  const chapterId = decodeRuleValue(rule.match(MANGA_COPY_CHAPTER_ID_RULE_PATTERN)?.[1] ?? '')
  const comicId = decodeRuleValue(
    rule.match(MANGA_COPY_COMIC_ID_RULE_PATTERN)?.[1] ?? fallbackComicId ?? ''
  )

  if (!MANGA_COPY_CHAPTER_ID_PATTERN.test(chapterId) || !comicId) {
    return null
  }

  return {
    chapterId,
    comicId
  }
}

export function resolveMangaCopyChapterProxyUrl(identity: MangaCopyChapterIdentity): string {
  return `${MANGA_COPY_API_PROXY_PREFIX}/api/v3/comic/${encodeURIComponent(
    identity.comicId
  )}/chapter/${encodeURIComponent(identity.chapterId)}`
}

export async function fetchWenku8NovelChapter(proxyUrl: string): Promise<BookReaderChapterContent> {
  const response = await fetch(proxyUrl, {
    method: 'GET',
    credentials: 'omit'
  })

  if (!response.ok) {
    throw new Error(`Wenku8 chapter request failed: ${response.status}`)
  }

  const html = await decodeWenku8HtmlResponse(response)
  const content = extractWenku8NovelChapterContent(html, resolveWenku8PathFromProxyUrl(proxyUrl))
  if (content.items.length === 0) {
    throw new Error('Wenku8 chapter content is empty')
  }

  return content
}

export async function fetchWmanhuaComicChapter(
  proxyUrl: string
): Promise<BookReaderChapterContent> {
  const response = await fetch(proxyUrl, {
    method: 'GET',
    credentials: 'omit'
  })

  if (!response.ok) {
    throw new Error(`WManhua chapter request failed: ${response.status}`)
  }

  const content = extractWmanhuaComicChapterContent(await response.text())
  if (content.items.length === 0) {
    throw new Error('WManhua chapter content is empty')
  }

  return content
}

export async function fetchMangaCopyComicChapter(
  proxyUrl: string
): Promise<BookReaderChapterContent> {
  const response = await fetch(proxyUrl, {
    method: 'GET',
    credentials: 'omit',
    headers: {
      accept: 'application/json',
      platform: '1',
      version: MANGA_COPY_API_VERSION
    }
  })

  if (!response.ok) {
    throw new Error(`MangaCopy chapter request failed: ${response.status}`)
  }

  const content = extractMangaCopyComicChapterContent(await response.json())
  if (content.items.length === 0) {
    throw new Error('MangaCopy chapter content is empty')
  }

  return content
}

export async function decodeWenku8HtmlResponse(response: Response): Promise<string> {
  const buffer = await response.arrayBuffer()
  const contentType = response.headers.get('content-type')?.toLocaleLowerCase() ?? ''
  const charset = contentType
    .match(/charset=([^;]+)/)?.[1]
    ?.trim()
    .replace(/^"|"$/g, '')

  return createTextDecoder(charset || 'gb18030').decode(buffer)
}

export function extractWenku8NovelChapterContent(
  html: string,
  chapterPath = ''
): BookReaderChapterContent {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const contentElement = document.querySelector('#content')
  if (!contentElement) {
    return {
      items: [],
      paragraphs: [],
      title: extractWenku8DocumentTitle(document)
    }
  }

  const items = extractWenku8ContentItems(contentElement, chapterPath)

  return {
    items,
    paragraphs: items.flatMap((item) => (item.type === 'paragraph' ? [item.text] : [])),
    title: extractWenku8DocumentTitle(document)
  }
}

export function extractWmanhuaComicChapterContent(html: string): BookReaderChapterContent {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const title = extractWmanhuaDocumentTitle(document)
  const imageBase = extractWmanhuaImageBase(html)
  const pageCount = extractWmanhuaPageCount(html)
  const extension = extractWmanhuaImageExtension(html)

  if (!imageBase || pageCount <= 0) {
    return {
      items: [],
      paragraphs: [],
      title
    }
  }

  const items = Array.from({ length: pageCount }, (_, index): BookReaderChapterContentItem => {
    const pageNumber = index + 1

    return {
      alt: title ? `${title} 第 ${pageNumber} 页` : `漫画第 ${pageNumber} 页`,
      loading: 'lazy',
      src: `${imageBase}${pageNumber}${extension}`,
      type: 'image'
    }
  })

  return {
    items,
    paragraphs: [],
    title
  }
}

interface MangaCopyImageEntry {
  url: string
}

function extractMangaCopyComicChapterContent(payload: unknown): BookReaderChapterContent {
  const emptyContent = {
    items: [],
    paragraphs: [],
    title: ''
  }

  if (!isRecord(payload) || !isRecord(payload.results) || !isRecord(payload.results.chapter)) {
    return emptyContent
  }

  const title = normalizeWenku8Line(String(payload.results.chapter.name ?? ''))
  const rawContents = payload.results.chapter.contents
  if (!Array.isArray(rawContents)) {
    return {
      ...emptyContent,
      title
    }
  }

  const images = rawContents
    .map(normalizeMangaCopyImageEntry)
    .filter((image): image is MangaCopyImageEntry => Boolean(image))
  const items = images.map((image, index): BookReaderChapterContentItem => {
    const pageNumber = index + 1

    return {
      alt: title ? `${title} 第 ${pageNumber} 页` : `MangaCopy 漫画第 ${pageNumber} 页`,
      enhance: false,
      loading: 'lazy',
      src: image.url,
      type: 'image'
    }
  })

  return {
    items,
    paragraphs: [],
    title
  }
}

function normalizeMangaCopyImageEntry(value: unknown): MangaCopyImageEntry | null {
  if (!isRecord(value)) {
    return null
  }

  const url = normalizeMangaCopyImageUrl(String(value.url ?? ''))
  return url ? { url } : null
}

function normalizeMangaCopyImageUrl(value: string): string {
  const normalizedUrl = value.trim().replace('c800x.jpg', 'c1500x.jpg')
  if (!normalizedUrl) {
    return ''
  }

  try {
    const url = new URL(normalizedUrl)
    return /^https?:$/.test(url.protocol) ? url.toString() : ''
  } catch {
    return ''
  }
}

function decodeRuleValue(value: string): string {
  const rawValue = value.trim()
  if (!rawValue) {
    return ''
  }

  try {
    return decodeURIComponent(rawValue).trim()
  } catch {
    return rawValue
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function createTextDecoder(encoding: string): TextDecoder {
  try {
    return new TextDecoder(encoding)
  } catch {
    return new TextDecoder('gb18030')
  }
}

function extractWenku8DocumentTitle(document: Document): string {
  const heading = document.querySelector('h1, .title, #title')?.textContent?.trim() ?? ''
  if (heading) {
    return normalizeWenku8Line(heading)
  }

  const title = document.querySelector('title')?.textContent ?? ''
  return normalizeWenku8Line(title.replace(/_.*$/, ''))
}

function extractWmanhuaDocumentTitle(document: Document): string {
  const heading = document.querySelector('h1, .chapter-title, .title')?.textContent?.trim() ?? ''
  if (heading) {
    return normalizeWenku8Line(heading)
  }

  const title = document.querySelector('title')?.textContent ?? ''
  return normalizeWenku8Line(title.replace(/[-_].*$/, ''))
}

function extractWmanhuaImageBase(html: string): string {
  const rawBase = html.match(/\bvar\s+pasd\s*=\s*(["'])(.*?)\1/i)?.[2]?.trim() ?? ''
  if (!rawBase) {
    return ''
  }

  try {
    const url = new URL(rawBase)
    if (!/^https?:$/.test(url.protocol)) {
      return ''
    }

    return url.toString().endsWith('/') ? url.toString() : `${url.toString()}/`
  } catch {
    return ''
  }
}

function extractWmanhuaPageCount(html: string): number {
  const evalValue = html.match(/\bvar\s+num\s*=\s*eval\(\s*(["'])(\d+)\1\s*\)/i)?.[2]
  const directValue = html.match(/\bvar\s+num\s*=\s*(\d+)/i)?.[1]
  const pageCount = Number(evalValue ?? directValue ?? 0)

  return Number.isFinite(pageCount) ? Math.max(0, Math.floor(pageCount)) : 0
}

function extractWmanhuaImageExtension(html: string): string {
  return html.match(/pasd\s*\+\s*i\s*\+\s*(["'])(\.[a-z0-9]+)\1/i)?.[2] ?? '.webp'
}

function extractWenku8ContentItems(
  contentElement: Element,
  chapterPath: string
): BookReaderChapterContentItem[] {
  const items: BookReaderChapterContentItem[] = []
  let textBuffer = ''

  function appendText(value: string): void {
    textBuffer = `${textBuffer}${value}`
  }

  function flushText(): void {
    const lines = normalizeWenku8Paragraphs(textBuffer)
    lines.forEach((text) => {
      items.push({
        text,
        type: 'paragraph'
      })
    })
    textBuffer = ''
  }

  function visit(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      appendText(node.textContent ?? '')
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return
    }

    const element = node as Element
    const tagName = element.tagName.toLocaleLowerCase()

    if (tagName === 'br') {
      appendText('\n')
      return
    }

    if (tagName === 'img') {
      flushText()
      const imageSrc = resolveWenku8ContentImageSrc(element, chapterPath)
      if (imageSrc) {
        items.push({
          alt: normalizeWenku8Line(element.getAttribute('alt') ?? '') || '章节插图',
          loading: 'lazy',
          src: imageSrc,
          type: 'image'
        })
      }
      return
    }

    Array.from(element.childNodes).forEach(visit)

    if (isWenku8BlockElement(tagName)) {
      appendText('\n')
    }
  }

  Array.from(contentElement.childNodes).forEach(visit)
  flushText()

  return items
}

function resolveWenku8ContentImageSrc(element: Element, chapterPath: string): string {
  const rawSrc =
    element.getAttribute('data-src')?.trim() ||
    element.getAttribute('data-original')?.trim() ||
    element.getAttribute('src')?.trim() ||
    ''
  if (!rawSrc || /^(?:javascript|data):/i.test(rawSrc)) {
    return ''
  }

  if (rawSrc.startsWith(WENKU8_PROXY_PREFIX)) {
    return rawSrc
  }

  try {
    const baseUrl = new URL(chapterPath || '/', 'https://www.wenku8.net')
    const resolvedUrl = new URL(rawSrc, baseUrl)
    if (!/^https?:$/.test(resolvedUrl.protocol)) {
      return ''
    }

    if (isWenku8DocumentHost(resolvedUrl.hostname)) {
      return `${WENKU8_PROXY_PREFIX}${resolvedUrl.pathname}${resolvedUrl.search}`
    }

    return resolvedUrl.toString()
  } catch {
    return ''
  }
}

function resolveWenku8PathFromProxyUrl(proxyUrl: string): string {
  return proxyUrl.startsWith(WENKU8_PROXY_PREFIX) ? proxyUrl.slice(WENKU8_PROXY_PREFIX.length) : ''
}

function isWenku8DocumentHost(hostname: string): boolean {
  return /^(?:www\.)?wenku8\.(?:net|com)$/i.test(hostname)
}

function isWenku8BlockElement(tagName: string): boolean {
  return ['article', 'div', 'li', 'p', 'section'].includes(tagName)
}

function normalizeWenku8Paragraphs(text: string): string[] {
  return text
    .split(/\r?\n+/)
    .map(normalizeWenku8Line)
    .filter((line) => line.length > 0 && !isWenku8BoilerplateLine(line))
}

function normalizeWenku8Line(value: string): string {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isWenku8BoilerplateLine(line: string): boolean {
  return [
    /^上一章/i,
    /^下一章/i,
    /返回目录/,
    /返回书页/,
    /轻小说文库/i,
    /www\.wenku8\.net/i,
    /本书来自/i,
    /手机用户/i
  ].some((pattern) => pattern.test(line))
}
