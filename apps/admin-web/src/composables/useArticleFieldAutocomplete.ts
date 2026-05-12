import { computed } from 'vue'
import type { AiClient } from '@frontend/ai-sdk'

import {
  ARTICLE_FIELD_AUTOCOMPLETE_CONFIG,
  ARTICLE_FIELD_WAITING_TEXT,
  type ArticleAutocompleteField
} from '@/constants/ai-content-assist'
import { useContentFieldAiSuggestion } from '@/composables/useContentFieldAiSuggestion'
import {
  buildArticleFieldComposeRequest,
  collectArticleAiSource,
  extractContentSuggestionText,
  resolveArticleFieldAutoTriggerLength,
  resolveArticleFieldManualDisabledReason,
  type ArticleAiFormSnapshot
} from '@/utils/ai-content-payload'

interface UseArticleFieldAutocompleteOptions {
  field: ArticleAutocompleteField
  form: ArticleAiFormSnapshot
  client?: AiClient
}

export function useArticleFieldAutocomplete(options: UseArticleFieldAutocompleteOptions) {
  const config = ARTICLE_FIELD_AUTOCOMPLETE_CONFIG[options.field]

  const sourceSnapshot = computed(() => collectArticleAiSource(options.form))

  const fieldSuggestion = useContentFieldAiSuggestion({
    label: config.label,
    minTriggerLength: config.minTriggerLength,
    debounceMs: config.debounceMs,
    waitingText: ARTICLE_FIELD_WAITING_TEXT[options.field],
    getTriggerLength: () =>
      resolveArticleFieldAutoTriggerLength(options.field, sourceSnapshot.value),
    getDisabledReason: () =>
      resolveArticleFieldManualDisabledReason(options.field, sourceSnapshot.value),
    buildRequest: () => buildArticleFieldComposeRequest(options.field, options.form),
    extractSuggestionText: extractContentSuggestionText,
    applySuggestion: (nextValue) => {
      if (options.field === 'title') {
        options.form.title = nextValue
      } else {
        options.form.desc = nextValue
      }
    },
    watchSource: () =>
      JSON.stringify([
        sourceSnapshot.value.title,
        sourceSnapshot.value.summary,
        sourceSnapshot.value.content,
        sourceSnapshot.value.themeId
      ]),
    client: options.client
  })

  return {
    field: options.field,
    minTriggerLength: config.minTriggerLength,
    ...fieldSuggestion
  }
}
