import { describe, expect, it } from 'vitest'

import { IMAGE_BATCH_LIMIT, IMAGE_MAX_FILE_SIZE } from '@/constants'

import { getImageUploadLimitMessage } from './media-upload'

function createImageFile(name: string, size: number, type = 'image/png'): File {
  return {
    name,
    size,
    type
  } as File
}

describe('media upload limits', () => {
  it('rejects unsupported image types before upload', () => {
    const message = getImageUploadLimitMessage([createImageFile('a.svg', 12, 'image/svg+xml')])

    expect(message).toContain('仅支持 jpg、png、webp、gif 格式')
  })

  it('rejects single images over the configured size before upload', () => {
    const message = getImageUploadLimitMessage([
      createImageFile('oversize.png', IMAGE_MAX_FILE_SIZE + 1)
    ])

    expect(message).toContain('单张图片大小不能超过')
  })

  it('rejects batches over the configured file count before upload', () => {
    const files = Array.from({ length: IMAGE_BATCH_LIMIT + 1 }, (_, index) =>
      createImageFile(`image-${index}.png`, 12)
    )

    expect(getImageUploadLimitMessage(files)).toContain('单次最多只能选择')
  })
})
