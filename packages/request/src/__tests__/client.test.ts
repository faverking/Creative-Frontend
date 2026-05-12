import { AxiosError, type AxiosAdapter } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import { createHttpClient } from '../client'

const successAdapter: AxiosAdapter = async (config) => ({
  data: { code: 0, data: { ok: true } },
  status: 200,
  statusText: 'OK',
  headers: {},
  config
})

describe('createHttpClient', () => {
  it('rejects when permission checker returns false', async () => {
    const client = createHttpClient({
      permissionChecker: vi.fn().mockResolvedValue(false)
    })

    await expect(
      client.get('/users', {
        permission: {
          resource: 'user',
          action: 'read'
        },
        adapter: successAdapter
      })
    ).rejects.toThrow('Permission denied: user:read')
  })

  it('injects token, trace id and permission headers', async () => {
    let capturedHeaders: Record<string, string> = {}

    const adapter: AxiosAdapter = async (config) => {
      capturedHeaders = (config.headers ?? {}) as Record<string, string>
      return {
        data: { code: 0, data: null },
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      }
    }

    const client = createHttpClient({
      getToken: () => 'token-123',
      permissionChecker: () => true,
      generateTraceId: () => 'trace-fixed'
    })

    await client.get('/users', {
      permission: {
        resource: 'user',
        action: 'read'
      },
      adapter
    })

    expect(capturedHeaders.Authorization).toBe('Bearer token-123')
    expect(capturedHeaders['x-trace-id']).toBe('trace-fixed')
    expect(capturedHeaders['x-resource']).toBe('user')
    expect(capturedHeaders['x-action']).toBe('read')
  })

  it('does not generate trace header when no trace strategy is provided', async () => {
    let capturedHeaders: Record<string, string> = {}

    const adapter: AxiosAdapter = async (config) => {
      capturedHeaders = (config.headers ?? {}) as Record<string, string>
      return {
        data: { code: 0, data: null },
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      }
    }

    const client = createHttpClient({
      getToken: () => 'token-123'
    })

    await client.get('/users', {
      skipPermission: true,
      adapter
    })

    expect(capturedHeaders['x-trace-id']).toBeUndefined()
  })

  it('resolves trace id from successful response payload', async () => {
    const onTraceResolved = vi.fn()

    const adapter: AxiosAdapter = async (config) => ({
      data: { code: 0, traceId: 'server-trace-1', data: { ok: true } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    })

    const client = createHttpClient({
      onTraceResolved
    })

    await client.get('/users', {
      skipPermission: true,
      adapter
    })

    expect(onTraceResolved).toHaveBeenCalledWith('server-trace-1')
  })

  it('unwraps successful responses and notifies onUnwrapResolved', async () => {
    const onUnwrapResolved = vi.fn()

    const client = createHttpClient({
      onUnwrapResolved
    })

    const payload = await client.get('/users', {
      skipPermission: true,
      adapter: successAdapter
    })

    expect(payload).toEqual({ ok: true })
    expect(onUnwrapResolved).toHaveBeenCalledWith(
      { ok: true },
      expect.objectContaining({
        status: 200
      })
    )
  })

  it('refreshes token and retries once when api returns 401', async () => {
    let currentToken = 'expired-token'
    const unauthorizedHandler = vi.fn()
    const serverErrorHandler = vi.fn()
    const refreshHandler = vi.fn(async () => {
      currentToken = 'fresh-token'
      return currentToken
    })

    const callHeaders: Array<Record<string, string>> = []

    const adapter: AxiosAdapter = async (config) => {
      callHeaders.push({ ...((config.headers ?? {}) as Record<string, string>) })
      if (callHeaders.length === 1) {
        const response = {
          data: { code: 401001, message: 'token expired', traceId: 'server-trace-401' },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config
        }
        return Promise.reject(
          new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, {}, response)
        )
      }

      return {
        data: { code: 0, data: { ok: true } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      }
    }

    const traceResolved = vi.fn()
    const client = createHttpClient({
      getToken: () => currentToken,
      refreshToken: refreshHandler,
      onTraceResolved: traceResolved,
      onUnauthorized: unauthorizedHandler,
      onServerError: serverErrorHandler
    })

    const response = await client.get('/auth/me', {
      adapter,
      skipPermission: true
    })

    expect(response).toEqual({ ok: true })
    expect(refreshHandler).toHaveBeenCalledTimes(1)
    expect(traceResolved).toHaveBeenCalledWith('server-trace-401')
    expect(unauthorizedHandler).not.toHaveBeenCalled()
    expect(serverErrorHandler).not.toHaveBeenCalled()
    expect(callHeaders).toHaveLength(2)
    expect(callHeaders[0].Authorization).toBe('Bearer expired-token')
    expect(callHeaders[1].Authorization).toBe('Bearer fresh-token')
  })

  it('treats an explicit Authorization header as authenticated for optional auth requests', async () => {
    const refreshHandler = vi.fn(async () => 'fresh-token')
    const unauthorizedHandler = vi.fn()
    const callHeaders: Array<Record<string, string>> = []

    const adapter: AxiosAdapter = async (config) => {
      callHeaders.push({ ...((config.headers ?? {}) as Record<string, string>) })
      if (callHeaders.length === 1) {
        const response = {
          data: { message: 'token expired' },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config
        }
        return Promise.reject(
          new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, {}, response)
        )
      }

      return {
        data: { code: 0, data: { ok: true } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      }
    }

    const client = createHttpClient({
      refreshToken: refreshHandler,
      onUnauthorized: unauthorizedHandler
    })

    const response = await client.get('/articles/1', {
      adapter,
      optionalAuth: true,
      skipPermission: true,
      headers: {
        Authorization: 'Bearer explicit-token'
      }
    })

    expect(response).toEqual({ ok: true })
    expect(refreshHandler).toHaveBeenCalledTimes(1)
    expect(unauthorizedHandler).not.toHaveBeenCalled()
    expect(callHeaders).toHaveLength(2)
    expect(callHeaders[0].Authorization).toBe('Bearer explicit-token')
    expect(callHeaders[1].Authorization).toBe('Bearer fresh-token')
  })

  it('falls back to anonymous retry for optional auth requests when refresh fails', async () => {
    const unauthorizedHandler = vi.fn()
    const refreshHandler = vi.fn(async () => {
      throw new Error('refresh failed')
    })
    const callHeaders: Array<Record<string, string>> = []

    const adapter: AxiosAdapter = async (config) => {
      callHeaders.push({ ...((config.headers ?? {}) as Record<string, string>) })
      if (callHeaders.length === 1) {
        const response = {
          data: { message: 'token expired' },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config
        }
        return Promise.reject(
          new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, {}, response)
        )
      }

      return {
        data: { code: 0, data: { ok: true } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      }
    }

    const client = createHttpClient({
      getToken: () => 'expired-token',
      refreshToken: refreshHandler,
      onUnauthorized: unauthorizedHandler
    })

    const response = await client.get('/articles/1', {
      adapter,
      optionalAuth: true,
      skipPermission: true
    })

    expect(response).toEqual({ ok: true })
    expect(refreshHandler).toHaveBeenCalledTimes(1)
    expect(unauthorizedHandler).not.toHaveBeenCalled()
    expect(callHeaders).toHaveLength(2)
    expect(callHeaders[0].Authorization).toBe('Bearer expired-token')
    expect(callHeaders[1].Authorization).toBeUndefined()
  })

  it('does not redirect on 401 for optional auth requests without token', async () => {
    const unauthorizedHandler = vi.fn()
    const requestConfigs: Array<{ skipAuth?: boolean; authorization?: string }> = []
    const adapter: AxiosAdapter = async (config) => {
      const headers = (config.headers ?? {}) as Record<string, string>
      requestConfigs.push({
        skipAuth: (config as { skipAuth?: boolean }).skipAuth,
        authorization: headers.Authorization
      })

      const response = {
        data: { message: 'unauthorized' },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config
      }
      return Promise.reject(new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, {}, response))
    }

    const client = createHttpClient({
      onUnauthorized: unauthorizedHandler
    })

    await expect(
      client.get('/articles/1', {
        adapter,
        optionalAuth: true,
        skipPermission: true
      })
    ).rejects.toBeInstanceOf(AxiosError)

    expect(unauthorizedHandler).not.toHaveBeenCalled()
    expect(requestConfigs).toHaveLength(1)
    expect(requestConfigs[0].skipAuth).toBe(true)
    expect(requestConfigs[0].authorization).toBeUndefined()
  })

  it('strips explicit Authorization headers when skipAuth is true', async () => {
    let capturedHeaders: Record<string, string> = {}

    const adapter: AxiosAdapter = async (config) => {
      capturedHeaders = { ...((config.headers ?? {}) as Record<string, string>) }
      return {
        data: { code: 0, data: { ok: true } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      }
    }

    const client = createHttpClient({})

    const response = await client.get('/articles/1', {
      adapter,
      skipAuth: true,
      skipPermission: true,
      headers: {
        Authorization: 'Bearer explicit-token'
      }
    })

    expect(response).toEqual({ ok: true })
    expect(capturedHeaders.Authorization).toBeUndefined()
  })

  it('calls onUnauthorized for 401 without refresh', async () => {
    const unauthorizedHandler = vi.fn()
    const serverErrorHandler = vi.fn()
    const client = createHttpClient({
      onUnauthorized: unauthorizedHandler,
      onServerError: serverErrorHandler
    })

    const adapter: AxiosAdapter = async (config) => {
      const response = {
        data: { message: 'unauthorized' },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config
      }
      return Promise.reject(new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, {}, response))
    }

    await expect(
      client.get('/users', {
        skipPermission: true,
        adapter
      })
    ).rejects.toBeInstanceOf(AxiosError)

    expect(unauthorizedHandler).toHaveBeenCalledTimes(1)
    expect(serverErrorHandler).not.toHaveBeenCalled()
  })

  it('calls onForbidden for 403', async () => {
    const forbiddenHandler = vi.fn()
    const serverErrorHandler = vi.fn()
    const client = createHttpClient({
      onForbidden: forbiddenHandler,
      onServerError: serverErrorHandler
    })

    const adapter: AxiosAdapter = async (config) => {
      const response = {
        data: { message: 'forbidden' },
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config
      }
      return Promise.reject(new AxiosError('Forbidden', 'ERR_BAD_REQUEST', config, {}, response))
    }

    await expect(
      client.get('/users', {
        skipPermission: true,
        adapter
      })
    ).rejects.toBeInstanceOf(AxiosError)

    expect(forbiddenHandler).toHaveBeenCalledTimes(1)
    expect(serverErrorHandler).not.toHaveBeenCalled()
  })

  it('calls onServerError for 4xx request errors', async () => {
    const requestErrorHandler = vi.fn()
    const client = createHttpClient({
      onServerError: requestErrorHandler
    })

    const adapter: AxiosAdapter = async (config) => {
      const response = {
        data: { message: 'bad request' },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config
      }
      return Promise.reject(new AxiosError('Bad Request', 'ERR_BAD_REQUEST', config, {}, response))
    }

    await expect(
      client.get('/users', {
        skipPermission: true,
        adapter
      })
    ).rejects.toBeInstanceOf(AxiosError)

    expect(requestErrorHandler).toHaveBeenCalledWith(400, 'bad request')
  })

  it('reports business errors and keeps throwing the original error', async () => {
    const businessErrorHandler = vi.fn()
    const client = createHttpClient({
      onBusinessError: businessErrorHandler
    })

    const adapter: AxiosAdapter = async (config) => ({
      data: { code: 10001, message: 'business failed' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    })

    const error = await client
      .get('/users', {
        skipPermission: true,
        adapter
      })
      .catch((reason) => reason)

    expect(businessErrorHandler).toHaveBeenCalledWith({ code: 10001, message: 'business failed' })
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe('business failed')
  })
})
