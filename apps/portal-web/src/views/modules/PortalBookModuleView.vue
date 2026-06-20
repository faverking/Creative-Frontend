<template>
  <section class="portal-book-module-page">
    <portal-section-heading heading-tag="h1" title="书库版块" variant="bookshelf" />

    <portal-module-filter-panel
      v-model="keywordInput"
      :active-category="activePart"
      :categories="BOOK_MODULE_CATEGORIES"
      categories-label="书库内容类型"
      :has-active-filters="hasActiveFilters"
      keyword-label="按书库标题、简介或标签搜索"
      keyword-placeholder="搜索书库标题、简介或作者"
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
      class="portal-book-module-page__results"
      :mode="resultsBoundaryMode"
      :error-code="primaryErrorCode"
      primary-label="重试"
      @primary="refresh"
    >
      <template #loading>
        <div class="portal-book-module-page__grid" aria-hidden="true">
          <article
            v-for="index in PUBLIC_MODULE_QUERY_CONFIG.book.pageSize"
            :key="`book-skeleton-${index}`"
            class="portal-book-module-page__card"
          >
            <span class="portal-book-module-page__type-tag-skeleton" />
            <div class="portal-book-module-page__cover portal-book-module-page__cover--skeleton" />

            <div class="portal-book-module-page__copy">
              <div class="portal-book-module-page__skeleton-title">
                <span
                  class="portal-book-module-page__skeleton-line portal-book-module-page__skeleton-line--title"
                >
                  <span
                    class="portal-book-module-page__skeleton-block portal-book-module-page__skeleton-block--title"
                  />
                </span>
              </div>

              <div class="portal-book-module-page__skeleton-author">
                <span
                  class="portal-book-module-page__skeleton-line portal-book-module-page__skeleton-line--author"
                >
                  <span
                    class="portal-book-module-page__skeleton-block portal-book-module-page__skeleton-block--author"
                  />
                </span>
              </div>

              <div class="portal-book-module-page__skeleton-summary">
                <span
                  class="portal-book-module-page__skeleton-line portal-book-module-page__skeleton-line--summary"
                >
                  <span
                    class="portal-book-module-page__skeleton-block portal-book-module-page__skeleton-block--summary"
                  />
                </span>
                <span
                  class="portal-book-module-page__skeleton-line portal-book-module-page__skeleton-line--summary"
                >
                  <span
                    class="portal-book-module-page__skeleton-block portal-book-module-page__skeleton-block--summary-short"
                  />
                </span>
              </div>

              <div
                class="portal-book-module-page__style-tags portal-book-module-page__style-tags--skeleton"
              >
                <span
                  class="portal-book-module-page__skeleton-pill portal-book-module-page__skeleton-pill--style"
                />
                <span
                  class="portal-book-module-page__skeleton-pill portal-book-module-page__skeleton-pill--style portal-book-module-page__skeleton-pill--style-short"
                />
                <span
                  class="portal-book-module-page__skeleton-pill portal-book-module-page__skeleton-pill--style portal-book-module-page__skeleton-pill--style-mid"
                />
              </div>

              <div class="portal-book-module-page__skeleton-footer">
                <div class="portal-book-module-page__skeleton-meta">
                  <span
                    class="portal-book-module-page__skeleton-line portal-book-module-page__skeleton-line--meta"
                  >
                    <span
                      class="portal-book-module-page__skeleton-block portal-book-module-page__skeleton-block--meta-chapters"
                    />
                  </span>
                  <span class="portal-book-module-page__skeleton-divider" />
                  <span
                    class="portal-book-module-page__skeleton-line portal-book-module-page__skeleton-line--meta"
                  >
                    <span
                      class="portal-book-module-page__skeleton-block portal-book-module-page__skeleton-block--meta-time"
                    />
                  </span>
                </div>

                <div class="portal-book-module-page__skeleton-metrics">
                  <span
                    v-for="item in 3"
                    :key="item"
                    class="portal-book-module-page__skeleton-pill portal-book-module-page__skeleton-pill--metric"
                  />
                </div>
              </div>
            </div>
          </article>
        </div>
      </template>

      <div class="portal-book-module-page__results-stage" :aria-busy="loading ? 'true' : 'false'">
        <template v-if="items.length > 0">
          <div class="portal-book-module-page__grid" role="list" aria-label="书库列表">
            <article
              v-for="item in items"
              :key="item.id"
              class="portal-book-module-page__card portal-book-module-page__card--link portal-interactive-surface"
            >
              <router-link
                class="portal-book-module-page__link-layer portal-link-layer"
                :to="resolvePortalContentDetailLocation('book', item.id)"
                :aria-label="`查看${item.title || item.name || '公开书库'}详情`"
                :title="item.title || item.name || '公开书库'"
              />
              <span
                class="portal-book-module-page__type-tag"
                :style="resolveBookPartTagStyle(item.part)"
              >
                {{ resolvePublicBookPartLabel(item.part) }}
              </span>

              <div class="portal-book-module-page__cover">
                <portal-image
                  :src="resolveBookModuleCoverUrl(item)"
                  class="portal-book-module-page__cover-image"
                />
              </div>

              <div class="portal-book-module-page__copy">
                <h2>{{ item.title || item.name || '公开书库' }}</h2>
                <div class="portal-book-module-page__author">{{ resolveAuthorLabel(item) }}</div>
                <p>{{ resolveSummary(item) }}</p>
                <div
                  v-if="resolveStyleTags(item).length > 0"
                  class="portal-book-module-page__style-tags"
                >
                  <span
                    v-for="tag in resolveStyleTags(item)"
                    :key="`${item.id}-${tag.label}`"
                    class="portal-book-module-page__style-tag"
                    :class="`portal-book-module-page__style-tag--${tag.tone}`"
                  >
                    {{ tag.label }}
                  </span>
                </div>

                <div class="portal-book-module-page__footer">
                  <div class="portal-book-module-page__meta">
                    <span
                      v-for="entry in resolveMetaEntries(item)"
                      :key="entry.key"
                      class="portal-book-module-page__meta-item"
                    >
                      {{ entry.label }}
                    </span>
                  </div>

                  <div class="portal-book-module-page__metrics">
                    <span
                      v-for="metric in resolveMetrics(item)"
                      :key="metric.iconName"
                      class="portal-book-module-page__metric"
                      :title="metric.label"
                      :aria-label="metric.label"
                    >
                      <portal-svg-icon
                        :name="metric.iconName"
                        size="1.3rem"
                        class="portal-book-module-page__metric-icon"
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
            :page-size="PUBLIC_MODULE_QUERY_CONFIG.book.pageSize"
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
  resolveBookModuleCoverUrl,
  type PublicBookModuleItemResponse
} from '@/api/public-modules'
import type { PortalRequestBoundaryMode } from '@/components/PortalRequestBoundary.vue'
import { resolvePublicBookPartLabel } from '@/constants/public-detail'
import { HOME_TAG_TONES } from '@/constants/home'
import {
  BOOK_MODULE_CATEGORIES,
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
  formatUnixTimestampLabel,
  resolvePortalContentDetailLocation
} from '@/utils/content'
import { createToneTagList } from '@/utils/home'
import { resolvePublicBookDisplayTagLabels } from '@/utils/public-book-tags'

