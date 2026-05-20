<template>
  <portal-workspace-page-shell
    page-key="favorites"
    :section-pills="sectionPills"
    :title="title"
    :toolbar-actions="toolbarActions"
    @section-pill-click="handleSectionPillClick"
  >
    <portal-request-boundary
      as="section"
      class="workspace-favorite-stage"
      :mode="stageBoundaryMode"
      :error-code="errorCode"
      primary-label="重试"
      @primary="loadFavorites"
    >
      <template #loading>
        <div class="workspace-favorite-list workspace-favorite-list--skeleton" aria-hidden="true">
          <article
            v-for="index in 3"
            :key="`favorite-skeleton-${index}`"
            class="workspace-favorite-card"
          >
            <div
              class="workspace-favorite-card__cover workspace-favorite-skeleton__block workspace-favorite-skeleton__block--cover"
            />

            <div class="workspace-favorite-card__content workspace-favorite-skeleton__content">
              <div class="workspace-favorite-card__header">
                <span class="workspace-favorite-skeleton__pill" />
              </div>
              <h2 class="workspace-favorite-card__title">
                <span
                  class="workspace-favorite-skeleton__line workspace-favorite-skeleton__line--title"
                />
              </h2>
              <p class="workspace-favorite-card__summary">
                <span
                  class="workspace-favorite-skeleton__line workspace-favorite-skeleton__line--summary"
                />
              </p>
              <div class="workspace-tag-row workspace-favorite-card__tags" aria-hidden="true">
                <span
                  v-for="tagIndex in 3"
                  :key="tagIndex"
                  class="workspace-favorite-skeleton__tag"
                />
              </div>
              <div class="workspace-favorite-card__footer">
                <div class="workspace-favorite-skeleton__meta" aria-hidden="true">
                  <span
                    v-for="metaIndex in 3"
                    :key="metaIndex"
                    class="workspace-favorite-skeleton__line workspace-favorite-skeleton__line--meta"
                  />
                </div>
                <div class="workspace-favorite-skeleton__metrics" aria-hidden="true">
                  <span
                    v-for="metricIndex in 3"
                    :key="metricIndex"
                    class="workspace-favorite-skeleton__pill workspace-favorite-skeleton__pill--metric"
                  />
                </div>
              </div>
            </div>

            <div class="workspace-favorite-card__aside workspace-favorite-skeleton__aside">
              <span class="workspace-favorite-skeleton__button" />
              <span
                class="workspace-favorite-skeleton__button workspace-favorite-skeleton__button--secondary"
              />
            </div>
          </article>
        </div>
      </template>

      <div :aria-busy="isRefreshing ? 'true' : 'false'">
        <div v-if="favoriteItems.length > 0" class="workspace-favorite-list">
          <article v-for="item in favoriteItems" :key="item.id" class="workspace-favorite-card">
            <div class="workspace-favorite-card__cover" :class="`is-${item.business}`">
              <portal-image v-if="item.coverUrl" :src="item.coverUrl" :alt="item.title" />
            </div>

            <div class="workspace-favorite-card__content">
              <div class="workspace-favorite-card__header">
                <span class="workspace-badge" :class="`workspace-badge--${item.business}`">
                  {{ item.label }}
                </span>
              </div>

              <h2 class="workspace-favorite-card__title">
                <router-link
                  :to="item.primaryAction.to"
                  class="workspace-favorite-card__title-link"
                >
                  {{ item.title }}
                </router-link>
              </h2>

              <p class="workspace-favorite-card__summary">{{ item.description }}</p>

              <div
                class="workspace-tag-row workspace-favorite-card__tags"
                :class="{ 'is-empty': item.tags.length === 0 }"
              >
                <span v-for="tag in item.tags" :key="tag" class="workspace-tag">{{ tag }}</span>
              </div>

              <div class="workspace-favorite-card__footer">
                <div class="workspace-favorite-card__meta">
                  <span
                    v-for="metaItem in item.metaItems"
                    :key="`${item.id}-${metaItem}`"
                    class="workspace-favorite-card__meta-item"
                  >
                    {{ metaItem }}
                  </span>
                </div>
                <div class="workspace-favorite-card__metrics">
                  <span
                    v-for="metric in item.metricEntries"
                    :key="metric.iconName"
                    class="workspace-favorite-card__metric"
                    :title="metric.label"
                    :aria-label="metric.label"
                  >
                    <portal-svg-icon
                      :name="metric.iconName"
                      size="13px"
                      class="workspace-favorite-card__metric-icon"
                    />
                    <span>{{ metric.value }}</span>
                  </span>
                </div>
              </div>
            </div>

            <div class="workspace-favorite-card__aside">
              <router-link
                class="workspace-action-button workspace-action-button--primary"
                :to="item.primaryAction.to"
              >
                {{ item.primaryAction.label }}
              </router-link>

              <button
                type="button"
                class="workspace-action-button"
                :disabled="pendingFavoriteId === item.id"
                @click="handleToggleFavorite(item)"
              >
                {{ pendingFavoriteId === item.id ? '处理中...' : '取消收藏' }}
              </button>
            </div>
          </article>

          <portal-module-pagination
            :current-page="activePage"
            :disabled="isRefreshing"
            :page-size="pageSize"
            :total="total"
            @change="handlePageChange"
          />
        </div>
      </div>
    </portal-request-boundary>
  </portal-workspace-page-shell>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import PortalWorkspacePageShell from './components/PortalWorkspacePageShell.vue'
