import {
  extractWenku8NovelChapterContent,
  resolveBookReaderSource,
  resolveWenku8ChapterPath,
  resolveWenku8ChapterProxyUrl
} from './book-reader'
import type { PublicBookChapterItemResponse, PublicBookDetailResponse } from '@/api/public-detail'

function createBookDetail(
  overrides: Partial<PublicBookDetailResponse> = {}
): PublicBookDetailResponse {
  return {
    id: 'book-1',
    name: '测试书库',
    chapterList: [],
    ...overrides
  }
}

function createChapter(
  overrides: Partial<PublicBookChapterItemResponse> = {}
): PublicBookChapterItemResponse {
  return {
    id: 1,
    order: 1,
    size: 0,
    title: '第一章',
    ...overrides
  }
}

describe('book reader source resolution', () => {
  it('resolves and guards Wenku8 chapter paths from chapter rules', () => {
    expect(
      resolveWenku8ChapterPath(
        'origin=https://www.wenku8.net; wenku8Path=/novel/2/2542/123456.htm',
        '2542'
      )
    ).toBe('/novel/2/2542/123456.htm')

    expect(resolveWenku8ChapterProxyUrl('/novel/2/2542/123456.htm')).toBe(
      '/proxy/wenku8/novel/2/2542/123456.htm'
    )
  })

  it('rejects invalid Wenku8 paths and novel id mismatches', () => {
    expect(resolveWenku8ChapterPath('wenku8Path=https://example.com/1.htm', '2542')).toBe('')
    expect(resolveWenku8ChapterPath('wenku8Path=/novel/2/2542/index.htm', '2542')).toBe('')
    expect(resolveWenku8ChapterPath('wenku8Path=/novel/2/9999/123456.htm', '2542')).toBe('')
    expect(resolveWenku8ChapterPath('wenku8Path=/novel/2/2542/123456.htm', '')).toBe('')
  })

  it('identifies supported Wenku8 novel chapters from valid rules first', () => {
    const source = resolveBookReaderSource(
      createBookDetail({
        comicId: 'mc123',
        novelId: '2542',
        origin: 'https://manga.bilibili.com'
      }),
      createChapter({
        rule: 'wenku8Path=/novel/2/2542/123456.htm'
      })
    )

    expect(source).toMatchObject({
      mode: 'novel',
      sourceType: 'wenku8Novel',
      proxyUrl: '/proxy/wenku8/novel/2/2542/123456.htm'
    })
  })

  it('identifies Bilibili manga and unknown sources as controlled unsupported branches', () => {
    expect(
      resolveBookReaderSource(
        createBookDetail({
          comicId: 'mc123',
          origin: 'https://manga.bilibili.com'
        }),
        createChapter()
      )
    ).toMatchObject({
      mode: 'comic',
      sourceType: 'bilibiliManga'
    })

    expect(resolveBookReaderSource(createBookDetail(), createChapter())).toMatchObject({
      mode: 'novel',
      sourceType: 'unsupported'
    })
  })
})

describe('Wenku8 novel chapter extraction', () => {
  it('extracts paragraphs from #content and removes source boilerplate', () => {
    const content = extractWenku8NovelChapterContent(`
      <html>
        <head><title>第一章 开始_轻小说文库</title></head>
        <body>
          <div id="content">
            第一段正文。<br />
            &nbsp;&nbsp;第二段正文。<br />
            返回目录<br />
            本书来自 www.wenku8.net<br />
            第三段正文。
          </div>
        </body>
      </html>
    `)

    expect(content.title).toBe('第一章 开始')
    expect(content.paragraphs).toEqual(['第一段正文。', '第二段正文。', '第三段正文。'])
    expect(content.items).toEqual([
      { text: '第一段正文。', type: 'paragraph' },
      { text: '第二段正文。', type: 'paragraph' },
      { text: '第三段正文。', type: 'paragraph' }
    ])
  })

  it('keeps body images in chapter order and ignores images outside #content', () => {
    const content = extractWenku8NovelChapterContent(
      `
        <html>
          <body>
            <img src="/images/site-banner.jpg" alt="站点图" />
            <div id="content">
              第一段正文。<br />
              <img src="../images/insert-1.jpg" alt="插图一" />
              第二段正文。
              <img src="https://img.example.test/insert-2.jpg" />
            </div>
          </body>
        </html>
      `,
      '/novel/2/2542/123456.htm'
    )

    expect(content.items).toEqual([
      { text: '第一段正文。', type: 'paragraph' },
      {
        alt: '插图一',
        src: '/proxy/wenku8/novel/2/images/insert-1.jpg',
        type: 'image'
      },
      { text: '第二段正文。', type: 'paragraph' },
      {
        alt: '章节插图',
        src: 'https://img.example.test/insert-2.jpg',
        type: 'image'
      }
    ])
  })

  it('returns empty paragraphs when #content is missing', () => {
    expect(extractWenku8NovelChapterContent('<html><body>正文</body></html>').paragraphs).toEqual(
      []
    )
  })
})
