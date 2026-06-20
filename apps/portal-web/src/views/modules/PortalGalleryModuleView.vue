<template>
  <section class="gallery-module-page" :aria-busy="loading || autoLoading">
    <portal-section-heading heading-tag="h1" variant="gallery" title="图包版块" />

    <portal-module-filter-panel
      v-model="keywordInput"
      :active-category="activeThemeId"
      :categories="GALLERY_MODULE_TOPICS"
      categories-label="图包主题分类"
      :has-active-filters="hasActiveFilters"
      keyword-label="按标题或摘要搜索图包"
      keyword-placeholder="搜索标题、摘要、分辨率或图包描述"
      :loading="loading"
      :sort="activeSort"
      :sort-options="PORTAL_MODULE_SORT_OPTIONS"
      @category-change="handleThemeChange"
      @clear="clearFilters"
      @submit="submitKeyword"
      @sort-change="setSort"
    />

    <portal-request-boundary
      as="section"
      class="gallery-module-page__results"
      :mode="resultsBoundaryMode"
      :error-code="primaryErrorCode"
      primary-label="重试"
      @primary="refresh"
    >
      <template #loading>
        <gallery-module-loading-grid />
      </template>

      <div
        class="gallery-module-page__results-stage"
        :aria-busy="loading || autoLoading ? 'true' : 'false'"
      >
        <template v-if="items.length > 0">
          <div
            class="gallery-module-page__masonry"
            :class="{ 'is-refreshing': isRefreshing || autoLoading }"
            role="list"
            aria-label="图包列表"
          >
            <div
              v-for="(column, columnIndex) in masonryColumns"
              :key="`gallery-module-column-${columnIndex}`"
              class="gallery-module-page__masonry-column"
              role="presentation"
            >
              <gallery-module-masonry-card
                v-for="{ item, index } in column"
                :key="item.id"
                :index="index"
                :item="item"
              />
            </div>
          </div>
          <div :ref="bindSentinelRef" class="gallery-module-page__sentinel" aria-hidden="true" />

          <p
            v-if="appendError || loadingMore || autoLoading"
            class="gallery-module-page__hint"
            role="status"
            aria-live="polite"
          >
            {{ appendError ? '加载失败，请重试。' : loadingMoreStatusLabel }}
          </p>

          <button
            v-if="appendError"
            type="button"
            class="gallery-module-page__footer-button gallery-module-page__footer-button--primary"
            :disabled="loadingMore"
            @click="retryLoadMore"
          >
            重新拉取
          </button>
        </template>
      </div>
    </portal-request-boundary>
  </section>
</template>

<script setup lang="ts">
import { computed, type ComponentPublicInstance } from 'vue'

import GalleryModuleLoadingGrid from './components/GalleryModuleLoadingGrid.vue'
import GalleryModuleMasonryCard from './components/GalleryModuleMasonryCard.vue'
import { useGalleryModuleMasonryColumns } from './components/gallery-module-masonry'
import { portalPublicModulesApi, type GalleryModuleItemResponse } from '@/api/public-modules'
import {
  GALLERY_MODULE_TOPICS,
  PORTAL_MODULE_DEFAULT_SORT,
  PORTAL_MODULE_SORT_OPTIONS,
  PUBLIC_MODULE_QUERY_CONFIG
} from '@/constants/public-modules'
import type { PortalRequestBoundaryMode } from '@/components/PortalRequestBoundary.vue'
import {
  parseOptionalPositiveIntegerQueryValue,
  serializeOptionalPositiveIntegerQueryValue
} from '@/utils/public-modules'
import { useAutoLoadSentinel } from '@/composables/useAutoLoadSentinel'
import { usePortalModuleQuery } from '@/views/modules/composables/usePortalModuleQuery'

const {
  activeCategoryValue: activeThemeId,
  activeSort,
  appendError,
  canLoadMore,
  clearFilters,
  hasActiveFilters,
  hasLoaded,
  isRefreshing,
  items,
  keywordInput,
  loadMore,
  loading,
  loadingMore,
  primaryError,
  primaryErrorCode,
  refresh,
  retryLoadMore,
  setCategory,
  setSort,
  submitKeyword
} = usePortalModuleQuery<GalleryModuleItemResponse, number>({
  ...PUBLIC_MODULE_QUERY_CONFIG.gallery,
  defaultSort: PORTAL_MODULE_DEFAULT_SORT,
  fetchPage: ({ categoryValue, keyword, limit, page, sort }) =>
    portalPublicModulesApi.getGalleryList({
      page,
      limit,
      themeId: categoryValue,
      keyword,
      sort
    }),
  parseCategory: parseOptionalPositiveIntegerQueryValue,
  serializeCategory: serializeOptionalPositiveIntegerQueryValue
})

