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
      'bilibiliComic',
      'wenku8Novel'
    ])
  })

  it('infers source presets from source addresses and legacy markers', () => {
    expect(inferBookChapterSourcePreset('https://manga.bilibili.com/detail/mc123')).toBe(
      'bilibiliComic'
    )
    expect(inferBookChapterSourcePreset('www.wenku8.net/book/123.htm')).toBe('wenku8Novel')
    expect(inferBookChapterSourcePreset('bilibili-comic')).toBe('bilibiliComic')
    expect(inferBookChapterSourcePreset('novel-catalog')).toBe('wenku8Novel')
    expect(inferBookChapterSourcePreset('https://example.com/books/1')).toBe('manual')
  })

  it('keeps only the id field allowed by the selected source', () => {
    expect(
      normalizeBookChapterSourceConfig({
        origin: 'https://manga.bilibili.com/detail/mc123',
        comicId: 'mc123',
        novelId: 'novel-1',
        otherId: 'other-1'
      })
    ).toEqual({
      origin: 'https://manga.bilibili.com/detail/mc123',
      comicId: 'mc123',
      novelId: '',
      otherId: ''
    })

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
  })

  it('normalizes legacy source markers to source domains', () => {
    expect(
      normalizeBookChapterSourceConfig({
        origin: 'bilibili-comic',
        comicId: 'mc123'
      }).origin
    ).toBe('https://manga.bilibili.com')

    expect(
      resolveBookChapterSourceUrl({
        origin: 'novel-catalog',
        comicId: '',
        novelId: '123',
        otherId: ''
      })
    ).toBe('https://www.wenku8.net')
  })

  it('builds Wenku8 chapters from book page and catalog page', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          '<html><body><a href="/novel/2/2542/index.htm">小说目录</a></body></html>',
          {
            headers: {
              'content-type': 'text/html; charset=utf-8'
            }
          }
        )
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
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/proxy/wenku8/novel/2/2542/index.htm',
      {
        method: 'GET',
        credentials: 'omit'
      }
    )
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
})
