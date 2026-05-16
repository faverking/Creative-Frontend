function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function escapeRichTextHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const AI_RICH_TEXT_ALLOWED_TAGS = new Set([
  'A',
  'BLOCKQUOTE',
  'BR',
  'H2',
  'H3',
  'HR',
  'LI',
  'OL',
  'P',
  'STRONG',
  'UL'
])

const AI_RICH_TEXT_BLOCK_TAGS = new Set(['BLOCKQUOTE', 'H2', 'H3', 'HR', 'OL', 'P', 'UL'])

function createRichTextDocument(html: string): Document | null {
  if (typeof DOMParser === 'undefined') {
    return null
  }

  const parser = new DOMParser()
  return parser.parseFromString(html, 'text/html')
}

function uniqueStringItems(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function tryCreateHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

function parsePositiveInteger(value: string | null | undefined): number | null {
  const parsedValue = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null
}

function parseDurationToSeconds(value: string | null | undefined): number | null {
  const normalizedValue = value?.trim() ?? ''
  if (!normalizedValue) {
    return null
  }

  if (/^\d+$/.test(normalizedValue)) {
    return Number.parseInt(normalizedValue, 10)
  }

  const matches = normalizedValue.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i)
  if (!matches) {
    return null
  }

  const hours = Number.parseInt(matches[1] ?? '0', 10)
  const minutes = Number.parseInt(matches[2] ?? '0', 10)
  const seconds = Number.parseInt(matches[3] ?? '0', 10)
  const totalSeconds = hours * 60 * 60 + minutes * 60 + seconds

  return totalSeconds > 0 ? totalSeconds : null
}

function extractIframeSource(input: string): string {
  const trimmedInput = input.trim()
  if (!trimmedInput.includes('<iframe')) {
    return ''
  }

  const doc = createRichTextDocument(trimmedInput)
  return doc?.querySelector('iframe')?.getAttribute('src')?.trim() ?? ''
}

function isYouTubeHost(hostname: string): boolean {
  return (
    hostname === 'youtu.be' ||
    hostname.endsWith('.youtu.be') ||
    hostname === 'youtube.com' ||
    hostname.endsWith('.youtube.com') ||
    hostname === 'youtube-nocookie.com' ||
    hostname.endsWith('.youtube-nocookie.com')
  )
}

function isBilibiliHost(hostname: string): boolean {
  return (
    hostname === 'bilibili.com' ||
    hostname.endsWith('.bilibili.com') ||
    hostname === 'player.bilibili.com' ||
    hostname === 'b23.tv' ||
    hostname.endsWith('.b23.tv') ||
    hostname === 'bili2233.cn' ||
    hostname.endsWith('.bili2233.cn')
  )
}

function normalizeYouTubeVideo(url: URL): NormalizedRichTextEmbeddedVideo | null {
  const pathname = url.pathname.replace(/\/+$/, '')
  const pathSegments = pathname.split('/').filter(Boolean)
  let videoId = ''

  if (url.hostname.includes('youtu.be')) {
    videoId = pathSegments[0] ?? ''
  } else if (pathSegments[0] === 'watch') {
    videoId = url.searchParams.get('v')?.trim() ?? ''
  } else if (
    pathSegments[0] === 'embed' ||
    pathSegments[0] === 'shorts' ||
    pathSegments[0] === 'live'
  ) {
    videoId = pathSegments[1] ?? ''
  } else {
    videoId = url.searchParams.get('v')?.trim() ?? ''
  }

  if (!videoId) {
    return null
  }

  const startTime =
    parseDurationToSeconds(url.searchParams.get('t')) ??
    parseDurationToSeconds(url.searchParams.get('start'))
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1'
  })

  if (startTime) {
    params.set('start', String(startTime))
  }

  return {
    platform: 'youtube',
    platformLabel: 'YouTube',
    embedUrl: `https://www.youtube.com/embed/${videoId}?${params.toString()}`
  }
}

