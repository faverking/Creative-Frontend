import { describe, expect, it } from 'vitest'

import {
  formatContentByteSize,
  getContentByteLimitMessage,
  getContentByteUsage,
  getUtf8ByteLength,
  normalizeContentForByteLimit
} from './content-byte-limit'

describe('content byte limit', () => {
  it('counts utf-8 bytes instead of JavaScript characters', () => {
    expect(getUtf8ByteLength('abc')).toBe(3)
    expect(getUtf8ByteLength('正文')).toBe(6)
  })

  it('formats byte sizes for editor feedback', () => {
    expect(formatContentByteSize(12)).toBe('12 B')
    expect(formatContentByteSize(1025)).toBe('2 KB')
    expect(formatContentByteSize(1024 * 1024)).toBe('1.00 MB')
  })

  it('reports over-limit content against backend-aligned limits', () => {
    const message = getContentByteLimitMessage(
      'a'.repeat(3 * 1024 * 1024 + 10 * 1024),
      'article',
      '情报正文'
    )

    expect(message).toBe('情报正文不能超过 3.00 MB，当前为 3.01 MB。')
  })

  it('does not count embedded base64 image payloads as rich text content bytes', () => {
    const payload = 'a'.repeat(3 * 1024 * 1024 + 10 * 1024)
    const content = `<p>正文</p><p><img src="data:image/png;base64,${payload}" alt="cover"></p>`
    const normalized = normalizeContentForByteLimit(content)
    const usage = getContentByteUsage(content, 'article')

    expect(normalized).toContain('src="embedded-image"')
    expect(usage.isOverLimit).toBe(false)
  })

  it('marks content as near the configured limit', () => {
    const usage = getContentByteUsage('a'.repeat(Math.ceil(2 * 1024 * 1024 * 0.9)), 'topic')

    expect(usage.isNearLimit).toBe(true)
    expect(usage.isOverLimit).toBe(false)
  })
})
