import type { AxiosInstance, AxiosResponse } from 'axios'
import type { ApiPayload, UnwrapResolvedHandler } from '../types'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// Support both raw business payloads and { code, data } envelopes.
export function unwrapResponse<T>(response: AxiosResponse<ApiPayload<T>>): T {
  const payload = response.data
  if (!isRecord(payload) || typeof payload.code !== 'number') {
    return payload as T
  }

  return (payload.data ?? {}) as T
}

export function isAxiosResponseLike(value: unknown): value is AxiosResponse<ApiPayload<unknown>> {
  return (
    isRecord(value) &&
    'data' in value &&
    'status' in value &&
    'headers' in value &&
    'config' in value
  )
}

export function attachUnwrapInterceptor(
  instance: AxiosInstance,
  onUnwrapResolved?: UnwrapResolvedHandler
): void {
  const unwrapInterceptor = ((response: AxiosResponse<ApiPayload<unknown>> | unknown) => {
    if (!isAxiosResponseLike(response)) {
      return response
    }

    const payload = unwrapResponse(response)

    onUnwrapResolved?.(payload, response as AxiosResponse<ApiPayload<typeof payload>>)

    return payload
  }) as unknown as (response: AxiosResponse) => AxiosResponse

  instance.interceptors.response.use(unwrapInterceptor)
}