const {
  activeCategoryValue: activePart,
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
} = usePortalModuleQuery<PublicBookModuleItemResponse, number>({
  ...PUBLIC_MODULE_QUERY_CONFIG.book,
  defaultSort: PORTAL_MODULE_DEFAULT_SORT,
  fetchPage: ({ categoryValue, keyword, limit, page, sort }) =>
    portalPublicModulesApi.getBookList({
      page,
      limit,
      part: categoryValue,
      keyword,
      sort
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

function resolveSummary(item: PublicBookModuleItemResponse): string {
  return item.summary?.trim() || item.desc?.trim() || '当前书库简介正在整理中。'
}

function resolveAuthorLabel(item: PublicBookModuleItemResponse): string {
  const names = item.authorNames ?? item.author ?? []
  const normalizedNames = names.map((name) => name.trim()).filter(Boolean)
  return normalizedNames.length > 0 ? normalizedNames.join(' ') : '匿名整理'
}

function resolveMetaEntries(
  item: PublicBookModuleItemResponse
): Array<{ key: string; label: string }> {
  const chapterPrefix = item.status === 2 ? '已完结' : '更新至'
  const timeLabel =
    formatUnixTimestampLabel(item.updateTime) || formatUnixTimestampLabel(item.releaseTime)

  return [
    { key: `total-${item.id}`, label: `${chapterPrefix} ${item.total ?? 0} 章` },
    ...(timeLabel ? [{ key: `time-${item.id}`, label: timeLabel }] : [])
  ]
}

function resolveStyleTags(item: PublicBookModuleItemResponse) {
  const tagLabels = resolvePublicBookDisplayTagLabels({
    tags: item.tags,
    excludedLabels: [resolvePublicBookPartLabel(item.part)],
    limit: 3
  })

  return createToneTagList(tagLabels, HOME_TAG_TONES, 3)
}

function resolveMetrics(item: PublicBookModuleItemResponse) {
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

function resolveBookPartTagStyle(part?: number) {
  return createPortalModuleTagToneStyle(
    resolvePortalModuleCategoryTone(BOOK_MODULE_CATEGORIES, part)
  )
}

function handleCategoryChange(value?: number | string): void {
  void setCategory(typeof value === 'number' ? value : undefined)
}
</script>

<style scoped>
.portal-book-module-page {
  --portal-book-module-card-radius-local: 18px;
  --portal-book-module-card-padding-local: var(--portal-content-card-padding-xs);
  --portal-book-module-author-line-height-local: calc(12px * 1.35);
  --portal-book-module-title-line-height-local: calc(18px * 1.34);
  --portal-book-module-summary-line-height-local: calc(13px * 1.68);
  --portal-book-module-summary-height-local: calc(
    var(--portal-book-module-summary-line-height-local) * 2
  );
  --portal-book-module-meta-line-height-local: calc(12px * 1.35);
  width: min(var(--portal-browse-stage-max-width), 100%);
  margin: 0 auto;
  padding: var(--portal-stage-padding-top) var(--portal-stage-padding-inline)
    var(--portal-stage-padding-bottom);
  box-sizing: border-box;
  display: grid;
  gap: var(--portal-module-gap);
}

.portal-book-module-page > .portal-section-heading {
  margin: 0;
}

.portal-book-module-page__results,
.portal-book-module-page__results-stage {
  display: grid;
  gap: var(--portal-module-gap);
  min-width: 0;
}

.portal-book-module-page__results :deep(.portal-request-boundary__state) {
  --portal-request-boundary-accent: var(--portal-content-bookshelf-accent);
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

.portal-book-module-page__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--portal-module-gap);
}

.portal-book-module-page__card {
  position: relative;
  display: grid;
  grid-template-columns: 126px minmax(0, 1fr);
  gap: 16px;
  padding: var(--portal-book-module-card-padding-local);
  border: 1px solid var(--portal-module-topic-border);
  border-radius: var(--portal-book-module-card-radius-local);
  background: var(--portal-module-topic-surface);
}

.portal-book-module-page__card::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 0;
  border-bottom: 1px dashed var(--portal-module-topic-divider);
  opacity: 0.74;
  pointer-events: none;
}

.portal-book-module-page__card--link {
  --portal-interactive-hover-background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01)),
    var(--portal-module-topic-surface);
  --portal-interactive-hover-border: color-mix(
    in srgb,
    var(--portal-content-bookshelf-accent) 24%,
    var(--portal-module-topic-divider) 76%
  );
}

.portal-book-module-page__link-layer {
  z-index: 2;
}

.portal-book-module-page__cover {
  position: relative;
  width: 124px;
  height: 176px;
  align-self: center;
  justify-self: start;
  margin-left: 4px;
  border: 1px solid var(--home-bookshelf-cover-border);
  border-radius: 14px;
  background: var(--home-bookshelf-cover-a);
  box-shadow: var(--home-bookshelf-cover-shadow);
  overflow: hidden;
  transform: rotate(-2deg) translateY(1px);
}

.portal-book-module-page__cover::before,
.portal-book-module-page__cover::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.portal-book-module-page__cover::before {
  inset: 0;
  background: linear-gradient(180deg, var(--home-bookshelf-cover-sheen), transparent 42%);
}

.portal-book-module-page__cover::after {
  top: 0;
  right: 0;
  width: 7px;
  height: 100%;
  background: linear-gradient(180deg, var(--home-bookshelf-cover-spine), transparent 82%);
}

.portal-book-module-page__cover-image {
  z-index: 0;
  filter: saturate(0.96) contrast(0.99);
}

.portal-book-module-page__type-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  height: var(--portal-content-chip-height-sm);
  max-width: min(42%, 172px);
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
  color: color-mix(
    in srgb,
    var(--portal-module-card-tag-accent) 82%,
    var(--portal-content-ink) 18%
  );
  font-size: 12px;
  font-weight: 700;
  line-height: var(--portal-content-chip-height-sm);
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.portal-book-module-page__type-tag::before {
  content: '';
  width: 4px;
  height: 12px;
  margin-right: 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--portal-module-card-tag-accent) 74%, white 26%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.42);
}

