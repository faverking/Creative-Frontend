<template>
  <teleport to="body">
    <div
      v-if="open && activeItem"
      class="public-detail-gallery-lightbox"
      role="dialog"
      aria-modal="true"
      :aria-label="title ? `${title} 全屏预览` : '图包全屏预览'"
      @click.self="emit('close')"
    >
      <button
        type="button"
        class="public-detail-gallery-lightbox__dismiss"
        aria-label="关闭全屏预览"
        @click="emit('close')"
      >
        关闭
      </button>

      <div class="public-detail-gallery-lightbox__toolbar">
        <div class="public-detail-gallery-lightbox__meta">
          <strong>{{ title || activeItem.label }}</strong>
          <span>{{ activeLabel }}</span>
        </div>

        <div class="public-detail-gallery-lightbox__controls">
          <button type="button" @click="zoomOut">缩小</button>
          <button type="button" @click="resetView">重置</button>
          <button type="button" @click="zoomIn">放大</button>
        </div>
      </div>

      <button
        v-if="canNavigate"
        type="button"
        class="public-detail-gallery-lightbox__nav public-detail-gallery-lightbox__nav--prev"
        aria-label="查看上一张"
        @click="showPrevious"
      >
        <portal-svg-icon name="big-prev" size="2rem" />
      </button>

      <div
        ref="stageRef"
        class="public-detail-gallery-lightbox__stage"
        :class="{
          'is-draggable': scale > 1,
          'is-dragging': isDragging
        }"
        @dblclick="toggleZoom"
        @wheel.prevent="handleWheel"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerUp"
        @lostpointercapture="handlePointerUp"
      >
        <div class="public-detail-gallery-lightbox__backdrop-glow" />

        <div class="public-detail-gallery-lightbox__canvas" :style="canvasStyle">
          <portal-image
            :src="activeItem.imageUrl"
            :alt="activeItem.label"
            class="public-detail-gallery-lightbox__image"
            fit="contain"
            loading="eager"
          />
        </div>
      </div>

      <button
        v-if="canNavigate"
        type="button"
        class="public-detail-gallery-lightbox__nav public-detail-gallery-lightbox__nav--next"
        aria-label="查看下一张"
        @click="showNext"
      >
        <portal-svg-icon name="big-next" size="2rem" />
      </button>

      <div class="public-detail-gallery-lightbox__hint">
        <span>滚轮缩放</span>
        <span>双击切换</span>
        <span>拖拽平移</span>
        <span>Esc 退出</span>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

type GalleryLightboxItem = {
  id: string
  imageUrl: string
  label: string
}

const MIN_SCALE = 1
const MAX_SCALE = 4
const SCALE_STEP = 0.22

const props = withDefaults(
  defineProps<{
    currentIndex: number
    items: GalleryLightboxItem[]
    open: boolean
    title?: string
  }>(),
  {
    title: ''
  }
)

const emit = defineEmits<{
  close: []
  'update:currentIndex': [index: number]
}>()

const stageRef = ref<HTMLElement | null>(null)
const scale = ref(MIN_SCALE)
const offsetX = ref(0)
const offsetY = ref(0)
const isDragging = ref(false)
const activePointerId = ref<number | null>(null)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragOriginX = ref(0)
const dragOriginY = ref(0)

const normalizedIndex = computed(() => {
  if (props.items.length === 0) {
    return 0
  }

  return Math.min(Math.max(props.currentIndex, 0), props.items.length - 1)
})
const activeItem = computed(() => props.items[normalizedIndex.value] ?? null)
const canNavigate = computed(() => props.items.length > 1)
const activeLabel = computed(() => {
  if (!activeItem.value) {
    return ''
  }

  return `${normalizedIndex.value + 1} / ${props.items.length}`
})
const canvasStyle = computed(() => ({
  transform: `translate3d(${offsetX.value}px, ${offsetY.value}px, 0) scale(${scale.value})`
}))

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetView()
      window.addEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'hidden'
      return
    }

    window.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
    releaseDrag()
  }
)