function extractBilibiliVideoReference(
  url: URL
): { aid?: string; bvid?: string; page: number } | null {
  const pathname = url.pathname.replace(/\/+$/, '')
  const pathSegments = pathname.split('/').filter(Boolean)
  const page = parsePositiveInteger(url.searchParams.get('page') ?? url.searchParams.get('p')) ?? 1
  const pathMatch = pathname.match(/\/video\/(BV[0-9A-Za-z]+|av\d+)/i)
  const rawReference = pathMatch?.[1] ?? pathSegments[0] ?? ''

  if (/^BV[0-9A-Za-z]+$/i.test(rawReference)) {
    return {
      bvid: rawReference,
      page
    }
  }

  if (/^av\d+$/i.test(rawReference)) {
    return {
      aid: rawReference.replace(/^av/i, ''),
      page
    }
  }

  const bvid = url.searchParams.get('bvid')?.trim() ?? ''
  if (/^BV[0-9A-Za-z]+$/i.test(bvid)) {
    return {
      bvid,
      page
    }
  }

  const aid = url.searchParams.get('aid')?.trim() ?? ''
  if (/^\d+$/.test(aid)) {
    return {
      aid,
      page
    }
  }

  return null
}

function normalizeBilibiliVideo(url: URL): NormalizedRichTextEmbeddedVideo | null {
  const reference = extractBilibiliVideoReference(url)
  if (!reference) {
    return null
  }

  const params = new URLSearchParams({
    page: String(reference.page),
    high_quality: '1',
    as_wide: '1'
  })

  if (reference.bvid) {
    params.set('bvid', reference.bvid)
  } else if (reference.aid) {
    params.set('aid', reference.aid)
  } else {
    return null
  }

  return {
    platform: 'bilibili',
    platformLabel: 'Bilibili',
    embedUrl: `https://player.bilibili.com/player.html?${params.toString()}`
  }
}

function normalizeIframeNode(iframe: HTMLIFrameElement): void {
  const normalizedVideo = normalizeRichTextEmbeddedVideoInput(
    iframe.getAttribute('src')?.trim() || iframe.outerHTML
  )

  if (!normalizedVideo) {
    iframe.remove()
    return
  }

  iframe.setAttribute('src', normalizedVideo.embedUrl)
  iframe.setAttribute('class', 'ql-video')
  iframe.setAttribute('frameborder', '0')
  iframe.setAttribute('allowfullscreen', 'true')
  iframe.setAttribute(
    'allow',
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
  )
  iframe.setAttribute('loading', 'lazy')
  iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
  iframe.removeAttribute('width')
  iframe.removeAttribute('height')
}

function guessFileExtension(mimeType: string): string {
  const normalizedMimeType = mimeType.toLowerCase()

  if (normalizedMimeType.includes('png')) {
    return 'png'
  }

  if (normalizedMimeType.includes('webp')) {
    return 'webp'
  }

  if (normalizedMimeType.includes('gif')) {
    return 'gif'
  }

  return 'jpg'
}

function createSafeFileName(prefix: string, index: number, mimeType: string): string {
  const normalizedPrefix =
    prefix.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'rich-text-image'
  return `${normalizedPrefix}-${index}.${guessFileExtension(mimeType)}`
}

async function dataUrlToFile(source: string, prefix: string, index: number): Promise<File> {
  const matches = source.match(/^data:(.*?);base64,(.*)$/)
  if (!matches) {
    throw new Error('无法解析富文本中的图片数据。')
  }

  const mimeType = matches[1] || 'image/jpeg'
  const encodedPayload = matches[2] || ''
  const binary = atob(encodedPayload)
  const bytes = new Uint8Array(binary.length)

  for (let currentIndex = 0; currentIndex < binary.length; currentIndex += 1) {
    bytes[currentIndex] = binary.charCodeAt(currentIndex)
  }

  return new File([bytes], createSafeFileName(prefix, index, mimeType), {
    type: mimeType
  })
}

async function blobUrlToFile(source: string, prefix: string, index: number): Promise<File> {
  const response = await fetch(source)
  if (!response.ok) {
    throw new Error('无法读取富文本中的本地图片，请重新粘贴后再试。')
  }

  const blob = await response.blob()
  const mimeType = blob.type || 'image/jpeg'
  return new File([blob], createSafeFileName(prefix, index, mimeType), {
    type: mimeType
  })
}

function shouldUploadEmbeddedImage(source: string): boolean {
  return source.startsWith('data:') || source.startsWith('blob:')
}

function readImageMediaId(node: HTMLImageElement): string {
  return node.getAttribute('data-media-id')?.trim() ?? ''
}

