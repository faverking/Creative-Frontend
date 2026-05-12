import { reactive } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createAiClient,
  type AdminComposeRequest,
  type AdminComposeResponse
} from '@frontend/ai-sdk'

import { useArticleEditorAutocomplete } from './useArticleEditorAutocomplete'
import type {
  RichTextEditorExpose,
  RichTextEditorSelectionSnapshot
} from '@/types/rich-text-editor'

const encoder = new TextEncoder()

function createCompletedResponse(
  task: AdminComposeRequest['task'],
  result: AdminComposeResponse['result']
): AdminComposeResponse {
  return {
    task,
    contentType: 'article',
    model: 'gpt-5.4-mini',
    promptVersion: 'article-v2',
    traceId: 'trace-editor',
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

function createEditor(): RichTextEditorExpose {
  return {
    replaceSelection: vi.fn(),
    insertAtCursor: vi.fn(),
    focus: vi.fn()
  }
}

async function flushStreamLoop(): Promise<void> {
  await Promise.resolve()
  await vi.advanceTimersByTimeAsync(0)
}

beforeEach(() => {
  vi.useFakeTimers()
})

const selectionSnapshot: RichTextEditorSelectionSnapshot = {
  mode: 'range',
  plainText: '前文上下文 原始片段 后文上下文',
  selectedText: '原始片段',
  range: {
    index: 6,
    length: 4
  },
  anchor: {
    left: 120,
    top: 80,
    width: 64,
    height: 24,
    containerHeight: 420
  }
}

describe('useArticleEditorAutocomplete', () => {
  it('runs selection rewrite and applies result back into editor selection', async () => {
    const { client, fetchMock } = createClient(
      createSseResponse(
        createCompletedResponse('rewrite-selection', {
          content: '改写后的片段'
        })
      )
    )
    const form = reactive({
      title: '文章标题',
      themeId: 2,
      desc: '摘要',
      content: '<p>正文内容</p>'
    })
    const editor = createEditor()
    const autocomplete = useArticleEditorAutocomplete(form, client)

    autocomplete.updateSelectionSnapshot(selectionSnapshot)
    await autocomplete.run(editor)

    const request = parseRequest(fetchMock)
    expect(request.task).toBe('rewrite-selection')
    expect(request.source.selectionText).toBe('原始片段')
    expect(request.source.selectionPrefix).toBe('前文上下文')
    expect(autocomplete.actionLabel.value).toBe('AI 优化')

    autocomplete.acceptSuggestion(editor)
    expect(editor.replaceSelection).toHaveBeenCalledWith('改写后的片段')
    expect(editor.insertAtCursor).not.toHaveBeenCalled()
  })

  it('runs caret continuation and inserts result at cursor', async () => {
    const { client, fetchMock } = createClient(
      createSseResponse(
        createCompletedResponse('continue-content', {
          content: '继续往下写的内容'
        })
      )
    )
    const form = reactive({
      title: '文章标题',
      themeId: 2,
      desc: '',
      content: '<p>正文内容</p>'
    })
    const editor = createEditor()
    const autocomplete = useArticleEditorAutocomplete(form, client)

    autocomplete.updateSelectionSnapshot({
      ...selectionSnapshot,
      mode: 'caret',
      selectedText: '',
      range: {
        index: 10,
        length: 0
      }
    })
    await autocomplete.run(editor)

    const request = parseRequest(fetchMock)
    expect(request.task).toBe('continue-content')
    expect(request.source.cursorPrefix).toBe('前文上下文 原始片段')

    autocomplete.acceptSuggestion(editor)
    expect(editor.insertAtCursor).toHaveBeenCalledWith('继续往下写的内容')
    expect(editor.replaceSelection).not.toHaveBeenCalled()
  })

  it('keeps html editor suggestion for apply while showing readable preview', async () => {
    const { client } = createClient(
      createSseResponse(
        createCompletedResponse('rewrite-selection', {
          content: '<h2>段落标题</h2><p>第一段内容</p><ul><li>要点一</li><li>要点二</li></ul>'
        })
      )
    )
    const form = reactive({
      title: '文章标题',
      themeId: 2,
      desc: '摘要',
      content: '<p>正文内容</p>'
    })
    const editor = createEditor()
    const autocomplete = useArticleEditorAutocomplete(form, client)

    autocomplete.updateSelectionSnapshot(selectionSnapshot)
    await autocomplete.run(editor)

    expect(autocomplete.previewText.value).toBe('段落标题\n\n第一段内容\n\n• 要点一\n• 要点二')

    autocomplete.acceptSuggestion(editor)
    expect(editor.replaceSelection).toHaveBeenCalledWith(
      '<h2>段落标题</h2><p>第一段内容</p><ul><li>要点一</li><li>要点二</li></ul>'
    )
  })

  it('shows waiting popover immediately while editor suggestion is still streaming', async () => {
    const deferred = createDeferredSseResponse()
    const { client } = createClient(deferred.response)
    const form = reactive({
      title: '文章标题',
      themeId: 2,
      desc: '',
      content: '<p>正文内容</p>'
    })
    const editor = createEditor()
    const autocomplete = useArticleEditorAutocomplete(form, client)

    autocomplete.updateSelectionSnapshot(selectionSnapshot)
    const runPromise = autocomplete.run(editor)
    await flushStreamLoop()

    expect(autocomplete.status.value).toBe('streaming')
    expect(autocomplete.hasSuggestion.value).toBe(true)
    expect(autocomplete.showActionBubble.value).toBe(false)
    expect(autocomplete.popoverPlacement.value).toBe('below')
    expect(autocomplete.previewText.value).toBe('正在结合选区上下文生成改写建议…')

    autocomplete.dismissSuggestion()
    deferred.close()
    await runPromise
  })

  it('clears pending suggestion when editor content changes externally', async () => {
    const { client } = createClient(
      createSseResponse(
        createCompletedResponse('rewrite-selection', {
          content: '改写后的片段'
        })
      )
    )
    const form = reactive({
      title: '文章标题',
      themeId: 2,
      desc: '',
      content: '<p>正文内容</p>'
    })
    const editor = createEditor()
    const autocomplete = useArticleEditorAutocomplete(form, client)

    autocomplete.updateSelectionSnapshot(selectionSnapshot)
    await autocomplete.run(editor)
    expect(autocomplete.status.value).toBe('completed')

    autocomplete.handleExternalContentChange()
    expect(autocomplete.status.value).toBe('idle')
  })

  it('flips suggestion popover above when the selection is near the bottom edge', () => {
    const { client } = createClient(
      createSseResponse(
        createCompletedResponse('rewrite-selection', {
          content: '改写后的片段'
        })
      )
    )
    const form = reactive({
      title: '文章标题',
      themeId: 2,
      desc: '摘要',
      content: '<p>正文内容</p>'
    })
    const autocomplete = useArticleEditorAutocomplete(form, client)

    autocomplete.updateSelectionSnapshot({
      ...selectionSnapshot,
      anchor: {
        ...selectionSnapshot.anchor,
        top: 350,
        containerHeight: 400
      }
    })

    expect(autocomplete.popoverPlacement.value).toBe('above')
    expect(autocomplete.anchorStyle.value.top).toBe('336px')
  })
})
