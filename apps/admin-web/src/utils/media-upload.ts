import { formatContentByteSize } from './content-byte-limit'

import { IMAGE_BATCH_LIMIT, IMAGE_MAX_FILE_SIZE } from '@/constants'

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export function getImageUploadLimitMessage(files: File[]): string | null {
  if (files.length > IMAGE_BATCH_LIMIT) {
    return `单次最多只能选择 ${IMAGE_BATCH_LIMIT} 张图片。`
  }

  const invalidTypeFile = files.find((file) => !ALLOWED_IMAGE_MIME_TYPES.has(file.type))
  if (invalidTypeFile) {
    return `仅支持 jpg、png、webp、gif 格式：${invalidTypeFile.name}`
  }

  const oversizedFile = files.find((file) => file.size > IMAGE_MAX_FILE_SIZE)
  if (oversizedFile) {
    return `单张图片大小不能超过 ${formatContentByteSize(IMAGE_MAX_FILE_SIZE)}：${oversizedFile.name}`
  }

  return null
}
