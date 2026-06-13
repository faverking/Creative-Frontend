import type { AiClient } from './client'

export const ADMIN_AI_TASKS = [
  'rewrite-title',
  'generate-summary',
  'polish-summary',
  'extract-highlights',
  'structure-content',
  'suggest-feature-flags',
  'suggest-image-source',
  'rewrite-selection',
  'continue-content'
] as const

export type AdminAiTask = (typeof ADMIN_AI_TASKS)[number]

export const ADMIN_AI_TONES = ['neutral', 'official', 'community', 'promo'] as const
export type AdminAiTone = (typeof ADMIN_AI_TONES)[number]

export type AdminComposeContentType = 'article' | 'book' | 'topic' | 'image'

export interface AdminComposeChapterSnapshot {
  id?: number
  order?: number
  size?: number
  title?: string
  rule?: string
}

export interface AdminComposeSource {
  title?: string
  summary?: string
  content?: string
  selectionText?: string
  selectionPrefix?: string
  selectionSuffix?: string
  cursorPrefix?: string
  cursorSuffix?: string
  themeId?: number
  topicId?: number
  typeId?: number
  featureFlags?: number[]
  downloadUrl?: string
  author?: string[]
  part?: number
  status?: number
  area?: number
  chapterList?: AdminComposeChapterSnapshot[]
  source?: string
  imageCount?: number
  fileNameHints?: string[]
  coverSelected?: boolean
  hasArchive?: boolean
  embeddedImageCount?: number
  embeddedVideoCount?: number
}

export interface AdminComposeOptions {
  tone?: AdminAiTone
  maxTitleLength?: number
  maxSummaryLength?: number
  includeReasons?: boolean
}

export interface AdminComposeRequest {
  contentType: AdminComposeContentType
  task: AdminAiTask
  source: AdminComposeSource
  options?: AdminComposeOptions
}

export interface AdminComposeUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface RewriteTitleResult {
  title: string
  reasons?: string[]
}

export interface SummaryResult {
  summary: string
  reasons?: string[]
}

export interface HighlightsResult {
  highlights: string[]
  reasons?: string[]
}

export interface OutlineResult {
  outline: string[]
  reasons?: string[]
}

export interface FeatureFlagSuggestion {
  id: number
  label: string
  reason: string
}

export interface FeatureFlagSuggestionResult {
  featureFlagSuggestions: FeatureFlagSuggestion[]
}

export interface ImageSourceSuggestionResult {
  imageSourceSuggestion: {
    source: string
    reason: string
  }
}

export interface ContentRewriteResult {
  content: string
}

export type AdminComposeResult =
  | RewriteTitleResult
  | SummaryResult
  | HighlightsResult
  | OutlineResult
  | FeatureFlagSuggestionResult
  | ImageSourceSuggestionResult
  | ContentRewriteResult

export interface AdminComposeResponse {
  task: AdminAiTask
  contentType: AdminComposeContentType
  model: string
  promptVersion: string
  traceId: string
  result: AdminComposeResult
  usage?: AdminComposeUsage
}

export interface AdminAiStreamDeltaEvent {
  event: 'delta'
  data: {
    text: string
  }
}

export interface AdminAiStreamCompletedEvent {
  event: 'completed'
  data: AdminComposeResponse
}

export interface AdminAiStreamErrorEvent {
  event: 'error'
  data: {
    message: string
    traceId: string
  }
}

export type AdminAiStreamEvent =
  | AdminAiStreamDeltaEvent
  | AdminAiStreamCompletedEvent
  | AdminAiStreamErrorEvent

export interface StreamAdminComposeTaskOptions {
  signal?: AbortSignal
  onEvent?: (event: AdminAiStreamEvent) => void
  onDelta?: (data: AdminAiStreamDeltaEvent['data']) => void
  onCompleted?: (data: AdminComposeResponse) => void
  onError?: (data: AdminAiStreamErrorEvent['data']) => void
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function createAbortError(): DOMException {
  return new DOMException('AI 流式请求已取消。', 'AbortError')
}

function parseErrorMessage(status: number, text: string): string {
  const normalizedText = text.trim()
  if (!normalizedText) {
    return `AI 请求失败（${status}）。`
  }

  try {
    const parsed = JSON.parse(normalizedText) as {
      message?: string
      error?: string
    }
    return parsed.message || parsed.error || `AI 请求失败（${status}）。`
  } catch {
    return normalizedText
  }
}

function parseSseFrame(frame: string): AdminAiStreamEvent | null {
  const lines = frame
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)

