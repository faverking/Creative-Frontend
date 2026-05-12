import type { AuthTokens } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function parseDurationToMs(value: string): number | undefined {
  const normalized = value.trim()
  if (!normalized) {
    return undefined
  }

  if (/^\d+$/.test(normalized)) {
    return Number(normalized) * 1000
  }

  const matched = normalized.match(/^(\d+)(ms|s|m|h|d)$/i)
  if (!matched) {
    return undefined
  }

  const amount = Number(matched[1])
  const unit = matched[2].toLowerCase()

  if (!Number.isFinite(amount)) {
    return undefined
  }

  switch (unit) {
    case 'ms':
      return amount
    case 's':
      return amount * 1000
    case 'm':
      return amount * 60 * 1000
    case 'h':
      return amount * 60 * 60 * 1000
    case 'd':
      return amount * 24 * 60 * 60 * 1000
    default:
      return undefined
  }
}

function resolveTokenSource(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload)) {
    return null
  }

  return isRecord(payload.tokens) ? payload.tokens : payload
}

function resolveExpiresAt(source: Record<string, unknown>): number | undefined {
  const explicitExpiresAt =
    asNumber(source.expiresAt) ??
    asNumber(source.expires_at) ??
    asNumber(source.expireAt) ??
    asNumber(source.expire_at)
  if (typeof explicitExpiresAt === 'number') {
    return explicitExpiresAt
  }

  const expiresInSeconds = asNumber(source.expiresIn) ?? asNumber(source.expires_in)
  if (typeof expiresInSeconds === 'number') {
    return Date.now() + Math.max(0, expiresInSeconds) * 1000
  }

  const expiresInDuration = asString(source.expiresIn) ?? asString(source.expires_in)
  if (!expiresInDuration) {
    return undefined
  }

  const durationMs = parseDurationToMs(expiresInDuration)
  return typeof durationMs === 'number' ? Date.now() + Math.max(0, durationMs) : undefined
}

export function normalizeAuthTokensPayload(payload: unknown): AuthTokens {
  const source = resolveTokenSource(payload)
  if (!source) {
    throw new Error('Auth response is not a valid token payload.')
  }

  const accessToken =
    asString(source.accessToken) ?? asString(source.access_token) ?? asString(source.token)
  if (!accessToken) {
    throw new Error('Auth response succeeded but accessToken is missing.')
  }

  const refreshToken = asString(source.refreshToken) ?? asString(source.refresh_token)
  const expiresAt = resolveExpiresAt(source)
  const expiresInSeconds = asNumber(source.expiresIn) ?? asNumber(source.expires_in)

  return {
    accessToken,
    refreshToken,
    expiresIn: expiresInSeconds,
    expiresAt,
    tokenType: asString(source.tokenType) ?? asString(source.token_type) ?? 'Bearer'
  }
}

export function normalizeStoredAuthTokens(payload: unknown): AuthTokens | null {
  if (!isRecord(payload)) {
    return null
  }

  const accessToken = asString(payload.accessToken)
  if (!accessToken) {
    return null
  }

  return {
    accessToken,
    refreshToken: asString(payload.refreshToken),
    expiresIn: asNumber(payload.expiresIn),
    expiresAt: resolveExpiresAt(payload),
    tokenType: asString(payload.tokenType) ?? 'Bearer'
  }
}
