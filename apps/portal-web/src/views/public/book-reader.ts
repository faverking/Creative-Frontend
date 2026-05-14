import type { PublicBookChapterItemResponse, PublicBookDetailResponse } from '@/api/public-detail'

export type BookReaderMode = 'comic' | 'novel'
export type BookReaderSourceType = 'bilibiliManga' | 'unsupported' | 'wenku8Novel'

export interface BookReaderSourceResolution {
  mode: BookReaderMode
  proxyUrl: string
  sourceType: BookReaderSourceType
  wenku8Path: string
}

export interface Wenku8NovelChapterContent {
  items: Wenku8NovelChapterContentItem[]
  paragraphs: string[]
  title: string
}

export type Wenku8NovelChapterContentItem =
  | {
      text: string
      type: 'paragraph'
    }
  | {
      alt: string
      src: string
      type: 'image'
    }

const WENKU8_PATH_PATTERN = /^\/novel\/(\d+)\/(\d+)\/(\d+)\.htm$/i
const WENKU8_RULE_PATTERN = /(?:^|;\s*)wenku8Path=([^;]+)/i
const WENKU8_PROXY_PREFIX = '/proxy/wenku8'

export function resolveBookReaderSource(
  detail: PublicBookDetailResponse,
  chapter: PublicBookChapterItemResponse
): BookReaderSourceResolution {
  const wenku8Path = resolveWenku8ChapterPath(chapter.rule, detail.novelId)
  if (wenku8Path) {
    return {
      mode: 'novel',
      proxyUrl: resolveWenku8ChapterProxyUrl(wenku8Path),
      sourceType: 'wenku8Novel',
      wenku8Path
    }
  }

  const origin = detail.origin?.trim().toLocaleLowerCase() ?? ''
  if (origin.includes('bilibili') || Boolean(detail.comicId?.trim())) {
    return {
      mode: 'comic',
      proxyUrl: '',
      sourceType: 'bilibiliManga',
      wenku8Path: ''
    }
  }

  if (origin.includes('wenku8') || Boolean(detail.novelId?.trim())) {
    return {
      mode: 'novel',
      proxyUrl: '',
      sourceType: 'wenku8Novel',
      wenku8Path: ''
    }
  }

  return {
    mode: detail.part === 1 ? 'comic' : 'novel',
    proxyUrl: '',
    sourceType: 'unsupported',
    wenku8Path: ''
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

export async function fetchWenku8NovelChapter(
  proxyUrl: string
): Promise<Wenku8NovelChapterContent> {
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
): Wenku8NovelChapterContent {
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

function extractWenku8ContentItems(
  contentElement: Element,
  chapterPath: string
): Wenku8NovelChapterContentItem[] {
  const items: Wenku8NovelChapterContentItem[] = []
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
