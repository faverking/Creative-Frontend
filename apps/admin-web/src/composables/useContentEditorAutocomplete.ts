import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAiTaskRunner, type AdminComposeRequest, type AiClient } from '@frontend/ai-sdk'

import { getAiClient } from '@/api/ai'
import type {
  RichTextEditorExpose,
  RichTextEditorSelectionSnapshot
} from '@/types/rich-text-editor'
import {
  extractContentSuggestionApplyContent,
  extractContentSuggestionText
} from '@/utils/ai-content-payload'

interface UseContentEditorAutocompleteOptions {
  actionLabels: Record<'rewrite-selection' | 'continue-content', string>
  waitingTexts: Record<'rewrite-selection' | 'continue-content', string>
  buildRequest: (
    task: 'rewrite-selection' | 'continue-content',
    snapshot: RichTextEditorSelectionSnapshot
  ) => AdminComposeRequest
  resolveDisabledReason: (snapshot: RichTextEditorSelectionSnapshot | null) => string
  client?: AiClient
}

function createSnapshotSignature(snapshot: RichTextEditorSelectionSnapshot | null): string {
  if (!snapshot) {
    return ''
  }

  return JSON.stringify({
    mode: snapshot.mode,
    range: snapshot.range,
    selectedText: snapshot.selectedText
  })
}

function resolveEditorTask(
  selectionSnapshot: RichTextEditorSelectionSnapshot | null
): 'rewrite-selection' | 'continue-content' | null {
  if (!selectionSnapshot) {
    return null
  }

  return selectionSnapshot.mode === 'range' ? 'rewrite-selection' : 'continue-content'
}

const EDITOR_POPOVER_ESTIMATED_HEIGHT = 240

export function useContentEditorAutocomplete(options: UseContentEditorAutocompleteOptions) {
  const runner = useAiTaskRunner(options.client ?? getAiClient())
  const selectionSnapshot = ref<RichTextEditorSelectionSnapshot | null>(null)
  const selectionSignature = ref('')
  const ignoreNextExternalContentChange = ref(false)

  const task = computed(() => resolveEditorTask(selectionSnapshot.value))
  const disabledReason = computed(() => options.resolveDisabledReason(selectionSnapshot.value))
  const actionLabel = computed(() =>
    task.value ? options.actionLabels[task.value] : options.actionLabels['continue-content']
  )
  const applyContent = computed(() => extractContentSuggestionApplyContent(runner.result.value))
  const suggestionText = computed(() => extractContentSuggestionText(runner.result.value))
  const waitingText = computed(() =>
    task.value ? options.waitingTexts[task.value] : options.waitingTexts['continue-content']
  )
  const previewText = computed(() =>
    runner.status.value === 'streaming'
      ? runner.streamPreviewText.value.trim() || waitingText.value
      : suggestionText.value
  )
  const hasSuggestion = computed(
    () =>
      runner.status.value === 'streaming' ||
      Boolean(suggestionText.value) ||
      (runner.status.value === 'error' && runner.error.value.length > 0)
  )
  const canAccept = computed(
    () => runner.status.value === 'completed' && applyContent.value.length > 0
  )
  const showActionBubble = computed(
    () =>
      Boolean(selectionSnapshot.value) &&
      !disabledReason.value &&
      !hasSuggestion.value &&
      !runner.loading.value
  )
  const popoverPlacement = computed<'above' | 'below'>(() => {
    if (!selectionSnapshot.value) {
      return 'below'
    }

    const { anchor } = selectionSnapshot.value
    const spaceAbove = anchor.top
    const spaceBelow = anchor.containerHeight - (anchor.top + anchor.height)

    if (spaceBelow < EDITOR_POPOVER_ESTIMATED_HEIGHT && spaceAbove > spaceBelow) {
      return 'above'
    }

    return 'below'
  })
  const anchorStyle = computed(() => {
    if (!selectionSnapshot.value) {
      return {
        left: '50%',
        top: '24px'
      }
    }

    return {
      left: `${selectionSnapshot.value.anchor.left}px`,
      top:
        popoverPlacement.value === 'above'
          ? `${selectionSnapshot.value.anchor.top - 14}px`
          : `${selectionSnapshot.value.anchor.top + selectionSnapshot.value.anchor.height + 14}px`
    }
  })

  function updateSelectionSnapshot(snapshot: RichTextEditorSelectionSnapshot | null): void {
    const nextSignature = createSnapshotSignature(snapshot)
    if (nextSignature === selectionSignature.value) {
      return
    }

    selectionSignature.value = nextSignature
    selectionSnapshot.value = snapshot

    if (runner.status.value !== 'idle') {
      runner.abort()
      runner.reset()
    }
  }

  async function run(editor: RichTextEditorExpose | null): Promise<void> {
    if (!editor) {
      return
    }

    if (!task.value || !selectionSnapshot.value) {
      ElMessage.warning('请先在正文里定位光标或选中内容。')
      return
    }

    if (disabledReason.value) {
      ElMessage.warning(disabledReason.value)
      return
    }

    await runner.run(options.buildRequest(task.value, selectionSnapshot.value))
  }

  function dismissSuggestion(): void {
    runner.abort()
    runner.reset()
  }

  function handleExternalContentChange(): void {
    if (ignoreNextExternalContentChange.value) {
      ignoreNextExternalContentChange.value = false
      return
    }

    if (runner.status.value !== 'idle') {
      runner.abort()
      runner.reset()
    }
  }

  function acceptSuggestion(editor: RichTextEditorExpose | null): void {
    if (!editor || !task.value || !canAccept.value) {
      return
    }

    const nextText = applyContent.value
    ignoreNextExternalContentChange.value = true

    if (task.value === 'rewrite-selection') {
      editor.replaceSelection(nextText)
    } else {
      editor.insertAtCursor(nextText)
    }

    runner.reset()
    editor.focus()
  }

  function resetAll(): void {
    selectionSignature.value = ''
    selectionSnapshot.value = null
    runner.abort()
    runner.reset()
  }

  return {
    task,
    actionLabel,
    disabledReason,
    status: runner.status,
    loading: runner.loading,
    error: runner.error,
    waitingText,
    previewText,
    suggestionText,
    hasSuggestion,
    canAccept,
    showActionBubble,
    popoverPlacement,
    anchorStyle,
    updateSelectionSnapshot,
    handleExternalContentChange,
    run,
    acceptSuggestion,
    dismissSuggestion,
    reset: resetAll
  }
}
