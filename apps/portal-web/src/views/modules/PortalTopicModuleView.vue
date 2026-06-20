<template>
  <section class="portal-topic-module-page">
    <portal-section-heading heading-tag="h1" title="游戏版块" variant="column" />

    <portal-module-filter-panel
      v-model="keywordInput"
      :active-category="activeTopicId"
      :categories="TOPIC_MODULE_CATEGORIES"
      categories-label="游戏题材分类"
      :has-active-filters="hasActiveFilters"
      keyword-label="按标题或摘要搜索游戏"
      keyword-placeholder="搜索标题、摘要或游戏简介"
      :loading="loading"
      :sort="activeSort"
      :sort-options="PORTAL_MODULE_SORT_OPTIONS"
      @category-change="handleCategoryChange"
      @clear="clearFilters"
      @sort-change="setSort"
      @submit="submitKeyword"
    />

    <portal-request-boundary
      as="section"
      class="portal-topic-module-page__results"
      :mode="resultsBoundaryMode"
      :error-code="primaryErrorCode"
      primary-label="重试"
      @primary="refresh"
    >
      <template #loading>
        <div class="portal-topic-module-page__list" aria-hidden="true">
          <article
            v-for="index in PUBLIC_MODULE_QUERY_CONFIG.topic.pageSize"
            :key="`topic-skeleton-${index}`"
            class="portal-topic-module-page__card"
          >
            <div
              class="portal-topic-module-page__media portal-topic-module-page__media--skeleton"
            />

            <div class="portal-topic-module-page__copy">
              <div class="portal-topic-module-page__skeleton-header">
                <span
                  class="portal-topic-module-page__skeleton-line portal-topic-module-page__skeleton-line--eyebrow"
                >
                  <span
                    class="portal-topic-module-page__skeleton-block portal-topic-module-page__skeleton-block--eyebrow"
                  />
                </span>
                <span class="portal-topic-module-page__theme-tag-skeleton" />
              </div>

              <div class="portal-topic-module-page__skeleton-title">
                <span
                  class="portal-topic-module-page__skeleton-line portal-topic-module-page__skeleton-line--title"
                >
                  <span
                    class="portal-topic-module-page__skeleton-block portal-topic-module-page__skeleton-block--title"
                  />
                </span>
              </div>

              <div class="portal-topic-module-page__skeleton-summary">
                <span
                  class="portal-topic-module-page__skeleton-line portal-topic-module-page__skeleton-line--summary"
                >
                  <span
                    class="portal-topic-module-page__skeleton-block portal-topic-module-page__skeleton-block--summary"
                  />
                </span>
                <span
                  class="portal-topic-module-page__skeleton-line portal-topic-module-page__skeleton-line--summary-short"
                >
                  <span
                    class="portal-topic-module-page__skeleton-block portal-topic-module-page__skeleton-block--summary-short"
                  />
                </span>
              </div>

              <div class="portal-topic-module-page__skeleton-footer">
                <div class="portal-topic-module-page__skeleton-meta">
                  <span
                    class="portal-topic-module-page__skeleton-line portal-topic-module-page__skeleton-line--meta-feature"
                  >
                    <span
                      class="portal-topic-module-page__skeleton-block portal-topic-module-page__skeleton-block--meta-feature"
                    />
                  </span>
                  <span class="portal-topic-module-page__skeleton-divider" />
                  <span
                    class="portal-topic-module-page__skeleton-line portal-topic-module-page__skeleton-line--author"
                  >
                    <span
                      class="portal-topic-module-page__skeleton-block portal-topic-module-page__skeleton-block--author"
                    />
                  </span>
                  <span class="portal-topic-module-page__skeleton-divider" />
                  <span
                    class="portal-topic-module-page__skeleton-line portal-topic-module-page__skeleton-line--time"
                  >
                    <span
                      class="portal-topic-module-page__skeleton-block portal-topic-module-page__skeleton-block--time"
                    />
                  </span>
                </div>

                <div class="portal-topic-module-page__skeleton-metrics">
                  <span
                    v-for="item in 3"
                    :key="item"
                    class="portal-topic-module-page__skeleton-pill portal-topic-module-page__skeleton-pill--metric"
                  />
                </div>
              </div>
            </div>
          </article>
        </div>
      </template>

      <div class="portal-topic-module-page__results-stage" :aria-busy="loading ? 'true' : 'false'">
        <template v-if="items.length > 0">
          <div class="portal-topic-module-page__list" role="list" aria-label="游戏列表">
            <article
              v-for="item in items"
              :key="item.id"
              class="portal-topic-module-page__card portal-topic-module-page__card--link portal-interactive-surface"
            >
              <router-link
                class="portal-topic-module-page__link-layer portal-link-layer"
                :to="resolvePortalContentDetailLocation('topic', item.id)"
                :aria-label="`查看${item.title || '公开游戏'}详情`"
                :title="item.title || '公开游戏'"
              />

              <div class="portal-topic-module-page__media">
                <portal-image
                  :src="resolvePublicContentModuleCoverUrl(item)"
                  class="portal-topic-module-page__media-image"
                />
              </div>

              <div class="portal-topic-module-page__copy">
                <div class="portal-topic-module-page__header">
                  <span class="portal-topic-module-page__eyebrow">
                    {{ resolvePublicTopicSectionLabel(item.typeId) }}
                  </span>
                  <span
                    class="portal-topic-module-page__theme-tag"
                    :style="resolveTopicThemeTagStyle(item.topicId)"
                  >
                    {{ resolvePublicTopicThemeLabel(item.topicId) }}
                  </span>
                </div>

                <h2>{{ item.title || '公开游戏' }}</h2>
                <p>{{ resolveSummary(item) }}</p>

                <div class="portal-topic-module-page__footer">
                  <div class="portal-topic-module-page__meta">
                    <span
                      v-for="entry in resolveMetaEntries(item)"
                      :key="entry.key"
                      class="portal-topic-module-page__meta-item"
                      :class="`portal-topic-module-page__meta-item--${entry.type}`"
                    >
                      {{ entry.label }}
                    </span>
                  </div>
                  <div class="portal-topic-module-page__metrics">
                    <span
                      v-for="metric in resolveMetrics(item)"
                      :key="metric.iconName"
                      class="portal-topic-module-page__metric"
                      :title="metric.label"
                      :aria-label="metric.label"
                    >
                      <portal-svg-icon
                        :name="metric.iconName"
                        size="1.3rem"
                        class="portal-topic-module-page__metric-icon"
                      />
                      <span>{{ metric.value }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <portal-module-pagination
            :current-page="activePage"
            :disabled="loading"
            :page-size="PUBLIC_MODULE_QUERY_CONFIG.topic.pageSize"
            :total="resolvedTotal"
            @change="setPage"
          />
        </template>
      </div>
    </portal-request-boundary>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import {
  portalPublicModulesApi,
  resolvePublicContentModuleCoverUrl,
  type PublicTopicModuleItemResponse
} from '@/api/public-modules'
import type { PortalRequestBoundaryMode } from '@/components/PortalRequestBoundary.vue'
import { useOptionalAuthRefresh } from '@/composables/useOptionalAuthRefresh'
import {
  resolvePublicTopicFeatureFlagLabels,
  resolvePublicTopicSectionLabel,
  resolvePublicTopicThemeLabel
} from '@/constants/public-detail'
import {
  PORTAL_MODULE_DEFAULT_SORT,
  PORTAL_MODULE_SORT_OPTIONS,
  PUBLIC_MODULE_QUERY_CONFIG,
  TOPIC_MODULE_CATEGORIES
} from '@/constants/public-modules'
import {
  createPortalModuleTagToneStyle,
  parseOptionalPositiveIntegerQueryValue,
  resolvePortalModuleCategoryTone,
  serializeOptionalPositiveIntegerQueryValue
} from '@/utils/public-modules'
import { usePortalModuleQuery } from '@/views/modules/composables/usePortalModuleQuery'
import {
  formatCompactCount,
  formatPublishTimeLabel,
  resolvePortalContentDetailLocation
} from '@/utils/content'

const {
  activeCategoryValue: activeTopicId,
  activePage,
  activeSort,
  clearFilters,
  hasActiveFilters,
  hasLoaded,
  items,
  keywordInput,
  loading,
  primaryError,
  primaryErrorCode,
  refresh,
  setCategory,
  setPage,
  setSort,
  submitKeyword,
  total
} = usePortalModuleQuery<PublicTopicModuleItemResponse, number>({
  ...PUBLIC_MODULE_QUERY_CONFIG.topic,
  defaultSort: PORTAL_MODULE_DEFAULT_SORT,
  fetchPage: ({ categoryValue, keyword, limit, page, sort }) =>
    portalPublicModulesApi.getTopicList({
      page,
      limit,
      topicId: categoryValue,
      keyword,
      sort,
      includeAuthor: true
    }),
  parseCategory: parseOptionalPositiveIntegerQueryValue,
  serializeCategory: serializeOptionalPositiveIntegerQueryValue
})

const resolvedTotal = computed(() => Math.max(total.value, items.value.length))

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

useOptionalAuthRefresh(() => refresh())

function resolveMetaEntries(item: PublicTopicModuleItemResponse): Array<{
  key: string
  label: string
  type: 'feature' | 'author' | 'time'
}> {
  const entries: Array<{ key: string; label: string; type: 'feature' | 'author' | 'time' }> = []
  const featureLabelText = resolveFeatureLabelText(item)
  if (featureLabelText) {
    entries.push({ key: `feature-${item.id}`, label: featureLabelText, type: 'feature' })
  }

  const authorName = item.author?.name?.trim()
  if (authorName) {
    entries.push({ key: `author-${item.id}`, label: authorName, type: 'author' })
  }
  const timeLabel = formatPublishTimeLabel(item.postTime)
  if (timeLabel) {
    entries.push({ key: `time-${item.id}`, label: timeLabel, type: 'time' })
  }
  return entries
}

function resolveSummary(item: PublicTopicModuleItemResponse): string {
  return item.summary?.trim() || item.desc?.trim() || '当前游戏摘要正在整理中。'
}

function resolveFeatureLabelText(item: PublicTopicModuleItemResponse): string {
  return resolvePublicTopicFeatureFlagLabels(item.featureFlagLabels, 2).join('、')
}

function resolveMetrics(item: PublicTopicModuleItemResponse) {
  return [
    {
      iconName: 'view' as const,
      label: `浏览 ${formatCompactCount(item.viewCount ?? 0)}`,
      value: formatCompactCount(item.viewCount ?? 0)
    },
    {
      iconName: 'favorite' as const,
      label: `收藏 ${formatCompactCount(item.favorCount ?? 0)}`,
      value: formatCompactCount(item.favorCount ?? 0)
    },
    {
      iconName: 'message' as const,
      label: `评论 ${formatCompactCount(item.replyCount ?? 0)}`,
      value: formatCompactCount(item.replyCount ?? 0)
    }
  ]
}

function resolveTopicThemeTagStyle(topicId?: number) {
  return createPortalModuleTagToneStyle(
    resolvePortalModuleCategoryTone(TOPIC_MODULE_CATEGORIES, topicId)
  )
}

function handleCategoryChange(value?: string | number): void {
  void setCategory(typeof value === 'number' ? value : undefined)
}
</script>

<style scoped>
.portal-topic-module-page {
  --portal-topic-module-card-radius-local: 18px;
  --portal-topic-module-card-padding-local: var(--portal-content-card-padding-xs);
  --portal-topic-module-title-line-height-local: calc(18px * 1.34);
  --portal-topic-module-summary-line-height-local: calc(13px * 1.68);
  --portal-topic-module-summary-height-local: calc(
    var(--portal-topic-module-summary-line-height-local) * 2
  );
  --portal-topic-module-meta-line-height-local: calc(12px * 1.35);
  width: min(var(--portal-browse-stage-max-width), 100%);
  margin: 0 auto;
  padding: var(--portal-stage-padding-top) var(--portal-stage-padding-inline)
    var(--portal-stage-padding-bottom);
  box-sizing: border-box;
  display: grid;
  gap: var(--portal-module-gap);
}

.portal-topic-module-page > .portal-section-heading {
  margin: 0;
}

.portal-topic-module-page__results {
  display: grid;
  gap: var(--portal-module-gap);
  min-width: 0;
}

.portal-topic-module-page__results-stage {
  display: grid;
  gap: var(--portal-module-gap);
  min-width: 0;
}

.portal-topic-module-page__results :deep(.portal-request-boundary__state) {
  --portal-request-boundary-accent: var(--portal-content-topic-accent);
  min-height: 320px;
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

.portal-topic-module-page__list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--portal-module-gap);
}

