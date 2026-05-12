import { computed } from 'vue'
import type { AiClient } from '@frontend/ai-sdk'

import {
  IMAGE_FIELD_AUTOCOMPLETE_CONFIG,
  IMAGE_FIELD_WAITING_TEXT,
  type ImageAutocompleteField
} from '@/constants/ai-content-assist'
import { useContentFieldAiSuggestion } from '@/composables/useContentFieldAiSuggestion'
import {
  buildImageFieldComposeRequest,
  collectImageAiSource,
  extractContentSuggestionText,
  extractImageSourceSuggestion,
  resolveImageFieldAutoTriggerLength,
  resolveImageFieldManualDisabledReason,
  type ImageAiFormSnapshot,
  type ImageAiSourceInput
} from '@/utils/ai-content-payload'

interface UseImageFieldAutocompleteOptions {
  field: ImageAutocompleteField
  form: ImageAiFormSnapshot
  input: ImageAiSourceInput
  client?: AiClient
}

export function useImageFieldAutocomplete(options: UseImageFieldAutocompleteOptions) {
  const config = IMAGE_FIELD_AUTOCOMPLETE_CONFIG[options.field]
  const sourceSnapshot = computed(() => collectImageAiSource(options.form, options.input))

  const fieldSuggestion = useContentFieldAiSuggestion({
    label: config.label,
    minTriggerLength: config.minTriggerLength,
    debounceMs: config.debounceMs,
    waitingText: IMAGE_FIELD_WAITING_TEXT[options.field],
    getTriggerLength: () => resolveImageFieldAutoTriggerLength(options.field, sourceSnapshot.value),
    getDisabledReason: () =>
      resolveImageFieldManualDisabledReason(options.field, sourceSnapshot.value),
    buildRequest: () => buildImageFieldComposeRequest(options.field, options.form, options.input),
    extractSuggestionText: extractContentSuggestionText,
    applySuggestion: (nextValue, response) => {
      if (options.field === 'title') {
        options.form.title = nextValue
        return
      }

      if (options.field === 'source') {
        const nextSource = extractImageSourceSuggestion(response)
        if (nextSource) {
          options.form.source = nextSource
        }
        return
      }

      options.form.desc = nextValue
    },
    watchSource: () =>
      JSON.stringify([
        sourceSnapshot.value.title,
        sourceSnapshot.value.summary,
        sourceSnapshot.value.themeId,
        sourceSnapshot.value.source,
        sourceSnapshot.value.imageCount,
        sourceSnapshot.value.fileNameHints,
        sourceSnapshot.value.coverSelected
      ]),
    client: options.client
  })

  return {
    field: options.field,
    minTriggerLength: config.minTriggerLength,
    ...fieldSuggestion
  }
}
