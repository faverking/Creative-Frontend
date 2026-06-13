import { describe, expect, it, vi } from 'vitest'

import type { AdminComposeRequest, AdminComposeResponse } from '../api/admin-compose'
import { createAiClient } from '../api/client'
import { useAiTaskRunner } from './useAiTaskRunner'

const encoder = new TextEncoder()

function createCompletedResponse(): AdminComposeResponse {
  return {
    task: 'generate-summary',
    contentType: 'article',
    model: 'deepseek-v4-flash',
    promptVersion: 'article-v1',
    traceId: 'trace-1',
    result: {
      summary: '这是一段 AI 摘要。'
    }
  }
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
    push(chunk: string) {
      streamController?.enqueue(encoder.encode(chunk))
    },
    close() {
      try {
        streamController?.close()
      } catch {
        // abort 场景下 reader.cancel 会先关闭流，这里允许重复 close。
      }
    }
  }
}

const request: AdminComposeRequest = {
  contentType: 'article',
  task: 'generate-summary',
  source: {
    title: '标题',
    content: '正文内容'
  },
  options: {
    tone: 'neutral',
    maxSummaryLength: 160,
    includeReasons: false
  }
}

async function flushStreamLoop(): Promise<void> {
  await Promise.resolve()
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('useAiTaskRunner', () => {
  it('updates preview and result when stream completes', async () => {
    const deferred = createDeferredSseResponse()
    const client = createAiClient({
      endpoint: '/api/v1/admin/ai',
      requester: {
        post: vi.fn()
      },
      streamFetch: vi.fn().mockResolvedValue(deferred.response) as typeof globalThis.fetch,
      ensureFreshAccessToken: vi.fn().mockResolvedValue(true),
      getAccessToken: vi.fn().mockResolvedValue('token-1')
    })
    const runner = useAiTaskRunner(client)

    const taskPromise = runner.run(request)
    await flushStreamLoop()

    expect(runner.status.value).toBe('streaming')

    deferred.push('event: delta\ndata: {"text":"预览片段"}\n\n')
    await flushStreamLoop()
    expect(runner.streamPreviewText.value).toBe('预览片段')

    deferred.push(`event: completed\ndata: ${JSON.stringify(createCompletedResponse())}\n\n`)
    deferred.close()
    await taskPromise

    expect(runner.status.value).toBe('completed')
    expect(runner.result.value?.result).toEqual({
      summary: '这是一段 AI 摘要。'
    })
  })

  it('returns to idle when task is aborted', async () => {
    const deferred = createDeferredSseResponse()
    const client = createAiClient({
      endpoint: '/api/v1/admin/ai',
      requester: {
        post: vi.fn()
      },
      streamFetch: vi.fn().mockResolvedValue(deferred.response) as typeof globalThis.fetch,
      ensureFreshAccessToken: vi.fn().mockResolvedValue(true),
      getAccessToken: vi.fn().mockResolvedValue('token-1')
    })
    const runner = useAiTaskRunner(client)

    const taskPromise = runner.run(request)
    await flushStreamLoop()

    runner.abort()
    deferred.close()
    await taskPromise

    expect(runner.status.value).toBe('idle')
    expect(runner.streamPreviewText.value).toBe('')
    expect(runner.result.value).toBeNull()
  })
})
