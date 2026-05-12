import type { AdminComposeRequest, AdminComposeResponse } from '@frontend/ai-sdk'

import {
  ARTICLE_FIELD_CONTENT_EXCERPT_LIMITS,
  ARTICLE_EDITOR_CONTEXT_LIMITS,
  ARTICLE_SUMMARY_AI_OPTIONS,
  DEFAULT_CONTENT_AI_OPTIONS,
  IMAGE_SUMMARY_AI_OPTIONS,
  TOPIC_SUMMARY_AI_OPTIONS,
  type ArticleAutocompleteField,
  type ContentEditorAiTask,
  type ImageAutocompleteField,
  type TopicAutocompleteField
} from '@/constants/ai-content-assist'
import type { RichTextEditorSelectionSnapshot } from '@/types/rich-text-editor'
import { extractRichTextPlainText, extractRichTextPreviewText } from '@/utils/rich-text'

export interface ArticleAiFormSnapshot {
  title: string
  themeId: number
  desc: string
  content: string
}

export interface ArticleAiSourceSnapshot {
  title: string
  summary: string
  content: string
  themeId: number
}

export interface TopicAiFormSnapshot {
  title: string
  topicId: number
  typeId: number
  featureFlags: number[]
  desc: string
  content: string
  downloadUrl: string
}

export interface TopicAiSourceSnapshot {
  title: string
  summary: string
  content: string
  topicId: number
  typeId: number
  featureFlags: number[]
  downloadUrl: string
  embeddedImageCount: number
  embeddedVideoCount: number
  hasArchive: boolean
}

export interface ImageAiFormSnapshot {
  title: string
  themeId: number
  desc: string
  source: string
}

export interface ImageAiSourceInput {
  imageCount: number
  fileNameHints: string[]
  coverSelected: boolean
}

export interface ImageAiSourceSnapshot extends ImageAiSourceInput {
  title: string
  summary: string
  themeId: number
  source: string
}

function toOptionalText(value: string): string | undefined {
  const normalizedValue = value.trim()
  return normalizedValue ? normalizedValue : undefined
}

function normalizeEditorText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function trimFromStart(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }

  return value.slice(value.length - maxLength)
}

function trimFromEnd(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }

  return value.slice(0, maxLength)
}

function normalizeSelectionText(value: string, maxLength: number): string | undefined {
  const normalizedValue = normalizeEditorText(value)
  if (!normalizedValue) {
    return undefined
  }

  return trimFromEnd(normalizedValue, maxLength)
}

function resolveEditorContext(selectionSnapshot: RichTextEditorSelectionSnapshot) {
  const selectionStart = selectionSnapshot.range.index
  const selectionEnd = selectionSnapshot.range.index + selectionSnapshot.range.length
  const rawPrefix = selectionSnapshot.plainText.slice(
    Math.max(0, selectionStart - ARTICLE_EDITOR_CONTEXT_LIMITS.surroundingText),
    selectionStart
  )
  const rawSuffix = selectionSnapshot.plainText.slice(
    selectionEnd,
    selectionEnd + ARTICLE_EDITOR_CONTEXT_LIMITS.surroundingText
  )

  return {
    selectedText: normalizeSelectionText(
      selectionSnapshot.selectedText,
      ARTICLE_EDITOR_CONTEXT_LIMITS.selectionText
    ),
    selectionPrefix: normalizeSelectionText(
      trimFromStart(rawPrefix, ARTICLE_EDITOR_CONTEXT_LIMITS.surroundingText),
      ARTICLE_EDITOR_CONTEXT_LIMITS.surroundingText
    ),
    selectionSuffix: normalizeSelectionText(
      trimFromEnd(rawSuffix, ARTICLE_EDITOR_CONTEXT_LIMITS.surroundingText),
      ARTICLE_EDITOR_CONTEXT_LIMITS.surroundingText
    ),
    cursorPrefix: normalizeSelectionText(
      trimFromStart(rawPrefix, ARTICLE_EDITOR_CONTEXT_LIMITS.surroundingText),
      ARTICLE_EDITOR_CONTEXT_LIMITS.surroundingText
    ),
    cursorSuffix: normalizeSelectionText(
      trimFromEnd(rawSuffix, ARTICLE_EDITOR_CONTEXT_LIMITS.surroundingText),
      ARTICLE_EDITOR_CONTEXT_LIMITS.surroundingText
    )
  }
}

