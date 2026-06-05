<template>
  <section class="portal-article-module-page">
    <portal-section-heading heading-tag="h1" title="情报版块" variant="article" />

    <portal-module-filter-panel
      v-model="keywordInput"
      :active-category="activeThemeId"
      :categories="ARTICLE_MODULE_CATEGORIES"
      categories-label="情报主题分类"
      :has-active-filters="hasActiveFilters"
      keyword-label="按标题或摘要搜索情报"
      keyword-placeholder="搜索标题、摘要或情报内容"
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
      class="portal-article-module-page__results"
      :mode="resultsBoundaryMode"
      :error-code="primaryErrorCode"
      primary-label="重试"
      @primary="refresh"
    >
      <template #loading>
        <div class="portal-article-module-page__grid" aria-hidden="true">
          <article
            v-for="index in PUBLIC_MODULE_QUERY_CONFIG.article.pageSize"
            :key="`article-skeleton-${index}`"
            class="portal-article-module-page__card"
          >
            <div
              class="portal-article-module-page__cover portal-article-module-page__cover--skeleton"
            >
              <span class="portal-article-module-page__cover-tag-skeleton" />
            </div>
            <div class="portal-article-module-page__copy">
              <div class="portal-article-module-page__skeleton-title">
                <span
                  class="portal-article-module-page__skeleton-line portal-article-module-page__skeleton-line--title"
                >
                  <span
                    class="portal-article-module-page__skeleton-block portal-article-module-page__skeleton-block--title"
                  />
                </span>
              </div>

              <div class="portal-article-module-page__skeleton-summary">
                <span
                  class="portal-article-module-page__skeleton-line portal-article-module-page__skeleton-line--summary"
                >
                  <span
                    class="portal-article-module-page__skeleton-block portal-article-module-page__skeleton-block--summary"
                  />
                </span>
                <span
                  class="portal-article-module-page__skeleton-line portal-article-module-page__skeleton-line--summary-short"
                >
                  <span
                    class="portal-article-module-page__skeleton-block portal-article-module-page__skeleton-block--summary-short"
                  />
                </span>
              </div>

              <div class="portal-article-module-page__skeleton-footer">
                <div class="portal-article-module-page__skeleton-meta">
                  <span
                    class="portal-article-module-page__skeleton-line portal-article-module-page__skeleton-line--meta-author"
                  >
                    <span
                      class="portal-article-module-page__skeleton-block portal-article-module-page__skeleton-block--meta-author"
                    />
                  </span>
                  <span class="portal-article-module-page__skeleton-divider" />
                  <span
                    class="portal-article-module-page__skeleton-line portal-article-module-page__skeleton-line--meta-time"
                  >
                    <span
                      class="portal-article-module-page__skeleton-block portal-article-module-page__skeleton-block--meta-time"
                    />
                  </span>
                </div>
                <div class="portal-article-module-page__skeleton-metrics">
                  <span
                    v-for="item in 3"
                    :key="item"
                    class="portal-article-module-page__skeleton-pill portal-article-module-page__skeleton-pill--metric"
                  />
                </div>
              </div>
            </div>
          </article>
        </div>
      </template>

      <div
        class="portal-article-module-page__results-stage"
        :aria-busy="loading ? 'true' : 'false'"
      >
        <template v-if="items.length > 0">
          <div class="portal-article-module-page__grid" role="list" aria-label="情报列表">
            <article
              v-for="item in items"
              :key="item.id"
              class="portal-article-module-page__card portal-article-module-page__card--link portal-interactive-surface"
            >
              <router-link
                class="portal-article-module-page__link-layer portal-link-layer"
                :to="resolvePortalContentDetailLocation('article', item.id)"
                :aria-label="`查看${item.title || '公开情报'}详情`"
                :title="item.title || '公开情报'"
              />

              <div class="portal-article-module-page__cover">
                <span
                  class="portal-article-module-page__cover-tag"
                  :style="resolveArticleThemeTagStyle(item.themeId)"
                >
                  {{ resolvePublicArticleThemeLabel(item.themeId) }}
                </span>
                <portal-image
                  :src="resolvePublicContentModuleCoverUrl(item)"
                  class="portal-article-module-page__cover-image"
                />
              </div>

              <div class="portal-article-module-page__copy">
                <h2>{{ item.title || '公开情报' }}</h2>
                <p>{{ resolveSummary(item) }}</p>

                <div class="portal-article-module-page__footer">
                  <div class="portal-article-module-page__meta">
                    <span
                      v-for="entry in resolveMetaEntries(item)"
                      :key="entry.key"
                      class="portal-article-module-page__meta-item"
                      :class="`portal-article-module-page__meta-item--${entry.type}`"
                    >
                      {{ entry.label }}
                    </span>
                  </div>
                  <div class="portal-article-module-page__metrics">
                    <span
                      v-for="metric in resolveMetrics(item)"
                      :key="metric.iconName"
                      class="portal-article-module-page__metric"
                      :title="metric.label"
                      :aria-label="metric.label"
                    >
                      <portal-svg-icon
                        :name="metric.iconName"
                        size="1.3rem"
                        class="portal-article-module-page__metric-icon"
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
            :page-size="PUBLIC_MODULE_QUERY_CONFIG.article.pageSize"
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
  type PublicArticleModuleItemResponse
} from '@/api/public-modules'
import type { PortalRequestBoundaryMode } from '@/components/PortalRequestBoundary.vue'
import { resolvePublicArticleThemeLabel } from '@/constants/public-detail'
import {
  ARTICLE_MODULE_CATEGORIES,
  PORTAL_MODULE_DEFAULT_SORT,
  PORTAL_MODULE_SORT_OPTIONS,
  PUBLIC_MODULE_QUERY_CONFIG
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
  activeCategoryValue: activeThemeId,
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
} = usePortalModuleQuery<PublicArticleModuleItemResponse, number>({
  ...PUBLIC_MODULE_QUERY_CONFIG.article,
  defaultSort: PORTAL_MODULE_DEFAULT_SORT,
  fetchPage: ({ categoryValue, keyword, limit, page, sort }) =>
    portalPublicModulesApi.getArticleList({
      page,
      limit,
      themeId: categoryValue,
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

function resolveSummary(item: PublicArticleModuleItemResponse): string {
  return item.summary?.trim() || item.desc?.trim() || '当前情报正在整理摘要。'
}

function resolveMetaEntries(item: PublicArticleModuleItemResponse): Array<{
  key: string
  label: string
  type: 'author' | 'time'
}> {
  const entries: Array<{ key: string; label: string; type: 'author' | 'time' }> = []
  const authorName = item.author?.name?.trim() || ''

  if (authorName) {
    entries.push({ key: `author-${item.id}`, label: authorName, type: 'author' })
  }

  const timeLabel = formatPublishTimeLabel(item.postTime)

  if (timeLabel) {
    entries.push({ key: `time-${item.id}`, label: timeLabel, type: 'time' })
  }

  return entries
}

function resolveMetrics(item: PublicArticleModuleItemResponse) {
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

function resolveArticleThemeTagStyle(themeId?: number) {
  return createPortalModuleTagToneStyle(
    resolvePortalModuleCategoryTone(ARTICLE_MODULE_CATEGORIES, themeId)
  )
}

function handleCategoryChange(value?: string | number): void {
  void setCategory(typeof value === 'number' ? value : undefined)
}
</script>

<style scoped>
.portal-article-module-page {
  --portal-article-module-card-radius-local: 18px;
  --portal-article-module-card-padding-local: var(--home-card-padding-xs);
  --portal-article-module-cover-height-local: 140px;
  --portal-article-module-copy-gap-local: var(--home-copy-gap-base);
  --portal-article-module-title-line-height-local: calc(17px * 1.38);
  --portal-article-module-summary-line-height-local: calc(13px * 1.68);
  --portal-article-module-summary-height-local: calc(
    var(--portal-article-module-summary-line-height-local) * 2
  );
  --portal-article-module-footer-line-height-local: calc(12px * 1.35);
  width: min(var(--portal-browse-stage-max-width), 100%);
  margin: 0 auto;
  padding: var(--portal-stage-padding-top) var(--portal-stage-padding-inline)
    var(--portal-stage-padding-bottom);
  box-sizing: border-box;
  display: grid;
  gap: var(--portal-module-gap);
}

.portal-article-module-page > .portal-section-heading {
  margin: 0;
}

.portal-article-module-page__results {
  display: grid;
  gap: var(--portal-module-gap);
  min-width: 0;
}

.portal-article-module-page__results-stage {
  display: grid;
  gap: var(--portal-module-gap);
  min-width: 0;
}

.portal-article-module-page__results :deep(.portal-request-boundary__state) {
  --portal-request-boundary-accent: var(--home-business-article-accent);
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

.portal-article-module-page__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--portal-module-gap);
}

.portal-article-module-page__card {
  position: relative;
  display: grid;
  gap: var(--home-card-gap-tight);
  padding: var(--portal-article-module-card-padding-local);
  border: 1px solid var(--home-article-module-border);
  border-radius: var(--portal-article-module-card-radius-local);
  background: var(--home-article-module-surface);
  box-shadow: var(--home-article-item-inset-shadow);
}

.portal-article-module-page__card::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 0;
  border-bottom: 1px dashed var(--home-article-module-divider);
  opacity: 0.74;
  pointer-events: none;
}

.portal-article-module-page__card--link {
  --portal-interactive-hover-background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01)),
    var(--home-article-module-surface);
  --portal-interactive-hover-border: var(--home-article-module-divider-strong);
  --portal-interactive-hover-shadow: var(--home-article-item-inset-shadow);
}

.portal-article-module-page__link-layer {
  z-index: 2;
}

.portal-article-module-page__cover {
  position: relative;
  min-height: var(--portal-article-module-cover-height-local);
  border: 1px solid var(--home-media-panel-border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(18, 41, 74, 0.04);
  background: var(--home-media-overlay-soft), var(--home-media-placeholder-surface);
}

.portal-article-module-page__cover::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: var(--home-article-cover-art);
}

.portal-article-module-page__cover-image {
  z-index: 0;
  filter: saturate(0.94) contrast(0.98);
}

.portal-article-module-page__copy {
  display: grid;
  grid-template-rows: auto var(--portal-article-module-summary-height-local) auto;
  gap: var(--portal-article-module-copy-gap-local);
  min-width: 0;
}

.portal-article-module-page__footer,
.portal-article-module-page__meta,
.portal-article-module-page__metrics,
.portal-article-module-page__skeleton-meta,
.portal-article-module-page__skeleton-footer {
  display: flex;
  align-items: center;
  gap: var(--home-card-gap-tight);
  min-width: 0;
}

.portal-article-module-page__footer,
.portal-article-module-page__skeleton-footer {
  justify-content: space-between;
  padding-top: 9px;
  border-top: 1px dashed var(--home-article-module-divider);
}

.portal-article-module-page__metrics {
  justify-content: flex-end;
  flex-wrap: wrap;
}

.portal-article-module-page__meta,
.portal-article-module-page__skeleton-meta {
  flex: 1 1 auto;
  flex-wrap: wrap;
}

.portal-article-module-page__skeleton-pill {
  display: inline-flex;
  align-items: center;
  height: var(--home-chip-height-xs);
  padding: 0 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: var(--home-chip-height-xs);
}

.portal-article-module-page__meta-item,
.portal-article-module-page__metric,
.portal-article-module-page__skeleton-pill {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
}

.portal-article-module-page__meta-item {
  position: relative;
  color: color-mix(in srgb, var(--home-muted) 84%, var(--home-detail-glass-ink) 16%);
}

.portal-article-module-page__meta-item:not(:last-child) {
  padding-right: 10px;
}

.portal-article-module-page__meta-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  width: 1px;
  height: 10px;
  background: var(--home-article-module-divider);
  transform: translateY(-50%);
}

