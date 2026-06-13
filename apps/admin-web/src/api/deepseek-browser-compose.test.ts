import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AdminComposeRequest } from '@frontend/ai-sdk'

import {
  buildDeepSeekChatPayload,
  createAdminComposeResponseFromDeepSeek,
  createBrowserDeepSeekStreamResponse,
  resolveAdminComposePreviewText,
  resolveDeepSeekBrowserComposeConfig,
  runBrowserDeepSeekCompose
} from './deepseek-browser-compose'

const baseRequest: AdminComposeRequest = {
  contentType: 'article',
  task: 'generate-summary',
  source: {
    title: '春季版本前瞻',
    content: '这是一段用于测试 DeepSeek 浏览器直连层的正文内容。'
  },
  options: {
    tone: 'neutral',
    maxSummaryLength: 160,
    includeReasons: false
  }
}

interface DeepSeekPayloadForTest {
  model: string
  messages: Array<{ role: string; content: string }>
  response_format: {
    type: string
  }
  thinking: {
    type: string
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('resolveDeepSeekBrowserComposeConfig', () => {
  it('reads browser-side deepseek config with defaults', () => {
    expect(
      resolveDeepSeekBrowserComposeConfig({
        VITE_ADMIN_DEEPSEEK_API_KEY: 'key-1'
      })
    ).toEqual({
      config: {
        apiKey: 'key-1',
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-v4-flash'
      },
      setupError: ''
    })
  })

  it('reads browser-side deepseek config overrides', () => {
    expect(
      resolveDeepSeekBrowserComposeConfig({
        VITE_ADMIN_DEEPSEEK_API_KEY: 'key-1',
        VITE_ADMIN_DEEPSEEK_API_BASE_URL: 'https://deepseek.example.com',
        VITE_ADMIN_DEEPSEEK_MODEL: 'deepseek-v4-pro'
      })
    ).toEqual({
      config: {
        apiKey: 'key-1',
        baseUrl: 'https://deepseek.example.com',
        model: 'deepseek-v4-pro'
      },
      setupError: ''
    })
  })

  it('returns setup error when api key is missing', () => {
    expect(resolveDeepSeekBrowserComposeConfig({})).toEqual({
      config: null,
      setupError: 'DeepSeek 浏览器直连配置不完整，缺少 VITE_ADMIN_DEEPSEEK_API_KEY。'
    })
  })
})

describe('buildDeepSeekChatPayload', () => {
  it('builds a json-mode chat completions payload with thinking disabled', () => {
    const payload = buildDeepSeekChatPayload(baseRequest, {
      model: 'deepseek-v4-flash'
    }) as unknown as DeepSeekPayloadForTest

    expect(payload.model).toBe('deepseek-v4-flash')
    expect(payload.messages).toEqual([
      expect.objectContaining({
        role: 'system'
      }),
      expect.objectContaining({
        role: 'user'
      })
    ])
    expect(payload.response_format).toEqual({ type: 'json_object' })
    expect(payload.thinking).toEqual({ type: 'disabled' })
    expect(payload.messages[0]?.content).toContain('输出契约')
    expect(payload.messages[0]?.content).toContain('"summary"')
    expect(payload.messages[0]?.content).toContain('不要输出 reasons 字段')
    expect(payload.messages[0]?.content).toContain('承担主笔型编辑工作')
    expect(payload.messages[0]?.content).toContain('可直接填入后台')
  })

  it('narrows title rewrite input to title and content only', () => {
    const payload = buildDeepSeekChatPayload(
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
        model: 'deepseek-v4-flash'
      }
    ) as unknown as DeepSeekPayloadForTest

    expect(payload.messages[1]?.content).toContain('当前标题：原标题')
    expect(payload.messages[1]?.content).toContain('正文内容摘录：正文摘录内容')
    expect(payload.messages[1]?.content).not.toContain('当前摘要')
    expect(payload.messages[1]?.content).toContain('主题标签：新番情报')
  })

  it('narrows selection rewrite input to editor context and business labels only', () => {
    const payload = buildDeepSeekChatPayload(
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
        model: 'deepseek-v4-flash'
      }
    ) as unknown as DeepSeekPayloadForTest

    expect(payload.messages[1]?.content).toContain('正文选区：原始片段')
    expect(payload.messages[1]?.content).toContain('选区前文：前文上下文')
    expect(payload.messages[1]?.content).not.toContain('当前标题')
    expect(payload.messages[1]?.content).not.toContain('当前摘要')
    expect(payload.messages[1]?.content).toContain('主题标签：二游动态')
  })

  it('asks editor tasks to return restricted html while allowing ai-driven structure enhancement', () => {
    const selectionPayload = buildDeepSeekChatPayload(
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
        model: 'deepseek-v4-flash'
      }
    ) as unknown as DeepSeekPayloadForTest

    const continuePayload = buildDeepSeekChatPayload(
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
        model: 'deepseek-v4-flash'
      }
    ) as unknown as DeepSeekPayloadForTest

    expect(selectionPayload.messages[0]?.content).toContain(
      '只允许使用 p / h2 / h3 / blockquote / ul / ol / li / hr / br / strong / a'
    )
    expect(selectionPayload.messages[0]?.content).toContain('不能输出 h1、span、style、class')
    expect(selectionPayload.messages[0]?.content).toContain(
      '主动补齐导语、过渡、解释、要点、小标题、列表、引用或分隔线'
    )
    expect(selectionPayload.messages[0]?.content).toContain('可以明显扩写和重组')
    expect(continuePayload.messages[0]?.content).toContain(
      '主动引入标题、列表、引用、分隔线、过渡段或补充说明'
    )
    expect(continuePayload.messages[0]?.content).toContain('默认续写 2 到 4 个自然段')
  })

  it('builds game operation input with topic labels and feature flag candidates', () => {
    const payload = buildDeepSeekChatPayload(
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
        model: 'deepseek-v4-flash'
      }
    ) as unknown as DeepSeekPayloadForTest

    expect(payload.messages[1]?.content).toContain('内容类型：游戏')
    expect(payload.messages[1]?.content).toContain('游戏题材：Galgame')
    expect(payload.messages[1]?.content).toContain('游戏内容类型：合集整理')
    expect(payload.messages[1]?.content).toContain('游戏标签：PC')
    expect(payload.messages[1]?.content).toContain('候选游戏标签')
    expect(payload.messages[0]?.content).toContain('"featureFlagSuggestions"')
    expect(payload.messages[0]?.content).toContain('"id"')
  })

  it('builds image package source suggestions from metadata only', () => {
    const payload = buildDeepSeekChatPayload(
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
        model: 'deepseek-v4-flash'
      }
    ) as unknown as DeepSeekPayloadForTest

    expect(payload.messages[0]?.content).toContain('只能从候选图片类型中选择一个')
    expect(payload.messages[1]?.content).toContain('内容类型：图包')
    expect(payload.messages[1]?.content).toContain('主题标签：插画图集')
    expect(payload.messages[1]?.content).toContain('图片数量：6')
    expect(payload.messages[1]?.content).toContain('文件名线索：wallpaper-01.webp、cg-main.png')
    expect(payload.messages[0]?.content).toContain('"原画"')
    expect(payload.messages[0]?.content).toContain('"壁纸"')
    expect(payload.messages[0]?.content).toContain('"图集"')
  })
})