watch(
  () => normalizedIndex.value,
  () => {
    resetView()
  }
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function clampOffsets(nextX: number, nextY: number, nextScale = scale.value) {
  const stage = stageRef.value

  if (!stage || nextScale <= MIN_SCALE) {
    return { x: 0, y: 0 }
  }

  const { width, height } = stage.getBoundingClientRect()
  const maxOffsetX = (width * nextScale - width) / 2
  const maxOffsetY = (height * nextScale - height) / 2

  return {
    x: clamp(nextX, -maxOffsetX, maxOffsetX),
    y: clamp(nextY, -maxOffsetY, maxOffsetY)
  }
}

function applyScale(nextScale: number, originX = 0, originY = 0) {
  const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE)

  if (clampedScale === MIN_SCALE) {
    scale.value = clampedScale
    offsetX.value = 0
    offsetY.value = 0
    return
  }

  const ratio = clampedScale / scale.value
  const nextX = offsetX.value - originX * (ratio - 1)
  const nextY = offsetY.value - originY * (ratio - 1)
  const { x, y } = clampOffsets(nextX, nextY, clampedScale)

  scale.value = clampedScale
  offsetX.value = x
  offsetY.value = y
}

function zoomIn() {
  applyScale(scale.value + SCALE_STEP)
}

function zoomOut() {
  applyScale(scale.value - SCALE_STEP)
}

function resetView() {
  scale.value = MIN_SCALE
  offsetX.value = 0
  offsetY.value = 0
}

function toggleZoom(event: MouseEvent) {
  const stage = stageRef.value

  if (!stage) {
    return
  }

  if (scale.value > MIN_SCALE) {
    resetView()
    return
  }

  const rect = stage.getBoundingClientRect()
  applyScale(
    2,
    event.clientX - rect.left - rect.width / 2,
    event.clientY - rect.top - rect.height / 2
  )
}

function handleWheel(event: WheelEvent) {
  const stage = stageRef.value

  if (!stage || !activeItem.value) {
    return
  }

  const rect = stage.getBoundingClientRect()
  const originX = event.clientX - rect.left - rect.width / 2
  const originY = event.clientY - rect.top - rect.height / 2
  const direction = event.deltaY < 0 ? SCALE_STEP : -SCALE_STEP

  applyScale(scale.value + direction, originX, originY)
}

function handlePointerDown(event: PointerEvent) {
  if (scale.value <= MIN_SCALE || event.button !== 0) {
    return
  }

  activePointerId.value = event.pointerId
  isDragging.value = true
  dragStartX.value = event.clientX
  dragStartY.value = event.clientY
  dragOriginX.value = offsetX.value
  dragOriginY.value = offsetY.value
  stageRef.value?.setPointerCapture(event.pointerId)
}

function handlePointerMove(event: PointerEvent) {
  if (!isDragging.value || activePointerId.value !== event.pointerId) {
    return
  }

  const nextX = dragOriginX.value + (event.clientX - dragStartX.value)
  const nextY = dragOriginY.value + (event.clientY - dragStartY.value)
  const { x, y } = clampOffsets(nextX, nextY)

  offsetX.value = x
  offsetY.value = y
}

function handlePointerUp(event: PointerEvent) {
  if (activePointerId.value !== null && activePointerId.value !== event.pointerId) {
    return
  }

  releaseDrag()
}

function releaseDrag() {
  if (activePointerId.value !== null) {
    if (stageRef.value?.hasPointerCapture(activePointerId.value)) {
      stageRef.value.releasePointerCapture(activePointerId.value)
    }
  }

  activePointerId.value = null
  isDragging.value = false
}

function showPrevious() {
  if (!canNavigate.value) {
    return
  }

  emit(
    'update:currentIndex',
    normalizedIndex.value === 0 ? props.items.length - 1 : normalizedIndex.value - 1
  )
}