.portal-topic-module-page__card {
  position: relative;
  display: grid;
  grid-template-columns: 212px minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
  padding: var(--portal-topic-module-card-padding-local);
  border: 1px solid var(--portal-module-topic-border);
  border-radius: var(--portal-topic-module-card-radius-local);
  background: var(--portal-module-topic-surface);
}

.portal-topic-module-page__card::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 0;
  border-bottom: 1px dashed var(--portal-module-topic-divider);
  opacity: 0.74;
  pointer-events: none;
}

.portal-topic-module-page__card--link {
  --portal-interactive-hover-background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01)),
    var(--portal-module-topic-surface);
  --portal-interactive-hover-border: var(--portal-module-topic-divider-strong);
}

.portal-topic-module-page__link-layer {
  z-index: 2;
}

.portal-topic-module-page__media {
  position: relative;
  min-height: 152px;
  border: 1px solid var(--portal-browse-media-panel-border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(18, 41, 74, 0.04);
  background:
    var(--portal-browse-media-overlay-soft), var(--portal-browse-media-placeholder-surface);
}

.portal-topic-module-page__media::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: var(--portal-module-topic-media-overlay);
}

.portal-topic-module-page__media-image {
  z-index: 0;
  filter: saturate(0.94) contrast(0.98);
}