export function collectArticleAiSource(form: ArticleAiFormSnapshot): ArticleAiSourceSnapshot {
  return {
    title: form.title.trim(),
    // 这里明确只取手填摘要，而不取 effectiveSummary。
    // 自动摘要属于页面展示层推导值，AI 侧更需要知道用户真正确认过的输入。
    summary: form.desc.trim(),
    // 文章 AI 统一消费纯文本正文，避免富文本标签、图片占位和 iframe 噪音干扰模型判断。
    content: extractRichTextPlainText(form.content),
    themeId: form.themeId
  }
}

function resolveArticleFieldContentExcerpt(
  field: ArticleAutocompleteField,
  content: string
): string | undefined {
  const normalizedContent = normalizeEditorText(content)
  if (!normalizedContent) {
    return undefined
  }

  const maxLength =
    field === 'title'
      ? ARTICLE_FIELD_CONTENT_EXCERPT_LIMITS.title
      : ARTICLE_FIELD_CONTENT_EXCERPT_LIMITS.summary

  return trimFromEnd(normalizedContent, maxLength)
}

function resolveContentExcerpt(content: string, maxLength: number): string | undefined {
  const normalizedContent = normalizeEditorText(content)
  return normalizedContent ? trimFromEnd(normalizedContent, maxLength) : undefined
}

export function resolveArticleSummaryTask(
  source: ArticleAiSourceSnapshot
): 'generate-summary' | 'polish-summary' {
  return source.summary ? 'polish-summary' : 'generate-summary'
}

export function resolveArticleFieldAutoTriggerLength(
  field: ArticleAutocompleteField,
  source: ArticleAiSourceSnapshot
): number {
  if (field === 'title') {
    return `${source.title} ${source.content}`.trim().length
  }

  if (source.summary) {
    return `${source.summary} ${source.content}`.trim().length
  }

  return source.content.length
}

export function resolveArticleFieldManualDisabledReason(
  field: ArticleAutocompleteField,
  source: ArticleAiSourceSnapshot
): string {
  if (field === 'title') {
    if (!source.title) {
      return '请先输入标题，再结合正文改写标题。'
    }

    if (!source.content) {
      return '请先输入正文，再结合正文改写标题。'
    }
  }

  if (field === 'summary') {
    const activeTask = resolveArticleSummaryTask(source)
    if (activeTask === 'generate-summary' && !source.content) {
      return '请先输入正文，再生成摘要。'
    }

    if (activeTask === 'polish-summary' && (!source.summary || !source.content)) {
      return '请先提供摘要和正文，再润色摘要。'
    }
  }

  return ''
}

export function buildArticleFieldComposeRequest(
  field: ArticleAutocompleteField,
  form: ArticleAiFormSnapshot
): AdminComposeRequest {
  const source = collectArticleAiSource(form)
  const task = field === 'title' ? 'rewrite-title' : resolveArticleSummaryTask(source)
  const contentExcerpt = resolveArticleFieldContentExcerpt(field, source.content)

  return {
    contentType: 'article',
    task,
    source: {
      title: field === 'title' ? toOptionalText(source.title) : undefined,
      summary: field === 'summary' ? toOptionalText(source.summary) : undefined,
      content: contentExcerpt,
      themeId: source.themeId
    },
    options:
      field === 'summary' ? { ...ARTICLE_SUMMARY_AI_OPTIONS } : { ...DEFAULT_CONTENT_AI_OPTIONS }
  }
}

