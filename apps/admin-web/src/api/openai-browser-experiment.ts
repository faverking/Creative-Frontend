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

import { isAdminAiExperimentEnabled } from '@/constants/ai-experiment'
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

type BrowserExperimentEnvValue = string | boolean | undefined
type BrowserExperimentEnvSource = Record<string, BrowserExperimentEnvValue>

interface OpenAiBrowserExperimentConfig {
  apiKey: string
  baseUrl: string
  model: string
}

interface OpenAiBrowserExperimentState {
  enabled: boolean
  config: OpenAiBrowserExperimentConfig | null
  setupError: string
}

interface OpenAiPromptDefinition {
  instructions: string
  input: string
  schemaName: string
  schema: Record<string, unknown>
}

interface OpenAiResponseUsagePayload {
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
}

interface OpenAiOutputTextContent {
  type?: string
  text?: string
}

interface OpenAiOutputMessage {
  type?: string
  content?: OpenAiOutputTextContent[]
}

interface OpenAiResponsesPayload {
  id?: string
  model?: string
  output?: OpenAiOutputMessage[]
  usage?: OpenAiResponseUsagePayload
}

const TESTAI_RESPONSES_PATH = '/responses'
const TESTAI_DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const TESTAI_EXPERIMENT_PROMPT_VERSION = 'admin-web.browser-openai.v1'
const TESTAI_API_KEY_ENV_KEY = 'VITE_TESTAI_API_KEY'
const TESTAI_BASE_URL_ENV_KEY = 'VITE_TESTAI_API_BASE_URL'
const TESTAI_MODEL_ENV_KEY = 'VITE_TESTAI_MODEL'
const TESTAI_MODEL_ADMIN_COMPOSE_ENV_KEY = 'VITE_TESTAI_API_MODEL_COMPOSE'

function readString(value: BrowserExperimentEnvValue): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim()
  if (!normalized || normalized === 'undefined' || normalized === 'null') {
    return undefined
  }

  return normalized
}

function readModelValue(env: BrowserExperimentEnvSource): string | undefined {
  return (
    readString(env[TESTAI_MODEL_ENV_KEY]) ?? readString(env[TESTAI_MODEL_ADMIN_COMPOSE_ENV_KEY])
  )
}

