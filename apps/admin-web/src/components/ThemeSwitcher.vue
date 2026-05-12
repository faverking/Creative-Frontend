<template>
  <el-button
    class="theme-button"
    :class="{ 'theme-button-compact': compact }"
    size="small"
    @click="onToggle"
  >
    <svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        v-if="themeStore.mode === 'dark'"
        d="M12 3.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V4.5a.75.75 0 0 1 .75-.75Zm0 12a3.75 3.75 0 1 0 0-7.5a3.75 3.75 0 0 0 0 7.5Zm0 4.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V21a.75.75 0 0 1 .75-.75Zm8.25-8.25a.75.75 0 0 1 .75.75a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5ZM5.25 12a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1 0-1.5h1.5Zm10.586-5.836a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 1 1-1.06 1.061l-1.06-1.061a.75.75 0 0 1 0-1.06Zm-9.792 9.793a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061Zm11.913 1.06a.75.75 0 0 1 0 1.061l-1.06 1.06a.75.75 0 1 1-1.061-1.06l1.06-1.06a.75.75 0 0 1 1.061 0Zm-9.792-9.793a.75.75 0 0 1 0 1.061L7.104 9.345a.75.75 0 1 1-1.06-1.06l1.06-1.061a.75.75 0 0 1 1.061 0Z"
      />
      <path
        v-else
        d="M14.5 3.5a.75.75 0 0 1 .791.89a6.75 6.75 0 1 0 8.32 8.32a.75.75 0 0 1 1.151.756a8.25 8.25 0 1 1-10.12-10.12a.75.75 0 0 1-.142.014Z"
      />
    </svg>
    <span>{{ label }}</span>
  </el-button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useThemeStore } from '@frontend/store'

withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  {
    compact: false
  }
)

const themeStore = useThemeStore()

const label = computed(() => (themeStore.mode === 'dark' ? '浅色模式' : '深色模式'))

const onToggle = () => {
  themeStore.toggle()
}
</script>

<style scoped>
.theme-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 116px;
  height: 40px;
  border: 1px solid var(--community-border);
  border-radius: 999px;
  background: var(--community-surface-soft);
  box-shadow: var(--community-inner-glow);
}

.theme-button-compact {
  min-width: 108px;
  padding-inline: 16px;
}

.theme-icon {
  margin-top: -1px;
  margin-right: 4px;
  width: 16px;
  height: 16px;
  fill: currentColor;
}
</style>
