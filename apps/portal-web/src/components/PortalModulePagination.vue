<template>
  <nav class="portal-module-pagination" aria-label="模块分页导航">
    <el-pagination
      :layout="paginationLayout"
      :current-page="normalizedCurrentPage"
      :disabled="disabled"
      :page-size="normalizedPageSize"
      :pager-count="7"
      :total="normalizedTotal"
      @current-change="handleCurrentChange"
    />
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    currentPage: number
    disabled?: boolean
    pageSize?: number
    total: number
  }>(),
  {
    disabled: false,
    pageSize: 1
  }
)

const emit = defineEmits<{
  change: [page: number]
}>()

const normalizedPageSize = computed(() => Math.max(1, props.pageSize))
const normalizedTotal = computed(() => Math.max(0, props.total))
const normalizedTotalPages = computed(() =>
  Math.max(1, Math.ceil(normalizedTotal.value / normalizedPageSize.value))
)
const normalizedCurrentPage = computed(() =>
  Math.min(Math.max(1, props.currentPage), normalizedTotalPages.value)
)
const paginationLayout = computed(() =>
  normalizedTotalPages.value > 1 ? 'total, prev, pager, next' : 'total'
)

function handleCurrentChange(page: number): void {
  emit('change', page)
}
</script>

<style scoped>
.portal-module-pagination {
  --portal-module-pagination-bg: var(--home-detail-card-bg);
  --portal-module-pagination-border: var(--home-detail-card-border);
  --portal-module-pagination-ink: color-mix(in srgb, var(--home-detail-glass-ink) 88%, transparent);
  --portal-module-pagination-active-bg: var(--home-detail-glass-bg-emphasis);
  --portal-module-pagination-active-border: var(--home-feature-ribbon-border);
  --portal-module-pagination-active-ink: var(--home-ink);
  --portal-module-pagination-hover-shadow: 0 10px 18px rgba(18, 41, 74, 0.08);
  --portal-module-pagination-active-shadow: 0 12px 20px rgba(18, 41, 74, 0.1);
  --portal-module-pagination-control-gap: 8px;
  --portal-module-pagination-control-radius: 14px;
  --portal-module-pagination-nav-width: 44px;
  --portal-module-pagination-page-min-width: 40px;
  --portal-module-pagination-section-gap: 12px;
  display: flex;
  justify-content: center;
}

.portal-module-pagination :deep(.el-pagination) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--portal-module-pagination-section-gap);
}

.portal-module-pagination :deep(.el-pagination__total) {
  margin: 0;
  color: var(--portal-module-pagination-ink);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
  white-space: nowrap;
}

.portal-module-pagination :deep(.el-pager) {
  display: flex;
  align-items: center;
  gap: var(--portal-module-pagination-control-gap);
  margin: 0;
  padding: 0;
}

.portal-module-pagination :deep(.btn-prev),
.portal-module-pagination :deep(.btn-next),
.portal-module-pagination :deep(.el-pager li) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  margin: 0;
  border: 1px solid var(--portal-module-pagination-border);
  border-radius: var(--portal-module-pagination-control-radius);
  background: var(--portal-module-pagination-bg);
  box-sizing: border-box;
  color: var(--portal-module-pagination-ink);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease;
}

.portal-module-pagination :deep(.btn-prev),
.portal-module-pagination :deep(.btn-next) {
  width: var(--portal-module-pagination-nav-width);
  min-width: var(--portal-module-pagination-nav-width);
}

.portal-module-pagination :deep(.el-pager li) {
  min-width: var(--portal-module-pagination-page-min-width);
  padding: 0 12px;
}

.portal-module-pagination :deep(.btn-prev:hover),
.portal-module-pagination :deep(.btn-next:hover),
.portal-module-pagination :deep(.el-pager li:hover) {
  border-color: var(--portal-module-pagination-active-border);
  box-shadow: var(--portal-module-pagination-hover-shadow);
}

.portal-module-pagination :deep(.el-pager li.is-active) {
  border-color: var(--portal-module-pagination-active-border);
  background: var(--portal-module-pagination-active-bg);
  color: var(--portal-module-pagination-active-ink);
  box-shadow: var(--portal-module-pagination-active-shadow);
}

.portal-module-pagination :deep(.el-pager li.is-disabled),
.portal-module-pagination :deep(.btn-prev:disabled),
.portal-module-pagination :deep(.btn-next:disabled) {
  box-shadow: none;
  opacity: 0.64;
}

.portal-module-pagination :deep(.btn-prev:focus-visible),
.portal-module-pagination :deep(.btn-next:focus-visible),
.portal-module-pagination :deep(.el-pager li:focus-visible) {
  outline: none;
  box-shadow: 0 0 0 3px var(--portal-focus-ring);
}
</style>