.portal-book-module-page__copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.portal-book-module-page__copy h2 {
  margin: 0;
  min-width: 0;
  padding-right: min(154px, 40%);
  box-sizing: border-box;
  color: var(--portal-content-ink);
  font-size: 16px;
  font-weight: 700;
  line-height: var(--portal-book-module-title-line-height-local);
  letter-spacing: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.portal-book-module-page__author {
  color: color-mix(
    in srgb,
    var(--portal-content-bookshelf-accent) 32%,
    var(--portal-content-muted) 68%
  );
  font-size: 12px;
  font-weight: 600;
  line-height: var(--portal-book-module-author-line-height-local);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.portal-book-module-page__copy p {
  margin: 0;
  color: color-mix(in srgb, var(--portal-content-muted) 82%, transparent);
  font-size: 13px;
  line-height: var(--portal-book-module-summary-line-height-local);
  display: -webkit-box;
  height: var(--portal-book-module-summary-height-local);
  min-height: var(--portal-book-module-summary-height-local);
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.portal-book-module-page__style-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: start;
  min-height: var(--portal-content-chip-height-sm);
}

.portal-book-module-page__style-tag {
  display: inline-flex;
  align-items: center;
  height: var(--portal-content-chip-height-sm);
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: var(--portal-content-chip-height-sm);
}

.portal-book-module-page__style-tag--cyan {
  background: var(--portal-content-feature-tag-cyan-bg);
  border-color: var(--portal-content-feature-tag-cyan-border);
  color: var(--portal-content-feature-tag-cyan-ink);
}

.portal-book-module-page__style-tag--sky {
  background: var(--portal-content-feature-tag-sky-bg);
  border-color: var(--portal-content-feature-tag-sky-border);
  color: var(--portal-content-feature-tag-sky-ink);
}

.portal-book-module-page__style-tag--iris {
  background: var(--portal-content-feature-tag-iris-bg);
  border-color: var(--portal-content-feature-tag-iris-border);
  color: var(--portal-content-feature-tag-iris-ink);
}

.portal-book-module-page__style-tag--soft {
  background: var(--portal-content-feature-tag-soft-bg);
  border-color: var(--portal-content-feature-tag-soft-border);
  color: var(--portal-content-feature-tag-soft-ink);
}

.portal-book-module-page__footer,
.portal-book-module-page__meta,
.portal-book-module-page__metrics,
.portal-book-module-page__skeleton-meta,
.portal-book-module-page__skeleton-footer,
.portal-book-module-page__skeleton-metrics {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.portal-book-module-page__footer,
.portal-book-module-page__skeleton-footer {
  justify-content: space-between;
  padding-top: 10px;
  margin-top: auto;
  border-top: 1px dashed var(--portal-module-topic-divider);
}

.portal-book-module-page__meta,
.portal-book-module-page__skeleton-meta {
  flex: 1 1 auto;
  flex-wrap: wrap;
}

.portal-book-module-page__metrics,
.portal-book-module-page__skeleton-metrics {
  justify-content: flex-end;
}

.portal-book-module-page__meta-item,
.portal-book-module-page__metric {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: color-mix(in srgb, var(--portal-content-muted) 84%, var(--public-detail-glass-ink) 16%);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
}

.portal-book-module-page__meta-item:not(:last-child),
.portal-book-module-page__metric + .portal-book-module-page__metric {
  padding-right: 10px;
}

.portal-book-module-page__meta-item:not(:last-child)::after,
.portal-book-module-page__metric + .portal-book-module-page__metric::before {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  width: 1px;
  height: 10px;
  background: var(--portal-module-topic-divider);
  transform: translateY(-50%);
}

.portal-book-module-page__metric + .portal-book-module-page__metric {
  padding-left: 10px;
  padding-right: 0;
}

.portal-book-module-page__metric + .portal-book-module-page__metric::before {
  left: 0;
  right: auto;
}

.portal-book-module-page__metric-icon {
  flex: 0 0 auto;
  color: color-mix(
    in srgb,
    var(--portal-content-bookshelf-accent) 74%,
    var(--portal-content-ink) 26%
  );
}

.portal-book-module-page__cover--skeleton,
.portal-book-module-page__type-tag-skeleton,
.portal-book-module-page__skeleton-block,
.portal-book-module-page__skeleton-pill {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--portal-skeleton-border);
  background: linear-gradient(
    135deg,
    var(--portal-skeleton-block-strong),
    var(--portal-skeleton-block)
  );
}

.portal-book-module-page__cover--skeleton::after,
.portal-book-module-page__type-tag-skeleton::after,
.portal-book-module-page__skeleton-block::after,
.portal-book-module-page__skeleton-pill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--portal-skeleton-shimmer);
  animation: home-skeleton-wave 2.4s ease-in-out infinite;
  transform: translateX(-100%);
}

