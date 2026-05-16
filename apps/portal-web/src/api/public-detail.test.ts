import { describe, expect, it } from 'vitest'

import {
  resolvePublicDetailMediaUrl,
  resolvePublicDetailOriginalMediaUrl,
  type PublicMediaAsset
} from './public-detail'

describe('public detail media url resolvers', () => {
  it('keeps generic detail media urls preview-first for lightweight covers', () => {
    const asset: PublicMediaAsset = {
      previewPath: '/api/v1/media/preview-image/preview',
      downloadPath: '/api/v1/media/original-image/download'
    }

    expect(resolvePublicDetailMediaUrl(asset)).toBe('/api/v1/media/preview-image/preview')
  })

  it('resolves original media urls download-first for gallery detail previews', () => {
    const asset: PublicMediaAsset = {
      previewPath: '/api/v1/media/preview-image/preview',
      downloadPath: '/api/v1/media/original-image/download'
    }

    expect(resolvePublicDetailOriginalMediaUrl(asset)).toBe('/api/v1/media/original-image/download')
  })

  it('falls back to preview when original download path is missing', () => {
    expect(
      resolvePublicDetailOriginalMediaUrl({
        previewPath: '/api/v1/media/preview-only/preview'
      })
    ).toBe('/api/v1/media/preview-only/preview')
  })
})
