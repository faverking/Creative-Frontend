import { CONTENT_BYTE_LIMITS, type ContentByteLimitType } from '@/constants'

export interface ContentByteUsage {
  bytes: number
  max: number
  min: number
  ratio: number
  isNearLimit: boolean
  isOverLimit: boolean
}

const CONTENT_LIMIT_WARNING_RATIO = 0.85

export function getUtf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length
}

export function formatContentByteSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  if (bytes >= 1024) {
    return `${Math.ceil(bytes / 1024)} KB`
  }

  return `${bytes} B`
}

export function getContentByteUsage(
  value: string,
  limitType: ContentByteLimitType
): ContentByteUsage {
  const limits = CONTENT_BYTE_LIMITS[limitType]
  const bytes = getUtf8ByteLength(value)
  const ratio = limits.max > 0 ? bytes / limits.max : 0

  return {
    bytes,
    max: limits.max,
    min: limits.min,
    ratio,
    isNearLimit: ratio >= CONTENT_LIMIT_WARNING_RATIO && bytes <= limits.max,
    isOverLimit: bytes > limits.max
  }
}

export function getContentByteLimitMessage(
  value: string,
  limitType: ContentByteLimitType,
  label: string
): string | null {
  const usage = getContentByteUsage(value, limitType)

  if (usage.bytes < usage.min) {
    return `${label}不能少于 ${formatContentByteSize(usage.min)}。`
  }

  if (usage.isOverLimit) {
    return `${label}不能超过 ${formatContentByteSize(usage.max)}，当前为 ${formatContentByteSize(usage.bytes)}。`
  }

  return null
}
