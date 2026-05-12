import type { AdminComposeOptions } from '@frontend/ai-sdk'

export type ArticleAutocompleteField = 'title' | 'summary'
export type ContentEditorAiTask = 'rewrite-selection' | 'continue-content'
export type TopicAutocompleteField = 'title' | 'summary'
export type ImageAutocompleteField = 'title' | 'summary' | 'source'

export interface ContentFieldAutocompleteConfig<TField extends string = string> {
  field: TField
  label: string
  minTriggerLength: number
  debounceMs: number
}

export const ARTICLE_FIELD_AUTOCOMPLETE_CONFIG: Record<
  ArticleAutocompleteField,
  ContentFieldAutocompleteConfig<ArticleAutocompleteField>
> = {
  title: {
    field: 'title',
    label: '标题',
    minTriggerLength: 6,
    debounceMs: 600
  },
  summary: {
    field: 'summary',
    label: '摘要',
    minTriggerLength: 12,
    debounceMs: 600
  }
}

export const ARTICLE_EDITOR_AI_LABELS: Record<ContentEditorAiTask, string> = {
  'rewrite-selection': 'AI 优化',
  'continue-content': 'AI 续写'
}

export const ARTICLE_FIELD_WAITING_TEXT: Record<ArticleAutocompleteField, string> = {
  title: '正在根据当前标题和正文生成标题建议…',
  summary: '正在根据当前摘要和正文生成摘要建议…'
}

export const ARTICLE_EDITOR_WAITING_TEXT: Record<ContentEditorAiTask, string> = {
  'rewrite-selection': '正在结合选区上下文生成改写建议…',
  'continue-content': '正在结合正文上下文生成续写建议…'
}

export const ARTICLE_EDITOR_CONTEXT_LIMITS = {
  selectionText: 500,
  surroundingText: 300
} as const

export const ARTICLE_FIELD_CONTENT_EXCERPT_LIMITS = {
  title: 720,
  summary: 1200
} as const

export const DEFAULT_CONTENT_AI_OPTIONS: Required<
  Pick<AdminComposeOptions, 'tone' | 'includeReasons'>
> = {
  tone: 'neutral',
  includeReasons: false
}

export const ARTICLE_SUMMARY_AI_OPTIONS: Required<
  Pick<AdminComposeOptions, 'tone' | 'includeReasons' | 'maxSummaryLength'>
> = {
  ...DEFAULT_CONTENT_AI_OPTIONS,
  maxSummaryLength: 160
}

export const ARTICLE_FIELD_MANUAL_BUTTON_LABEL = 'AI'

export const TOPIC_FIELD_AUTOCOMPLETE_CONFIG: Record<
  TopicAutocompleteField,
  ContentFieldAutocompleteConfig<TopicAutocompleteField>
> = {
  title: {
    field: 'title',
    label: '标题',
    minTriggerLength: 8,
    debounceMs: 600
  },
  summary: {
    field: 'summary',
    label: '摘要',
    minTriggerLength: 12,
    debounceMs: 600
  }
}

export const TOPIC_FIELD_WAITING_TEXT: Record<TopicAutocompleteField, string> = {
  title: '正在结合游戏题材、标签和正文生成标题建议…',
  summary: '正在结合游戏摘要、正文和运营标签生成摘要建议…'
}

export const TOPIC_EDITOR_WAITING_TEXT: Record<ContentEditorAiTask, string> = {
  'rewrite-selection': '正在结合游戏正文上下文生成优化建议…',
  'continue-content': '正在结合游戏正文上下文生成续写建议…'
}

export const TOPIC_EDITOR_AI_LABELS: Record<ContentEditorAiTask, string> = {
  'rewrite-selection': 'AI 优化',
  'continue-content': 'AI 续写'
}

export const IMAGE_FIELD_AUTOCOMPLETE_CONFIG: Record<
  ImageAutocompleteField,
  ContentFieldAutocompleteConfig<ImageAutocompleteField>
> = {
  title: {
    field: 'title',
    label: '标题',
    minTriggerLength: 6,
    debounceMs: 600
  },
  summary: {
    field: 'summary',
    label: '描述',
    minTriggerLength: 8,
    debounceMs: 600
  },
  source: {
    field: 'source',
    label: '图片类型',
    minTriggerLength: 1,
    debounceMs: 600
  }
}

export const IMAGE_FIELD_WAITING_TEXT: Record<ImageAutocompleteField, string> = {
  title: '正在根据图包信息生成标题建议…',
  summary: '正在根据图包信息生成描述建议…',
  source: '正在根据图包信息建议图片类型…'
}

export const TOPIC_SUMMARY_AI_OPTIONS: Required<
  Pick<AdminComposeOptions, 'tone' | 'includeReasons' | 'maxSummaryLength'>
> = {
  tone: 'promo',
  includeReasons: false,
  maxSummaryLength: 180
}

export const IMAGE_SUMMARY_AI_OPTIONS: Required<
  Pick<AdminComposeOptions, 'tone' | 'includeReasons' | 'maxSummaryLength'>
> = {
  tone: 'community',
  includeReasons: false,
  maxSummaryLength: 180
}
