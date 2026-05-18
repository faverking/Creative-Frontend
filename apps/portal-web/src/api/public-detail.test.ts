import { describe, expect, it } from 'vitest'

import {
  resolvePublicDetailFavoriteState,
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

describe('public detail favorite state resolver', () => {
  it('uses the viewer favorite flag returned by detail responses', () => {
    expect(resolvePublicDetailFavoriteState({ favored: true, favorCount: 8 })).toEqual({
      favorited: true,
      favoriteCount: 8
    })
  })

  it('falls back to an anonymous uncollected state when the backend omits viewer state', () => {
    expect(resolvePublicDetailFavoriteState({ favorCount: 3 })).toEqual({
      favorited: false,
      favoriteCount: 3
    })
  })
})