function showNext() {
  if (!canNavigate.value) {
    return
  }

  emit(
    'update:currentIndex',
    normalizedIndex.value === props.items.length - 1 ? 0 : normalizedIndex.value + 1
  )
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.open) {
    return
  }

  if (event.key === 'Escape') {
    emit('close')
    return
  }

  if (event.key === 'ArrowLeft') {
    showPrevious()
    return
  }

  if (event.key === 'ArrowRight') {
    showNext()
  }
}
</script>

<style scoped>
.public-detail-gallery-lightbox {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-rows: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: 24px;
  background:
    radial-gradient(circle at top, rgba(123, 214, 255, 0.18), transparent 34%),
    radial-gradient(circle at 84% 18%, rgba(245, 170, 214, 0.16), transparent 28%),
    rgba(6, 12, 23, 0.9);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.public-detail-gallery-lightbox__dismiss,
.public-detail-gallery-lightbox__controls button,
.public-detail-gallery-lightbox__nav {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(16, 26, 43, 0.7);
  color: rgba(244, 248, 255, 0.94);
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease;
}

.public-detail-gallery-lightbox__dismiss:hover,
.public-detail-gallery-lightbox__controls button:hover,
.public-detail-gallery-lightbox__nav:hover {
  border-color: rgba(123, 214, 255, 0.42);
  background: rgba(26, 39, 61, 0.86);
  transform: translateY(-1px);
}

.public-detail-gallery-lightbox__dismiss {
  justify-self: end;
  grid-column: 3;
  grid-row: 1;
  padding: 0 14px;
  min-height: 36px;
  font-size: 13px;
  font-weight: 700;
}

.public-detail-gallery-lightbox__toolbar {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}

.public-detail-gallery-lightbox__meta {
  display: grid;
  gap: 4px;
  min-width: 0;
  color: rgba(244, 248, 255, 0.92);
}

.public-detail-gallery-lightbox__meta strong {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.public-detail-gallery-lightbox__meta span {
  color: rgba(212, 225, 243, 0.76);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.public-detail-gallery-lightbox__controls {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.public-detail-gallery-lightbox__controls button {
  min-height: 36px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 700;
}

.public-detail-gallery-lightbox__stage {
  position: relative;
  grid-column: 2;
  grid-row: 2;
  min-height: min(80vh, 920px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 28px;
  background: rgba(10, 18, 31, 0.72);
  overflow: hidden;
  touch-action: none;
  user-select: none;
}

.public-detail-gallery-lightbox__stage.is-draggable {
  cursor: grab;
}

.public-detail-gallery-lightbox__stage.is-dragging {
  cursor: grabbing;
}

.public-detail-gallery-lightbox__backdrop-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 22%, rgba(123, 214, 255, 0.16), transparent 34%),
    radial-gradient(circle at 76% 78%, rgba(245, 170, 214, 0.12), transparent 28%);
  pointer-events: none;
}

.public-detail-gallery-lightbox__canvas {
  position: absolute;
  inset: 0;
  transition: transform 180ms ease;
}

.public-detail-gallery-lightbox__stage.is-dragging .public-detail-gallery-lightbox__canvas {
  transition: none;
}

.public-detail-gallery-lightbox__image {
  position: absolute;
}

.public-detail-gallery-lightbox__nav {
  width: 46px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.public-detail-gallery-lightbox__nav--prev {
  grid-column: 1;
  grid-row: 2;
}

.public-detail-gallery-lightbox__nav--next {
  grid-column: 3;
  grid-row: 2;
}

.public-detail-gallery-lightbox__hint {
  grid-column: 2;
  grid-row: 3;
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.public-detail-gallery-lightbox__hint span {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  background: rgba(16, 26, 43, 0.52);
  color: rgba(218, 229, 245, 0.76);
  font-size: 12px;
  font-weight: 700;
}
</style>