export function buildArticleEditorComposeRequest(
  task: ContentEditorAiTask,
  form: ArticleAiFormSnapshot,
  selectionSnapshot: RichTextEditorSelectionSnapshot
): AdminComposeRequest {
  const editorContext = resolveEditorContext(selectionSnapshot)

  return {
    contentType: 'article',
    task,
    source: {
      themeId: form.themeId,
      selectionText: task === 'rewrite-selection' ? editorContext.selectedText : undefined,
      selectionPrefix: task === 'rewrite-selection' ? editorContext.selectionPrefix : undefined,
      selectionSuffix: task === 'rewrite-selection' ? editorContext.selectionSuffix : undefined,
      cursorPrefix: task === 'continue-content' ? editorContext.cursorPrefix : undefined,
      cursorSuffix: task === 'continue-content' ? editorContext.cursorSuffix : undefined
    },
    options: {
      ...DEFAULT_CONTENT_AI_OPTIONS
    }
  }
}

export function collectTopicAiSource(
  form: TopicAiFormSnapshot,
  meta: Pick<TopicAiSourceSnapshot, 'embeddedImageCount' | 'embeddedVideoCount' | 'hasArchive'>
): TopicAiSourceSnapshot {
  return {
    title: form.title.trim(),
    summary: form.desc.trim(),
    content: extractRichTextPlainText(form.content),
    topicId: form.topicId,
    typeId: form.typeId,
    featureFlags: Array.from(new Set(form.featureFlags.filter((value) => Number.isInteger(value)))),
    downloadUrl: form.downloadUrl.trim(),
    embeddedImageCount: meta.embeddedImageCount,
    embeddedVideoCount: meta.embeddedVideoCount,
    hasArchive: meta.hasArchive
  }
}

export function resolveTopicSummaryTask(
  source: TopicAiSourceSnapshot
): 'generate-summary' | 'polish-summary' {
  return source.summary ? 'polish-summary' : 'generate-summary'
}

export function resolveTopicFieldAutoTriggerLength(
  field: TopicAutocompleteField,
  source: TopicAiSourceSnapshot
): number {
  if (field === 'title') {
    return `${source.title} ${source.summary} ${source.content}`.trim().length
  }

  if (source.summary) {
    return `${source.summary} ${source.content}`.trim().length
  }

  return source.content.length
}

export function resolveTopicFieldManualDisabledReason(
  field: TopicAutocompleteField,
  source: TopicAiSourceSnapshot
): string {
  if (field === 'title') {
    if (!source.title && !source.summary && !source.content) {
      return '请先输入游戏标题、摘要或正文，再生成标题建议。'
    }
  }

  if (field === 'summary') {
    const activeTask = resolveTopicSummaryTask(source)
    if (activeTask === 'generate-summary' && !source.content) {
      return '请先输入游戏正文，再生成摘要。'
    }

    if (activeTask === 'polish-summary' && (!source.summary || !source.content)) {
      return '请先提供游戏摘要和正文，再润色摘要。'
    }
  }

  return ''
}

export function buildTopicFieldComposeRequest(
  field: TopicAutocompleteField,
  form: TopicAiFormSnapshot,
  meta: Pick<TopicAiSourceSnapshot, 'embeddedImageCount' | 'embeddedVideoCount' | 'hasArchive'>
): AdminComposeRequest {
  const source = collectTopicAiSource(form, meta)
  const task = field === 'title' ? 'rewrite-title' : resolveTopicSummaryTask(source)

  return {
    contentType: 'topic',
    task,
    source: {
      title: field === 'title' ? toOptionalText(source.title) : undefined,
      summary:
        field === 'summary' || field === 'title' ? toOptionalText(source.summary) : undefined,
      content: resolveContentExcerpt(source.content, field === 'title' ? 900 : 1400),
      topicId: source.topicId,
      typeId: source.typeId,
      featureFlags: source.featureFlags,
      downloadUrl: source.downloadUrl || undefined,
      hasArchive: source.hasArchive,
      embeddedImageCount: source.embeddedImageCount,
      embeddedVideoCount: source.embeddedVideoCount
    },
    options:
      field === 'summary' ? { ...TOPIC_SUMMARY_AI_OPTIONS } : { ...DEFAULT_CONTENT_AI_OPTIONS }
  }
}

