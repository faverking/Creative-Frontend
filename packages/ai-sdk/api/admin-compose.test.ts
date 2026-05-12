import { describe, expect, it, vi } from 'vitest'

import {
  streamAdminComposeTask,
  type AdminComposeRequest,
  type AdminComposeResponse
} from './admin-compose'
import { createAiClient } from './client'

const encoder = new TextEncoder()

function createSseResponse(chunks: string[], status = 200): Response {
  return new Response(
    new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => {
          controller.enqueue(encoder.encode(chunk))
        })
        controller.close()
      }
    }),
    {
      status,
      headers: {
        'Content-Type': 'text/event-stream'
      }
    }
  )
}

function createCompletedResponse(task: AdminComposeRequest['task']): AdminComposeResponse {
  return {
    task,
    contentType: 'article',
    model: 'gpt-5.4-mini',
    promptVersion: 'article-v1',
    traceId: 'trace-1',
    result: {
      summary: '这是一段 AI 摘要。'
    }
  }
}

const baseRequest: AdminComposeRequest = {
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

describe('streamAdminComposeTask', () => {
  it('sends stream request with auth header and parses delta/completed events', async () => {
    const completedResponse = createCompletedResponse('generate-summary')
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        createSseResponse([
          'event: delta\ndata: {"text":"预览"}\n\n',
          `event: completed\ndata: ${JSON.stringify(completedResponse)}\n\n`
        ])
      )
    const ensureFreshAccessToken = vi.fn().mockResolvedValue(true)
    const getAccessToken = vi.fn().mockResolvedValue('token-1')
    const events: string[] = []

    const client = createAiClient({
      endpoint: '/api/v1/admin/ai',
      requester: {
        post: vi.fn()
      },
      streamFetch: fetchMock as typeof globalThis.fetch,
      ensureFreshAccessToken,
      getAccessToken
    })

    const result = await streamAdminComposeTask(client, baseRequest, {
      onEvent: (event) => {
        events.push(event.event)
      }
    })

    expect(result).toEqual(completedResponse)
    expect(events).toEqual(['delta', 'completed'])
    expect(ensureFreshAccessToken).toHaveBeenCalledTimes(1)
    expect(getAccessToken).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/admin/ai/compose/stream')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      Authorization: 'Bearer token-1'
    })
    expect(JSON.parse(String(init.body))).toEqual(baseRequest)
  })

  it('throws backend error event as a normal exception', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        createSseResponse([
          'event: error\ndata: {"message":"模型服务暂时不可用","traceId":"trace-2"}\n\n'
        ])
      )

    const client = createAiClient({
      endpoint: '/api/v1/admin/ai',
      requester: {
        post: vi.fn()
      },
      streamFetch: fetchMock as typeof globalThis.fetch,
      ensureFreshAccessToken: vi.fn().mockResolvedValue(true),
      getAccessToken: vi.fn().mockResolvedValue('token-1')
    })

    await expect(streamAdminComposeTask(client, baseRequest)).rejects.toThrow('模型服务暂时不可用')
  })
})
