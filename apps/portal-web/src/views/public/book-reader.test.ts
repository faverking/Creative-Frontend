import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  fetchKomiicComicChapter,
  resolveBookReaderSource,
  resolveKomiicChapterId
} from './book-reader'
import type { PublicBookChapterItemResponse, PublicBookDetailResponse } from '@/api/public-detail'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('book reader Komiic source', () => {
  it('resolves Komiic chapter rules to the shared query proxy', () => {
    const detail = {
      id: 'book-1',
      origin: 'https://komiic.com',
      part: 1,
      comicId: '400'
    } satisfies PublicBookDetailResponse
    const chapter = {
      id: 1,
      order: 1,
      size: 0,
      title: '第 1 话',
      rule: 'komiicChapterId=6160'
    } satisfies PublicBookChapterItemResponse

    expect(resolveKomiicChapterId('komiicChapterId=6160')).toBe('6160')
    expect(resolveBookReaderSource(detail, chapter)).toEqual({
      mode: 'comic',
      proxyUrl: '/proxy/komiic/api/query',
      sourcePath: '6160',
      sourceType: 'komiicComic'
    })
  })

  it('fetches Komiic image tickets and keeps chapter image order', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          data: {
            imagesByChapterId: [
              {
                id: 'image-1',
                kid: 'kid-1',
                height: 1200,
                width: 800
              },
              {
                id: 'image-2',
                kid: 'kid-2',
                height: 1300,
                width: 820
              }
            ]
          }
        })
      )
      .mockResolvedValueOnce(
        Response.json({
          data: {
            getImageTickets: [
              {
                kid: 'kid-2',
                url: 'https://cdn.example.test/page-2.webp',
                ticket: 'ticket-2',
                height: 1300,
                width: 820
              },
              {
                kid: 'kid-1',
                url: 'https://cdn.example.test/page-1.webp',
                ticket: 'ticket-1',
                height: 1200,
                width: 800
              }
            ]
          }
        })
      )

    vi.stubGlobal('fetch', fetchMock)

    const content = await fetchKomiicComicChapter('/proxy/komiic/api/query', '6160')
    const imagesRequest = fetchMock.mock.calls[0]?.[1] as RequestInit
    const ticketsRequest = fetchMock.mock.calls[1]?.[1] as RequestInit

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/proxy/komiic/api/query',
      expect.objectContaining({
        method: 'POST',
        credentials: 'omit'
      })
    )
    expect(JSON.parse(String(imagesRequest.body))).toMatchObject({
      operationName: 'imagesByChapterId',
      variables: {
        chapterId: '6160'
      }
    })
    expect(JSON.parse(String(ticketsRequest.body))).toMatchObject({
      operationName: 'getImageTickets',
      variables: {
        kids: ['kid-1', 'kid-2']
      }
    })
    expect(content).toEqual({
      items: [
        {
          alt: 'Komiic 漫画第 1 页',
          loading: 'lazy',
          requestHeaders: {
            'x-image-ticket': 'ticket-1'
          },
          src: 'https://cdn.example.test/page-1.webp',
          type: 'image'
        },
        {
          alt: 'Komiic 漫画第 2 页',
          loading: 'lazy',
          requestHeaders: {
            'x-image-ticket': 'ticket-2'
          },
          src: 'https://cdn.example.test/page-2.webp',
          type: 'image'
        }
      ],
      paragraphs: [],
      title: ''
    })
  })
})
