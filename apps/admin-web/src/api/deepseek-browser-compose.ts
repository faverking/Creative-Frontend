import type {
  AdminComposeRequest,
  AdminComposeResponse,
  AdminComposeResult,
  AdminComposeUsage,
  ContentRewriteResult,
  FeatureFlagSuggestionResult,
  HighlightsResult,
  ImageSourceSuggestionResult,
  OutlineResult,
  RewriteTitleResult,
  SummaryResult
} from '@frontend/ai-sdk'

import {
  ARTICLE_THEME_LABELS,
  BUSINESS_LABELS_BY_TARGET_TYPE,
  IMAGE_SOURCE_OPTIONS,
  IMAGE_THEME_LABELS,
  TOPIC_FEATURE_FLAG_LABELS,
  TOPIC_SECTION_LABELS,
  TOPIC_SERIES_LABELS
} from '@/constants'
import { extractRichTextPreviewText } from '@/utils/rich-text'

type BrowserDeepSeekEnvValue = string | boolean | undefined
type BrowserDeepSeekEnvSource = Record<string, BrowserDeepSeekEnvValue>

interface DeepSeekBrowserComposeConfig {
  apiKey: string
  baseUrl: string
  model: string
}

interface DeepSeekBrowserComposeState {
  config: DeepSeekBrowserComposeConfig | null
  setupError: string
}

interface DeepSeekPromptDefinition {
  instructions: string
  input: string
  contract: Record<string, unknown>
}

interface DeepSeekUsagePayload {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
}

interface DeepSeekChatMessagePayload {
  content?: string | null
}

interface DeepSeekChatCompletionChoicePayload {
  message?: DeepSeekChatMessagePayload
}

interface DeepSeekChatCompletionPayload {
  id?: string
  model?: string
  choices?: DeepSeekChatCompletionChoicePayload[]
  usage?: DeepSeekUsagePayload
}

const DEEPSEEK_CHAT_COMPLETIONS_PATH = '/chat/completions'
const DEEPSEEK_DEFAULT_BASE_URL = 'https://api.deepseek.com'
const DEEPSEEK_DEFAULT_MODEL = 'deepseek-v4-flash'
const DEEPSEEK_PROMPT_VERSION = 'admin-web.browser-deepseek.v1'
const DEEPSEEK_API_KEY_ENV_KEY = 'VITE_ADMIN_DEEPSEEK_API_KEY'
const DEEPSEEK_BASE_URL_ENV_KEY = 'VITE_ADMIN_DEEPSEEK_API_BASE_URL'
const DEEPSEEK_MODEL_ENV_KEY = 'VITE_ADMIN_DEEPSEEK_MODEL'

function readString(value: BrowserDeepSeekEnvValue): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim()
  if (!normalized || normalized === 'undefined' || normalized === 'null') {
    return undefined
  }

  return normalized
}

