import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AdminComposeRequest } from '@frontend/ai-sdk'

import {
  buildOpenAiResponsesPayload,
  createBrowserOpenAiStreamResponse,
  createAdminComposeResponseFromOpenAi,
  resolveAdminComposePreviewText,
  resolveOpenAiBrowserExperimentConfig
} from './openai-browser-experiment'

const baseRequest: AdminComposeRequest = {
  contentType: 'article',
  task: 'generate-summary',
  source: {
    title: '春季版本前瞻',
    content: '这是一段用于测试 OpenAI 浏览器实验层的正文内容。'
  },
  options: {
    tone: 'neutral',
    maxSummaryLength: 160,
    includeReasons: false
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('resolveOpenAiBrowserExperimentConfig', () => {
  it('reads browser-side openai config when production experiment is enabled', () => {
    expect(
      resolveOpenAiBrowserExperimentConfig({
        MODE: 'production',
        PROD: true,
        VITE_ADMIN_AI_EXPERIMENT_ENABLED: 'true',
        VITE_TESTAI_API_KEY: 'key-1',
        VITE_TESTAI_API_MODEL_COMPOSE: 'gpt-5.4-mini'
      })
    ).toEqual({
      enabled: true,
      config: {
        apiKey: 'key-1',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-5.4-mini'
      },
      setupError: ''
    })
  })

  it('returns disabled state when experiment flag is not enabled', () => {
    expect(
      resolveOpenAiBrowserExperimentConfig({
        MODE: 'production',
        PROD: true,
        VITE_TESTAI_API_KEY: 'key-1',
        VITE_TESTAI_API_MODEL_COMPOSE: 'gpt-5.4-mini'
      })
    ).toEqual({
      enabled: false,
      config: null,
      setupError: ''
    })
  })

  it('reads browser-side openai config when experiment is enabled', () => {
    expect(
      resolveOpenAiBrowserExperimentConfig({
        MODE: 'development',
        DEV: true,
        VITE_ADMIN_AI_EXPERIMENT_ENABLED: 'true',
        VITE_TESTAI_API_KEY: 'key-1',
        VITE_TESTAI_API_MODEL_COMPOSE: 'gpt-5.4-mini'
      })
    ).toEqual({
      enabled: true,
      config: {
        apiKey: 'key-1',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-5.4-mini'
      },
      setupError: ''
    })
  })

  it('falls back to compose model when optional model is serialized as undefined', () => {
    expect(
      resolveOpenAiBrowserExperimentConfig({
        MODE: 'production',
        PROD: true,
        VITE_ADMIN_AI_EXPERIMENT_ENABLED: 'true',
        VITE_TESTAI_API_KEY: 'key-1',
        VITE_TESTAI_MODEL: 'undefined',
        VITE_TESTAI_API_MODEL_COMPOSE: 'gpt-5.4-mini'
      })
    ).toEqual({
      enabled: true,
      config: {
        apiKey: 'key-1',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-5.4-mini'
      },
      setupError: ''
    })
  })

  it('returns setup error when browser experiment env is incomplete', () => {
    expect(
      resolveOpenAiBrowserExperimentConfig({
        MODE: 'development',
        DEV: true,
        VITE_ADMIN_AI_EXPERIMENT_ENABLED: 'true',
        VITE_TESTAI_API_MODEL_COMPOSE: 'gpt-5.4-mini'
      })
    ).toEqual({
      enabled: true,
      config: null,
      setupError: '已开启 OpenAI 浏览器实验，但缺少 VITE_TESTAI_API_KEY。'
    })
  })
})

describe('buildOpenAiResponsesPayload', () => {
  it('builds a structured output payload for responses api', () => {
    const payload = buildOpenAiResponsesPayload(baseRequest, {
      model: 'gpt-5.4-mini'
    }) as {
      model: string
      input: Array<{ role: string; content: string }>
      text: {
        format: {
          type: string
          name: string
          strict: boolean
          schema: {
            required: string[]
          }
        }
      }
    }

    expect(payload.model).toBe('gpt-5.4-mini')
    expect(payload.input).toEqual([
      expect.objectContaining({
        role: 'system'
      }),
      expect.objectContaining({
        role: 'user'
      })
    ])
    expect(payload.text.format).toEqual(
      expect.objectContaining({
        type: 'json_schema',
        name: 'article_generate_summary',
        strict: true
      })
    )
    expect(payload.text.format.schema.required).toEqual(['summary', 'reasons'])
  })

  it('narrows title rewrite input to title and content only', () => {
    const payload = buildOpenAiResponsesPayload(
      {
        ...baseRequest,
        task: 'rewrite-title',
        source: {
          title: '原标题',
          summary: '这段摘要不应进入标题补全输入',
          content: '正文摘录内容',
          themeId: 1
        }
      },
      {
        model: 'gpt-5.4-mini'
      }
    ) as {
      input: Array<{ role: string; content: string }>
    }

    expect(payload.input[1]?.content).toContain('当前标题：原标题')
    expect(payload.input[1]?.content).toContain('正文内容摘录：正文摘录内容')
    expect(payload.input[1]?.content).not.toContain('当前摘要')
    expect(payload.input[1]?.content).toContain('主题标签：新番情报')
  })

  it('narrows selection rewrite input to editor context and business labels only', () => {
    const payload = buildOpenAiResponsesPayload(
      {
        ...baseRequest,
        task: 'rewrite-selection',
        source: {
          title: '不应进入正文补全输入',
          summary: '这段摘要也不应进入正文补全输入',
          selectionText: '原始片段',
          selectionPrefix: '前文上下文',
          selectionSuffix: '后文上下文',
          themeId: 2
        }
      },
      {
        model: 'gpt-5.4-mini'
      }
    ) as {
      input: Array<{ role: string; content: string }>
    }

    expect(payload.input[1]?.content).toContain('正文选区：原始片段')
    expect(payload.input[1]?.content).toContain('选区前文：前文上下文')
    expect(payload.input[1]?.content).not.toContain('当前标题')
    expect(payload.input[1]?.content).not.toContain('当前摘要')
    expect(payload.input[1]?.content).toContain('主题标签：二游动态')
  })

  it('asks editor tasks to return restricted html while allowing ai-driven structure enhancement', () => {
    const selectionPayload = buildOpenAiResponsesPayload(
      {
        ...baseRequest,
        task: 'rewrite-selection',
        source: {
          selectionText: '第一段',
          selectionPrefix: '前文',
          selectionSuffix: '后文',
          themeId: 1
        }
      },
      {
        model: 'gpt-5.4-mini'
      }
    ) as {
      input: Array<{ role: string; content: string }>
    }

    const continuePayload = buildOpenAiResponsesPayload(
      {
        ...baseRequest,
        task: 'continue-content',
        source: {
          cursorPrefix: '前文上下文',
          cursorSuffix: '后文上下文',
          themeId: 1
        }
      },
      {
        model: 'gpt-5.4-mini'
      }
    ) as {
      input: Array<{ role: string; content: string }>
    }

    expect(selectionPayload.input[0]?.content).toContain(
      '只允许使用 p / h2 / h3 / blockquote / ul / ol / li / hr / br / strong / a'
    )
    expect(selectionPayload.input[0]?.content).toContain('不能输出 h1、span、style、class')
    expect(selectionPayload.input[0]?.content).toContain(
      '可以根据选区及其上下文自行判断是否补充 h2/h3、小列表、引用或分隔线'
    )
    expect(continuePayload.input[0]?.content).toContain(
      '你可以根据前后文自行判断是否引入标题、列表、引用或分隔线'
    )
    expect(continuePayload.input[0]?.content).toContain('默认先续一个自然段')
  })

  it('builds game operation input with topic labels and feature flag candidates', () => {
    const payload = buildOpenAiResponsesPayload(
      {
        contentType: 'topic',
        task: 'suggest-feature-flags',
        source: {
          title: '夏季资源合集',
          summary: '整理 PC 汉化资源',
          content: '正文提到 PC、汉化和合集整理。',
          topicId: 1,
          typeId: 4,
          featureFlags: [3],
          hasArchive: true,
          embeddedImageCount: 2,
          embeddedVideoCount: 1
        },
        options: {
          tone: 'promo',
          includeReasons: false
        }
      },
      {
        model: 'gpt-5.4-mini'
      }
    ) as {
      input: Array<{ role: string; content: string }>
      text: {
        format: {
          schema: {
            properties: {
              featureFlagSuggestions: {
                items: {
                  properties: {
                    id: {
                      enum: number[]
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    expect(payload.input[1]?.content).toContain('内容类型：游戏')
    expect(payload.input[1]?.content).toContain('游戏题材：Galgame')
    expect(payload.input[1]?.content).toContain('游戏内容类型：合集整理')
    expect(payload.input[1]?.content).toContain('游戏标签：PC')
    expect(payload.input[1]?.content).toContain('候选游戏标签')
    expect(
      payload.text.format.schema.properties.featureFlagSuggestions.items.properties.id.enum
    ).toContain(1)
  })

  it('builds image package source suggestions from metadata only', () => {
    const payload = buildOpenAiResponsesPayload(
      {
        contentType: 'image',
        task: 'suggest-image-source',
        source: {
          title: '春季收藏图包',
          summary: '一组适合收藏的图包描述',
          themeId: 2,
          source: '图集',
          imageCount: 6,
          fileNameHints: ['wallpaper-01.webp', 'cg-main.png'],
          coverSelected: true
        },
        options: {
          tone: 'community',
          includeReasons: false
        }
      },
      {
        model: 'gpt-5.4-mini'
      }
    ) as {
      input: Array<{ role: string; content: string }>
      text: {
        format: {
          schema: {
            properties: {
              imageSourceSuggestion: {
                properties: {
                  source: {
                    enum: string[]
                  }
                }
              }
            }
          }
        }
      }
    }

    expect(payload.input[0]?.content).toContain('只能从候选图片类型中选择一个')
    expect(payload.input[1]?.content).toContain('内容类型：图包')
    expect(payload.input[1]?.content).toContain('主题标签：插画图集')
    expect(payload.input[1]?.content).toContain('图片数量：6')
    expect(payload.input[1]?.content).toContain('文件名线索：wallpaper-01.webp、cg-main.png')
    expect(
      payload.text.format.schema.properties.imageSourceSuggestion.properties.source.enum
    ).toEqual(['原画', '壁纸', '图集'])
  })
})

describe('createAdminComposeResponseFromOpenAi', () => {
  it('maps output_text to the existing admin compose response shape', () => {
    const response = createAdminComposeResponseFromOpenAi(baseRequest, {
      id: 'resp_123',
      model: 'gpt-5.4-mini',
      output: [
        {
          type: 'message',
          content: [
            {
              type: 'output_text',
              text: JSON.stringify({
                summary: '一段适合卡片展示的精炼摘要。',
                reasons: ['保留核心信息']
              })
            }
          ]
        }
      ],
      usage: {
        input_tokens: 12,
        output_tokens: 18,
        total_tokens: 30
      }
    })

    expect(response).toEqual({
      task: 'generate-summary',
      contentType: 'article',
      model: 'gpt-5.4-mini',
      promptVersion: 'admin-web.browser-openai.v1',
      traceId: 'resp_123',
      result: {
        summary: '一段适合卡片展示的精炼摘要。'
      },
      usage: {
        inputTokens: 12,
        outputTokens: 18,
        totalTokens: 30
      }
    })

    expect(resolveAdminComposePreviewText(response.result)).toBe('一段适合卡片展示的精炼摘要。')
  })

  it('uses readable preview text for html-based editor content', () => {
    const response = createAdminComposeResponseFromOpenAi(
      {
        ...baseRequest,
        task: 'rewrite-selection',
        source: {
          selectionText: '原始片段',
          selectionPrefix: '前文',
          selectionSuffix: '后文'
        }
      },
      {
        id: 'resp_html',
        model: 'gpt-5.4-mini',
        output: [
          {
            type: 'message',
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({
                  content:
                    '<h2>段落标题</h2><p>第一段内容</p><ul><li>要点一</li><li>要点二</li></ul>'
                })
              }
            ]
          }
        ]
      }
    )

    expect(resolveAdminComposePreviewText(response.result)).toBe(
      '段落标题\n\n第一段内容\n\n• 要点一\n• 要点二'
    )
  })
})

describe('createBrowserOpenAiStreamResponse', () => {
  it('rethrows abort errors so blur-driven cancellation stays silent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'))
    )

    await expect(
      createBrowserOpenAiStreamResponse(baseRequest, {
        MODE: 'development',
        DEV: true,
        VITE_ADMIN_AI_EXPERIMENT_ENABLED: 'true',
        VITE_TESTAI_API_KEY: 'key-1',
        VITE_TESTAI_API_MODEL_COMPOSE: 'gpt-5.4-mini'
      })
    ).rejects.toMatchObject({
      name: 'AbortError'
    })
  })
})