  if (lines.length === 0) {
    return null
  }

  let eventName = ''
  const dataLines: string[] = []

  lines.forEach((line) => {
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim()
      return
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trim())
    }
  })

  if (!eventName || dataLines.length === 0) {
    return null
  }

  const rawPayload = dataLines.join('\n')
  const payload = JSON.parse(rawPayload) as AdminAiStreamEvent['data']

  if (eventName === 'delta') {
    return {
      event: 'delta',
      data: payload as AdminAiStreamDeltaEvent['data']
    }
  }

  if (eventName === 'completed') {
    return {
      event: 'completed',
      data: payload as AdminComposeResponse
    }
  }

  if (eventName === 'error') {
    return {
      event: 'error',
      data: payload as AdminAiStreamErrorEvent['data']
    }
  }

  return null
}

export async function runAdminComposeTask(
  client: AiClient,
  request: AdminComposeRequest
): Promise<AdminComposeResponse> {
  return client
    .getRequester()
    .post<AdminComposeResponse, AdminComposeRequest>(client.resolveUrl('/compose'), request)
}

export async function streamAdminComposeTask(
  client: AiClient,
  request: AdminComposeRequest,
  options: StreamAdminComposeTaskOptions = {}
): Promise<AdminComposeResponse> {
  // 流式接口需要自定义 POST body、Authorization 和 SSE 读取过程，
  // 这类能力超出了当前普通 HttpClient.post 的返回模型，所以这里单独走 fetch。
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    'Content-Type': 'application/json'
  }

  if (client.resolveStreamAuth() === 'bearer') {
    const hasFreshAccessToken = await client.ensureFreshAccessToken()
    // 开流前先刷新一次 token，避免 SSE 建链后才因 401 中断，导致前端只能拿到半段预览文本。
    if (!hasFreshAccessToken) {
      throw new Error('登录状态已失效，请重新登录后再试。')
    }

    const accessToken = await client.getAccessToken()
    if (!accessToken) {
      throw new Error('缺少访问令牌，无法发起 AI 请求。')
    }

    headers.Authorization = `Bearer ${accessToken}`
  }

  const response = await client.resolveStreamFetch()(client.resolveUrl('/compose/stream'), {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
    signal: options.signal
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(parseErrorMessage(response.status, errorText))
  }

  if (!response.body) {
    throw new Error('AI 流式响应缺少可读数据流。')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let completedResponse: AdminComposeResponse | null = null

  const abortHandler = () => {
    void reader.cancel()
  }

  options.signal?.addEventListener('abort', abortHandler)

  try {
    while (!options.signal?.aborted) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      buffer = `${buffer}${decoder.decode(value, { stream: true })}`.replace(/\r\n/g, '\n')
      const frames = buffer.split('\n\n')
      buffer = frames.pop() ?? ''

      for (const frame of frames) {
        const event = parseSseFrame(frame)
        if (!event) {
          continue
        }

        options.onEvent?.(event)

        if (event.event === 'delta') {
          options.onDelta?.(event.data)
          continue
        }

        if (event.event === 'completed') {
          completedResponse = event.data
          options.onCompleted?.(event.data)
          continue
        }

        if (event.event === 'error') {
          options.onError?.(event.data)
          throw new Error(event.data.message || 'AI 流式请求失败。')
        }
      }
    }
  } catch (error) {
    if (isAbortError(error) || options.signal?.aborted) {
      throw createAbortError()
    }

    throw error
  } finally {
    options.signal?.removeEventListener('abort', abortHandler)
    decoder.decode()
  }

  if (options.signal?.aborted) {
    throw createAbortError()
  }

  if (buffer.trim()) {
    const event = parseSseFrame(buffer)
    if (event?.event === 'completed') {
      completedResponse = event.data
      options.onEvent?.(event)
      options.onCompleted?.(event.data)
    }
  }

  if (!completedResponse) {
    throw new Error('AI 流式响应未返回完成结果。')
  }

  return completedResponse
}
