import {
  extractWmanhuaComicChapterContent,
  extractWenku8NovelChapterContent,
  resolveBookReaderSource,
  resolveWenku8ChapterPath,
  resolveWenku8ChapterProxyUrl,
  resolveWmanhuaChapterPath,
  resolveWmanhuaChapterProxyUrl
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
        comicId: '1155',
        novelId: '2542',
        origin: 'https://www.wmanhua.com'
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

  it('resolves and guards WManhua chapter paths from chapter rules', () => {
    expect(resolveWmanhuaChapterPath('wmanhuaPath=/chapter/1155-845383.html', '1155')).toBe(
      '/chapter/1155-845383.html'
    )

    expect(resolveWmanhuaChapterProxyUrl('/chapter/1155-845383.html')).toBe(
      '/proxy/wmanhua/chapter/1155-845383.html'
    )
    expect(resolveWmanhuaChapterPath('wmanhuaPath=/chapter/9999-845383.html', '1155')).toBe('')
    expect(resolveWmanhuaChapterPath('wmanhuaPath=https://example.com/chapter.html', '1155')).toBe(
      ''
    )
  })

  it('identifies supported WManhua comic chapters and unknown sources as controlled branches', () => {
    expect(
      resolveBookReaderSource(
        createBookDetail({
          comicId: '1155',
          origin: 'https://www.wmanhua.com'
        }),
        createChapter({
          rule: 'wmanhuaPath=/chapter/1155-845383.html'
        })
      )
    ).toMatchObject({
      mode: 'comic',
      proxyUrl: '/proxy/wmanhua/chapter/1155-845383.html',
      sourceType: 'wmanhuaComic'
    })

    expect(resolveBookReaderSource(createBookDetail(), createChapter())).toMatchObject({
      mode: 'novel',
      sourceType: 'unsupported'
    })
  })
})

describe('WManhua comic chapter extraction', () => {
  it('builds comic image items from chapter page script variables', () => {
    const content = extractWmanhuaComicChapterContent(`
      <html>
        <head><title>第01卷 - WManhua</title></head>
        <body>
          <script>
            var num = eval("3")
            var pasd = "https://image4.wmanhua.com/mh/hash/chapter-path/"
            for(let i = 1; i <= num; i++) {
              img.setAttribute('data-src', pasd + i + '.webp');
            }
          </script>
        </body>
      </html>
    `)

    expect(content.title).toBe('第01卷')
    expect(content.paragraphs).toEqual([])
    expect(content.items).toEqual([
      {
        alt: '第01卷 第 1 页',
        loading: 'lazy',
        src: 'https://image4.wmanhua.com/mh/hash/chapter-path/1.webp',
        type: 'image'
      },
      {
        alt: '第01卷 第 2 页',
        loading: 'lazy',
        src: 'https://image4.wmanhua.com/mh/hash/chapter-path/2.webp',
        type: 'image'
      },
      {
        alt: '第01卷 第 3 页',
        loading: 'lazy',
        src: 'https://image4.wmanhua.com/mh/hash/chapter-path/3.webp',
        type: 'image'
      }
    ])
  })

  it('returns empty items when the chapter page has no image base', () => {
    expect(extractWmanhuaComicChapterContent('<html><body>正文</body></html>').items).toEqual([])
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
        loading: 'lazy',
        src: '/proxy/wenku8/novel/2/images/insert-1.jpg',
        type: 'image'
      },
      { text: '第二段正文。', type: 'paragraph' },
      {
        alt: '章节插图',
        loading: 'lazy',
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
