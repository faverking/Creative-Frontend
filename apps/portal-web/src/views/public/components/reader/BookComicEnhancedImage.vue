<template>
  <div
    ref="rootRef"
    class="book-comic-enhanced-image"
    :class="[attrs.class, `book-comic-enhanced-image--${enhancementState}`]"
    :style="attrs.style"
  >
    <canvas
      v-show="enhancementState === 'enhanced'"
      ref="canvasRef"
      class="book-comic-enhanced-image__canvas"
      :aria-label="alt"
      role="img"
    />

    <div
      v-if="enhancementState === 'idle' || enhancementState === 'loading'"
      class="book-comic-enhanced-image__state"
      aria-live="polite"
    >
      <span class="book-comic-enhanced-image__spinner" aria-hidden="true" />
      <strong>图片增强中</strong>
    </div>

    <div
      v-else-if="enhancementState === 'error'"
      class="book-comic-enhanced-image__state book-comic-enhanced-image__state--error"
      role="status"
    >
      <strong>{{ enhancementErrorText }}</strong>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch } from 'vue'

import {
  BOOK_COMIC_ENHANCEMENT_MAX_CSS_WIDTH,
  BookComicEnhancementError,
  type EnhanceBookComicImageResult,
  enhanceBookComicImage
} from '@/views/public/book-comic-enhancer'

defineOptions({
  inheritAttrs: false
})

const props = withDefaults(
  defineProps<{
    alt?: string
    loading?: 'eager' | 'lazy'
    maxCssWidth?: number
    src: string
  }>(),
  {
    alt: '',
    loading: 'lazy',
    maxCssWidth: BOOK_COMIC_ENHANCEMENT_MAX_CSS_WIDTH
  }
)

const attrs = useAttrs()
const rootRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const enhancementState = ref<'idle' | 'loading' | 'enhanced' | 'error'>('idle')
const enhancementErrorText = ref('图片增强失败')
const isVisible = ref(false)
const measuredWidth = ref(0)
let abortController: AbortController | null = null
let intersectionObserver: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null
let enhancementRunId = 0
const PORTAL_FALLBACK_ROOT_FONT_SIZE = 10

const normalizedSrc = computed(() => props.src.trim())

watch(
  () => [normalizedSrc.value, props.maxCssWidth] as const,
  () => {
    resetEnhancementState()
    void scheduleEnhancement()
  }
)

onMounted(() => {
  setupResizeObserver()
  setupIntersectionObserver()
  void scheduleEnhancement()
})

onBeforeUnmount(() => {
  enhancementRunId += 1
  abortCurrentEnhancement()
  intersectionObserver?.disconnect()
  resizeObserver?.disconnect()
})

async function scheduleEnhancement(): Promise<void> {
  await nextTick()

  if (props.loading === 'lazy' && !isVisible.value) {
    return
  }

  if (!normalizedSrc.value || enhancementState.value === 'loading') {
    return
  }

  const canvas = canvasRef.value
  if (!canvas) {
    return
  }

  abortCurrentEnhancement()
  const runId = enhancementRunId + 1
  enhancementRunId = runId
  abortController = new AbortController()
  enhancementState.value = 'loading'
  enhancementErrorText.value = '图片增强失败'
  resetCanvasPresentation(canvas)

  try {
    const result = await enhanceBookComicImage({
      canvas,
      containerWidth: resolveContainerWidth(),
      maxCssWidth: props.maxCssWidth,
      signal: abortController.signal,
      src: normalizedSrc.value
    })

    if (runId !== enhancementRunId) {
      return
    }

    applyCanvasPresentation(canvas, result)
    enhancementState.value = 'enhanced'
  } catch (error) {
    if (runId !== enhancementRunId) {
      return
    }

    if (isBookComicEnhancementAbortError(error)) {
      return
    }

    if (!(error instanceof BookComicEnhancementError)) {
      throw error
    }

    enhancementErrorText.value = `图片增强失败：${error.stage}`
    console.error('[portal-book-reader] comic image enhancement failed', {
      error,
      src: normalizedSrc.value
    })
    enhancementState.value = 'error'
  }
}

