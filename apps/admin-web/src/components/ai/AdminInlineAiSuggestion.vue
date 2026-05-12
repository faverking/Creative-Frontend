<template>
  <div class="inline-ai-suggestion" :class="statusClass">
    <header class="inline-ai-suggestion__header">
      <strong>
        <template v-if="status === 'error'">{{ label }}生成失败</template>
        <template v-else>{{
          status === 'streaming' ? `${label}建议生成中` : `${label}建议`
        }}</template>
        <span v-if="status === 'streaming'" class="inline-ai-suggestion__loading-dot" />
      </strong>
      <button
        type="button"
        class="inline-ai-suggestion__close"
        aria-label="收起 AI 建议"
        @click="$emit('dismiss')"
      >
        ×
      </button>
    </header>

    <div class="inline-ai-suggestion__copy">
      <p>{{ status === 'error' ? errorMessage : previewText }}</p>
    </div>

    <div v-if="status === 'completed'" class="inline-ai-suggestion__actions">
      <div class="inline-ai-suggestion__hint">
        <span class="inline-ai-suggestion__keycap">Tab</span>
        <span>应用</span>
        <span class="inline-ai-suggestion__hint-divider">/</span>
        <span class="inline-ai-suggestion__keycap">Esc</span>
        <span>关闭</span>
      </div>
      <el-button link type="primary" @click="$emit('accept')">应用</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AiTaskRunnerStatus } from '@frontend/ai-sdk'

const props = defineProps<{
  label: string
  status: AiTaskRunnerStatus
  previewText: string
  errorMessage: string
}>()

defineEmits<{
  accept: []
  dismiss: []
}>()

const statusClass = computed(() => ({
  'is-streaming': props.status === 'streaming',
  'is-error': props.status === 'error'
}))
</script>

<style scoped>
.inline-ai-suggestion {
  gap: 16px;
  display: grid;
  margin-top: 10px;
  padding: 12px 14px;
  border: 1px dashed color-mix(in srgb, var(--community-border) 78%, white 22%);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(250, 252, 255, 0.94), rgba(244, 248, 255, 0.98)),
    var(--community-surface-soft);
}

.inline-ai-suggestion.is-streaming {
  border-color: color-mix(in srgb, var(--community-blue) 24%, var(--community-border) 76%);
}

.inline-ai-suggestion.is-error {
  border-style: solid;
  border-color: color-mix(in srgb, var(--el-color-danger) 28%, var(--community-border) 72%);
}

.inline-ai-suggestion__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.inline-ai-suggestion__close {
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

.inline-ai-suggestion__close:hover {
  background: rgba(17, 24, 39, 0.06);
  color: var(--el-text-color-secondary);
}

.inline-ai-suggestion__copy {
  display: grid;
  gap: 6px;
}

.inline-ai-suggestion__copy strong {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--app-text-color);
  font-size: 13px;
  line-height: 1.4;
}

.inline-ai-suggestion__loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--community-blue) 76%, white 24%);
  box-shadow: 0 0 0 0 rgba(89, 136, 255, 0.24);
  animation: ai-suggestion-pulse 1.2s ease-in-out infinite;
}

.inline-ai-suggestion__copy p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.inline-ai-suggestion__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: space-between;
}

.inline-ai-suggestion__hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  white-space: nowrap;
}

.inline-ai-suggestion__hint-divider {
  opacity: 0.5;
}

.inline-ai-suggestion__keycap {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border: 1px solid color-mix(in srgb, var(--community-border) 84%, white 16%);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  color: var(--el-text-color-secondary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

@keyframes ai-suggestion-pulse {
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
