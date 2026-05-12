<template>
  <button
    class="theme-switch"
    :class="{ 'is-dark': isDark }"
    type="button"
    :aria-label="ariaLabel"
    :title="title"
    @click="onToggle"
  >
    <span class="theme-switch__track">
      <span class="theme-switch__icon theme-switch__icon--light" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path
            d="M12 3.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V4.5a.75.75 0 0 1 .75-.75Zm0 12a3.75 3.75 0 1 0 0-7.5a3.75 3.75 0 0 0 0 7.5Zm0 4.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V21a.75.75 0 0 1 .75-.75Zm8.25-8.25a.75.75 0 0 1 .75.75a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5ZM5.25 12a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1 0-1.5h1.5Z"
          />
        </svg>
      </span>

      <span class="theme-switch__icon theme-switch__icon--dark" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path
            d="M14.5 3.5a.75.75 0 0 1 .791.89a6.75 6.75 0 1 0 8.32 8.32a.75.75 0 0 1 1.151.756a8.25 8.25 0 1 1-10.12-10.12a.75.75 0 0 1-.142.014Z"
          />
        </svg>
      </span>

      <span class="theme-switch__thumb" aria-hidden="true" />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useThemeStore } from '@frontend/store'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.mode === 'dark')
const ariaLabel = computed(() => (isDark.value ? '切换到浅色主题' : '切换到深色主题'))
const title = computed(() => (isDark.value ? '深色模式' : '浅色模式'))

const onToggle = () => {
  themeStore.toggle()
}
</script>

<style scoped>
.theme-switch {
  --switch-track-bg: linear-gradient(135deg, rgba(248, 252, 255, 0.92), rgba(225, 236, 248, 0.76));
  --switch-track-border: rgba(121, 162, 205, 0.24);
  --switch-thumb-bg: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(235, 243, 251, 0.94));
  --switch-thumb-shadow: 0 6px 12px rgba(18, 41, 74, 0.12);
  --switch-light: var(--portal-accent-cyan);
  --switch-dark: rgba(25, 60, 123, 0.58);
  --switch-ease: cubic-bezier(0.22, 1, 0.36, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.theme-switch__track {
  position: relative;
  display: block;
  width: 54px;
  height: 28px;
  border: 1px solid var(--switch-track-border);
  border-radius: 999px;
  background: var(--switch-track-bg);
  box-shadow:
    inset 0 1px 0 var(--portal-surface-top),
    0 8px 16px rgba(18, 41, 74, 0.12);
  transition:
    background 220ms var(--switch-ease),
    border-color 220ms var(--switch-ease),
    box-shadow 220ms var(--switch-ease),
    width 220ms var(--switch-ease),
    height 220ms var(--switch-ease);
}

.theme-switch__icon {
  position: absolute;
  top: 50%;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 11px;
  height: 11px;
  transform: translateY(-50%);
  transition:
    color 220ms var(--switch-ease),
    opacity 220ms var(--switch-ease),
    transform 220ms var(--switch-ease),
    left 220ms var(--switch-ease),
    right 220ms var(--switch-ease);
}

.theme-switch__icon svg {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

.theme-switch__icon--light {
  left: 8px;
  color: var(--switch-light);
}

.theme-switch__icon--dark {
  right: 8px;
  color: var(--switch-dark);
}

.theme-switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--switch-thumb-bg);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    var(--switch-thumb-shadow);
  transition:
    transform 220ms var(--switch-ease),
    background 220ms var(--switch-ease),
    box-shadow 220ms var(--switch-ease),
    width 220ms var(--switch-ease),
    height 220ms var(--switch-ease);
}

.theme-switch:hover .theme-switch__track {
  box-shadow:
    inset 0 1px 0 var(--portal-surface-top),
    0 10px 18px rgba(18, 41, 74, 0.14);
}

.theme-switch.is-dark .theme-switch__thumb {
  transform: translateX(26px);
}

.theme-switch.is-dark .theme-switch__icon--light {
  opacity: 0.58;
}

.theme-switch:not(.is-dark) .theme-switch__icon--dark {
  opacity: 0.5;
}
</style>