.portal-topic-module-page__copy {
  display: grid;
  grid-template-rows: auto auto var(--portal-topic-module-summary-height-local) auto;
  align-content: start;
  gap: 8px;
  min-width: 0;
}

.portal-topic-module-page__header,
.portal-topic-module-page__footer,
.portal-topic-module-page__skeleton-header,
.portal-topic-module-page__skeleton-footer {
  display: flex;
  align-items: center;
  gap: var(--portal-content-card-gap-tight);
  min-width: 0;
}

.portal-topic-module-page__header,
.portal-topic-module-page__skeleton-header {
  justify-content: space-between;
  align-items: flex-start;
}

.portal-topic-module-page__footer,
.portal-topic-module-page__skeleton-footer {
  justify-content: space-between;
  gap: 12px;
  padding-top: 9px;
  border-top: 1px dashed var(--portal-module-topic-divider);
}

.portal-topic-module-page__meta,
.portal-topic-module-page__metrics,
.portal-topic-module-page__skeleton-meta,
.portal-topic-module-page__skeleton-metrics {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--portal-content-card-gap-tight);
  min-width: 0;
}

.portal-topic-module-page__meta,
.portal-topic-module-page__skeleton-meta {
  flex: 1 1 auto;
}

.portal-topic-module-page__metrics,
.portal-topic-module-page__skeleton-metrics {
  flex: 0 0 auto;
  justify-content: flex-end;
}