.portal-article-module-page__copy h2 {
  margin: 0;
  min-width: 0;
  color: var(--home-ink);
  font-size: 16px;
  font-weight: 700;
  line-height: var(--portal-article-module-title-line-height-local);
  letter-spacing: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.portal-article-module-page__card p {
  margin: 0;
  color: color-mix(in srgb, var(--home-muted) 82%, transparent);
  font-size: 13px;
  line-height: var(--portal-article-module-summary-line-height-local);
  display: -webkit-box;
  height: var(--portal-article-module-summary-height-local);
  min-height: var(--portal-article-module-summary-height-local);
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.portal-article-module-page__metric {
  position: relative;
  gap: 5px;
  color: color-mix(in srgb, var(--home-muted) 84%, var(--home-detail-glass-ink) 16%);
}

.portal-article-module-page__metric + .portal-article-module-page__metric {
  padding-left: 10px;
}

.portal-article-module-page__metric + .portal-article-module-page__metric::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 1px;
  height: 10px;
  background: var(--home-article-module-divider);
  transform: translateY(-50%);
}

.portal-article-module-page__metric-icon {
  flex: 0 0 auto;
  color: var(--home-article-module-meta-icon-ink);
}

.portal-article-module-page__cover-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  height: var(--home-chip-height-sm);
  max-width: min(46%, 176px);
  padding: 0 11px 0 12px;
  border: 1px solid
    color-mix(in srgb, var(--portal-module-card-tag-border) 78%, rgba(255, 255, 255, 0.32));
  border-radius: 11px 15px 13px 11px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0) 58%),
    color-mix(in srgb, var(--portal-module-card-tag-bg) 88%, rgba(255, 255, 255, 0.22));
  box-shadow:
    0 4px 10px color-mix(in srgb, var(--portal-module-card-tag-accent) 9%, rgba(18, 41, 74, 0.08)),
    inset 0 1px 0 rgba(255, 255, 255, 0.44);
  color: color-mix(in srgb, var(--portal-module-card-tag-accent) 82%, var(--home-ink) 18%);
  font-size: 12px;
  font-weight: 700;
  line-height: var(--home-chip-height-sm);
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.portal-article-module-page__cover-tag::before {
  content: '';
  width: 4px;
  height: 12px;
  margin-right: 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--portal-module-card-tag-accent) 74%, white 26%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.42);
}

