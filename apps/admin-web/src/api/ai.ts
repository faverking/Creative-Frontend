import { createAiClient, type AiClient, type AiRequester } from '@frontend/ai-sdk'
import { loadEnvConfig } from '@frontend/config'

import { getHttpClient } from './index'
import { ensureFreshAccessToken, getAuthRuntime } from '@/auth/runtime'
import { isAdminAiExperimentEnabled } from '@/constants/ai-experiment'
import {
  createBrowserOpenAiStreamResponse,
  runBrowserOpenAiCompose
} from '@/api/openai-browser-experiment'

const env = loadEnvConfig(import.meta.env)
const isBrowserOpenAiExperimentEnabled = isAdminAiExperimentEnabled(import.meta.env)

function trimSlash(value: string): string {
  return value.replace(/^\/+|\/+$/g, '')
}

function resolveAdminAiEndpoint(): string {
  const baseUrl = env.apiBaseUrl.replace(/\/+$/, '')
  const prefix = trimSlash(env.apiPrefix)
  const path = trimSlash('/admin/ai')

  if (!baseUrl) {
    return `/${[prefix, path].filter(Boolean).join('/')}`
  }

  return `${baseUrl}/${[prefix, path].filter(Boolean).join('/')}`
}

function normalizeRequesterUrl(url: string): string {
  const prefix = trimSlash(env.apiPrefix)
  if (env.apiBaseUrl || !prefix) {
    return url
  }

  // requester 复用的是已经带 apiPrefix 的 HttpClient。
  // 开发和测试环境下如果不把这里的前缀剥掉，就会叠成 /api/v1/api/v1/...。
  const prefixedPath = `/${prefix}`
  if (url === prefixedPath) {
    return '/'
  }

  if (url.startsWith(`${prefixedPath}/`)) {
    return url.slice(prefixedPath.length)
  }

  return url
}

let aiClient: AiClient | null = null

function parseExperimentStreamRequest(
  init?: RequestInit
): Parameters<typeof createBrowserOpenAiStreamResponse>[0] {
  const rawBody = typeof init?.body === 'string' ? init.body : ''
  return JSON.parse(rawBody) as Parameters<typeof createBrowserOpenAiStreamResponse>[0]
}

function createRequester(): AiRequester {
  return {
    post<T = unknown, D = unknown>(
      url: string,
      data?: D,
      config?: Record<string, unknown>
    ): Promise<T> {
      return getHttpClient().post<T, D>(normalizeRequesterUrl(url), data, config)
    }
  }
}

function createExperimentRequester(): AiRequester {
  return {
    async post<T = unknown, D = unknown>(_url: string, data?: D): Promise<T> {
      return (await runBrowserOpenAiCompose(
        data as Parameters<typeof runBrowserOpenAiCompose>[0],
        import.meta.env
      )) as T
    }
  }
}

export function getAiClient(): AiClient {
  if (!aiClient) {
    if (isBrowserOpenAiExperimentEnabled) {
      aiClient = createAiClient({
        endpoint: resolveAdminAiEndpoint(),
        requester: createExperimentRequester(),
        streamFetch: async (_url, init) => {
          const request = parseExperimentStreamRequest(init)
          const signal = init?.signal ?? undefined
          return createBrowserOpenAiStreamResponse(request, import.meta.env, signal)
        },
        // 浏览器实验链路由显式开关控制，不依赖后台 token 刷新状态，
        // 这样页面侧可以沿用既有 AiClient / runner，而不用再分一套调用入口。
        ensureFreshAccessToken: async () => true,
        getAccessToken: async () => 'browser-openai-experiment'
      })
      return aiClient
    }

    aiClient = createAiClient({
      endpoint: resolveAdminAiEndpoint(),
      requester: createRequester(),
      ensureFreshAccessToken,
      getAccessToken: () => getAuthRuntime()?.loginSdk.getToken()
    })
  }

  return aiClient
}
