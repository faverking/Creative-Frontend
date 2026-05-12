import { onBeforeUnmount, ref } from 'vue'

export function useCopyFeedback(delay = 1600) {
  const copied = ref(false)
  let copiedTimer: number | undefined

  function clearCopyFeedback(): void {
    if (copiedTimer) {
      window.clearTimeout(copiedTimer)
      copiedTimer = undefined
    }
  }

  function markCopied(): void {
    copied.value = true
    clearCopyFeedback()

    copiedTimer = window.setTimeout(() => {
      copied.value = false
      copiedTimer = undefined
    }, delay)
  }

  onBeforeUnmount(() => {
    clearCopyFeedback()
  })

  return {
    copied,
    markCopied
  }
}