function createTraceId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`
}

function parseUpstreamErrorMessage(text: string, status: number): string {
  const normalizedText = text.trim()
  if (!normalizedText) {
    return `DeepSeek 请求失败（${status}）。`
  }

  try {
    const parsed = JSON.parse(normalizedText) as {
      error?: {
        message?: string
      }
      message?: string
    }
    return parsed.error?.message || parsed.message || `DeepSeek 请求失败（${status}）。`
  } catch {
    return normalizedText
  }
}

function assertSupportedRequest(request: AdminComposeRequest): void {
  if (!['article', 'topic', 'image'].includes(request.contentType)) {
    throw new Error('当前 DeepSeek 浏览器直连层仅支持情报、游戏和图包 AI 功能。')
  }
}

function buildCommonInstructions(request: AdminComposeRequest): string {
  const rules: string[] = [
    '你是 MonoApp 管理端的内容编辑辅助助手。',
    '你的目标是承担主笔型编辑工作：在事实边界内主动完成可直接填入后台的标题、摘要、正文片段或运营建议，而不是只给保守短建议。',
    '可以基于输入做合理的编辑推断、信息重组、表达扩写、导语/过渡补齐和结构优化；但不能编造未提供的事实、下载信息、版本信息、人物信息或具体视觉细节。',
    '不确定的信息要用概括性表达处理，不要写成确定事实。',
    '输出必须是一个合法 JSON object，不能输出 Markdown、解释性前缀、代码块标记或额外说明。',
    'JSON object 必须符合输出契约；未在契约中声明的字段不要输出。'
  ]

  if (request.options?.maxTitleLength) {
    rules.push(`标题建议尽量控制在 ${request.options.maxTitleLength} 个字符以内。`)
  }

  if (request.options?.maxSummaryLength) {
    rules.push(`摘要建议尽量控制在 ${request.options.maxSummaryLength} 个字符以内。`)
  }

  if (!request.options?.includeReasons) {
    rules.push('不要输出 reasons 字段。')
  }

  return rules.join('\n')
}

function buildTaskInstructions(request: AdminComposeRequest): string {
  switch (request.task) {
    case 'rewrite-title':
      if (request.contentType === 'topic') {
        return '任务是主笔式改写游戏运营标题。依据当前标题、摘要、正文、题材、内容类型和已有标签，提炼最值得点击和管理端识别的运营重点，给出可直接使用的成熟标题；不能虚构平台、版本、下载状态或补丁信息。'
      }

      if (request.contentType === 'image') {
        return '任务是主笔式改写图包标题。依据当前标题、图包描述、板块、图片类型、图片数量和文件名线索，提炼收藏价值、用途或主题氛围，给出可直接使用的成熟标题。没有视觉识别结果时，不要描述具体画面、人物、服装、动作或场景细节。'
      }

      return '任务是主笔式改写情报标题。依据当前标题和正文内容重组表达，提炼核心看点，给出自然、清晰、适合直接发布或后台采纳的成熟标题，避免标题党和虚构信息。'
    case 'generate-summary':
      if (request.contentType === 'topic') {
        return '任务是主笔式生成游戏摘要。依据当前正文、题材、内容类型和标签，主动组织成可直接展示的运营摘要，突出作品看点、资源价值、适用场景或导览价值；不要编造下载链接、密码、版本号或安装步骤。'
      }

      if (request.contentType === 'image') {
        return '任务是主笔式生成图包描述。依据图包描述、板块、图片类型、图片数量和文件名线索，主动组织成可直接展示的描述，说明图包范围、用途、收藏价值或活动信息；不要虚构具体视觉内容。'
      }

      return '任务是主笔式生成情报摘要。依据正文内容主动提炼背景、重点和读者价值，写成适合列表卡片与运营简介的可直接使用摘要；不要写成标题，也不要引入正文之外的新事实。'
    case 'polish-summary':
      if (request.contentType === 'topic') {
        return '任务是主笔式润色游戏摘要。可以在保留事实边界的前提下重写摘要，而不是只做轻微修辞；依据当前摘要、正文、题材、内容类型和标签，补齐表达层次并提升运营可读性，不要新增未提供的资源信息。'
      }

      if (request.contentType === 'image') {
        return '任务是主笔式润色图包描述。可以在保留事实边界的前提下重写描述，而不是只做轻微修辞；依据当前描述、板块、图片类型、图片数量和文件名线索，补齐范围、用途或收藏价值，不要虚构图片具体画面。'
      }

      return '任务是主笔式润色情报摘要。可以在保留事实边界的前提下重写摘要，而不是只做轻微修辞；依据当前摘要和正文内容补齐表达层次，提升清晰度、信息密度和可读性，不要引入新事实。'
    case 'extract-highlights':
      return '任务是提炼内容要点。返回的 highlights 应主动整理成可直接用于运营拆条或后台浏览的重点，简洁、可读，并覆盖输入中最有价值的信息。'
    case 'structure-content':
      return '任务是给出内容结构建议。返回的 outline 应主动设计成后台编辑可直接采用的小标题或段落结构，帮助补齐文章展开路径，而不是只概括已有段落。'
    case 'rewrite-selection':
      return '任务是主笔式改写正文选区。返回的 content 必须是可直接写回富文本编辑器的 HTML 片段，只允许使用 p / h2 / h3 / blockquote / ul / ol / li / hr / br / strong / a。不能输出 h1、span、style、class、内联颜色、背景色或任意包裹容器。你可以根据选区及其上下文主动补齐导语、过渡、解释、要点、小标题、列表、引用或分隔线，让结果像编辑已经完成过的一段内容；可以明显扩写和重组，但不要脱离选区主题扩成一篇独立文章，也不要引入新事实。'
    case 'continue-content':
      return '任务是基于当前光标位置主笔式续写正文。返回的 content 必须是可直接写回富文本编辑器的 HTML 片段，只允许使用 p / h2 / h3 / blockquote / ul / ol / li / hr / br / strong / a。不能输出 h1、span、style、class、内联颜色、背景色或任意包裹容器。你可以根据前后文主动引入标题、列表、引用、分隔线、过渡段或补充说明，只要能增强阅读节奏并保持上下文自然衔接。默认续写 2 到 4 个自然段；如果上下文给出了明确结构，可以完成一个相对完整的小节。不要引入新事实。'
    case 'suggest-feature-flags':
      return '任务是为游戏内容建议标签。只能从候选游戏标签中选择，最多 7 个，至少 1 个。不要为了凑数量选择没有依据的标签，返回的 id 必须来自候选标签。'
    case 'suggest-image-source':
      return '任务是为图包建议图片类型。只能从候选图片类型中选择一个：原画、壁纸、图集。不要输出候选之外的类型，也不要根据文件名强行推断具体画面。'
  }
}

function createObjectContract(
  properties: Record<string, unknown>,
  required: string[]
): Record<string, unknown> {
  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false
  }
}

function withOptionalReasons(
  request: AdminComposeRequest,
  properties: Record<string, unknown>
): Record<string, unknown> {
  if (!request.options?.includeReasons) {
    return properties
  }

  return {
    ...properties,
    reasons: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 4
    }
  }
}

function buildResultContract(request: AdminComposeRequest): Record<string, unknown> {
  switch (request.task) {
    case 'rewrite-title':
      return createObjectContract(
        withOptionalReasons(request, {
          title: { type: 'string' }
        }),
        ['title']
      )
    case 'generate-summary':
    case 'polish-summary':
      return createObjectContract(
        withOptionalReasons(request, {
          summary: { type: 'string' }
        }),
        ['summary']
      )
    case 'extract-highlights':
      return createObjectContract(
        withOptionalReasons(request, {
          highlights: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 6
          }
        }),
        ['highlights']
      )
    case 'structure-content':
      return createObjectContract(
        withOptionalReasons(request, {
          outline: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 8
          }
        }),
        ['outline']
      )
    case 'rewrite-selection':
    case 'continue-content':
      return createObjectContract(
        {
          content: { type: 'string' }
        },
        ['content']
      )
    case 'suggest-feature-flags':
      return createObjectContract(
        {
          featureFlagSuggestions: {
            type: 'array',
            minItems: 1,
            maxItems: 7,
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'number',
                  enum: Object.keys(TOPIC_FEATURE_FLAG_LABELS).map(Number)
                },
                label: {
                  type: 'string',
                  enum: Object.values(TOPIC_FEATURE_FLAG_LABELS)
                },
                reason: { type: 'string' }
              },
              required: ['id', 'label', 'reason'],
              additionalProperties: false
            }
          }
        },
        ['featureFlagSuggestions']
      )
    case 'suggest-image-source':
      return createObjectContract(
        {
          imageSourceSuggestion: {
            type: 'object',
            properties: {
              source: {
                type: 'string',
                enum: IMAGE_SOURCE_OPTIONS
              },
              reason: { type: 'string' }
            },
            required: ['source', 'reason'],
            additionalProperties: false
          }
        },
        ['imageSourceSuggestion']
      )
  }
}

function toSectionLine(label: string, value: string | undefined): string {
  return `${label}：${value?.trim() || '无'}`
}

function buildPromptInput(request: AdminComposeRequest): string {
  const contentTypeLabel = BUSINESS_LABELS_BY_TARGET_TYPE[request.contentType]
  const themeLabel = request.source.themeId
    ? request.contentType === 'article'
      ? ARTICLE_THEME_LABELS[request.source.themeId]
      : request.contentType === 'image'
        ? IMAGE_THEME_LABELS[request.source.themeId]
        : undefined
    : undefined
  const seriesLabel =
    request.contentType === 'topic' && request.source.topicId
      ? TOPIC_SERIES_LABELS[request.source.topicId]
      : undefined
  const sectionLabel =
    request.contentType === 'topic' && request.source.typeId
      ? TOPIC_SECTION_LABELS[request.source.typeId]
      : undefined
  const featureFlagLabels =
    request.contentType === 'topic'
      ? request.source.featureFlags
          ?.map((id) => TOPIC_FEATURE_FLAG_LABELS[id])
          .filter((label): label is string => Boolean(label))
          .join('、')
      : undefined
  const baseLines = [
    toSectionLine('内容类型', contentTypeLabel),
    toSectionLine('主题标签', themeLabel),
    toSectionLine('游戏题材', seriesLabel),
    toSectionLine('游戏内容类型', sectionLabel),
    toSectionLine('游戏标签', featureFlagLabels),
    toSectionLine('图片类型', request.contentType === 'image' ? request.source.source : undefined),
    toSectionLine('图片数量', request.source.imageCount?.toString()),
    toSectionLine('文件名线索', request.source.fileNameHints?.join('、')),
    toSectionLine(
      '已选封面',
      request.source.coverSelected === undefined
        ? undefined
        : request.source.coverSelected
          ? '是'
          : '否'
    ),
    toSectionLine(
      '是否有 ZIP 资源',
      request.source.hasArchive === undefined ? undefined : request.source.hasArchive ? '是' : '否'
    ),
    toSectionLine('是否有下载地址', request.source.downloadUrl ? '是' : undefined),
    toSectionLine('正文内图片数', request.source.embeddedImageCount?.toString()),
    toSectionLine('正文内视频数', request.source.embeddedVideoCount?.toString()),
    toSectionLine('任务', request.task),
    toSectionLine('语气', request.options?.tone ?? 'neutral')
  ]

  switch (request.task) {
    case 'rewrite-title':
      return [
        ...baseLines,
        toSectionLine('当前标题', request.source.title),
        toSectionLine('正文内容摘录', request.source.content)
      ].join('\n')
    case 'generate-summary':
      return [
        ...baseLines,
        toSectionLine('当前摘要', request.source.summary),
        toSectionLine('正文内容摘录', request.source.content)
      ].join('\n')
    case 'polish-summary':
      return [
        ...baseLines,
        toSectionLine('当前摘要', request.source.summary),
        toSectionLine('正文内容摘录', request.source.content)
      ].join('\n')
    case 'extract-highlights':
    case 'structure-content':
      return [...baseLines, toSectionLine('正文内容', request.source.content)].join('\n')
    case 'suggest-feature-flags':
      return [
        ...baseLines,
        toSectionLine(
          '候选游戏标签',
          Object.entries(TOPIC_FEATURE_FLAG_LABELS)
            .map(([id, label]) => `${id}:${label}`)
            .join('、')
        ),
        toSectionLine('当前标题', request.source.title),
        toSectionLine('当前摘要', request.source.summary),
        toSectionLine('正文内容摘录', request.source.content)
      ].join('\n')
    case 'suggest-image-source':
      return [
        ...baseLines,
        toSectionLine('候选图片类型', IMAGE_SOURCE_OPTIONS.join('、')),
        toSectionLine('当前标题', request.source.title),
        toSectionLine('当前描述', request.source.summary),
        toSectionLine('图包描述摘录', request.source.content)
      ].join('\n')
    case 'rewrite-selection':
      return [
        ...baseLines,
        toSectionLine('正文选区', request.source.selectionText),
        toSectionLine('选区前文', request.source.selectionPrefix),
        toSectionLine('选区后文', request.source.selectionSuffix)
      ].join('\n')
    case 'continue-content':
      return [
        ...baseLines,
        toSectionLine('光标前文', request.source.cursorPrefix),
        toSectionLine('光标后文', request.source.cursorSuffix)
      ].join('\n')
  }
}

function buildDeepSeekPrompt(request: AdminComposeRequest): DeepSeekPromptDefinition {
  assertSupportedRequest(request)

  const contract = buildResultContract(request)
  return {
    instructions: [
      buildCommonInstructions(request),
      buildTaskInstructions(request),
      `输出契约：${JSON.stringify(contract)}`
    ].join('\n\n'),
    input: buildPromptInput(request),
    contract
  }
}

export function resolveDeepSeekBrowserComposeConfig(
  env: BrowserDeepSeekEnvSource
): DeepSeekBrowserComposeState {
  const apiKey = readString(env[DEEPSEEK_API_KEY_ENV_KEY])
  if (!apiKey) {
    return {
      config: null,
      setupError: `DeepSeek 浏览器直连配置不完整，缺少 ${DEEPSEEK_API_KEY_ENV_KEY}。`
    }
  }

  return {
    config: {
      apiKey,
      baseUrl: readString(env[DEEPSEEK_BASE_URL_ENV_KEY]) ?? DEEPSEEK_DEFAULT_BASE_URL,
      model: readString(env[DEEPSEEK_MODEL_ENV_KEY]) ?? DEEPSEEK_DEFAULT_MODEL
    },
    setupError: ''
  }
}

export function buildDeepSeekChatPayload(
  request: AdminComposeRequest,
  config: Pick<DeepSeekBrowserComposeConfig, 'model'>
): Record<string, unknown> {
  const prompt = buildDeepSeekPrompt(request)

  return {
    model: config.model,
    messages: [
      {
        role: 'system',
        content: prompt.instructions
      },
      {
        role: 'user',
        content: prompt.input
      }
    ],
    response_format: {
      type: 'json_object'
    },
    thinking: {
      type: 'disabled'
    }
  }
}

function normalizeUsage(usage: DeepSeekUsagePayload | undefined): AdminComposeUsage | undefined {
  if (!usage) {
    return undefined
  }

  return {
    inputTokens: usage.prompt_tokens ?? 0,
    outputTokens: usage.completion_tokens ?? 0,
    totalTokens: usage.total_tokens ?? 0
  }
}

function extractOutputText(payload: DeepSeekChatCompletionPayload): string {
  return (
    payload.choices
      ?.map((choice) => choice.message?.content)
      .filter((content): content is string => typeof content === 'string')
      .join('\n')
      .trim() ?? ''
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readRequiredString(source: Record<string, unknown>, key: string): string {
  const value = source[key]
  if (typeof value !== 'string') {
    throw new Error(`DeepSeek 返回结果缺少有效字段：${key}。`)
  }

  return value.trim()
}

function readReasons(
  source: Record<string, unknown>,
  includeReasons: boolean | undefined
): string[] | undefined {
  if (!includeReasons) {
    return undefined
  }

  if (source.reasons === undefined) {
    return undefined
  }

  if (!Array.isArray(source.reasons) || !source.reasons.every((item) => typeof item === 'string')) {
    throw new Error('DeepSeek 返回的 reasons 字段格式无效。')
  }

  return source.reasons.map((item) => item.trim()).filter(Boolean)
}

function readStringArray(source: Record<string, unknown>, key: string): string[] {
  const value = source[key]
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`DeepSeek 返回结果缺少有效字段：${key}。`)
  }

  return value.map((item) => item.trim()).filter(Boolean)
}

function parseDeepSeekResult(
  request: AdminComposeRequest,
  payload: DeepSeekChatCompletionPayload
): AdminComposeResult {
  const rawText = extractOutputText(payload)
  if (!rawText) {
    throw new Error('DeepSeek 接口未返回可解析的文本结果。')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new Error('DeepSeek 返回的 JSON 结果无法解析。')
  }

  if (!isRecord(parsed)) {
    throw new Error('DeepSeek 返回的 JSON 结果必须是对象。')
  }

  switch (request.task) {
    case 'rewrite-title': {
      const result: RewriteTitleResult = {
        title: readRequiredString(parsed, 'title')
      }
      const reasons = readReasons(parsed, request.options?.includeReasons)
      return reasons ? { ...result, reasons } : result
    }
    case 'generate-summary':
    case 'polish-summary': {
      const result: SummaryResult = {
        summary: readRequiredString(parsed, 'summary')
      }
      const reasons = readReasons(parsed, request.options?.includeReasons)
      return reasons ? { ...result, reasons } : result
    }
    case 'extract-highlights': {
      const result: HighlightsResult = {
        highlights: readStringArray(parsed, 'highlights')
      }
      const reasons = readReasons(parsed, request.options?.includeReasons)
      return reasons ? { ...result, reasons } : result
    }
    case 'structure-content': {
      const result: OutlineResult = {
        outline: readStringArray(parsed, 'outline')
      }
      const reasons = readReasons(parsed, request.options?.includeReasons)
      return reasons ? { ...result, reasons } : result
    }
    case 'rewrite-selection':
    case 'continue-content':
      return {
        content: readRequiredString(parsed, 'content')
      } satisfies ContentRewriteResult
    case 'suggest-feature-flags': {
      const suggestions = parsed.featureFlagSuggestions
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error('DeepSeek 返回的游戏标签建议格式无效。')
      }

      return {
        featureFlagSuggestions: suggestions.map((item) => {
          if (!isRecord(item)) {
            throw new Error('DeepSeek 返回的游戏标签建议格式无效。')
          }

          const id = item.id
          const reason = item.reason
          if (!Number.isInteger(id) || !TOPIC_FEATURE_FLAG_LABELS[id as number]) {
            throw new Error('DeepSeek 返回了候选范围外的游戏标签。')
          }

          if (typeof reason !== 'string') {
            throw new Error('DeepSeek 返回的游戏标签理由格式无效。')
          }

          return {
            id: id as number,
            label: TOPIC_FEATURE_FLAG_LABELS[id as number],
            reason: reason.trim()
          }
        })
      } satisfies FeatureFlagSuggestionResult
    }
    case 'suggest-image-source': {
      const suggestion = parsed.imageSourceSuggestion
      if (!isRecord(suggestion)) {
        throw new Error('DeepSeek 返回的图片类型建议格式无效。')
      }

      const source = suggestion.source
      const reason = suggestion.reason
      if (
        typeof source !== 'string' ||
        !IMAGE_SOURCE_OPTIONS.includes(source as (typeof IMAGE_SOURCE_OPTIONS)[number])
      ) {
        throw new Error('DeepSeek 返回了候选范围外的图片类型。')
      }

      if (typeof reason !== 'string') {
        throw new Error('DeepSeek 返回的图片类型理由格式无效。')
      }

      return {
        imageSourceSuggestion: {
          source,
          reason: reason.trim()
        }
      } satisfies ImageSourceSuggestionResult
    }
  }
}

export function resolveAdminComposePreviewText(result: AdminComposeResult): string {
  if ('title' in result) {
    return result.title.trim()
  }

  if ('summary' in result) {
    return result.summary.trim()
  }

  if ('content' in result) {
    return extractRichTextPreviewText(result.content)
  }

  if ('highlights' in result) {
    return result.highlights.join('\n').trim()
  }

  if ('outline' in result) {
    return result.outline.join('\n').trim()
  }

  if ('featureFlagSuggestions' in result) {
    return result.featureFlagSuggestions
      .map((item) => `${item.label}：${item.reason}`)
      .join('\n')
      .trim()
  }

  if ('imageSourceSuggestion' in result) {
    return `${result.imageSourceSuggestion.source}：${result.imageSourceSuggestion.reason}`.trim()
  }

  return ''
}

export function createAdminComposeResponseFromDeepSeek(
  request: AdminComposeRequest,
  payload: DeepSeekChatCompletionPayload
): AdminComposeResponse {
  return {
    task: request.task,
    contentType: request.contentType,
    model: payload.model || '',
    promptVersion: DEEPSEEK_PROMPT_VERSION,
    traceId: payload.id || createTraceId('browser-deepseek'),
    result: parseDeepSeekResult(request, payload),
    usage: normalizeUsage(payload.usage)
  }
}

function createErrorResponse(message: string): Response {
  return new Response(JSON.stringify({ message }), {
    status: 500,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  })
}

export async function runBrowserDeepSeekCompose(
  request: AdminComposeRequest,
  env: BrowserDeepSeekEnvSource,
  signal?: AbortSignal
): Promise<AdminComposeResponse> {
  const composeState = resolveDeepSeekBrowserComposeConfig(env)
  if (!composeState.config) {
    throw new Error(composeState.setupError || 'DeepSeek 浏览器直连配置不完整。')
  }

  const payload = buildDeepSeekChatPayload(request, composeState.config)
  const response = await fetch(
    `${composeState.config.baseUrl.replace(/\/+$/, '')}${DEEPSEEK_CHAT_COMPLETIONS_PATH}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${composeState.config.apiKey}`
      },
      body: JSON.stringify(payload),
      signal
    }
  )

  if (!response.ok) {
    throw new Error(parseUpstreamErrorMessage(await response.text(), response.status))
  }

  const data = (await response.json()) as DeepSeekChatCompletionPayload
  return createAdminComposeResponseFromDeepSeek(request, {
    ...data,
    model: data.model || composeState.config.model
  })
}

export async function createBrowserDeepSeekStreamResponse(
  request: AdminComposeRequest,
  env: BrowserDeepSeekEnvSource,
  signal?: AbortSignal
): Promise<Response> {
  try {
    const response = await runBrowserDeepSeekCompose(request, env, signal)
    const encoder = new TextEncoder()
    const previewText = resolveAdminComposePreviewText(response.result)

    return new Response(
      new ReadableStream({
        start(controller) {
          if (previewText) {
            controller.enqueue(
              encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: previewText })}\n\n`)
            )
          }

          controller.enqueue(
            encoder.encode(`event: completed\ndata: ${JSON.stringify(response)}\n\n`)
          )
          controller.close()
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8'
        }
      }
    )
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      // 用户失焦、切换字段或调整选区时会主动取消当前请求；直接抛回上游保持静默取消语义。
      throw error
    }

    return createErrorResponse(error instanceof Error ? error.message : 'DeepSeek 请求失败。')
  }
}
