import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  fetchMangaCopyComicChapter,
  resolveBookReaderSource,
  resolveMangaCopyChapterIdentity
} from './source'
import type { PublicBookChapterItemResponse, PublicBookDetailResponse } from '@/api/public-detail'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('book reader MangaCopy source', () => {
  it('resolves MangaCopy chapter rules to the API proxy', () => {
    const detail = {
      id: 'book-1',
      origin: 'https://www.mangacopy.com',
      part: 1,
      comicId: 'example-comic'
    } satisfies PublicBookDetailResponse
    const chapter = {
      id: 1,
      order: 1,
      size: 0,
      title: '第 1 话',
      rule: 'mangaCopyComicId=example-comic; mangaCopyChapterId=chapter-one'
    } satisfies PublicBookChapterItemResponse

    expect(
      resolveMangaCopyChapterIdentity(
        'mangaCopyComicId=example-comic; mangaCopyChapterId=chapter-one',
        ''
      )
    ).toEqual({
      chapterId: 'chapter-one',
      comicId: 'example-comic'
    })
    expect(resolveBookReaderSource(detail, chapter)).toEqual({
      mode: 'comic',
      proxyUrl: '/proxy/mangacopy-api/api/v3/comic/example-comic/chapter/chapter-one',
      sourcePath: 'example-comic/chapter-one',
      sourceType: 'mangaCopyComic'
    })
  })

  it('fetches MangaCopy chapter images from the proxied API', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      Response.json({
        results: {
          comic: {
            name: 'Example Comic'
          },
          chapter: {
            name: '第 1 话',
            contents: [
              {
                url: 'https://cdn.example.test/page-1-c800x.jpg'
              },
              {
                url: 'https://cdn.example.test/page-2.webp'
              }
            ]
          }
        }
      })
    )

    vi.stubGlobal('fetch', fetchMock)

    const content = await fetchMangaCopyComicChapter(
      '/proxy/mangacopy-api/api/v3/comic/example-comic/chapter/chapter-one'
    )

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/proxy/mangacopy-api/api/v3/comic/example-comic/chapter/chapter-one',
      {
        method: 'GET',
        credentials: 'omit',
        headers: {
          accept: 'application/json',
          platform: '1',
          version: '2025.08.08'
        }
      }
    )
    expect(content).toEqual({
      items: [
        {
          alt: '第 1 话 第 1 页',
          enhance: false,
          loading: 'lazy',
          src: 'https://cdn.example.test/page-1-c1500x.jpg',
          type: 'image'
        },
        {
          alt: '第 1 话 第 2 页',
          enhance: false,
          loading: 'lazy',
          src: 'https://cdn.example.test/page-2.webp',
          type: 'image'
        }
      ],
      paragraphs: [],
      title: '第 1 话'
    })
  })
})
