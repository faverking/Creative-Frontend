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
  --portal-empty-bg: var(--home-detail-panel-bg);
  --portal-empty-border: var(--home-detail-panel-border);
  --portal-empty-shadow: var(--home-detail-panel-shadow);
  --portal-empty-radius: 24px;
  --portal-empty-padding: 24px;
}

.portal-empty-state :deep(.el-empty) {
  padding: var(--portal-empty-padding);
  border: 1px solid var(--portal-empty-border);
  border-radius: var(--portal-empty-radius);
  background: var(--portal-empty-bg);
  box-shadow: var(--portal-empty-shadow);
}

.portal-empty-state :deep(.el-empty__description) {
  margin-top: 10px;
}

.portal-empty-state :deep(.el-empty__description p) {
  margin: 0;
  color: var(--portal-muted);
  font-size: 12px;
  line-height: 1.7;
}
</style>