describe('createAdminComposeResponseFromDeepSeek', () => {
  it('maps chat completion content to the existing admin compose response shape', () => {
    const response = createAdminComposeResponseFromDeepSeek(baseRequest, {
      id: 'chatcmpl_123',
      model: 'deepseek-v4-flash',
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: '一段适合卡片展示的精炼摘要。',
              reasons: ['保留核心信息']
            })
          }
        }
      ],
      usage: {
        prompt_tokens: 12,
        completion_tokens: 18,
        total_tokens: 30
      }
    })

    expect(response).toEqual({
      task: 'generate-summary',
      contentType: 'article',
      model: 'deepseek-v4-flash',
      promptVersion: 'admin-web.browser-deepseek.v1',
      traceId: 'chatcmpl_123',
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
    const response = createAdminComposeResponseFromDeepSeek(
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
        id: 'chatcmpl_html',
        model: 'deepseek-v4-flash',
        choices: [
          {
            message: {
              content: JSON.stringify({
                content: '<h2>段落标题</h2><p>第一段内容</p><ul><li>要点一</li><li>要点二</li></ul>'
              })
            }
          }
        ]
      }
    )

    expect(resolveAdminComposePreviewText(response.result)).toBe(
      '段落标题\n\n第一段内容\n\n• 要点一\n• 要点二'
    )
  })

  it('normalizes feature flag labels to local candidates', () => {
    const response = createAdminComposeResponseFromDeepSeek(
      {
        contentType: 'topic',
        task: 'suggest-feature-flags',
        source: {},
        options: {
          includeReasons: false
        }
      },
      {
        id: 'chatcmpl_flags',
        model: 'deepseek-v4-flash',
        choices: [
          {
            message: {
              content: JSON.stringify({
                featureFlagSuggestions: [
                  {
                    id: 3,
                    label: '模型给出的标签会被本地枚举校准',
                    reason: '正文提到 PC 资源'
                  }
                ]
              })
            }
          }
        ]
      }
    )

    expect(response.result).toEqual({
      featureFlagSuggestions: [
        {
          id: 3,
          label: 'PC',
          reason: '正文提到 PC 资源'
        }
      ]
    })
  })
})

describe('runBrowserDeepSeekCompose', () => {
  it('sends a deepseek chat completions request with auth and json mode', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'chatcmpl_123',
          model: 'deepseek-v4-flash',
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: '一段适合卡片展示的精炼摘要。'
                })
              }
            }
          ]
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    )
    vi.stubGlobal('fetch', fetchMock)

    const response = await runBrowserDeepSeekCompose(baseRequest, {
      VITE_ADMIN_DEEPSEEK_API_KEY: 'key-1'
    })

    expect(response.result).toEqual({
      summary: '一段适合卡片展示的精炼摘要。'
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.deepseek.com/chat/completions')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer key-1'
    })

    const body = JSON.parse(String(init.body)) as DeepSeekPayloadForTest
    expect(body.model).toBe('deepseek-v4-flash')
    expect(body.response_format).toEqual({ type: 'json_object' })
    expect(body.thinking).toEqual({ type: 'disabled' })
  })
})

describe('createBrowserDeepSeekStreamResponse', () => {
  it('rethrows abort errors so blur-driven cancellation stays silent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'))
    )

    await expect(
      createBrowserDeepSeekStreamResponse(baseRequest, {
        VITE_ADMIN_DEEPSEEK_API_KEY: 'key-1'
      })
    ).rejects.toMatchObject({
      name: 'AbortError'
    })
  })
})
