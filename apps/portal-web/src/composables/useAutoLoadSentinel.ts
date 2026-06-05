import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

interface AutoLoadSentinelOptions {
  enabled: Ref<boolean>
  onLoadMore: () => Promise<void>
}

const AUTO_LOAD_COOLDOWN_MS = 520
const AUTO_LOAD_TRIGGER_OFFSET = 180
const AUTO_LOAD_TRIGGER_OFFSET_REM = AUTO_LOAD_TRIGGER_OFFSET / 10
const FALLBACK_SCROLL_DELAY_MS = 200

export function useAutoLoadSentinel(options: AutoLoadSentinelOptions) {
  const sentinelRef = ref<HTMLElement | null>(null)
  const autoLoading = ref(false)

  let observer: IntersectionObserver | null = null
  let scrollTimer: number | null = null
  let cooldownUntil = 0

  async function triggerAutoLoad(): Promise<void> {
    if (!options.enabled.value || autoLoading.value) {
      return
    }

    const now = Date.now()
    if (now < cooldownUntil) {
      return
    }

    cooldownUntil = now + AUTO_LOAD_COOLDOWN_MS
    autoLoading.value = true

    try {
      await options.onLoadMore()
      await nextTick()
    } finally {
      autoLoading.value = false
    }
  }

  function handleScrollFallback(): void {
    const currentWindow = globalThis.window

    if (scrollTimer !== null || !options.enabled.value) {
      return
    }

    scrollTimer = currentWindow.setTimeout(() => {
      scrollTimer = null

      const sentinel = sentinelRef.value
      if (!sentinel) {
        return
      }

      const rect = sentinel.getBoundingClientRect()
      if (rect.top - currentWindow.innerHeight < AUTO_LOAD_TRIGGER_OFFSET) {
        void triggerAutoLoad()
      }
    }, FALLBACK_SCROLL_DELAY_MS)
  }

  function cleanup(): void {
    const currentWindow = typeof window === 'undefined' ? null : window

    observer?.disconnect()
    observer = null

    if (currentWindow) {
      currentWindow.removeEventListener('scroll', handleScrollFallback)
      currentWindow.removeEventListener('resize', handleScrollFallback)
    }

    if (scrollTimer !== null) {
      currentWindow?.clearTimeout(scrollTimer)
      scrollTimer = null
    }
  }

  function setup(): void {
    const currentWindow = typeof window === 'undefined' ? null : window

    cleanup()

    if (!currentWindow || !options.enabled.value || !sentinelRef.value) {
      return
    }

    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            void triggerAutoLoad()
          }
        },
        {
          root: null,
          rootMargin: `0rem 0rem ${AUTO_LOAD_TRIGGER_OFFSET_REM}rem 0rem`,
          threshold: 0.01
        }
      )

      observer.observe(sentinelRef.value)
      return
    }

    currentWindow.addEventListener('scroll', handleScrollFallback, { passive: true })
    currentWindow.addEventListener('resize', handleScrollFallback, { passive: true })
    handleScrollFallback()
  }

  onMounted(setup)
  onBeforeUnmount(cleanup)

  watch(sentinelRef, () => {
    setup()
  })

  watch(
    options.enabled,
    () => {
      setup()
    },
    { immediate: true }
  )

  return {
    autoLoading,
    sentinelRef
  }
}