.portal-topic-module-page__theme-tag,
.portal-topic-module-page__theme-tag-skeleton,
.portal-topic-module-page__skeleton-pill {
  display: inline-flex;
  align-items: center;
  height: var(--portal-content-chip-height-xs);
  padding: 0 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: var(--portal-content-chip-height-xs);
}

.portal-topic-module-page__theme-tag {
  flex: 0 1 auto;
  min-width: 0;
  height: var(--portal-content-chip-height-sm);
  padding: 0 11px 0 12px;
  max-width: min(46%, 176px);
  overflow: hidden;
  border: 1px solid
    color-mix(in srgb, var(--portal-module-card-tag-border) 78%, rgba(255, 255, 255, 0.32));
  border-radius: 11px 15px 13px 11px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0) 58%),
    color-mix(in srgb, var(--portal-module-card-tag-bg) 88%, rgba(255, 255, 255, 0.22));
  box-shadow:
    0 4px 10px color-mix(in srgb, var(--portal-module-card-tag-accent) 9%, rgba(18, 41, 74, 0.08)),
    inset 0 1px 0 rgba(255, 255, 255, 0.42);
  color: color-mix(
    in srgb,
    var(--portal-module-card-tag-accent) 82%,
    var(--portal-content-ink) 18%
  );
  line-height: var(--portal-content-chip-height-sm);
  letter-spacing: 0.02em;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.portal-topic-module-page__theme-tag::before {
  content: '';
  width: 4px;
  height: 12px;
  margin-right: 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--portal-module-card-tag-accent) 74%, white 26%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.42);
}

