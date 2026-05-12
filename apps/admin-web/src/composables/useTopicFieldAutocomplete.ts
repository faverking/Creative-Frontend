import { computed } from 'vue'
import type { AiClient } from '@frontend/ai-sdk'

import {
  TOPIC_FIELD_AUTOCOMPLETE_CONFIG,
  TOPIC_FIELD_WAITING_TEXT,
  type TopicAutocompleteField
} from '@/constants/ai-content-assist'
import { useContentFieldAiSuggestion } from '@/composables/useContentFieldAiSuggestion'
import {
  buildTopicFieldComposeRequest,
  collectTopicAiSource,
  extractContentSuggestionText,
  resolveTopicFieldAutoTriggerLength,
  resolveTopicFieldManualDisabledReason,
  type TopicAiFormSnapshot,
  type TopicAiSourceSnapshot
} from '@/utils/ai-content-payload'

interface UseTopicFieldAutocompleteOptions {
  field: TopicAutocompleteField
  form: TopicAiFormSnapshot
  meta: Pick<TopicAiSourceSnapshot, 'embeddedImageCount' | 'embeddedVideoCount' | 'hasArchive'>
  client?: AiClient
}

export function useTopicFieldAutocomplete(options: UseTopicFieldAutocompleteOptions) {
  const config = TOPIC_FIELD_AUTOCOMPLETE_CONFIG[options.field]
  const sourceSnapshot = computed(() => collectTopicAiSource(options.form, options.meta))

  const fieldSuggestion = useContentFieldAiSuggestion({
    label: config.label,
    minTriggerLength: config.minTriggerLength,
    debounceMs: config.debounceMs,
    waitingText: TOPIC_FIELD_WAITING_TEXT[options.field],
    getTriggerLength: () => resolveTopicFieldAutoTriggerLength(options.field, sourceSnapshot.value),
    getDisabledReason: () =>
      resolveTopicFieldManualDisabledReason(options.field, sourceSnapshot.value),
    buildRequest: () => buildTopicFieldComposeRequest(options.field, options.form, options.meta),
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
        sourceSnapshot.value.topicId,
        sourceSnapshot.value.typeId,
        sourceSnapshot.value.featureFlags,
        sourceSnapshot.value.downloadUrl,
        sourceSnapshot.value.hasArchive
      ]),
    client: options.client
  })

  return {
    field: options.field,
    minTriggerLength: config.minTriggerLength,
    ...fieldSuggestion
  }
}
