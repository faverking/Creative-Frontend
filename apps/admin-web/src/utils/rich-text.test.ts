import { describe, expect, it } from 'vitest'

import {
  collectPreparedRichTextImageMediaIds,
  extractRichTextPreviewText,
  convertPlainTextToRichTextHtml,
  normalizeRichTextEmbeddedMedia,
  normalizeRichTextEmbeddedVideoInput,
  sanitizeAiRichTextHtml
} from './rich-text'

function parseHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

describe('collectPreparedRichTextImageMediaIds', () => {
  it('keeps only valid media ids in stable order', () => {
    expect(
      collectPreparedRichTextImageMediaIds([
        { mediaId: 'media-1', url: '/api/v1/media/media-1/download' },
        { mediaId: '', url: '/api/v1/media/media-2/download' },
        { mediaId: 'media-2', url: '/api/v1/media/media-2/download' },
        { mediaId: 'media-1', url: '/api/v1/media/media-1/download' },
        { mediaId: '', url: '/api/v1/media/media-3/download' }
      ])
    ).toEqual(['media-1', 'media-2'])
  })
})

describe('normalizeRichTextEmbeddedMedia', () => {
  it('splits consecutive standalone images into separate figures', async () => {
    const result = await normalizeRichTextEmbeddedMedia(
      `
        <p>
          <img src="https://cdn.test/one.jpg" alt="First image" />
          <img src="https://cdn.test/two.jpg" title="Second image" />
        </p>
      `,
      {
        resolveAssetUrl: (path) => path,
        uploadImages: async () => []
      }
    )

    const doc = parseHtml(result.content)
    const figures = Array.from(doc.querySelectorAll('figure'))

    expect(figures).toHaveLength(2)
    expect(figures[0]?.querySelector('img')?.getAttribute('src')).toBe('https://cdn.test/one.jpg')
    expect(figures[0]?.querySelector('figcaption')?.textContent).toBe('First image')
    expect(figures[1]?.querySelector('img')?.getAttribute('src')).toBe('https://cdn.test/two.jpg')
    expect(figures[1]?.querySelector('figcaption')?.textContent).toBe('Second image')
  })

  it('does not consume an adjacent caption paragraph for multiple images', async () => {
    const result = await normalizeRichTextEmbeddedMedia(
      `
        <p>
          <img src="https://cdn.test/one.jpg" alt="First image" />
          <a href="https://example.com/source">
            <img src="https://cdn.test/two.jpg" alt="Second image" />
          </a>
        </p>
        <p>caption: shared note</p>
      `,
      {
        resolveAssetUrl: (path) => path,
        uploadImages: async () => []
      }
    )

    const doc = parseHtml(result.content)
    const figures = Array.from(doc.querySelectorAll('figure'))
    const captionParagraph = doc.querySelector('p')

    expect(figures).toHaveLength(2)
    expect(figures[1]?.querySelector('a')?.getAttribute('href')).toBe('https://example.com/source')
    expect(captionParagraph?.textContent).toBe('caption: shared note')
  })

  it('normalizes bilibili iframe sources into player embed urls', async () => {
    const result = await normalizeRichTextEmbeddedMedia(
      `
        <p>Video intro</p>
        <iframe src="https://www.bilibili.com/video/BV1xx411c7mD?p=2"></iframe>
      `,
      {
        resolveAssetUrl: (path) => path,
        uploadImages: async () => []
      }
    )

    const doc = parseHtml(result.content)
    const iframe = doc.querySelector('iframe.ql-video')

    expect(iframe?.getAttribute('src')).toBe(
      'https://player.bilibili.com/player.html?page=2&high_quality=1&as_wide=1&bvid=BV1xx411c7mD'
    )
  })
})

describe('normalizeRichTextEmbeddedVideoInput', () => {
  it('converts youtube watch urls into embed urls', () => {
    expect(
      normalizeRichTextEmbeddedVideoInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m5s')
    ).toEqual({
      platform: 'youtube',
      platformLabel: 'YouTube',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&start=65'
    })
  })

  it('reads iframe html and converts bilibili urls into player embeds', () => {
    expect(
      normalizeRichTextEmbeddedVideoInput(
        '<iframe src="https://www.bilibili.com/video/BV1xx411c7mD?p=3"></iframe>'
      )
    ).toEqual({
      platform: 'bilibili',
      platformLabel: 'Bilibili',
      embedUrl:
        'https://player.bilibili.com/player.html?page=3&high_quality=1&as_wide=1&bvid=BV1xx411c7mD'
    })
  })
})

describe('convertPlainTextToRichTextHtml', () => {
  it('preserves blank-line paragraph boundaries for ai suggestion text', () => {
    expect(convertPlainTextToRichTextHtml('第一段内容\n\n第二段内容')).toBe(
      '<p>第一段内容</p><p>第二段内容</p>'
    )
  })

  it('keeps single line breaks inside the same paragraph', () => {
    expect(convertPlainTextToRichTextHtml('第一行\n第二行\n\n第三段')).toBe(
      '<p>第一行<br />第二行</p><p>第三段</p>'
    )
  })
})

describe('sanitizeAiRichTextHtml', () => {
  it('keeps only allowed rich text tags for ai editor content', () => {
    expect(
      sanitizeAiRichTextHtml(
        '<h1>主标题</h1><p><span style="color:red">正文</span><strong>重点</strong><a href="javascript:alert(1)">坏链接</a></p><div><ul><li>要点一</li><li>要点二</li></ul></div>'
      )
    ).toBe(
      '<h2>主标题</h2><p>正文<strong>重点</strong>坏链接</p><ul><li>要点一</li><li>要点二</li></ul>'
    )
  })
})

describe('extractRichTextPreviewText', () => {
  it('keeps block structure readable for ai suggestion preview', () => {
    expect(
      extractRichTextPreviewText(
        '<h2>段落标题</h2><p>第一段内容</p><blockquote>一句重点结论</blockquote><ul><li>要点一</li><li>要点二</li></ul>'
      )
    ).toBe('段落标题\n\n第一段内容\n\n一句重点结论\n\n• 要点一\n• 要点二')
  })
})