function createTraceId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`
}

function parseUpstreamErrorMessage(text: string, status: number): string {
  const normalizedText = text.trim()
  if (!normalizedText) {
    return `OpenAI 实验请求失败（${status}）。`
  }

  try {
    const parsed = JSON.parse(normalizedText) as {
      error?: {
        message?: string
      }
      message?: string
    }
    return parsed.error?.message || parsed.message || `OpenAI 实验请求失败（${status}）。`
  } catch {
    return normalizedText
  }
}

function assertSupportedRequest(request: AdminComposeRequest): void {
  if (!['article', 'topic', 'image'].includes(request.contentType)) {
    throw new Error('当前 OpenAI 浏览器实验层仅支持情报、游戏和图包 AI 功能。')
  }
}

function buildCommonInstructions(request: AdminComposeRequest): string {
  const rules: string[] = [
    '你是 MonoApp 管理端的内容编辑辅助助手。',
    '只能根据当前任务提供的输入块生成建议，不能借题发挥，也不能脑补未提供的事实、下载信息、版本信息或人物信息。',
    '输出必须严格符合 JSON Schema，不能输出 Markdown、解释性前缀或额外说明。'
  ]

  if (request.options?.maxTitleLength) {
    rules.push(`标题建议尽量控制在 ${request.options.maxTitleLength} 个字符以内。`)
  }

  if (request.options?.maxSummaryLength) {
    rules.push(`摘要建议尽量控制在 ${request.options.maxSummaryLength} 个字符以内。`)
  }

  if (!request.options?.includeReasons) {
    rules.push('除非确有必要，不要填充 reasons 字段。')
  }

  return rules.join('\n')
}

function buildTaskInstructions(request: AdminComposeRequest): string {
  switch (request.task) {
    case 'rewrite-title':
      if (request.contentType === 'topic') {
        return '任务是改写游戏运营标题。只能依据当前标题、摘要、正文、题材、内容类型和已有标签调整表达。标题要清晰呈现资源或运营重点，不能虚构平台、版本、下载状态或补丁信息。'
      }

      if (request.contentType === 'image') {
        return '任务是改写图包标题。只能依据当前标题、图包描述、板块、图片类型、图片数量和文件名线索生成建议。没有视觉识别结果时，不要描述具体画面、人物、服装、动作或场景细节。'
      }

      return '任务是改写情报标题。只能依据当前标题和正文内容调整标题表达，标题要自然、清晰、适合后台编辑人工采纳，避免标题党和虚构信息。'
    case 'generate-summary':
      if (request.contentType === 'topic') {
        return '任务是生成游戏摘要。只能依据当前正文、题材、内容类型和标签生成摘要，突出作品看点、资源价值或运营导览，不要编造下载链接、密码、版本号或安装步骤。'
      }

      if (request.contentType === 'image') {
        return '任务是生成图包描述。只能依据图包描述、板块、图片类型、图片数量和文件名线索生成，不要虚构具体视觉内容。描述应说明图包范围、用途、收藏价值或活动信息。'
      }

      return '任务是生成情报摘要。只能依据正文内容生成摘要，摘要应适合列表卡片和运营简介，不要写成标题，也不要引入正文之外的新事实。'
    case 'polish-summary':
      if (request.contentType === 'topic') {
        return '任务是润色游戏摘要。只能依据当前摘要、正文、题材、内容类型和标签润色，保留原始语义，提升运营表达清晰度，不要新增未提供的资源信息。'
      }

      if (request.contentType === 'image') {
        return '任务是润色图包描述。只能依据当前描述、板块、图片类型、图片数量和文件名线索润色，不要虚构图片具体画面。'
      }

      return '任务是润色情报摘要。只能依据当前摘要和正文内容润色，保留原始语义，提升清晰度和可读性，不要引入新事实。'
    case 'extract-highlights':
      return '任务是提炼内容要点。返回的 highlights 应简洁、可读，适合后台编辑快速浏览。'
    case 'structure-content':
      return '任务是给出内容结构建议。返回的 outline 应该是后台编辑可直接参考的小标题或段落结构。'
    case 'rewrite-selection':
      return '任务是改写正文选区。返回的 content 必须是可直接写回富文本编辑器的 HTML 片段，只允许使用 p / h2 / h3 / blockquote / ul / ol / li / hr / br / strong / a。不能输出 h1、span、style、class、内联颜色、背景色或任意包裹容器。你可以根据选区及其上下文自行判断是否补充 h2/h3、小列表、引用或分隔线，只要它们确实能增强阅读结构并且不引入新事实。短片段优先保持轻量，不要为了形式滥用结构，也不能扩写成整篇文章。'
    case 'continue-content':
      return '任务是基于当前光标位置续写正文。返回的 content 必须是可直接写回富文本编辑器的 HTML 片段，只允许使用 p / h2 / h3 / blockquote / ul / ol / li / hr / br / strong / a。不能输出 h1、span、style、class、内联颜色、背景色或任意包裹容器。你可以根据前后文自行判断是否引入标题、列表、引用或分隔线，只要它们确实能增强阅读节奏并保持上下文自然衔接。默认先续一个自然段；如果没有明显结构需求，不要强行插入标题或引用。'
    case 'suggest-feature-flags':
      return '任务是为游戏内容建议标签。只能从候选游戏标签中选择，最多 7 个，至少 1 个。不要为了凑数量选择没有依据的标签，返回的 id 必须来自候选标签。'
    case 'suggest-image-source':
      return '任务是为图包建议图片类型。只能从候选图片类型中选择一个：原画、壁纸、图集。不要输出候选之外的类型，也不要根据文件名强行推断具体画面。'
  }
}

function buildSchema(request: AdminComposeRequest): Record<string, unknown> {
  switch (request.task) {
    case 'rewrite-title':
      return {
        type: 'object',
        properties: {
          title: { type: 'string' },
          reasons: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 4
          }
        },
        // OpenAI 的 strict Structured Outputs 要求 properties 里的字段全部进入 required；
        // 这里保留 reasons 字段，但在不需要展示时再由前端结果层剥离。
        required: ['title', 'reasons'],
        additionalProperties: false
      }
    case 'generate-summary':
    case 'polish-summary':
      return {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          reasons: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 4
          }
        },
        required: ['summary', 'reasons'],
        additionalProperties: false
      }
    case 'extract-highlights':
      return {
        type: 'object',
        properties: {
          highlights: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 6
          },
          reasons: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 4
          }
        },
        required: ['highlights', 'reasons'],
        additionalProperties: false
      }
    case 'structure-content':
      return {
        type: 'object',
        properties: {
          outline: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 8
          },
          reasons: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 4
          }
        },
        required: ['outline', 'reasons'],
        additionalProperties: false
      }
    case 'rewrite-selection':
    case 'continue-content':
      return {
        type: 'object',
        properties: {
          content: { type: 'string' }
        },
        required: ['content'],
        additionalProperties: false
      }
    case 'suggest-feature-flags':
      return {
        type: 'object',
        properties: {
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
        required: ['featureFlagSuggestions'],
        additionalProperties: false
      }
    case 'suggest-image-source':
      return {
        type: 'object',
        properties: {
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
        required: ['imageSourceSuggestion'],
        additionalProperties: false
      }
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

function buildOpenAiPrompt(request: AdminComposeRequest): OpenAiPromptDefinition {
  assertSupportedRequest(request)

  return {
    instructions: [buildCommonInstructions(request), buildTaskInstructions(request)].join('\n\n'),
    input: buildPromptInput(request),
    schemaName: `${request.contentType}_${request.task}`.replace(/-/g, '_'),
    schema: buildSchema(request)
  }
}

export function resolveOpenAiBrowserExperimentConfig(
  env: BrowserExperimentEnvSource
): OpenAiBrowserExperimentState {
  if (!isAdminAiExperimentEnabled(env)) {
    return {
      enabled: false,
      config: null,
      setupError: ''
    }
  }

  const apiKey = readString(env[TESTAI_API_KEY_ENV_KEY])
  if (!apiKey) {
    return {
      enabled: true,
      config: null,
      setupError: `已开启 OpenAI 浏览器实验，但缺少 ${TESTAI_API_KEY_ENV_KEY}。`
    }
  }

  const model = readModelValue(env)
  if (!model) {
    return {
      enabled: true,
      config: null,
      setupError: `已开启 OpenAI 浏览器实验，但缺少 ${TESTAI_MODEL_ENV_KEY} 或 ${TESTAI_MODEL_ADMIN_COMPOSE_ENV_KEY}。`
    }
  }

  return {
    enabled: true,
    config: {
      apiKey,
      model,
      baseUrl: readString(env[TESTAI_BASE_URL_ENV_KEY]) ?? TESTAI_DEFAULT_BASE_URL
    },
    setupError: ''
  }
}

export function buildOpenAiResponsesPayload(
  request: AdminComposeRequest,
  config: Pick<OpenAiBrowserExperimentConfig, 'model'>
): Record<string, unknown> {
  const prompt = buildOpenAiPrompt(request)

  return {
    model: config.model,
    input: [
      {
        role: 'system',
        content: prompt.instructions
      },
      {
        role: 'user',
        content: prompt.input
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: prompt.schemaName,
        strict: true,
        schema: prompt.schema
      }
    }
  }
}

function normalizeUsage(
  usage: OpenAiResponseUsagePayload | undefined
): AdminComposeUsage | undefined {
  if (!usage) {
    return undefined
  }

  return {
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
    totalTokens: usage.total_tokens ?? 0
  }
}

function extractOutputText(payload: OpenAiResponsesPayload): string {
  const texts: string[] = []

  payload.output?.forEach((message) => {
    message.content?.forEach((content) => {
      if (content.type === 'output_text' && typeof content.text === 'string') {
        texts.push(content.text)
      }
    })
  })

  return texts.join('\n').trim()
}

function sanitizeResult<T extends AdminComposeResult>(
  result: T,
  includeReasons: boolean | undefined
): T {
  if (includeReasons || !('reasons' in result)) {
    return result
  }

  const nextResult = { ...result } as T & { reasons?: string[] }
  delete nextResult.reasons
  return nextResult
}

function parseOpenAiResult(
  request: AdminComposeRequest,
  payload: OpenAiResponsesPayload
): AdminComposeResult {
  const rawText = extractOutputText(payload)
  if (!rawText) {
    throw new Error('OpenAI 实验接口未返回可解析的文本结果。')
  }

  const parsed = JSON.parse(rawText) as AdminComposeResult

  switch (request.task) {
    case 'rewrite-title':
      return sanitizeResult(parsed as RewriteTitleResult, request.options?.includeReasons)
    case 'generate-summary':
    case 'polish-summary':
      return sanitizeResult(parsed as SummaryResult, request.options?.includeReasons)
    case 'extract-highlights':
      return sanitizeResult(parsed as HighlightsResult, request.options?.includeReasons)
    case 'structure-content':
      return sanitizeResult(parsed as OutlineResult, request.options?.includeReasons)
    case 'rewrite-selection':
    case 'continue-content':
      return parsed as ContentRewriteResult
    case 'suggest-feature-flags':
      return parsed as FeatureFlagSuggestionResult
    case 'suggest-image-source':
      return parsed as ImageSourceSuggestionResult
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

export function createAdminComposeResponseFromOpenAi(
  request: AdminComposeRequest,
  payload: OpenAiResponsesPayload
): AdminComposeResponse {
  return {
    task: request.task,
    contentType: request.contentType,
    model: payload.model || '',
    promptVersion: TESTAI_EXPERIMENT_PROMPT_VERSION,
    traceId: payload.id || createTraceId('browser-openai'),
    result: parseOpenAiResult(request, payload),
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

export async function runBrowserOpenAiCompose(
  request: AdminComposeRequest,
  env: BrowserExperimentEnvSource,
  signal?: AbortSignal
): Promise<AdminComposeResponse> {
  const experimentState = resolveOpenAiBrowserExperimentConfig(env)
  if (!experimentState.enabled) {
    throw new Error('OpenAI 浏览器实验未启用。')
  }

  if (!experimentState.config) {
    throw new Error(experimentState.setupError || 'OpenAI 浏览器实验配置不完整。')
  }

  const payload = buildOpenAiResponsesPayload(request, experimentState.config)
  const response = await fetch(
    `${experimentState.config.baseUrl.replace(/\/+$/, '')}${TESTAI_RESPONSES_PATH}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${experimentState.config.apiKey}`
      },
      body: JSON.stringify(payload),
      signal
    }
  )

  if (!response.ok) {
    throw new Error(parseUpstreamErrorMessage(await response.text(), response.status))
  }

  const data = (await response.json()) as OpenAiResponsesPayload
  return createAdminComposeResponseFromOpenAi(request, {
    ...data,
    model: data.model || experimentState.config.model
  })
}

export async function createBrowserOpenAiStreamResponse(
  request: AdminComposeRequest,
  env: BrowserExperimentEnvSource,
  signal?: AbortSignal
): Promise<Response> {
  try {
    const response = await runBrowserOpenAiCompose(request, env, signal)
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
      // 用户失焦、切换字段或调整选区时会主动取消当前实验请求；
      // 这里直接把取消语义抛回上游，避免被包装成“生成失败”。
      throw error
    }

    return createErrorResponse(error instanceof Error ? error.message : 'OpenAI 实验请求失败。')
  }
}