function inferMediaIdFromImageSource(source: string): string {
  const trimmedSource = source.trim()
  const match = trimmedSource.match(
    /(?:^|\/)media\/([a-f0-9]{24})(?:\/(?:preview|download|detail)|[/?#]|$)/i
  )

  return match?.[1] ?? ''
}

function markRichTextImageNode(
  node: HTMLImageElement,
  nextSource: string,
  nextMediaId?: string
): void {
  node.setAttribute('src', nextSource)
  node.setAttribute('loading', 'lazy')
  // 富文本图片统一补占位标记，后续预览可再按 data-media-id 换取最新地址。
  node.setAttribute('data-media-placeholder', 'rich-text-image')

  if (nextMediaId) {
    node.setAttribute('data-media-id', nextMediaId)
    return
  }

  node.removeAttribute('data-media-id')
}

function uniquePreparedImages(images: PreparedRichTextImage[]): PreparedRichTextImage[] {
  const imageMap = new Map<string, PreparedRichTextImage>()

  images.forEach((item) => {
    const key = item.mediaId ? `media:${item.mediaId}` : `url:${item.url}`
    imageMap.set(key, item)
  })

  return Array.from(imageMap.values())
}

function isElementNode(node: ChildNode): node is Element {
  return node.nodeType === Node.ELEMENT_NODE
}

function getMeaningfulChildNodes(element: Element): ChildNode[] {
  return Array.from(element.childNodes).filter((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent ?? '').trim().length > 0
    }

    if (!isElementNode(node)) {
      return false
    }

    return node.tagName !== 'BR'
  })
}

function isStandaloneImageMediaNode(node: ChildNode): node is Element {
  if (!isElementNode(node)) {
    return false
  }

  if (node.tagName === 'IMG') {
    return true
  }

  return (
    node.tagName === 'A' &&
    getMeaningfulChildNodes(node).length === 1 &&
    node.firstElementChild?.tagName === 'IMG'
  )
}

function findRichTextImageNode(node: Element): HTMLImageElement | null {
  if (node.tagName === 'IMG') {
    return node as HTMLImageElement
  }

  return node.querySelector('img')
}

function replaceElementTag(element: Element, tagName: string): Element {
  const nextElement = element.ownerDocument.createElement(tagName)

  while (element.firstChild) {
    nextElement.appendChild(element.firstChild)
  }

  element.replaceWith(nextElement)
  return nextElement
}

function unwrapRichTextElement(element: Element): void {
  const parent = element.parentNode
  if (!parent) {
    return
  }

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element)
  }

  parent.removeChild(element)
}

function hasMeaningfulTextNode(node: ChildNode): boolean {
  return node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length > 0
}

function isAiRichTextBlockElement(node: ChildNode): node is Element {
  return isElementNode(node) && AI_RICH_TEXT_BLOCK_TAGS.has(node.tagName)
}

function wrapAiRichTextInlineNodes(body: HTMLElement): void {
  const nextChildren = Array.from(body.childNodes)
  const fragment = body.ownerDocument.createDocumentFragment()
  let paragraph: HTMLParagraphElement | null = null

  function ensureParagraph(): HTMLParagraphElement {
    if (!paragraph) {
      paragraph = body.ownerDocument.createElement('p')
    }

    return paragraph
  }

  function flushParagraph(): void {
    if (!paragraph) {
      return
    }

    if (
      (paragraph.textContent ?? '').trim().length > 0 ||
      paragraph.querySelector('a, strong, br')
    ) {
      fragment.appendChild(paragraph)
    }

    paragraph = null
  }

  nextChildren.forEach((node) => {
    if (isAiRichTextBlockElement(node)) {
      flushParagraph()
      fragment.appendChild(node)
      return
    }

    if (hasMeaningfulTextNode(node) || isElementNode(node)) {
      ensureParagraph().appendChild(node)
    }
  })

  flushParagraph()
  body.replaceChildren(fragment)
}

function normalizeRichTextPreviewLine(value: string): string {
  return collapseWhitespace(value.replace(/\u00a0/g, ' '))
}

function extractRichTextInlinePreview(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ''
  }

  if (!isElementNode(node)) {
    return ''
  }

  if (node.tagName === 'BR') {
    return '\n'
  }

  return Array.from(node.childNodes).map(extractRichTextInlinePreview).join('')
}