.portal-topic-module-page__eyebrow {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  flex: 1 1 auto;
  min-width: 0;
  color: var(--portal-module-topic-eyebrow-ink);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.portal-topic-module-page__card h2 {
  margin: 0;
  min-width: 0;
  color: var(--portal-content-ink);
  font-size: 16px;
  font-weight: 700;
  line-height: var(--portal-topic-module-title-line-height-local);
  letter-spacing: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.portal-topic-module-page__card p {
  margin: 0;
  color: color-mix(in srgb, var(--portal-content-muted) 82%, transparent);
  font-size: 13px;
  line-height: var(--portal-topic-module-summary-line-height-local);
  display: -webkit-box;
  height: var(--portal-topic-module-summary-height-local);
  min-height: var(--portal-topic-module-summary-height-local);
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.portal-topic-module-page__meta-item,
.portal-topic-module-page__metric {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
  color: color-mix(in srgb, var(--portal-content-muted) 84%, var(--public-detail-glass-ink) 16%);
}

.portal-topic-module-page__meta-item {
  position: relative;
  padding-right: 10px;
}

.portal-topic-module-page__meta-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  width: 1px;
  height: 10px;
  background: var(--portal-module-topic-divider);
  transform: translateY(-50%);
}

.portal-topic-module-page__meta-divider,
.portal-topic-module-page__skeleton-divider {
  width: 1px;
  height: 10px;
  background: var(--portal-module-topic-divider);
  flex: 0 0 auto;
}

.portal-topic-module-page__metric {
  position: relative;
  gap: 5px;
}

.portal-topic-module-page__metric + .portal-topic-module-page__metric {
  padding-left: 10px;
}

.portal-topic-module-page__metric + .portal-topic-module-page__metric::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 1px;
  height: 10px;
  background: var(--portal-module-topic-divider);
  transform: translateY(-50%);
}

.portal-topic-module-page__metric-icon {
  flex: 0 0 auto;
  color: var(--portal-module-topic-meta-icon-ink);
}

.portal-topic-module-page__media--skeleton,
.portal-topic-module-page__theme-tag-skeleton,
.portal-topic-module-page__skeleton-block,
.portal-topic-module-page__skeleton-pill {
  position: relative;
}

.portal-topic-module-page__media--skeleton,
.portal-topic-module-page__theme-tag-skeleton,
.portal-topic-module-page__skeleton-block,
.portal-topic-module-page__skeleton-pill {
  overflow: hidden;
  border: 1px solid var(--portal-skeleton-border);
  background: linear-gradient(
    135deg,
    var(--portal-skeleton-block-strong),
    var(--portal-skeleton-block)
  );
}

.portal-topic-module-page__media--skeleton::after,
.portal-topic-module-page__theme-tag-skeleton::after,
.portal-topic-module-page__skeleton-block::after,
.portal-topic-module-page__skeleton-pill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--portal-skeleton-shimmer);
  animation: home-skeleton-wave 2.4s ease-in-out infinite;
  transform: translateX(-100%);
}

.portal-topic-module-page__skeleton-title,
.portal-topic-module-page__skeleton-summary {
  display: grid;
  gap: 0;
}

.portal-topic-module-page__skeleton-title {
  height: var(--portal-topic-module-title-line-height-local);
}

.portal-topic-module-page__skeleton-summary {
  height: var(--portal-topic-module-summary-height-local);
}

.portal-topic-module-page__theme-tag-skeleton {
  flex: 0 0 auto;
  margin-left: auto;
  width: 72px;
  height: var(--portal-content-chip-height-sm);
  border-radius: 11px 15px 13px 11px;
}

.portal-topic-module-page__skeleton-line {
  display: flex;
  align-items: center;
}

.portal-topic-module-page__skeleton-line--title {
  height: var(--portal-topic-module-title-line-height-local);
}

.portal-topic-module-page__skeleton-line--summary {
  height: var(--portal-topic-module-summary-line-height-local);
}

.portal-topic-module-page__skeleton-line--summary-short {
  height: var(--portal-topic-module-summary-line-height-local);
}

.portal-topic-module-page__skeleton-line--eyebrow {
  height: var(--portal-topic-module-meta-line-height-local);
}

.portal-topic-module-page__skeleton-line--meta-feature {
  height: var(--portal-topic-module-meta-line-height-local);
}

.portal-topic-module-page__skeleton-line--author,
.portal-topic-module-page__skeleton-line--time {
  height: var(--portal-topic-module-meta-line-height-local);
}

.portal-topic-module-page__skeleton-block {
  display: inline-flex;
  border-radius: 999px;
}

.portal-topic-module-page__skeleton-block--title {
  width: 82%;
  height: var(--portal-skeleton-title-md-height);
}

.portal-topic-module-page__skeleton-block--summary {
  width: 100%;
  height: var(--portal-skeleton-copy-13-height);
}

.portal-topic-module-page__skeleton-block--summary-short {
  width: 78%;
  height: var(--portal-skeleton-copy-13-height);
}

.portal-topic-module-page__skeleton-block--eyebrow {
  width: 74px;
  height: var(--portal-skeleton-copy-12-height);
}

.portal-topic-module-page__skeleton-block--meta-feature {
  width: 74px;
  height: var(--portal-skeleton-copy-12-height);
}

.portal-topic-module-page__skeleton-block--author {
  width: 56px;
  height: var(--portal-skeleton-copy-12-height);
}

.portal-topic-module-page__skeleton-block--time {
  width: 60px;
  height: var(--portal-skeleton-copy-12-height);
}

.portal-topic-module-page__skeleton-pill--metric {
  width: 42px;
}
</style>
