<template>
  <el-config-provider :locale="zhCn">
    <div class="portal-app">
      <portal-top-bar />

      <div class="portal-app__frame">
        <main class="portal-app__content">
          <router-view />
        </main>

        <router-view name="dialog" />
      </div>

      <div
        v-if="showAnonymousLoading"
        class="portal-app__global-loading"
        role="status"
        aria-live="polite"
      >
        <div class="portal-app__global-loading-mark" aria-hidden="true">
          <span />
          <span />
        </div>
        <p>正在载入</p>
      </div>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useUserStore } from '@frontend/store'

const userStore = useUserStore()
const showAnonymousLoading = computed(() => !userStore.profile)
</script>

<style scoped>
.portal-app {
  position: relative;
  min-height: 100vh;
  isolation: isolate;
  background: var(--portal-page-bg);
}

.portal-app::before,
.portal-app::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.portal-app::before {
  z-index: 0;
  background: var(--portal-scene-overlay);
  opacity: var(--portal-scene-opacity);
  transform: scale(1.02);
}

.portal-app::after {
  z-index: 0;
  background: var(--portal-scene-blur-overlay);
  filter: blur(34px) saturate(var(--portal-scene-saturate));
  opacity: var(--portal-scene-blur-opacity);
  transform: scale(1.1);
}

.portal-app__frame {
  position: relative;
  z-index: 1;
  width: var(--portal-frame-width);
  min-height: calc(100vh - 100px);
  margin: 0 auto;
  padding: 28px 0 56px;
}

.portal-app__content {
  display: grid;
  align-content: start;
  min-height: calc(100vh - 180px);
}

.portal-app__global-loading {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 16px;
  background: var(--portal-scene-blur-overlay), var(--portal-scene-overlay), var(--portal-page-bg);
  color: var(--portal-ink-strong);
}

.portal-app__global-loading::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, var(--portal-surface-top-soft), transparent 36%),
    radial-gradient(circle at 50% 42%, var(--portal-focus-ring), transparent 28%);
  opacity: 0.82;
  pointer-events: none;
}

.portal-app__global-loading-mark {
  position: relative;
  z-index: 1;
  width: 46px;
  height: 46px;
}

.portal-app__global-loading-mark span {
  position: absolute;
  inset: 0;
  border: 1px solid color-mix(in srgb, var(--portal-accent-cyan) 32%, transparent);
  border-radius: 999px;
  animation: portal-global-loading-pulse 1.8s ease-in-out infinite;
}

.portal-app__global-loading-mark span + span {
  inset: 8px;
  border-color: color-mix(in srgb, var(--portal-primary-strong) 38%, transparent);
  animation-delay: 0.28s;
}

.portal-app__global-loading p {
  position: relative;
  z-index: 1;
  color: color-mix(in srgb, var(--portal-muted) 88%, var(--portal-ink-strong) 12%);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
  letter-spacing: 0.08em;
}

@keyframes portal-global-loading-pulse {
  0%,
  100% {
    transform: scale(0.76);
    opacity: 0.36;
  }

  50% {
    transform: scale(1);
    opacity: 0.92;
  }
}
</style>
