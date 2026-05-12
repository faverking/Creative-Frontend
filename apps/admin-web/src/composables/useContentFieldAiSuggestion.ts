import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  useAiTaskRunner,
  type AdminComposeResponse,
  type AdminComposeRequest,
  type AiClient
} from '@frontend/ai-sdk'

import { getAiClient } from '@/api/ai'

interface UseContentFieldAiSuggestionOptions {
  label: string
  minTriggerLength: number
  debounceMs: number
  waitingText: string
  getTriggerLength: () => number
  getDisabledReason: () => string
  buildRequest: () => AdminComposeRequest
  extractSuggestionText: (response: AdminComposeResponse | null) => string
  applySuggestion: (text: string, response: AdminComposeResponse | null) => void
  watchSource: () => string
  client?: AiClient
}

export function useContentFieldAiSuggestion(options: UseContentFieldAiSuggestionOptions) {
  const client = options.client ?? getAiClient()
  const runner = useAiTaskRunner(client)
  const isActive = ref(false)
  const isComposing = ref(false)
  const lastRequestSignature = ref('')
  const suppressNextAutoRun = ref(false)
  let autoRunTimer: ReturnType<typeof setTimeout> | null = null

  const disabledReason = computed(() => options.getDisabledReason())
  const triggerLength = computed(() => options.getTriggerLength())
  const isAutoEligible = computed(
    () =>
      isActive.value &&
      !isComposing.value &&
      !disabledReason.value &&
      triggerLength.value >= options.minTriggerLength
  )
  const suggestionText = computed(() => options.extractSuggestionText(runner.result.value))
  const previewText = computed(() =>
    runner.status.value === 'streaming'
      ? runner.streamPreviewText.value.trim() || options.waitingText
      : suggestionText.value
  )
  const showSuggestion = computed(
    () =>
      runner.status.value === 'streaming' ||
      Boolean(suggestionText.value) ||
      (runner.status.value === 'error' && runner.error.value.length > 0)
  )
  const canAccept = computed(
    () => runner.status.value === 'completed' && suggestionText.value.length > 0
  )
  const manualButtonLabel = computed(() => (runner.loading.value ? '生成中' : 'AI'))

  function buildRequestSignature(): string {
    return JSON.stringify(options.buildRequest())
  }

  function clearRequestSignature(): void {
    lastRequestSignature.value = ''
  }

  function cancelScheduledAutoRun(): void {
    if (autoRunTimer) {
      clearTimeout(autoRunTimer)
      autoRunTimer = null
    }
  }

  function resetRunnerState(): void {
    if (runner.status.value !== 'idle') {
      runner.abort()
      runner.reset()
    }
  }

  function resetSuggestionState(): void {
    cancelScheduledAutoRun()
    clearRequestSignature()
    resetRunnerState()
  }

  async function runSuggestion(force = false): Promise<void> {
    if (runner.loading.value) {
      return
    }

    if (disabledReason.value) {
      if (force) {
        ElMessage.warning(disabledReason.value)
      }
      return
    }

    const requestSignature = buildRequestSignature()
    if (!force && requestSignature === lastRequestSignature.value) {
      return
    }

    lastRequestSignature.value = requestSignature
    await runner.run(options.buildRequest())
  }

  function scheduleAutoRun(): void {
    cancelScheduledAutoRun()
    autoRunTimer = setTimeout(() => {
      autoRunTimer = null

      if (!isAutoEligible.value || runner.status.value !== 'idle') {
        return
      }

      void runSuggestion()
    }, options.debounceMs)
  }

  function activate(): void {
    isActive.value = true
  }

  function deactivate(): void {
    isActive.value = false
    resetSuggestionState()
  }

  function handleCompositionStart(): void {
    isComposing.value = true
    cancelScheduledAutoRun()
  }

  function handleCompositionEnd(): void {
    isComposing.value = false

    if (!isAutoEligible.value) {
      return
    }

    scheduleAutoRun()
  }

  function acceptSuggestion(): void {
    if (!canAccept.value) {
      return
    }

    suppressNextAutoRun.value = true
    options.applySuggestion(suggestionText.value, runner.result.value)
    resetSuggestionState()
  }

  function dismissSuggestion(): void {
    resetSuggestionState()
  }

  async function rerunSuggestion(): Promise<void> {
    activate()
    clearRequestSignature()
    await runSuggestion(true)
  }

  watch(options.watchSource, () => {
    cancelScheduledAutoRun()

    if (suppressNextAutoRun.value) {
      suppressNextAutoRun.value = false
      return
    }

    resetRunnerState()
    clearRequestSignature()

    if (isAutoEligible.value) {
      scheduleAutoRun()
    }
  })

  watch(isActive, (active) => {
    if (active && isAutoEligible.value && runner.status.value === 'idle') {
      scheduleAutoRun()
      return
    }

    cancelScheduledAutoRun()
  })

  return {
    label: options.label,
    status: runner.status,
    loading: runner.loading,
    error: runner.error,
    waitingText: computed(() => options.waitingText),
    previewText,
    suggestionText,
    showSuggestion,
    canAccept,
    manualButtonLabel,
    manualDisabledReason: disabledReason,
    activate,
    deactivate,
    handleCompositionStart,
    handleCompositionEnd,
    rerunSuggestion,
    acceptSuggestion,
    dismissSuggestion,
    reset: resetSuggestionState
  }
}