.portal-article-module-page__cover-tag-skeleton {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  width: 74px;
  height: var(--home-chip-height-sm);
  border-radius: 11px 15px 13px 11px;
}

.portal-article-module-page__cover--skeleton,
.portal-article-module-page__skeleton-block,
.portal-article-module-page__skeleton-pill {
  position: relative;
}

.portal-article-module-page__cover--skeleton,
.portal-article-module-page__cover-tag-skeleton,
.portal-article-module-page__skeleton-block,
.portal-article-module-page__skeleton-pill {
  overflow: hidden;
  border: 1px solid var(--home-skeleton-border);
  background: linear-gradient(
    135deg,
    var(--home-skeleton-block-strong),
    var(--home-skeleton-block)
  );
}

.portal-article-module-page__cover--skeleton::after,
.portal-article-module-page__cover-tag-skeleton::after,
.portal-article-module-page__skeleton-block::after,
.portal-article-module-page__skeleton-pill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--home-skeleton-shimmer);
  animation: home-skeleton-wave 2.4s ease-in-out infinite;
  transform: translateX(-100%);
}

.portal-article-module-page__skeleton-title,
.portal-article-module-page__skeleton-summary {
  display: grid;
  gap: 0;
}

.portal-article-module-page__skeleton-title {
  height: var(--portal-article-module-title-line-height-local);
}

