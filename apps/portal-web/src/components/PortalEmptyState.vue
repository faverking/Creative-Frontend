<template>
  <section class="portal-empty-state">
    <el-empty :image-size="imageSize" :description="description" />
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    description?: string
    imageSize?: number
  }>(),
  {
    description: '暂无内容！',
    imageSize: 88
  }
)
</script>

<style scoped>
.portal-empty-state {
  display: grid;
}

.portal-empty-state :deep(.el-empty) {
  padding: var(--portal-empty-padding, 24px);
  border: 1px solid var(--portal-empty-border, var(--portal-request-state-border));
  border-radius: var(--portal-empty-radius, 24px);
  background: var(--portal-empty-bg, var(--portal-request-state-bg));
  box-shadow: var(--portal-empty-shadow, var(--portal-request-state-shadow));
}

.portal-empty-state :deep(.el-empty__description) {
  margin-top: 10px;
}

.portal-empty-state :deep(.el-empty__description p) {
  margin: 0;
  color: var(--portal-empty-description-ink, var(--portal-muted));
  font-size: var(--portal-empty-description-size, 12px);
  line-height: var(--portal-empty-description-line-height, 1.7);
}
</style>