import { useWorkspaceRequestState } from './composables/useWorkspaceRequestState'

import type { WorkspaceFavoriteItemResponse, WorkspaceTargetType } from '@/api'
import { portalWorkspaceApi } from '@/api'
import {
  WORKSPACE_DEFAULT_PAGE,
  WORKSPACE_PAGE_SIZE,
  WORKSPACE_CONTENT_FILTER_OPTIONS,
  type WorkspaceContentFilterKey,
  type WorkspacePageOption,
  type WorkspaceToolbarAction
} from '@/constants/workspace'
import {
  createWorkspaceContentQuery,
  resolveWorkspaceBusinessKey,
  resolveWorkspaceDetailLocation,
  resolveWorkspaceMetaItems,
  resolveWorkspaceMetricEntries,
  resolveWorkspaceMediaUrl,
  resolveWorkspacePrimaryActionLabel,
  resolveWorkspaceSavedAtLabel,
  resolveWorkspaceTargetLabel,
  type WorkspaceMetricEntry
} from '@/utils/workspace'

interface WorkspaceFavoriteCard {
  business: 'article' | 'book' | 'gallery' | 'topic'
  coverUrl: string
  description: string
  id: string
  label: string
  metaItems: string[]
  metricEntries: WorkspaceMetricEntry[]
  primaryAction: {
    label: string
    to: RouteLocationRaw
  }
  tags: string[]
  targetId: string
  targetType: WorkspaceTargetType
  title: string
}

const title = '收藏内容'
const WORKSPACE_FAVORITE_MAX_TAGS = 3
const favoriteFilter = ref<WorkspaceContentFilterKey>('all')
const favoriteItemsRaw = ref<WorkspaceFavoriteItemResponse[]>([])
const activePage = ref(WORKSPACE_DEFAULT_PAGE)
const pageSize = ref(WORKSPACE_PAGE_SIZE)
const total = ref(0)
const pendingFavoriteId = ref('')
const {
  beginRequest,
  boundaryMode,
  errorCode,
  isLatestRequest,
  isRefreshing,
  resolveFailure,
  resolveSuccess
} = useWorkspaceRequestState()

const sectionPills = computed<WorkspacePageOption[]>(() =>
  WORKSPACE_CONTENT_FILTER_OPTIONS.map((option) => ({
    key: option.key,
    label: option.label,
    active: option.key === favoriteFilter.value
  }))
)

const toolbarActions: WorkspaceToolbarAction[] = []

const favoriteItems = computed<WorkspaceFavoriteCard[]>(() =>
  favoriteItemsRaw.value.map((item) => {
    const metaItems = [
      resolveWorkspaceSavedAtLabel(item.savedAt),
      ...resolveWorkspaceMetaItems(item.targetType, item.meta, item.author).slice(0, 2)
    ]

    return {
      id: item.id,
      business: resolveWorkspaceBusinessKey(item.targetType),
      label: resolveWorkspaceTargetLabel(item.targetType),
      title: item.title,
      description: item.summary?.trim() || '当前内容暂无摘要。',
      tags: item.tags.slice(0, WORKSPACE_FAVORITE_MAX_TAGS),
      metaItems: metaItems.length > 0 ? metaItems : ['继续查看内容详情'],
      metricEntries: resolveWorkspaceMetricEntries(item.meta),
      coverUrl: resolveWorkspaceMediaUrl(item.coverMedia),
      targetType: item.targetType,
      targetId: item.targetId,
      primaryAction: {
        label: resolveWorkspacePrimaryActionLabel(item.targetType),
        to: resolveWorkspaceDetailLocation(item.targetType, item.targetId)
      }
    }
  })
)
const stageBoundaryMode = computed(() =>
  boundaryMode.value === 'ready' && favoriteItems.value.length === 0 ? 'empty' : boundaryMode.value
)

