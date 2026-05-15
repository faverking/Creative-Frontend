import { describe, expect, it } from 'vitest'

import { resolvePersistedAssetPath } from './assets'

describe('resolvePersistedAssetPath', () => {
  it('keeps uploaded media paths as api-relative paths', () => {
    expect(resolvePersistedAssetPath('/api/v1/media/media-1/download')).toBe(
      '/api/v1/media/media-1/download'
    )
    expect(resolvePersistedAssetPath('api/v1/media/media-2/download')).toBe(
      '/api/v1/media/media-2/download'
    )
  })

  it('strips production origins before persisting media paths', () => {
    expect(resolvePersistedAssetPath('http://121.41.223.169/api/v1/media/media-1/download')).toBe(
      '/api/v1/media/media-1/download'
    )
    expect(
      resolvePersistedAssetPath(
        'https://admin.example.com/api/v1/media/media-2/preview?size=small#image'
      )
    ).toBe('/api/v1/media/media-2/preview?size=small#image')
  })
})