function normalizeRichTextPreviewBlock(value: string): string {
  return value
    .split('\n')
    .map((line) => normalizeRichTextPreviewLine(line))
    .filter((line, index, lines) => line.length > 0 || (index > 0 && index < lines.length - 1))
    .join('\n')
    .trim()
}

function extractRichTextPreviewBlocks(node: ChildNode): string[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = normalizeRichTextPreviewLine(node.textContent ?? '')
    return text ? [text] : []
  }

  if (!isElementNode(node)) {
    return []
  }

  if (node.tagName === 'HR') {
    return ['——']
  }

  if (node.tagName === 'UL' || node.tagName === 'OL') {
    const items = Array.from(node.children)
      .filter((child) => child.tagName === 'LI')
      .map((child, index) => {
        const itemText = normalizeRichTextPreviewBlock(extractRichTextInlinePreview(child))
        if (!itemText) {
          return ''
        }

        return node.tagName === 'OL' ? `${index + 1}. ${itemText}` : `• ${itemText}`
      })
      .filter(Boolean)

    return items.length > 0 ? [items.join('\n')] : []
  }

  if (AI_RICH_TEXT_BLOCK_TAGS.has(node.tagName)) {
    const text = normalizeRichTextPreviewBlock(
      Array.from(node.childNodes).map(extractRichTextInlinePreview).join('')
    )
    return text ? [text] : []
  }

  return Array.from(node.childNodes).flatMap(extractRichTextPreviewBlocks)
}

function resolveStandaloneImageMediaNodes(block: Element): Element[] {
  const meaningfulChildNodes = getMeaningfulChildNodes(block)

  if (meaningfulChildNodes.length === 0) {
    return []
  }

  if (!meaningfulChildNodes.every(isStandaloneImageMediaNode)) {
    return []
  }

  return meaningfulChildNodes as Element[]
}

function resolveFigureCaptionFromImage(node: HTMLImageElement): string {
  const candidates = [
    node.getAttribute('data-caption')?.trim() ?? '',
    node.getAttribute('title')?.trim() ?? '',
    node.getAttribute('alt')?.trim() ?? ''
  ]

  return (
    candidates.find((value) => value.length > 0 && value !== node.getAttribute('src')?.trim()) ?? ''
  )
}

function consumeAdjacentFigureCaption(block: Element): string {
  const nextElement = block.nextElementSibling
  if (!nextElement || nextElement.tagName !== 'P') {
    return ''
  }

  const captionText = collapseWhitespace(nextElement.textContent ?? '')
  const match = captionText.match(/^(图注|图片说明|caption)\s*[:：]\s*(.+)$/i)

  if (!match) {
    return ''
  }

  nextElement.remove()
  return match[2]?.trim() ?? ''
}

function normalizeStandaloneFigures(doc: Document): void {
  Array.from(doc.body.querySelectorAll('p, div')).forEach((block) => {
    if (block.closest('figure, blockquote, li, td, th')) {
      return
    }

    const mediaNodes = resolveStandaloneImageMediaNodes(block)
    if (mediaNodes.length === 0) {
      return
    }

    const figureFragment = doc.createDocumentFragment()

    mediaNodes.forEach((mediaNode, index) => {
      const imageNode = findRichTextImageNode(mediaNode)
      if (!imageNode) {
        return
      }

      const figure = doc.createElement('figure')
      const caption =
        resolveFigureCaptionFromImage(imageNode) ||
        (mediaNodes.length === 1 && index === 0 ? consumeAdjacentFigureCaption(block) : '')

      mediaNode.remove()
      figure.appendChild(mediaNode)

      if (caption) {
        const figcaption = doc.createElement('figcaption')
        figcaption.textContent = caption
        figure.appendChild(figcaption)
      }

      figureFragment.appendChild(figure)
    })

    if (figureFragment.childNodes.length > 0) {
      block.replaceWith(figureFragment)
    }
  })
}