.portal-book-module-page__cover--skeleton::before {
  content: none;
}

.portal-book-module-page__cover--skeleton::after {
  width: auto;
  height: auto;
}

.portal-book-module-page__cover--skeleton {
  background: linear-gradient(
    135deg,
    var(--portal-skeleton-block-strong),
    var(--portal-skeleton-block)
  );
}

.portal-book-module-page__type-tag-skeleton {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  pointer-events: none;
  width: 72px;
  height: var(--portal-content-chip-height-sm);
  border-radius: 11px 15px 13px 11px;
}

.portal-book-module-page__skeleton-title,
.portal-book-module-page__skeleton-author,
.portal-book-module-page__skeleton-summary {
  display: grid;
  gap: 0;
}

.portal-book-module-page__skeleton-title {
  height: var(--portal-book-module-title-line-height-local);
}

.portal-book-module-page__skeleton-author {
  height: var(--portal-book-module-author-line-height-local);
}

.portal-book-module-page__skeleton-summary {
  height: var(--portal-book-module-summary-height-local);
}

.portal-book-module-page__skeleton-line {
  display: flex;
  align-items: center;
}

.portal-book-module-page__skeleton-line--title {
  height: var(--portal-book-module-title-line-height-local);
}

.portal-book-module-page__skeleton-line--author {
  height: var(--portal-book-module-author-line-height-local);
}

