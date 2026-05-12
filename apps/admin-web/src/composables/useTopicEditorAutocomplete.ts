import type { AiClient } from '@frontend/ai-sdk'

import { TOPIC_EDITOR_AI_LABELS, TOPIC_EDITOR_WAITING_TEXT } from '@/constants/ai-content-assist'
import { getAiClient } from '@/api/ai'
import { useContentEditorAutocomplete } from '@/composables/useContentEditorAutocomplete'
import {
  buildTopicEditorComposeRequest,
  resolveArticleEditorDisabledReason,
  type TopicAiFormSnapshot,
  type TopicAiSourceSnapshot
} from '@/utils/ai-content-payload'

export function useTopicEditorAutocomplete(
  form: TopicAiFormSnapshot,
  meta: Pick<TopicAiSourceSnapshot, 'embeddedImageCount' | 'embeddedVideoCount' | 'hasArchive'>,
  client: AiClient = getAiClient()
) {
  return useContentEditorAutocomplete({
    actionLabels: TOPIC_EDITOR_AI_LABELS,
    waitingTexts: TOPIC_EDITOR_WAITING_TEXT,
    buildRequest: (task, snapshot) => buildTopicEditorComposeRequest(task, form, meta, snapshot),
    resolveDisabledReason: resolveArticleEditorDisabledReason,
    client
  })
}