function normalizeBlockquotes(doc: Document): void {
  doc.querySelectorAll('blockquote').forEach((blockquote) => {
    const elementChildren = Array.from(blockquote.children)
    if (
      elementChildren.length === 0 ||
      !elementChildren.every((child) => child.tagName === 'P' || child.tagName === 'DIV')
    ) {
      return
    }

    const fragments = elementChildren
      .map((child) => child.innerHTML.trim())
      .filter((fragment) => fragment.length > 0)

    if (fragments.length === 0) {
      blockquote.innerHTML = collapseWhitespace(blockquote.textContent ?? '')
      return
    }

    blockquote.innerHTML = fragments.join('<br /><br />')
  })

  Array.from(doc.body.querySelectorAll('p')).forEach((paragraph) => {
    if (paragraph.closest('figure, blockquote, li, td, th')) {
      return
    }

    const quoteHtml = paragraph.innerHTML.replace(/^(?:&gt;|>|＞)\s*/, '')
    if (quoteHtml === paragraph.innerHTML) {
      return
    }

    const blockquote = doc.createElement('blockquote')
    blockquote.innerHTML = quoteHtml.trim()
    paragraph.replaceWith(blockquote)
  })
}

function normalizeRichTextPublicDetailMarkup(doc: Document): void {
  normalizeStandaloneFigures(doc)
  normalizeBlockquotes(doc)
}

export interface NormalizedRichTextEmbeddedVideo {
  embedUrl: string
  platform: 'bilibili' | 'youtube' | 'generic'
  platformLabel: string
}

export function normalizeRichTextEmbeddedVideoInput(
  input: string
): NormalizedRichTextEmbeddedVideo | null {
  const normalizedInput = extractIframeSource(input) || input.trim()
  const url = tryCreateHttpUrl(normalizedInput)

  if (!url) {
    return null
  }

  if (isYouTubeHost(url.hostname)) {
    return normalizeYouTubeVideo(url)
  }

  if (isBilibiliHost(url.hostname)) {
    return normalizeBilibiliVideo(url)
  }

  return {
    platform: 'generic',
    platformLabel: '通用嵌入',
    embedUrl: url.toString()
  }
}

export interface UploadedRichTextImage {
  id: string
  downloadPath: string
}

export interface PreparedRichTextImage {
  mediaId: string
  url: string
}

export interface NormalizeRichTextEmbeddedMediaOptions {
  fileNamePrefix?: string
  resolveAssetUrl: (path: string) => string
  uploadImages: (files: File[]) => Promise<UploadedRichTextImage[]>
}

export interface NormalizeRichTextEmbeddedMediaResult {
  content: string
  images: PreparedRichTextImage[]
}

export function extractRichTextPlainText(html: string): string {
  if (!html) {
    return ''
  }

  const doc = createRichTextDocument(html)
  if (doc) {
    return collapseWhitespace(doc.body.textContent ?? '')
  }

  return collapseWhitespace(
    html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
  )
}

export function createRichTextExcerpt(html: string, maxLength = 160): string {
  const text = extractRichTextPlainText(html)
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength).trimEnd()}...`
}

export function convertPlainTextToRichTextHtml(text: string): string {
  const normalizedText = text.replace(/\r\n?/g, '\n').trim()
  if (!normalizedText) {
    return ''
  }

  return normalizedText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p>${paragraph
          .split('\n')
          .map((line) => escapeRichTextHtml(line))
          .join('<br />')}</p>`
    )
    .join('')
}

export function containsRichTextHtml(value: string): boolean {
  const doc = createRichTextDocument(value)
  return Boolean(doc?.body.querySelector('*'))
}

export function sanitizeAiRichTextHtml(html: string): string {
  const doc = createRichTextDocument(html)
  if (!doc) {
    return ''
  }

  doc.querySelectorAll('script, style, meta, link').forEach((node) => node.remove())

  Array.from(doc.body.querySelectorAll('*')).forEach((element) => {
    let nextElement = element

    if (nextElement.tagName === 'H1') {
      nextElement = replaceElementTag(nextElement, 'h2')
    } else if (nextElement.tagName === 'B') {
      nextElement = replaceElementTag(nextElement, 'strong')
    } else if (nextElement.tagName === 'DIV') {
      unwrapRichTextElement(nextElement)
      return
    }

    if (!AI_RICH_TEXT_ALLOWED_TAGS.has(nextElement.tagName)) {
      unwrapRichTextElement(nextElement)
      return
    }

    Array.from(nextElement.attributes).forEach((attribute) => {
      if (nextElement.tagName === 'A' && attribute.name.toLowerCase() === 'href') {
        return
      }

      nextElement.removeAttribute(attribute.name)
    })

    if (nextElement.tagName === 'A') {
      const href = nextElement.getAttribute('href')?.trim() ?? ''
      if (!tryCreateHttpUrl(href)) {
        unwrapRichTextElement(nextElement)
        return
      }

      nextElement.setAttribute('href', href)
    }
  })

  wrapAiRichTextInlineNodes(doc.body)
  return doc.body.innerHTML.trim()
}

