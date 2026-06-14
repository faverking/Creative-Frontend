import type { PublicBookChapterItemResponse, PublicBookDetailResponse } from '@/api/public-detail'

export type BookReaderMode = 'comic' | 'novel'
export type BookReaderSourceType = 'unsupported' | 'wenku8Novel' | 'wmanhuaComic' | 'komiicComic'

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
const KOMIIC_CHAPTER_ID_PATTERN = /^[A-Za-z0-9_-]+$/
const KOMIIC_CHAPTER_ID_RULE_PATTERN = /(?:^|;\s*)komiicChapterId=([^;]+)/i
const KOMIIC_QUERY_PROXY_URL = '/proxy/komiic/api/query'

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

  const komiicChapterId = resolveKomiicChapterId(chapter.rule)
  if (komiicChapterId) {
    return {
      mode: 'comic',
      proxyUrl: resolveKomiicQueryProxyUrl(),
      sourcePath: komiicChapterId,
      sourceType: 'komiicComic'
    }
  }

  const origin = detail.origin?.trim().toLocaleLowerCase() ?? ''
  if (origin.includes('komiic')) {
    return {
      mode: 'comic',
      proxyUrl: '',
      sourcePath: '',
      sourceType: 'komiicComic'
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

export function resolveKomiicChapterId(rule: string | undefined): string {
  if (!rule?.trim()) {
    return ''
  }

  const rawChapterId = rule.match(KOMIIC_CHAPTER_ID_RULE_PATTERN)?.[1]?.trim() ?? ''
  if (!rawChapterId) {
    return ''
  }

  let chapterId = rawChapterId
  try {
    chapterId = decodeURIComponent(rawChapterId)
  } catch {
    chapterId = rawChapterId
  }

  return KOMIIC_CHAPTER_ID_PATTERN.test(chapterId) ? chapterId : ''
}

export function resolveKomiicQueryProxyUrl(): string {
  return KOMIIC_QUERY_PROXY_URL
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

export async function fetchKomiicComicChapter(
  proxyUrl: string,
  chapterId: string
): Promise<BookReaderChapterContent> {
  const normalizedChapterId = chapterId.trim()
  if (!normalizedChapterId) {
    throw new Error('Komiic chapter id is required')
  }

  const imagesResponse = await fetch(proxyUrl, {
    method: 'POST',
    credentials: 'omit',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    },
    body: JSON.stringify(createKomiicImagesPayload(normalizedChapterId))
  })

  if (!imagesResponse.ok) {
    throw new Error(`Komiic chapter images request failed: ${imagesResponse.status}`)
  }

  const images = extractKomiicChapterImages(await imagesResponse.json())
  if (images.length === 0) {
    throw new Error('Komiic chapter images are empty')
  }

  const ticketsResponse = await fetch(proxyUrl, {
    method: 'POST',
    credentials: 'omit',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    },
    body: JSON.stringify(createKomiicImageTicketsPayload(images.map((image) => image.kid)))
  })

  if (!ticketsResponse.ok) {
    throw new Error(`Komiic image tickets request failed: ${ticketsResponse.status}`)
  }

  const content = buildKomiicComicChapterContent(
    images,
    extractKomiicImageTickets(await ticketsResponse.json())
  )
  if (content.items.length === 0) {
    throw new Error('Komiic chapter content is empty')
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

interface KomiicChapterImageEntry {
  height: number
  id: string
  kid: string
  width: number
}

interface KomiicImageTicketEntry {
  height: number
  kid: string
  ticket: string
  url: string
  width: number
}

function createKomiicImagesPayload(chapterId: string): Record<string, unknown> {
  return {
    operationName: 'imagesByChapterId',
    variables: {
      chapterId
    },
    query:
      'query imagesByChapterId($chapterId: ID!) {\n  imagesByChapterId(chapterId: $chapterId) {\n    id\n    kid\n    height\n    width\n    __typename\n  }\n}'
  }
}

function createKomiicImageTicketsPayload(kids: string[]): Record<string, unknown> {
  return {
    operationName: 'getImageTickets',
    variables: {
      kids
    },
    query:
      'query getImageTickets($kids: [String!]!) {\n  getImageTickets(kids: $kids) {\n    ...ImageTicketFields\n    __typename\n  }\n}\n\nfragment ImageTicketFields on ImageTicket {\n  url\n  ticket\n  kid\n  width\n  height\n  expiresAt\n  __typename\n}'
  }
}

function extractKomiicChapterImages(payload: unknown): KomiicChapterImageEntry[] {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    return []
  }

  const rawImages = payload.data.imagesByChapterId
  if (!Array.isArray(rawImages)) {
    return []
  }

  return rawImages
    .map(normalizeKomiicChapterImage)
    .filter((image): image is KomiicChapterImageEntry => Boolean(image))
}

function normalizeKomiicChapterImage(value: unknown): KomiicChapterImageEntry | null {
  if (!isRecord(value)) {
    return null
  }

  const id = String(value.id ?? '').trim()
  const kid = String(value.kid ?? '').trim()
  const height = Number(value.height ?? 0)
  const width = Number(value.width ?? 0)

  if (!id || !kid || !Number.isFinite(height) || !Number.isFinite(width)) {
    return null
  }

  return {
    height: Math.max(0, Math.floor(height)),
    id,
    kid,
    width: Math.max(0, Math.floor(width))
  }
}

function extractKomiicImageTickets(payload: unknown): Map<string, KomiicImageTicketEntry> {
  const tickets = new Map<string, KomiicImageTicketEntry>()
  if (!isRecord(payload) || !isRecord(payload.data)) {
    return tickets
  }

  const rawTickets = payload.data.getImageTickets
  if (!Array.isArray(rawTickets)) {
    return tickets
  }

  rawTickets.forEach((rawTicket) => {
    const ticket = normalizeKomiicImageTicket(rawTicket)
    if (ticket) {
      tickets.set(ticket.kid, ticket)
    }
  })

  return tickets
}

function normalizeKomiicImageTicket(value: unknown): KomiicImageTicketEntry | null {
  if (!isRecord(value)) {
    return null
  }

  const kid = String(value.kid ?? '').trim()
  const ticket = String(value.ticket ?? '').trim()
  const url = normalizeKomiicImageUrl(String(value.url ?? ''))
  const height = Number(value.height ?? 0)
  const width = Number(value.width ?? 0)

  if (!kid || !ticket || !url || !Number.isFinite(height) || !Number.isFinite(width)) {
    return null
  }

  return {
    height: Math.max(0, Math.floor(height)),
    kid,
    ticket,
    url,
    width: Math.max(0, Math.floor(width))
  }
}

function buildKomiicComicChapterContent(
  images: KomiicChapterImageEntry[],
  tickets: Map<string, KomiicImageTicketEntry>
): BookReaderChapterContent {
  const items = images.flatMap((image, index): BookReaderChapterContentItem[] => {
    const ticket = tickets.get(image.kid)
    if (!ticket) {
      return []
    }

    const pageNumber = index + 1
    return [
      {
        alt: `Komiic 漫画第 ${pageNumber} 页`,
        loading: 'lazy',
        requestHeaders: {
          'x-image-ticket': ticket.ticket
        },
        src: ticket.url,
        type: 'image'
      }
    ]
  })

  return {
    items,
    paragraphs: [],
    title: ''
  }
}

function normalizeKomiicImageUrl(value: string): string {
  const normalizedUrl = value.trim()
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