onMounted(() => {
  void loadFavorites()
})

async function loadFavorites(): Promise<void> {
  const requestToken = beginRequest()

  try {
    const response = await portalWorkspaceApi.getMyFavorites(
      createWorkspaceContentQuery(favoriteFilter.value, activePage.value, pageSize.value)
    )
    if (!isLatestRequest(requestToken)) {
      return
    }

    activePage.value = Math.max(WORKSPACE_DEFAULT_PAGE, response.page)
    pageSize.value = Math.max(1, response.limit)
    favoriteItemsRaw.value = response.items
    total.value = response.total
    resolveSuccess(requestToken)
  } catch (error) {
    const { applied, shouldResetData } = resolveFailure(requestToken, error)
    if (!applied) {
      return
    }

    if (shouldResetData) {
      favoriteItemsRaw.value = []
      total.value = 0
    }
  }
}

function handleSectionPillClick(key: string): void {
  favoriteFilter.value = key as WorkspaceContentFilterKey
  activePage.value = WORKSPACE_DEFAULT_PAGE
  void loadFavorites()
}

function handlePageChange(page: number): void {
  if (page === activePage.value) {
    return
  }

  activePage.value = page
  void loadFavorites()
}

async function handleToggleFavorite(item: WorkspaceFavoriteCard): Promise<void> {
  if (pendingFavoriteId.value) {
    return
  }

  pendingFavoriteId.value = item.id

  try {
    const result = await portalWorkspaceApi.toggleFavorite({
      targetType: item.targetType,
      targetId: item.targetId
    })

    if (!result.favored) {
      const nextTotal = Math.max(0, total.value - 1)
      const nextTotalPages = Math.max(WORKSPACE_DEFAULT_PAGE, Math.ceil(nextTotal / pageSize.value))

      if (
        favoriteItemsRaw.value.length === 1 &&
        nextTotal > 0 &&
        activePage.value > nextTotalPages
      ) {
        total.value = nextTotal
        activePage.value = nextTotalPages
        await loadFavorites()
        ElMessage.success('已取消收藏。')
        return
      }

      favoriteItemsRaw.value = favoriteItemsRaw.value.filter((current) => current.id !== item.id)
      total.value = nextTotal
      if (nextTotal === 0) {
        activePage.value = WORKSPACE_DEFAULT_PAGE
      }
      ElMessage.success('已取消收藏。')
    }
  } catch {
    // 消息提示由请求层统一处理
  } finally {
    pendingFavoriteId.value = ''
  }
}
</script>

<style scoped>
.workspace-favorite-list {
  --workspace-accent-current: var(--workspace-accent, var(--workspace-favorites-accent));
  --workspace-accent-soft-current: var(
    --workspace-accent-soft,
    var(--workspace-favorites-accent-soft)
  );
  --workspace-card-bg-current: var(--workspace-card-bg, var(--workspace-card-base-bg));
  --workspace-card-border-current: var(--workspace-card-border, var(--workspace-card-base-border));
  --workspace-card-shadow-current: var(--workspace-card-shadow, var(--workspace-card-base-shadow));
  --workspace-media-bg-current: var(--workspace-media-bg, var(--workspace-media-base-bg));
  --workspace-media-border-current: var(
    --workspace-media-border,
    var(--workspace-media-base-border)
  );
  --workspace-media-shadow-current: var(
    --workspace-media-shadow,
    var(--workspace-media-base-shadow)
  );
  --workspace-favorite-title-size: 18px;
  --workspace-favorite-title-line-height: 1.34;
  --workspace-favorite-body-size: 13px;
  --workspace-favorite-body-line-height: 1.68;
  --workspace-favorite-meta-size: 12px;
  --workspace-favorite-meta-line-height: 1.35;
  --workspace-favorite-list-gap: var(--home-card-gap-base);
  --workspace-favorite-stack-gap: var(--home-card-gap-tight);
  --workspace-favorite-content-min-height: 124px;
  --workspace-favorite-aside-offset-top: 10px;
}

.workspace-favorite-list {
  display: grid;
  gap: var(--workspace-favorite-list-gap);
  padding-top: var(--workspace-stage-top-space);
}

.workspace-favorite-card {
  display: grid;
  grid-template-columns: var(
    --workspace-favorite-card-columns,
    208px minmax(0, 1fr) var(--workspace-action-column-width)
  );
  align-items: start;
  gap: var(--home-card-gap-base);
  padding: var(--workspace-card-padding);
  border: 1px solid var(--workspace-card-border-current);
  border-radius: 20px;
  background: var(--workspace-card-bg-current);
  box-shadow: var(--workspace-card-shadow-current);
}

