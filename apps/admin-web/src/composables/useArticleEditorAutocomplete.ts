import type { AiClient } from '@frontend/ai-sdk'

import {
  ARTICLE_EDITOR_AI_LABELS,
  ARTICLE_EDITOR_WAITING_TEXT
} from '@/constants/ai-content-assist'
import { getAiClient } from '@/api/ai'
import { useContentEditorAutocomplete } from '@/composables/useContentEditorAutocomplete'
import {
  buildArticleEditorComposeRequest,
  resolveArticleEditorDisabledReason,
  type ArticleAiFormSnapshot
} from '@/utils/ai-content-payload'

export function useArticleEditorAutocomplete(
  form: ArticleAiFormSnapshot,
  client: AiClient = getAiClient()
) {
  return useContentEditorAutocomplete({
    actionLabels: ARTICLE_EDITOR_AI_LABELS,
    waitingTexts: ARTICLE_EDITOR_WAITING_TEXT,
    buildRequest: (task, snapshot) => buildArticleEditorComposeRequest(task, form, snapshot),
    resolveDisabledReason: resolveArticleEditorDisabledReason,
    client
  })
}