export function extractRichTextPreviewText(value: string): string {
  const normalizedValue = value.trim()
  if (!normalizedValue) {
    return ''
  }

  if (!containsRichTextHtml(normalizedValue)) {
    return normalizedValue.replace(/\r\n?/g, '\n').trim()
  }

  const sanitizedHtml = sanitizeAiRichTextHtml(normalizedValue)
  if (!sanitizedHtml) {
    return ''
  }

  const doc = createRichTextDocument(sanitizedHtml)
  if (!doc) {
    return extractRichTextPlainText(sanitizedHtml)
  }

  return Array.from(doc.body.childNodes)
    .flatMap(extractRichTextPreviewBlocks)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function countRichTextNodes(html: string, selector: string): number {
  if (!html) {
    return 0
  }

  const doc = createRichTextDocument(html)
  return doc ? doc.querySelectorAll(selector).length : 0
}

export function collectPreparedRichTextImageMediaIds(images: PreparedRichTextImage[]): string[] {
  return uniqueStringItems(images.map((item) => item.mediaId?.trim() ?? ''))
}

export async function normalizeRichTextEmbeddedMedia(
  html: string,
  options: NormalizeRichTextEmbeddedMediaOptions
): Promise<NormalizeRichTextEmbeddedMediaResult> {
  const doc = createRichTextDocument(html)
  if (!doc) {
    return {
      content: html.trim(),
      images: []
    }
  }

  const imageNodes = Array.from(doc.querySelectorAll<HTMLImageElement>('img[src]'))
  const uniqueImageSources = uniqueStringItems(
    imageNodes.map((node) => node.getAttribute('src')?.trim() ?? '')
  )
  const preparedImageMap = new Map<string, PreparedRichTextImage>()
  const uploadCandidates: Array<{ file: File; source: string }> = []
  const fileNamePrefix = options.fileNamePrefix ?? 'rich-text-image'

  // 发布前只上传编辑态的 data/blob 图片，其余图片优先沿用已有地址和媒体标记。
  for (const [index, source] of uniqueImageSources.entries()) {
    if (!source || !shouldUploadEmbeddedImage(source)) {
      continue
    }

    const file = source.startsWith('data:')
      ? await dataUrlToFile(source, fileNamePrefix, index + 1)
      : await blobUrlToFile(source, fileNamePrefix, index + 1)

    uploadCandidates.push({
      file,
      source
    })
  }

  if (uploadCandidates.length > 0) {
    const uploadedImages = await options.uploadImages(uploadCandidates.map((item) => item.file))
    if (uploadedImages.length !== uploadCandidates.length) {
      throw new Error('富文本图片上传结果不完整，请稍后重试。')
    }

    uploadCandidates.forEach((item, index) => {
      const uploadedImage = uploadedImages[index]
      preparedImageMap.set(item.source, {
        mediaId: uploadedImage.id,
        url: options.resolveAssetUrl(uploadedImage.downloadPath)
      })
    })
  }

  const preparedImages: PreparedRichTextImage[] = []
  imageNodes.forEach((node) => {
    const source = node.getAttribute('src')?.trim() ?? ''
    if (!source) {
      return
    }

    const uploadedImage = preparedImageMap.get(source)
    const nextSource = uploadedImage?.url ?? source
    const nextMediaId =
      (uploadedImage?.mediaId ?? readImageMediaId(node)) || inferMediaIdFromImageSource(source)

    markRichTextImageNode(node, nextSource, nextMediaId)
    preparedImages.push({
      mediaId: nextMediaId,
      url: nextSource
    })
  })

  doc.querySelectorAll<HTMLIFrameElement>('iframe[src]').forEach((iframe) => {
    normalizeIframeNode(iframe)
  })

  normalizeRichTextPublicDetailMarkup(doc)

  return {
    content: doc.body.innerHTML.trim(),
    images: uniquePreparedImages(preparedImages)
  }
}
