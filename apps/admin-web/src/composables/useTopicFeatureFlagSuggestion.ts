import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useAiTaskRunner, type AiClient } from '@frontend/ai-sdk'

import { getAiClient } from '@/api/ai'
import {
  buildTopicFeatureFlagComposeRequest,
  collectTopicAiSource,
  extractContentSuggestionText,
  extractFeatureFlagSuggestionIds,
  type TopicAiFormSnapshot,
  type TopicAiSourceSnapshot
} from '@/utils/ai-content-payload'

export function useTopicFeatureFlagSuggestion(
  form: TopicAiFormSnapshot,
  meta: Pick<TopicAiSourceSnapshot, 'embeddedImageCount' | 'embeddedVideoCount' | 'hasArchive'>,
  client: AiClient = getAiClient()
) {
  const runner = useAiTaskRunner(client)
  const sourceSnapshot = computed(() => collectTopicAiSource(form, meta))
  const previewText = computed(() =>
    runner.status.value === 'streaming'
      ? runner.streamPreviewText.value.trim() || '正在根据游戏内容建议标签…'
      : extractContentSuggestionText(runner.result.value)
  )
  const showSuggestion = computed(
    () =>
      runner.status.value === 'streaming' ||
      Boolean(previewText.value) ||
      (runner.status.value === 'error' && runner.error.value.length > 0)
  )
  const canAccept = computed(
    () =>
      runner.status.value === 'completed' &&
      extractFeatureFlagSuggestionIds(runner.result.value).length > 0
  )

  function resolveDisabledReason(): string {
    if (
      !sourceSnapshot.value.title &&
      !sourceSnapshot.value.summary &&
      !sourceSnapshot.value.content
    ) {
      return '请先填写游戏标题、摘要或正文，再建议游戏标签。'
    }

    return ''
  }

  async function runSuggestion(): Promise<void> {
    const disabledReason = resolveDisabledReason()
    if (disabledReason) {
      ElMessage.warning(disabledReason)
      return
    }

    await runner.run(buildTopicFeatureFlagComposeRequest(form, meta))
  }

  function acceptSuggestion(): void {
    if (!canAccept.value) {
      return
    }

    const suggestionIds = extractFeatureFlagSuggestionIds(runner.result.value)
    form.featureFlags = Array.from(new Set([...form.featureFlags, ...suggestionIds])).slice(0, 7)
    runner.reset()
  }

  function dismissSuggestion(): void {
    runner.abort()
    runner.reset()
  }

  function reset(): void {
    runner.abort()
    runner.reset()
  }

  return {
    status: runner.status,
    loading: runner.loading,
    error: runner.error,
    previewText,
    showSuggestion,
    canAccept,
    runSuggestion,
    acceptSuggestion,
    dismissSuggestion,
    reset
  }
}
