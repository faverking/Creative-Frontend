<template>
  <public-detail-panel as="div" class="public-detail-side-rail" :padding="padding">
    <slot />
  </public-detail-panel>
</template>

<script setup lang="ts">
import PublicDetailPanel from './PublicDetailPanel.vue'

withDefaults(
  defineProps<{
    padding?: 'sm' | 'md'
  }>(),
  {
    padding: 'md'
  }
)
</script>

<style scoped>
.public-detail-side-rail {
  --public-detail-side-rail-divider-gap-before: 14px;
  --public-detail-side-rail-divider-gap-after: 22px;
  display: grid;
  gap: 0;
  border-color: color-mix(in srgb, var(--home-detail-panel-border) 82%, transparent);
  box-shadow:
    0 10px 20px rgba(18, 41, 74, 0.045),
    0 4px 10px rgba(18, 41, 74, 0.025),
    inset 0 1px 0 rgba(255, 255, 255, 0.26);
}

.public-detail-side-rail::before {
  opacity: 0.82;
}

.public-detail-side-rail :deep(.public-detail-side-rail__section) {
  min-width: 0;
}

.public-detail-side-rail
  :deep(.public-detail-side-rail__section + .public-detail-side-rail__section) {
  margin-top: var(--public-detail-side-rail-divider-gap-before);
  padding-top: var(--public-detail-side-rail-divider-gap-after);
  border-top: 1px solid var(--home-line);
}
</style>
