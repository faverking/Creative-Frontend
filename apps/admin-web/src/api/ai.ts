import { createAiClient, type AiClient, type AiRequester } from '@frontend/ai-sdk'

import {
  createBrowserDeepSeekStreamResponse,
  runBrowserDeepSeekCompose
} from '@/api/deepseek-browser-compose'

let aiClient: AiClient | null = null

function parseDeepSeekStreamRequest(
  init?: RequestInit
): Parameters<typeof createBrowserDeepSeekStreamResponse>[0] {
  const rawBody = typeof init?.body === 'string' ? init.body : ''
  return JSON.parse(rawBody) as Parameters<typeof createBrowserDeepSeekStreamResponse>[0]
}

function createDeepSeekRequester(): AiRequester {
  return {
    async post<T = unknown, D = unknown>(_url: string, data?: D): Promise<T> {
      return (await runBrowserDeepSeekCompose(
        data as Parameters<typeof runBrowserDeepSeekCompose>[0],
        import.meta.env
      )) as T
    }
  }
}

export function getAiClient(): AiClient {
  if (!aiClient) {
    aiClient = createAiClient({
      endpoint: '/admin/deepseek',
      requester: createDeepSeekRequester(),
      streamFetch: async (_url, init) => {
        const request = parseDeepSeekStreamRequest(init)
        const signal = init?.signal ?? undefined
        return createBrowserDeepSeekStreamResponse(request, import.meta.env, signal)
      },
      streamAuth: 'none'
    })
  }

  return aiClient
}