.workspace-favorite-card__cover {
  position: relative;
  width: var(--workspace-favorite-cover-width, 208px);
  height: 124px;
  overflow: hidden;
  border: 1px solid var(--workspace-media-border-current);
  border-radius: 18px;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--workspace-accent-soft-current) 42%, transparent),
      transparent 78%
    ),
    var(--workspace-media-bg-current);
  box-shadow: var(--workspace-media-shadow-current);
}

.workspace-favorite-card__cover.is-article {
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--home-business-article-accent-soft) 58%, transparent),
      transparent 80%
    ),
    var(--workspace-media-bg-current);
}

.workspace-favorite-card__cover.is-topic {
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--home-business-topic-accent-soft) 58%, transparent),
      transparent 80%
    ),
    var(--workspace-media-bg-current);
}

.workspace-favorite-card__cover.is-gallery {
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--home-business-gallery-accent-soft) 58%, transparent),
      transparent 80%
    ),
    var(--workspace-media-bg-current);
}

.workspace-favorite-card__cover.is-book {
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--home-business-bookshelf-accent-soft) 58%, transparent),
      transparent 80%
    ),
    var(--workspace-media-bg-current);
}

.workspace-favorite-card__content {
  display: grid;
  align-content: start;
  gap: var(--workspace-favorite-stack-gap);
  min-height: var(--workspace-favorite-content-min-height);
  min-width: 0;
}

.workspace-favorite-card__header,
.workspace-favorite-card__footer {
  display: flex;
  gap: var(--home-card-gap-tight);
  min-width: 0;
}

.workspace-favorite-card__header {
  align-items: center;
}

.workspace-favorite-card__footer {
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--home-card-gap-base);
  padding-top: 10px;
  border-top: 1px dashed var(--workspace-meta-divider);
}

.workspace-favorite-card__meta,
.workspace-favorite-card__metrics,
.workspace-favorite-skeleton__meta,
.workspace-favorite-skeleton__metrics {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--home-card-gap-tight);
  min-width: 0;
}

.workspace-favorite-card__meta,
.workspace-favorite-skeleton__meta {
  flex: 1 1 auto;
}

.workspace-favorite-card__metrics,
.workspace-favorite-skeleton__metrics {
  flex: 0 0 auto;
  justify-content: flex-end;
}

.workspace-favorite-card__title {
  margin: 0;
  min-width: 0;
  color: var(--home-ink);
  font-size: var(--workspace-favorite-title-size);
  font-weight: 800;
  line-height: var(--workspace-favorite-title-line-height);
  letter-spacing: -0.02em;
}