export function buildTopicFeatureFlagComposeRequest(
  form: TopicAiFormSnapshot,
  meta: Pick<TopicAiSourceSnapshot, 'embeddedImageCount' | 'embeddedVideoCount' | 'hasArchive'>
): AdminComposeRequest {
  const source = collectTopicAiSource(form, meta)

  return {
    contentType: 'topic',
    task: 'suggest-feature-flags',
    source: {
      title: toOptionalText(source.title),
      summary: toOptionalText(source.summary),
      content: resolveContentExcerpt(source.content, 1400),
      topicId: source.topicId,
      typeId: source.typeId,
      featureFlags: source.featureFlags,
      downloadUrl: source.downloadUrl || undefined,
      hasArchive: source.hasArchive,
      embeddedImageCount: source.embeddedImageCount,
      embeddedVideoCount: source.embeddedVideoCount
    },
    options: {
      ...DEFAULT_CONTENT_AI_OPTIONS
    }
  }
}

export function buildTopicEditorComposeRequest(
  task: ContentEditorAiTask,
  form: TopicAiFormSnapshot,
  meta: Pick<TopicAiSourceSnapshot, 'embeddedImageCount' | 'embeddedVideoCount' | 'hasArchive'>,
  selectionSnapshot: RichTextEditorSelectionSnapshot
): AdminComposeRequest {
  const source = collectTopicAiSource(form, meta)
  const editorContext = resolveEditorContext(selectionSnapshot)

  return {
    contentType: 'topic',
    task,
    source: {
      topicId: source.topicId,
      typeId: source.typeId,
      featureFlags: source.featureFlags,
      downloadUrl: source.downloadUrl || undefined,
      hasArchive: source.hasArchive,
      embeddedImageCount: source.embeddedImageCount,
      embeddedVideoCount: source.embeddedVideoCount,
      selectionText: task === 'rewrite-selection' ? editorContext.selectedText : undefined,
      selectionPrefix: task === 'rewrite-selection' ? editorContext.selectionPrefix : undefined,
      selectionSuffix: task === 'rewrite-selection' ? editorContext.selectionSuffix : undefined,
      cursorPrefix: task === 'continue-content' ? editorContext.cursorPrefix : undefined,
      cursorSuffix: task === 'continue-content' ? editorContext.cursorSuffix : undefined
    },
    options: {
      ...DEFAULT_CONTENT_AI_OPTIONS
    }
  }
}

export function collectImageAiSource(
  form: ImageAiFormSnapshot,
  input: ImageAiSourceInput
): ImageAiSourceSnapshot {
  return {
    title: form.title.trim(),
    summary: form.desc.trim(),
    themeId: form.themeId,
    source: form.source.trim(),
    imageCount: input.imageCount,
    fileNameHints: input.fileNameHints
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 12),
    coverSelected: input.coverSelected
  }
}

export function resolveImageSummaryTask(
  source: ImageAiSourceSnapshot
): 'generate-summary' | 'polish-summary' {
  return source.summary ? 'polish-summary' : 'generate-summary'
}

export function resolveImageFieldAutoTriggerLength(
  field: ImageAutocompleteField,
  source: ImageAiSourceSnapshot
): number {
  if (field === 'title') {
    return `${source.title} ${source.summary} ${source.source} ${source.fileNameHints.join(' ')}`.trim()
      .length
  }

  if (field === 'summary') {
    return `${source.summary} ${source.source} ${source.fileNameHints.join(' ')}`.trim().length
  }

  return `${source.title} ${source.summary} ${source.fileNameHints.join(' ')}`.trim().length
}