function setupIntersectionObserver(): void {
  const root = rootRef.value
  if (!root) {
    return
  }

  if (props.loading === 'eager') {
    isVisible.value = true
    return
  }

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (!entry?.isIntersecting) {
        return
      }

      isVisible.value = true
      intersectionObserver?.disconnect()
      intersectionObserver = null
      void scheduleEnhancement()
    },
    {
      rootMargin: '720px 0px'
    }
  )
  intersectionObserver.observe(root)
}

function setupResizeObserver(): void {
  const root = rootRef.value
  if (!root) {
    return
  }

  measuredWidth.value = root.getBoundingClientRect().width
  resizeObserver = new ResizeObserver((entries) => {
    const nextWidth = entries[0]?.contentRect.width ?? root.getBoundingClientRect().width
    measuredWidth.value = nextWidth
  })
  resizeObserver.observe(root)
}

function resolveContainerWidth(): number {
  const rootWidth = rootRef.value?.getBoundingClientRect().width ?? 0
  return measuredWidth.value || rootWidth || props.maxCssWidth
}

function resetEnhancementState(): void {
  enhancementRunId += 1
  abortCurrentEnhancement()
  const canvas = canvasRef.value
  if (canvas) {
    resetCanvasPresentation(canvas)
  }
  enhancementState.value = 'idle'
}

function abortCurrentEnhancement(): void {
  abortController?.abort()
  abortController = null
}

function isBookComicEnhancementAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function applyCanvasPresentation(
  canvas: HTMLCanvasElement,
  result: EnhanceBookComicImageResult
): void {
  canvas.style.setProperty('--book-comic-enhanced-canvas-width', toCurrentRootRem(result.cssWidth))
  canvas.style.setProperty(
    '--book-comic-enhanced-canvas-height',
    toCurrentRootRem(result.cssHeight)
  )
  canvas.style.setProperty(
    '--book-comic-enhanced-canvas-aspect-ratio',
    `${result.cssWidth} / ${result.cssHeight}`
  )
}

function resetCanvasPresentation(canvas: HTMLCanvasElement): void {
  canvas.style.removeProperty('--book-comic-enhanced-canvas-width')
  canvas.style.removeProperty('--book-comic-enhanced-canvas-height')
  canvas.style.removeProperty('--book-comic-enhanced-canvas-aspect-ratio')
}

function toCurrentRootRem(px: number): string {
  const remValue = px / resolveCurrentRootFontSize()
  return `${roundCssNumber(remValue)}rem`
}

function resolveCurrentRootFontSize(): number {
  const fontSize = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize)
  return Number.isFinite(fontSize) && fontSize > 0 ? fontSize : PORTAL_FALLBACK_ROOT_FONT_SIZE
}

function roundCssNumber(value: number): number {
  return Math.round(value * 10000) / 10000
}
</script>

<style scoped>
.book-comic-enhanced-image {
  display: grid;
  justify-items: center;
  min-height: 320px;
  overflow: hidden;
}

.book-comic-enhanced-image__canvas {
  display: block;
  width: min(100%, var(--book-comic-enhanced-canvas-width, 100%));
  max-width: 100%;
  height: auto;
  aspect-ratio: var(--book-comic-enhanced-canvas-aspect-ratio, auto);
  user-select: none;
}

.book-comic-enhanced-image__state {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 12px;
  width: min(100%, 1080px);
  min-height: 420px;
  padding: 28px;
  color: color-mix(in srgb, var(--home-muted) 86%, var(--home-ink));
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
}

.book-comic-enhanced-image__state--error {
  color: color-mix(in srgb, var(--home-danger, #c2410c) 78%, var(--home-ink));
}

.book-comic-enhanced-image__spinner {
  width: 28px;
  height: 28px;
  border: 3px solid color-mix(in srgb, var(--portal-book-reader-border) 68%, transparent);
  border-top-color: color-mix(in srgb, var(--home-business-bookshelf-accent) 72%, transparent);
  border-radius: 999px;
  animation: book-comic-enhanced-image-spin 760ms linear infinite;
}

@keyframes book-comic-enhanced-image-spin {
  to {
    transform: rotate(1turn);
  }
}
</style>
