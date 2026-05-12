<template>
  <div class="editor-ai-popover" :class="placementClass" :style="anchorStyle">
    <div class="editor-ai-popover__card" :class="statusClass">
      <header class="editor-ai-popover__header">
        <div class="editor-ai-popover__headline">
          <strong>
            {{ title }}
            <span v-if="status === 'streaming'" class="editor-ai-popover__loading-dot" />
          </strong>
          <div v-if="status === 'completed'" class="editor-ai-popover__hint">
            <span class="editor-ai-popover__keycap">Tab</span>
            <span>应用</span>
            <span class="editor-ai-popover__hint-divider">/</span>
            <span class="editor-ai-popover__keycap">Esc</span>
            <span>关闭</span>
          </div>
        </div>
        <button
          type="button"
          class="editor-ai-popover__close"
          aria-label="关闭 AI 建议"
          @mousedown.prevent
          @click="$emit('dismiss')"
        >
          ×
        </button>
      </header>

      <p v-if="status === 'error'" class="editor-ai-popover__error">{{ errorMessage }}</p>
      <p v-else class="editor-ai-popover__content">{{ previewText }}</p>

      <footer v-if="status === 'completed'" class="editor-ai-popover__actions">
        <el-button type="primary" round size="small" @mousedown.prevent @click="$emit('accept')">
          应用
        </el-button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AiTaskRunnerStatus } from '@frontend/ai-sdk'

const props = defineProps<{
  title: string
  status: AiTaskRunnerStatus
  previewText: string
  errorMessage: string
  placement: 'above' | 'below'
  anchorStyle: {
    left: string
    top: string
  }
}>()

defineEmits<{
  accept: []
  dismiss: []
}>()

const statusClass = computed(() => ({
  'is-streaming': props.status === 'streaming',
  'is-error': props.status === 'error'
}))

const placementClass = computed(() => ({
  'editor-ai-popover--above': props.placement === 'above',
  'editor-ai-popover--below': props.placement === 'below'
}))
</script>

<style scoped>
.editor-ai-popover {
  position: absolute;
  z-index: 7;
  width: min(420px, calc(100% - 40px));
}

.editor-ai-popover--below {
  transform: translateX(-50%);
}

.editor-ai-popover--above {
  transform: translate(-50%, -100%);
}

.editor-ai-popover__card {
  display: grid;
  gap: 12px;
  padding: 16px 18px;
  border: 1px solid color-mix(in srgb, var(--community-border) 78%, white 22%);
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(246, 250, 255, 0.98)),
    var(--community-surface);
  box-shadow: 0 18px 36px rgba(14, 25, 42, 0.16);
}

.editor-ai-popover__card.is-streaming {
  border-color: color-mix(in srgb, var(--community-blue) 24%, var(--community-border) 76%);
}

.editor-ai-popover__card.is-error {
  border-color: color-mix(in srgb, var(--el-color-danger) 26%, var(--community-border) 74%);
}

.editor-ai-popover__header,
.editor-ai-popover__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.editor-ai-popover__header {
  justify-content: space-between;
}

.editor-ai-popover__headline {
  display: grid;
  gap: 6px;
}

.editor-ai-popover__header strong {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--app-text-color);
  font-size: 14px;
}

.editor-ai-popover__hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.editor-ai-popover__hint-divider {
  opacity: 0.5;
}

.editor-ai-popover__keycap {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border: 1px solid color-mix(in srgb, var(--community-border) 84%, white 16%);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.editor-ai-popover__loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--community-blue) 76%, white 24%);
  box-shadow: 0 0 0 0 rgba(89, 136, 255, 0.24);
  animation: editor-ai-popover-pulse 1.2s ease-in-out infinite;
}

.editor-ai-popover__close {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--el-text-color-placeholder);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.editor-ai-popover__close:hover {
  background: rgba(17, 24, 39, 0.06);
  color: var(--el-text-color-secondary);
}

.editor-ai-popover__content,
.editor-ai-popover__error {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.75;
  white-space: pre-wrap;
}

.editor-ai-popover__error {
  color: var(--el-color-danger);
}

.editor-ai-popover__actions {
  justify-content: flex-end;
}

@keyframes editor-ai-popover-pulse {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(0.92);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