export function resolveImageFieldManualDisabledReason(
  field: ImageAutocompleteField,
  source: ImageAiSourceSnapshot
): string {
  if (
    source.imageCount <= 0 &&
    source.fileNameHints.length === 0 &&
    !source.summary &&
    !source.title
  ) {
    return '请先上传图片或填写图包信息，再使用 AI 建议。'
  }

  if (field === 'summary' && source.imageCount <= 0 && !source.summary) {
    return '请先上传图片或填写描述，再生成图包描述。'
  }

  return ''
}

export function buildImageFieldComposeRequest(
  field: ImageAutocompleteField,
  form: ImageAiFormSnapshot,
  input: ImageAiSourceInput
): AdminComposeRequest {
  const source = collectImageAiSource(form, input)
  const task =
    field === 'title'
      ? 'rewrite-title'
      : field === 'source'
        ? 'suggest-image-source'
        : resolveImageSummaryTask(source)

  return {
    contentType: 'image',
    task,
    source: {
      title: field === 'title' ? toOptionalText(source.title) : undefined,
      summary: field !== 'title' ? toOptionalText(source.summary) : undefined,
      content: field === 'title' ? toOptionalText(source.summary) : undefined,
      themeId: source.themeId,
      source: source.source || undefined,
      imageCount: source.imageCount,
      fileNameHints: source.fileNameHints,
      coverSelected: source.coverSelected
    },
    options:
      field === 'summary' ? { ...IMAGE_SUMMARY_AI_OPTIONS } : { ...DEFAULT_CONTENT_AI_OPTIONS }
  }
}

export function resolveArticleEditorTask(
  selectionSnapshot: RichTextEditorSelectionSnapshot | null
): ContentEditorAiTask | null {
  if (!selectionSnapshot) {
    return null
  }

  return selectionSnapshot.mode === 'range' ? 'rewrite-selection' : 'continue-content'
}

export function resolveArticleEditorDisabledReason(
  selectionSnapshot: RichTextEditorSelectionSnapshot | null
): string {
  if (!selectionSnapshot) {
    return '请先在正文里定位光标或选中内容。'
  }

  if (selectionSnapshot.mode === 'range' && !normalizeEditorText(selectionSnapshot.selectedText)) {
    return '请先选中文正文片段，再使用 AI 改写。'
  }

  if (selectionSnapshot.mode === 'caret') {
    const selectionStart = selectionSnapshot.range.index
    const rawPrefix = selectionSnapshot.plainText.slice(
      Math.max(0, selectionStart - ARTICLE_EDITOR_CONTEXT_LIMITS.surroundingText),
      selectionStart
    )

    if (!normalizeEditorText(rawPrefix)) {
      return '请先输入一些正文，再让 AI 继续往下写。'
    }
  }

  return ''
}

export function extractContentSuggestionText(response: AdminComposeResponse | null): string {
  const result = response?.result
  if (!result) {
    return ''
  }

  if ('title' in result) {
    return result.title.trim()
  }

  if ('summary' in result) {
    return result.summary.trim()
  }

  if ('content' in result) {
    return extractRichTextPreviewText(result.content)
  }

  if ('featureFlagSuggestions' in result) {
    return result.featureFlagSuggestions.map((item) => `${item.label}：${item.reason}`).join('\n')
  }

  if ('imageSourceSuggestion' in result) {
    return `${result.imageSourceSuggestion.source}：${result.imageSourceSuggestion.reason}`
  }

  return ''
}

export function extractContentSuggestionApplyContent(
  response: AdminComposeResponse | null
): string {
  const result = response?.result
  if (!result || !('content' in result)) {
    return ''
  }

  return result.content.trim()
}

export function extractFeatureFlagSuggestionIds(response: AdminComposeResponse | null): number[] {
  const result = response?.result
  if (!result || !('featureFlagSuggestions' in result)) {
    return []
  }

  return result.featureFlagSuggestions
    .map((item) => item.id)
    .filter((value) => Number.isInteger(value))
}

export function extractImageSourceSuggestion(response: AdminComposeResponse | null): string {
  const result = response?.result
  if (!result || !('imageSourceSuggestion' in result)) {
    return ''
  }

  return result.imageSourceSuggestion.source.trim()
}