.portal-book-module-page__skeleton-line--summary {
  height: var(--portal-book-module-summary-line-height-local);
}

.portal-book-module-page__skeleton-line--meta {
  height: var(--portal-book-module-meta-line-height-local);
}

.portal-book-module-page__skeleton-divider {
  width: 1px;
  height: 10px;
  background: color-mix(in srgb, var(--portal-content-line) 78%, transparent);
  flex: 0 0 auto;
}

.portal-book-module-page__skeleton-block,
.portal-book-module-page__skeleton-pill {
  display: inline-flex;
  border-radius: 999px;
}

.portal-book-module-page__skeleton-block--title {
  width: 78%;
  height: var(--portal-skeleton-title-md-height);
}

.portal-book-module-page__skeleton-block--author {
  width: 92px;
  height: var(--portal-skeleton-copy-12-height);
}

.portal-book-module-page__skeleton-block--summary {
  width: 100%;
  height: var(--portal-skeleton-copy-13-height);
}

.portal-book-module-page__skeleton-block--summary-short {
  width: 84%;
  height: var(--portal-skeleton-copy-13-height);
}

.portal-book-module-page__skeleton-block--meta-chapters {
  width: 72px;
  height: var(--portal-skeleton-copy-12-height);
}

.portal-book-module-page__skeleton-block--meta-time {
  width: 74px;
  height: var(--portal-skeleton-copy-12-height);
}

.portal-book-module-page__style-tags--skeleton {
  min-height: var(--portal-content-chip-height-sm);
}

.portal-book-module-page__skeleton-pill--style {
  width: 72px;
  height: var(--portal-content-chip-height-sm);
}

.portal-book-module-page__skeleton-pill--style-short {
  width: 60px;
}

.portal-book-module-page__skeleton-pill--style-mid {
  width: 82px;
}

.portal-book-module-page__skeleton-pill--metric {
  box-sizing: border-box;
  width: 42px;
  height: calc(12px * 1.35);
  min-height: calc(12px * 1.35);
  padding: 0;
}
</style>
