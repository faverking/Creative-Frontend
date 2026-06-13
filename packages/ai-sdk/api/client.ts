export interface AiRequester {
  post<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: Record<string, unknown>
  ): Promise<T>
}

type MaybePromise<T> = T | Promise<T>

type FetchLike = typeof globalThis.fetch
export type AiStreamAuthMode = 'bearer' | 'none'

export interface AiClientOptions {
  endpoint: string
  requester: AiRequester
  getAccessToken?: () => MaybePromise<string | undefined>
  ensureFreshAccessToken?: () => Promise<boolean>
  streamFetch?: FetchLike
  streamAuth?: AiStreamAuthMode
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function trimLeadingSlash(value: string): string {
  return value.replace(/^\/+/, '')
}

export class AiClient {
  private readonly endpoint: string

  constructor(private readonly options: AiClientOptions) {
    this.endpoint = trimTrailingSlash(options.endpoint)
  }

  getEndpoint(): string {
    return this.endpoint
  }

  getRequester(): AiRequester {
    return this.options.requester
  }

  async getAccessToken(): Promise<string | undefined> {
    return this.options.getAccessToken?.()
  }

  async ensureFreshAccessToken(): Promise<boolean> {
    return (await this.options.ensureFreshAccessToken?.()) ?? true
  }

  resolveStreamAuth(): AiStreamAuthMode {
    return this.options.streamAuth ?? 'bearer'
  }

  resolveStreamFetch(): FetchLike {
    // streamFetch 只服务流式协议和测试替身，不对外表达成第二套 transport 心智。
    if (this.options.streamFetch) {
      return this.options.streamFetch
    }

    if (typeof globalThis.fetch !== 'function') {
      throw new Error('当前运行环境不支持 fetch。')
    }

    return globalThis.fetch.bind(globalThis)
  }

  resolveUrl(path: string): string {
    return `${this.endpoint}/${trimLeadingSlash(path)}`
  }
}

export function createAiClient(options: AiClientOptions): AiClient {
  return new AiClient(options)
}
