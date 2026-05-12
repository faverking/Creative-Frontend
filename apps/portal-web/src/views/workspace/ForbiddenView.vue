<template>
  <section class="workspace-forbidden">
    <img class="workspace-forbidden__illustration" :src="error403Illustration" alt="无权限访问" />

    <button type="button" class="workspace-forbidden__back" @click="handleBack">返回上一页</button>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

import error403Illustration from '@/assets/error-403.svg'

const router = useRouter()

function handleBack(): void {
  if (window.history.length > 1) {
    router.back()
    return
  }

  void router.push('/')
}
</script>

<style scoped>
.workspace-forbidden {
  min-height: calc(100vh - 160px);
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 20px;
  padding: 24px 12px 40px;
  box-sizing: border-box;
}

.workspace-forbidden__illustration {
  width: min(420px, 100%);
  height: auto;
  object-fit: contain;
}

.workspace-forbidden__back {
  appearance: none;
  min-height: 32px;
  padding: 0 16px;
  border: 1px solid var(--portal-request-state-primary-border);
  border-radius: 999px;
  background: var(--portal-request-state-primary-bg);
  box-shadow: var(--portal-request-state-primary-shadow);
  color: var(--portal-request-state-primary-ink);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.workspace-forbidden__back:hover {
  border-color: var(--portal-request-state-primary-hover-border);
  background: var(--portal-request-state-primary-hover-bg);
  box-shadow: var(--portal-request-state-primary-hover-shadow);
}
</style>
