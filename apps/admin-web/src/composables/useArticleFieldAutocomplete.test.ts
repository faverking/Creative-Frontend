import { reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createAiClient,
  type AdminComposeRequest,
  type AdminComposeResponse
} from '@frontend/ai-sdk'

import { useArticleFieldAutocomplete } from './useArticleFieldAutocomplete'

const encoder = new TextEncoder()

function createCompletedResponse(
  task: AdminComposeRequest['task'],
  result: AdminComposeResponse['result']
): AdminComposeResponse {
  return {
    task,
    contentType: 'article',
    model: 'deepseek-v4-flash',
    promptVersion: 'article-v2',
    traceId: 'trace-1',
    result
  }
}

function createSseResponse(payload: AdminComposeResponse): Response {
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`event: completed\ndata: ${JSON.stringify(payload)}\n\n`))
        controller.close()
      }
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream'
      }
    }
  )
}

function createDeferredSseResponse() {
  let streamController: ReadableStreamDefaultController<Uint8Array> | null = null

  const response = new Response(
    new ReadableStream({
      start(controller) {
        streamController = controller
      }
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream'
      }
    }
  )

  return {
    response,
    close() {
      try {
        streamController?.close()
      } catch {
        // abort 场景下 reader.cancel 会先关闭流，这里允许重复 close。
      }
    }
  }
}

function createClient(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  const client = createAiClient({
    endpoint: '/api/v1/admin/ai',
    requester: {
      post: vi.fn()
    },
    streamFetch: fetchMock as typeof globalThis.fetch,
    ensureFreshAccessToken: vi.fn().mockResolvedValue(true),
    getAccessToken: vi.fn().mockResolvedValue('token-1')
  })

  return {
    client,
    fetchMock
  }
}

function parseRequest(fetchMock: ReturnType<typeof vi.fn>): AdminComposeRequest {
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  return JSON.parse(String(init.body)) as AdminComposeRequest
}

async function flushAutoRun(): Promise<void> {
  await vi.advanceTimersByTimeAsync(620)
  await Promise.resolve()
}

async function flushStreamLoop(): Promise<void> {
  await Promise.resolve()
  await vi.advanceTimersByTimeAsync(0)
}

beforeEach(() => {
  vi.useFakeTimers()
})

describe('useArticleFieldAutocomplete', () => {
  it('auto-runs title suggestion after debounce and skips IME composition stage', async () => {
    const { client, fetchMock } = createClient(
      createSseResponse(
        createCompletedResponse('rewrite-title', {
          title: '更聚焦的新标题'
        })
      )
    )
    const form = reactive({
      title: '',
      themeId: 2,
      desc: '',
      content: '<p>正文内容</p>'
    })
    const autocomplete = useArticleFieldAutocomplete({
      field: 'title',
      form,
      client
    })

    autocomplete.activate()
    autocomplete.handleCompositionStart()
    form.title = '这是一个足够长的标题'
    await flushAutoRun()

    expect(fetchMock).not.toHaveBeenCalled()

    autocomplete.handleCompositionEnd()
    await flushAutoRun()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(parseRequest(fetchMock).task).toBe('rewrite-title')
  })

  it('restarts auto run after dismissing and re-entering the same field', async () => {
    const { client, fetchMock } = createClient(
      createSseResponse(
        createCompletedResponse('rewrite-title', {
          title: '更聚焦的新标题'
        })
      )
    )
    const form = reactive({
      title: '这是一个足够长的标题',
      themeId: 2,
      desc: '',
      content: '<p>正文内容</p>'
    })
    const autocomplete = useArticleFieldAutocomplete({
      field: 'title',
      form,
      client
    })

    autocomplete.activate()
    await flushAutoRun()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    autocomplete.dismissSuggestion()
    autocomplete.deactivate()
    await Promise.resolve()
    autocomplete.activate()
    await flushAutoRun()

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('shows waiting feedback immediately while title suggestion is still streaming', async () => {
    const deferred = createDeferredSseResponse()
    const { client } = createClient(deferred.response)
    const form = reactive({
      title: '这是一个足够长的标题',
      themeId: 2,
      desc: '',
      content: '<p>正文内容</p>'
    })
    const autocomplete = useArticleFieldAutocomplete({
      field: 'title',
      form,
      client
    })

    const runPromise = autocomplete.rerunSuggestion()
    await flushStreamLoop()

    expect(autocomplete.status.value).toBe('streaming')
    expect(autocomplete.showSuggestion.value).toBe(true)
    expect(autocomplete.previewText.value).toBe('正在根据当前标题和正文生成标题建议…')
    expect(autocomplete.manualButtonLabel.value).toBe('生成中')

    autocomplete.dismissSuggestion()
    deferred.close()
    await runPromise
  })

  it('uses generate-summary when summary is empty and applies result only after accept', async () => {
    const { client, fetchMock } = createClient(
      createSseResponse(
        createCompletedResponse('generate-summary', {
          summary: 'AI 自动生成的摘要'
        })
      )
    )
    const form = reactive({
      title: '标题输入',
      themeId: 3,
      desc: '',
      content: '<p>正文内容已经足够丰富，可以自动生成摘要。</p>'
    })
    const autocomplete = useArticleFieldAutocomplete({
      field: 'summary',
      form,
      client
    })

    autocomplete.activate()
    await flushAutoRun()

    expect(parseRequest(fetchMock).task).toBe('generate-summary')
    expect(form.desc).toBe('')

    autocomplete.acceptSuggestion()
    expect(form.desc).toBe('AI 自动生成的摘要')
  })

  it('switches to polish-summary when manual summary exists', async () => {
    const { client, fetchMock } = createClient(
      createSseResponse(
        createCompletedResponse('polish-summary', {
          summary: '润色后的摘要'
        })
      )
    )
    const form = reactive({
      title: '标题输入',
      themeId: 3,
      desc: '这是一段已经填写的摘要内容',
      content: '<p>正文内容</p>'
    })
    const autocomplete = useArticleFieldAutocomplete({
      field: 'summary',
      form,
      client
    })

    await autocomplete.rerunSuggestion()

    expect(parseRequest(fetchMock).task).toBe('polish-summary')
    expect(form.desc).toBe('这是一段已经填写的摘要内容')
    autocomplete.acceptSuggestion()
    expect(form.desc).toBe('润色后的摘要')
  })
})
