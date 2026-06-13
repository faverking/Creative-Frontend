import { describe, expect, it } from 'vitest'
import type { AdminComposeResponse } from '@frontend/ai-sdk'

import {
  buildArticleEditorComposeRequest,
  buildArticleFieldComposeRequest,
  extractContentSuggestionApplyContent,
  extractContentSuggestionText
} from './ai-content-payload'
import type { RichTextEditorSelectionSnapshot } from '@/types/rich-text-editor'

const form = {
  title: '文章标题',
  themeId: 2,
  desc: '这是一段手填摘要',
  content:
    '<p>这是一段较长的正文内容，用来验证不同补全任务只拿到自己需要的上下文，而不是把整份表单都塞给模型。</p>'
}

const selectionSnapshot: RichTextEditorSelectionSnapshot = {
  mode: 'range',
  plainText: '前文上下文 原始片段 后文上下文',
  selectedText: '原始片段',
  range: {
    index: 6,
    length: 4
  },
  anchor: {
    left: 120,
    top: 80,
    width: 64,
    height: 24,
    containerHeight: 420
  }
}

describe('buildArticleFieldComposeRequest', () => {
  it('sends only title and content excerpt for title autocomplete', () => {
    const request = buildArticleFieldComposeRequest('title', form)

    expect(request.task).toBe('rewrite-title')
    expect(request.source.title).toBe('文章标题')
    expect(request.source.content).toContain('这是一段较长的正文内容')
    expect(request.source.summary).toBeUndefined()
  })

  it('sends only summary and content excerpt for summary autocomplete', () => {
    const request = buildArticleFieldComposeRequest('summary', form)

    expect(request.task).toBe('polish-summary')
    expect(request.source.summary).toBe('这是一段手填摘要')
    expect(request.source.content).toContain('这是一段较长的正文内容')
    expect(request.source.title).toBeUndefined()
  })
})

describe('buildArticleEditorComposeRequest', () => {
  it('keeps editor rewrite focused on selection context and business tags', () => {
    const request = buildArticleEditorComposeRequest('rewrite-selection', form, selectionSnapshot)

    expect(request.task).toBe('rewrite-selection')
    expect(request.source.selectionText).toBe('原始片段')
    expect(request.source.selectionPrefix).toBe('前文上下文')
    expect(request.source.themeId).toBe(2)
    expect(request.source.title).toBeUndefined()
    expect(request.source.summary).toBeUndefined()
  })

  it('keeps editor continuation focused on cursor context and business tags', () => {
    const request = buildArticleEditorComposeRequest('continue-content', form, {
      ...selectionSnapshot,
      mode: 'caret',
      selectedText: '',
      range: {
        index: 10,
        length: 0
      }
    })

    expect(request.task).toBe('continue-content')
    expect(request.source.cursorPrefix).toBe('前文上下文 原始片段')
    expect(request.source.cursorSuffix).toBe('后文上下文')
    expect(request.source.themeId).toBe(2)
    expect(request.source.title).toBeUndefined()
    expect(request.source.summary).toBeUndefined()
  })
})

describe('extractContentSuggestionText', () => {
  it('uses readable preview text for html-based editor suggestions and keeps raw content for apply', () => {
    const response = {
      task: 'rewrite-selection',
      contentType: 'article',
      model: 'deepseek-v4-flash',
      promptVersion: 'article-v2',
      traceId: 'trace-preview',
      result: {
        content: '<h2>段落标题</h2><p>第一段内容</p><ul><li>要点一</li><li>要点二</li></ul>'
      }
    } satisfies AdminComposeResponse

    expect(extractContentSuggestionText(response)).toBe(
      '段落标题\n\n第一段内容\n\n• 要点一\n• 要点二'
    )
    expect(extractContentSuggestionApplyContent(response)).toBe(
      '<h2>段落标题</h2><p>第一段内容</p><ul><li>要点一</li><li>要点二</li></ul>'
    )
  })
})