.workspace-favorite-card__title-link {
  display: block;
  overflow: hidden;
  color: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-favorite-card__title-link:hover {
  text-decoration: underline;
}

.workspace-favorite-card__summary {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  color: color-mix(in srgb, var(--home-muted) 88%, transparent);
  font-size: var(--workspace-favorite-body-size);
  line-height: var(--workspace-favorite-body-line-height);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-favorite-card__tags.workspace-tag-row {
  flex-wrap: nowrap;
  min-height: 30px;
  overflow: hidden;
}

.workspace-favorite-card__tags.workspace-tag-row.is-empty {
  visibility: hidden;
}

.workspace-favorite-card__tags .workspace-tag {
  flex: 0 0 auto;
}

.workspace-favorite-card__meta,
.workspace-favorite-card__metrics {
  color: color-mix(in srgb, var(--home-muted) 84%, var(--home-detail-glass-ink) 16%);
  font-size: var(--workspace-favorite-meta-size);
  font-weight: 600;
  line-height: var(--workspace-favorite-meta-line-height);
}

.workspace-favorite-card__meta {
  overflow: hidden;
  flex-wrap: nowrap;
}

.workspace-favorite-card__meta-item,
.workspace-favorite-card__metric {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.workspace-favorite-card__meta-item {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-favorite-card__meta-item:not(:last-child) {
  padding-right: var(--workspace-meta-divider-gap);
}

.workspace-favorite-card__meta-item:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 0;
  width: 1px;
  height: var(--workspace-meta-divider-height);
  background: var(--workspace-meta-divider);
  transform: translateY(-50%);
}

.workspace-favorite-card__metric {
  gap: 5px;
}

.workspace-favorite-card__metric + .workspace-favorite-card__metric {
  padding-left: var(--workspace-meta-divider-gap);
}

.workspace-favorite-card__metric + .workspace-favorite-card__metric::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 1px;
  height: var(--workspace-meta-divider-height);
  background: var(--workspace-meta-divider);
  transform: translateY(-50%);
}

.workspace-favorite-card__metric-icon {
  flex: 0 0 auto;
  color: color-mix(in srgb, var(--workspace-accent-current) 82%, var(--home-ink) 18%);
}

.workspace-favorite-card__aside {
  box-sizing: border-box;
  display: grid;
  align-content: start;
  gap: var(--workspace-action-stack-gap);
  justify-items: var(--workspace-favorite-aside-justify-items, stretch);
  min-height: max(var(--workspace-action-column-min-height), 80px);
  padding-top: var(--workspace-favorite-aside-offset-top);
}

.workspace-favorite-list--skeleton .workspace-favorite-card {
  pointer-events: none;
}

.workspace-favorite-skeleton__content,
.workspace-favorite-skeleton__aside {
  display: grid;
}

.workspace-favorite-skeleton__content {
  align-content: start;
  gap: var(--workspace-favorite-stack-gap);
  min-height: var(--workspace-favorite-content-min-height);
}

.workspace-favorite-skeleton__aside {
  box-sizing: border-box;
  align-content: start;
  gap: var(--workspace-action-stack-gap);
  justify-items: var(--workspace-favorite-aside-justify-items, stretch);
  min-height: max(var(--workspace-action-column-min-height), 80px);
  padding-top: var(--workspace-favorite-aside-offset-top);
}

.workspace-favorite-skeleton__meta {
  flex-wrap: nowrap;
  overflow: hidden;
}

.workspace-favorite-skeleton__line,
.workspace-favorite-skeleton__pill,
.workspace-favorite-skeleton__button,
.workspace-favorite-skeleton__tag,
.workspace-favorite-skeleton__block {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--home-skeleton-border);
  background: linear-gradient(
    135deg,
    var(--home-skeleton-block-strong),
    var(--home-skeleton-block)
  );
}

.workspace-favorite-skeleton__line::after,
.workspace-favorite-skeleton__pill::after,
.workspace-favorite-skeleton__button::after,
.workspace-favorite-skeleton__tag::after,
.workspace-favorite-skeleton__block::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: var(--home-skeleton-shimmer);
  animation: home-skeleton-wave 2.4s ease-in-out infinite;
}

.workspace-favorite-skeleton__pill,
.workspace-favorite-skeleton__button,
.workspace-favorite-skeleton__tag {
  border-radius: 999px;
}

.workspace-favorite-card__aside .workspace-action-button,
.workspace-favorite-skeleton__button {
  box-sizing: border-box;
  width: 100%;
  height: var(--workspace-action-button-height);
  min-height: var(--workspace-action-button-height);
}

.workspace-favorite-skeleton__block--cover {
  border-radius: 18px;
}

.workspace-favorite-skeleton__line {
  box-sizing: border-box;
  display: block;
  border-radius: 999px;
}

.workspace-favorite-skeleton__line--title {
  width: 84%;
  height: calc(var(--workspace-favorite-title-size) * var(--workspace-favorite-title-line-height));
}

.workspace-favorite-skeleton__line--summary {
  width: 100%;
  height: calc(var(--workspace-favorite-body-size) * var(--workspace-favorite-body-line-height));
}

.workspace-favorite-skeleton__line--meta {
  position: relative;
  flex: 0 0 auto;
  width: 60px;
  height: calc(var(--workspace-favorite-meta-size) * var(--workspace-favorite-meta-line-height));
}

.workspace-favorite-skeleton__line--meta:first-child {
  width: 88px;
}

.workspace-favorite-skeleton__line--meta:not(:last-child) {
  padding-right: var(--workspace-meta-divider-gap);
}

.workspace-favorite-skeleton__line--meta:not(:last-child)::before {
  content: '';
  position: absolute;
  top: 50%;
  right: 0;
  width: 1px;
  height: var(--workspace-meta-divider-height);
  background: var(--workspace-meta-divider);
  transform: translateY(-50%);
}

.workspace-favorite-skeleton__pill {
  width: 52px;
  height: 24px;
}

.workspace-favorite-skeleton__pill--metric {
  box-sizing: border-box;
  flex: 0 0 auto;
  width: 42px;
  height: calc(var(--workspace-favorite-meta-size) * var(--workspace-favorite-meta-line-height));
  min-height: calc(
    var(--workspace-favorite-meta-size) * var(--workspace-favorite-meta-line-height)
  );
}

.workspace-favorite-skeleton__button {
  padding: 0;
}

.workspace-favorite-skeleton__button--secondary {
  width: 100%;
}

.workspace-favorite-skeleton__tag {
  width: 56px;
  height: 28px;
}
</style>