.portal-article-module-page__skeleton-summary {
  height: var(--portal-article-module-summary-height-local);
}

.portal-article-module-page__skeleton-line {
  display: flex;
  align-items: center;
}

.portal-article-module-page__skeleton-line--title {
  height: var(--portal-article-module-title-line-height-local);
}

.portal-article-module-page__skeleton-line--summary {
  height: var(--portal-article-module-summary-line-height-local);
}

.portal-article-module-page__skeleton-line--summary-short {
  height: var(--portal-article-module-summary-line-height-local);
}

.portal-article-module-page__skeleton-line--meta-author,
.portal-article-module-page__skeleton-line--meta-time {
  height: var(--portal-article-module-footer-line-height-local);
}

.portal-article-module-page__skeleton-divider {
  width: 1px;
  height: 10px;
  background: var(--home-article-module-divider);
  flex: 0 0 auto;
}

.portal-article-module-page__skeleton-metrics {
  display: flex;
  align-items: center;
  gap: var(--home-card-gap-tight);
  justify-content: flex-end;
}

.portal-article-module-page__skeleton-block {
  display: inline-flex;
  border-radius: 999px;
}

.portal-article-module-page__skeleton-block--title {
  width: 72%;
  height: var(--home-skeleton-title-md-height);
}

.portal-article-module-page__skeleton-block--summary {
  width: 100%;
  height: var(--home-skeleton-copy-13-height);
}

.portal-article-module-page__skeleton-block--summary-short {
  width: 82%;
  height: var(--home-skeleton-copy-13-height);
}

.portal-article-module-page__skeleton-block--meta-author {
  width: 56px;
  height: var(--home-skeleton-copy-12-height);
}

.portal-article-module-page__skeleton-block--meta-time {
  width: 62px;
  height: var(--home-skeleton-copy-12-height);
}

.portal-article-module-page__skeleton-pill--metric {
  box-sizing: border-box;
  flex: 0 0 auto;
  width: 42px;
  height: var(--portal-article-module-footer-line-height-local);
  min-height: var(--portal-article-module-footer-line-height-local);
  padding: 0;
}
</style>
