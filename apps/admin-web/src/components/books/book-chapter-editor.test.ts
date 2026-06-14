import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  BOOK_CHAPTER_SOURCE_OPTIONS,
  buildBookChaptersFromSource,
  inferBookChapterSourcePreset,
  normalizeBookChapterSourceConfig,
  resolveBookChapterSourceUrl
} from './book-chapter-editor'

describe('book chapter source config', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps only the supported source presets', () => {
    expect(BOOK_CHAPTER_SOURCE_OPTIONS.map((option) => option.value)).toEqual([
      'manual',
      'wenku8Novel',
      'wmanhuaComic',
      'komiicComic'
    ])
  })

  it('infers source presets from source addresses', () => {
    expect(inferBookChapterSourcePreset('www.wenku8.net/book/123.htm')).toBe('wenku8Novel')
    expect(inferBookChapterSourcePreset('https://www.wmanhua.com/comic/1155')).toBe('wmanhuaComic')
    expect(inferBookChapterSourcePreset('https://komiic.com/comic/400')).toBe('komiicComic')
    expect(inferBookChapterSourcePreset('https://example.com/books/1')).toBe('manual')
  })

  it('keeps only the id field allowed by the selected source', () => {
    expect(
      normalizeBookChapterSourceConfig({
        origin: 'https://www.wenku8.net/book/123.htm',
        comicId: 'mc123',
        novelId: '123',
        otherId: 'other-1'
      })
    ).toEqual({
      origin: 'https://www.wenku8.net/book/123.htm',
      comicId: '',
      novelId: '123',
      otherId: ''
    })

    expect(
      normalizeBookChapterSourceConfig({
        origin: 'https://www.wmanhua.com/comic/1155',
        comicId: '1155',
        novelId: 'novel-1',
        otherId: 'other-1'
      })
    ).toEqual({
      origin: 'https://www.wmanhua.com/comic/1155',
      comicId: '1155',
      novelId: '',
      otherId: ''
    })

    expect(
      normalizeBookChapterSourceConfig({
        origin: 'https://komiic.com/comic/400',
        comicId: '400',
        novelId: 'novel-1',
        otherId: 'other-1'
      })
    ).toEqual({
      origin: 'https://komiic.com/comic/400',
      comicId: '400',
      novelId: '',
      otherId: ''
    })
  })

  it('resolves source domains from configured origins', () => {
    expect(
      resolveBookChapterSourceUrl({
        origin: 'https://www.wenku8.net',
        comicId: '',
        novelId: '123',
        otherId: ''
      })
    ).toBe('https://www.wenku8.net')

    expect(
      resolveBookChapterSourceUrl({
        origin: 'www.wmanhua.com',
        comicId: '1155',
        novelId: '',
        otherId: ''
      })
    ).toBe('https://www.wmanhua.com')
  })

  it('builds Wenku8 chapters from book page and catalog page', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('<html><body><a href="/novel/2/2542/index.htm">小说目录</a></body></html>', {
          headers: {
            'content-type': 'text/html; charset=utf-8'
          }
        })
      )
      .mockResolvedValueOnce(
        new Response(
          `
          <table>
            <tr><td class="ccss"><a href="/book/2542.htm">书籍名称</a></td></tr>
            <tr><td class="ccss"><a href="/novel/2/2542/index.htm">返回上一页</a></td></tr>
            <tr><td class="ccss"><a href="/novel/2/9999/100001.htm">第一章 其他作品</a></td></tr>
            <tr><td class="ccss"><a href="chapter-one.htm">第一章 非数字地址</a></td></tr>
            <tr><td class="vcss" colspan="4">第一卷 白日梦</td></tr>
            <tr><td class="ccss"><a href="123456.htm">第一章 开始</a></td></tr>
            <tr><td class="ccss"><a href="123457.htm">第二章 继续</a></td></tr>
            <tr><td class="vcss" colspan="4">第二卷 夜航</td></tr>
            <tr><td class="ccss"><a href="/novel/2/2542/123458.htm">第三章 抵达</a></td></tr>
          </table>
          `,
          {
            headers: {
              'content-type': 'text/html; charset=utf-8'
            }
          }
        )
      )

    vi.stubGlobal('fetch', fetchMock)

    const chapters = await buildBookChaptersFromSource({
      origin: 'https://www.wenku8.net',
      comicId: '',
      novelId: '2542',
      otherId: ''
    })

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/proxy/wenku8/book/2542.htm', {
      method: 'GET',
      credentials: 'omit'
    })
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/proxy/wenku8/novel/2/2542/index.htm', {
      method: 'GET',
      credentials: 'omit'
    })
    expect(chapters.map((chapter) => chapter.title)).toEqual([
      '第一卷 白日梦 第一章 开始',
      '第一卷 白日梦 第二章 继续',
      '第二卷 夜航 第三章 抵达'
    ])
    expect(chapters.map((chapter) => chapter.rule)).toEqual([
      'wenku8Path=/novel/2/2542/123456.htm',
      'wenku8Path=/novel/2/2542/123457.htm',
      'wenku8Path=/novel/2/2542/123458.htm'
    ])
  })

  it('builds WManhua comic chapters from the chapter list and stores chapter request paths', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      Response.json({
        code: 0,
        message: '',
        data: {
          chapters: [
            {
              id: 845604,
              contentId: 1155,
              chapterName: '第188话',
              chapterNum: 10
            },
            {
              id: 845383,
              contentId: 1155,
              chapterName: '第01卷',
              chapterNum: 158
            }
          ]
        }
      })
    )

    vi.stubGlobal('fetch', fetchMock)

    const chapters = await buildBookChaptersFromSource({
      origin: 'https://www.wmanhua.com',
      comicId: '1155',
      novelId: '',
      otherId: ''
    })

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/proxy/wmanhua/comic/1155', {
      method: 'POST',
      credentials: 'omit'
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(chapters.map((chapter) => chapter.title)).toEqual(['第01卷', '第188话'])
    expect(chapters.map((chapter) => chapter.size)).toEqual([158, 10])
    expect(chapters.map((chapter) => chapter.rule)).toEqual([
      'wmanhuaPath=/chapter/1155-845383.html',
      'wmanhuaPath=/chapter/1155-845604.html'
    ])
  })

  it('builds Komiic comic chapters from the GraphQL chapter list', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      Response.json({
        data: {
          chaptersByComicId: [
            {
              id: 'volume-1',
              serial: '1',
              type: 'book',
              size: 0
            },
            {
              id: '6160',
              serial: '1',
              type: 'main',
              size: 21
            },
            {
              id: '6161',
              serial: '2',
              type: 'main',
              size: 23
            },
            {
              id: 'volume-2',
              serial: '2',
              type: 'book',
              size: 0
            },
            {
              id: '6162',
              serial: '3',
              type: 'main',
              size: 25
            }
          ]
        }
      })
    )

    vi.stubGlobal('fetch', fetchMock)

    const chapters = await buildBookChaptersFromSource({
      origin: 'https://komiic.com',
      comicId: '400',
      novelId: '',
      otherId: ''
    })

    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/proxy/komiic/api/query',
      expect.objectContaining({
        method: 'POST',
        credentials: 'omit'
      })
    )
    expect(JSON.parse(String(requestInit.body))).toMatchObject({
      operationName: 'chapterByComicId',
      variables: {
        comicId: '400'
      }
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(chapters.map((chapter) => chapter.title)).toEqual([
      '第 1 卷',
      '第 1 话',
      '第 2 话',
      '第 2 卷',
      '第 3 话'
    ])
    expect(chapters.map((chapter) => chapter.size)).toEqual([0, 21, 23, 0, 25])
    expect(chapters.map((chapter) => chapter.rule)).toEqual([
      'komiicChapterId=volume-1',
      'komiicChapterId=6160',
      'komiicChapterId=6161',
      'komiicChapterId=volume-2',
      'komiicChapterId=6162'
    ])
  })
})