const autoLoadEnabled = computed(() => canLoadMore.value && hasLoaded.value)
const { autoLoading, sentinelRef } = useAutoLoadSentinel({
  enabled: autoLoadEnabled,
  onLoadMore: loadMore
})
const { columns: masonryColumns } = useGalleryModuleMasonryColumns(items)

const loadingMoreStatusLabel = computed(() =>
  autoLoading.value ? '正在继续加载更多图包…' : '正在加载更多图包…'
)

const resultsBoundaryMode = computed<PortalRequestBoundaryMode>(() => {
  if (loading.value && !hasLoaded.value) {
    return 'loading'
  }

  if (primaryError.value) {
    return 'error'
  }

  if (hasLoaded.value && items.value.length === 0) {
    return 'empty'
  }

  return 'ready'
})

function handleThemeChange(value?: string | number): void {
  void setCategory(typeof value === 'number' ? value : undefined)
}

function bindSentinelRef(element: Element | ComponentPublicInstance | null): void {
  sentinelRef.value = element instanceof HTMLElement ? element : null
}
</script>

<style scoped>
.gallery-module-page {
  --gallery-module-action-min-height-local: 36px;
  --gallery-module-action-padding-inline-local: 16px;
  width: min(var(--portal-browse-stage-max-width), 100%);
  margin: 0 auto;
  padding: var(--portal-stage-padding-top) var(--portal-stage-padding-inline)
    var(--portal-stage-padding-bottom);
  box-sizing: border-box;
  display: grid;
  gap: var(--portal-module-gap);
}

.gallery-module-page > .portal-section-heading {
  margin: 0;
}

.gallery-module-page__results {
  display: grid;
  gap: var(--portal-module-gap);
  min-width: 0;
}

.gallery-module-page__results-stage {
  display: grid;
  gap: var(--portal-module-gap);
  min-width: 0;
}

.gallery-module-page__results :deep(.portal-request-boundary__state) {
  --portal-request-boundary-accent: var(--portal-content-gallery-accent);
  min-height: 280px;
  padding: var(--portal-boundary-panel-padding-block) var(--portal-boundary-panel-padding-inline);
  border: 1px solid
    color-mix(
      in srgb,
      var(--portal-request-boundary-accent) 14%,
      var(--portal-request-state-border)
    );
  border-radius: var(--portal-request-state-radius);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--portal-request-boundary-accent) 10%, transparent),
      transparent 74%
    ),
    var(--portal-request-state-bg);
  box-shadow: var(--portal-request-state-shadow);
}

.gallery-module-page__masonry {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
  transition: opacity 180ms ease;
}

.gallery-module-page__masonry-column {
  display: grid;
  min-width: 0;
  align-content: start;
}

.gallery-module-page__masonry.is-refreshing {
  opacity: var(--gallery-module-page-refreshing-opacity);
}

.gallery-module-page__footer-button {
  flex: 0 0 auto;
  justify-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--gallery-module-action-min-height-local);
  padding: 0 var(--gallery-module-action-padding-inline-local);
  border: 1px solid var(--gallery-module-state-action-border);
  border-radius: 999px;
  background: var(--gallery-module-state-action-bg);
  color: var(--gallery-module-state-action-ink);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.gallery-module-page__footer-button--primary {
  border-color: var(--gallery-module-state-action-primary-border);
  background: var(--gallery-module-state-action-primary-bg);
}

.gallery-module-page__footer-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--gallery-module-state-action-hover-shadow);
}

.gallery-module-page__footer-button:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 4px var(--portal-focus-ring),
    var(--gallery-module-state-action-hover-shadow);
}

.gallery-module-page__footer-button:disabled {
  cursor: wait;
  opacity: var(--gallery-module-state-action-disabled-opacity);
  transform: none;
  box-shadow: none;
}

.gallery-module-page__hint {
  margin: 0;
  justify-self: center;
  color: var(--gallery-module-state-hint-ink);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-align: center;
}

.gallery-module-page__sentinel {
  width: 100%;
  height: 2px;
}
</style>
