<template>
  <portal-workspace-page-shell
    page-key="history"
    :section-pills="sectionPills"
    :title="title"
    :toolbar-actions="toolbarActions"
    @section-pill-click="handleSectionPillClick"
    @toolbar-action-click="handleToolbarActionClick"
  >
    <portal-request-boundary
      as="section"
      class="workspace-history-stage"
      :mode="stageBoundaryMode"
      :error-code="errorCode"
      primary-label="重试"
      @primary="loadHistory"
    >
      <template #loading>
        <div class="workspace-history-groups workspace-history-groups--skeleton" aria-hidden="true">
          <section
            v-for="groupIndex in 2"
            :key="`history-skeleton-${groupIndex}`"
            class="workspace-history-group"
          >
            <header class="workspace-history-group__head workspace-history-skeleton__head">
              <span
                class="workspace-history-skeleton__line workspace-history-skeleton__line--date"
              />
              <span
                class="workspace-history-skeleton__line workspace-history-skeleton__line--count"
              />
            </header>

            <div class="workspace-history-group__track">
              <div class="workspace-history-list">
                <article v-for="itemIndex in 2" :key="itemIndex" class="workspace-history-card">
                  <div
                    class="workspace-history-card__thumb workspace-history-skeleton__block workspace-history-skeleton__block--thumb"
                  />

                  <div class="workspace-history-card__content workspace-history-skeleton__content">
                    <div class="workspace-history-card__header">
                      <span class="workspace-history-skeleton__pill" />
                    </div>
                    <h2 class="workspace-history-card__title">
                      <span
                        class="workspace-history-skeleton__line workspace-history-skeleton__line--title"
                      />
                    </h2>
                    <p class="workspace-history-card__summary">
                      <span
                        class="workspace-history-skeleton__line workspace-history-skeleton__line--summary"
                      />
                    </p>
                    <div class="workspace-history-card__footer">
                      <div class="workspace-history-skeleton__meta" aria-hidden="true">
                        <span
                          v-for="metaIndex in 3"
                          :key="metaIndex"
                          class="workspace-history-skeleton__line workspace-history-skeleton__line--meta"
                        />
                      </div>
                      <div class="workspace-history-skeleton__metrics" aria-hidden="true">
                        <span
                          v-for="metricIndex in 3"
                          :key="metricIndex"
                          class="workspace-history-skeleton__pill workspace-history-skeleton__pill--metric"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="workspace-history-card__aside workspace-history-skeleton__aside">
                    <span
                      class="workspace-history-skeleton__line workspace-history-skeleton__line--time"
                    />
                    <span class="workspace-history-skeleton__button" />
                  </div>
                </article>
              </div>
            </div>
          </section>
        </div>
      </template>

      <div
        class="workspace-history-stage__body"
        :aria-busy="isRefreshing || loadingMore || autoLoading ? 'true' : 'false'"
      >
        <template v-if="historyGroups.length > 0">
          <div class="workspace-history-groups">
            <section
              v-for="group in historyGroups"
              :key="group.key"
              class="workspace-history-group"
            >
              <header class="workspace-history-group__head">
                <p class="workspace-history-group__date">{{ group.label }}</p>
                <p class="workspace-history-group__count">{{ group.countLabel }}</p>
              </header>

              <div class="workspace-history-group__track">
                <div class="workspace-history-list">
                  <article
                    v-for="item in group.items"
                    :key="item.id"
                    class="workspace-history-card"
                  >
                    <div class="workspace-history-card__thumb" :class="`is-${item.business}`">
                      <portal-image v-if="item.coverUrl" :src="item.coverUrl" :alt="item.title" />
                    </div>

                    <div class="workspace-history-card__content">
                      <div class="workspace-history-card__header">
                        <span class="workspace-badge" :class="`workspace-badge--${item.business}`">
                          {{ item.label }}
                        </span>
                      </div>

                      <h2 class="workspace-history-card__title">
                        <router-link
                          :to="item.action.to"
                          class="workspace-history-card__title-link"
                        >
                          {{ item.title }}
                        </router-link>
                      </h2>

                      <p class="workspace-history-card__summary">{{ item.description }}</p>
                      <div class="workspace-history-card__footer">
                        <div class="workspace-history-card__meta">
                          <span
                            v-for="metaItem in item.metaItems"
                            :key="`${item.id}-${metaItem}`"
                            class="workspace-history-card__meta-item"
                          >
                            {{ metaItem }}
                          </span>
                        </div>
                        <div class="workspace-history-card__metrics">
                          <span
                            v-for="metric in item.metricEntries"
                            :key="metric.iconName"
                            class="workspace-history-card__metric"
                            :title="metric.label"
                            :aria-label="metric.label"
                          >
                            <portal-svg-icon
                              :name="metric.iconName"
                              size="13px"
                              class="workspace-history-card__metric-icon"
                            />
                            <span>{{ metric.value }}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="workspace-history-card__aside">
                      <p class="workspace-history-card__time">{{ item.time }}</p>
                      <router-link class="workspace-action-button" :to="item.action.to">
                        {{ item.action.label }}
                      </router-link>
                    </div>
                  </article>
                </div>
              </div>
            </section>
          </div>

          <div
            v-if="canLoadMore || appendError || loadingMore || autoLoading"
            class="workspace-history-stage__append"
          >
            <div
              :ref="bindSentinelRef"
              class="workspace-history-stage__sentinel"
              aria-hidden="true"
            />

            <p
              v-if="appendError || loadingMore || autoLoading"
              class="workspace-history-stage__hint"
              role="status"
              aria-live="polite"
            >
              {{ appendError ? '加载失败，请重试。' : loadingMoreStatusLabel }}
            </p>

            <button
              v-if="appendError"
              type="button"
              class="workspace-history-stage__footer-button"
              :disabled="loadingMore"
              @click="retryLoadMore"
            >
              重新拉取
            </button>
          </div>
        </template>
      </div>
    </portal-request-boundary>
  </portal-workspace-page-shell>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref, type ComponentPublicInstance } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import PortalWorkspacePageShell from './components/PortalWorkspacePageShell.vue'
import { useWorkspaceRequestState } from './composables/useWorkspaceRequestState'

import type { WorkspaceHistoryItemResponse } from '@/api'
import { portalWorkspaceApi } from '@/api'
import {
  WORKSPACE_CONTENT_FILTER_OPTIONS,
  WORKSPACE_DEFAULT_PAGE,
  WORKSPACE_PAGE_SIZE,
  type WorkspaceContentFilterKey,
  type WorkspacePageOption,
  type WorkspaceToolbarAction
} from '@/constants/workspace'
import {
  createWorkspaceContentQuery,
  groupWorkspaceHistoryItems,
  resolveWorkspaceBusinessKey,
  resolveWorkspaceDetailLocation,
  resolveWorkspaceMediaUrl,
  resolveWorkspaceMetaItems,
  resolveWorkspaceMetricEntries,
  resolveWorkspacePrimaryActionLabel,
  resolveWorkspaceTargetLabel,
  resolveWorkspaceVisitedTimeLabel,
  type WorkspaceHistoryGroup,
  type WorkspaceMetricEntry
} from '@/utils/workspace'
import { useAutoLoadSentinel } from '@/composables/useAutoLoadSentinel'

interface WorkspaceHistoryCard {
  action: {
    label: string
    to: RouteLocationRaw
  }
  business: 'article' | 'book' | 'gallery' | 'topic'
  coverUrl: string
  description: string
  id: string
  label: string
  metaItems: string[]
  metricEntries: WorkspaceMetricEntry[]
  time: string
  title: string
  visitedAt: string
}

const title = '浏览历史'
const historyFilter = ref<WorkspaceContentFilterKey>('all')
const historyItemsRaw = ref<WorkspaceHistoryItemResponse[]>([])
const activePage = ref(WORKSPACE_DEFAULT_PAGE)
const pageSize = ref(WORKSPACE_PAGE_SIZE)
const total = ref(0)
const appendError = ref(false)
const loadingMore = ref(false)
const pendingToolbarActionKey = ref('')
const {
  beginRequest,
  boundaryMode,
  errorCode,
  hasLoaded,
  isLatestRequest,
  isRefreshing,
  resolveFailure,
  resolveSuccess
} = useWorkspaceRequestState()
let latestHistoryRequestId = 0

const sectionPills = computed<WorkspacePageOption[]>(() =>
  WORKSPACE_CONTENT_FILTER_OPTIONS.map((option) => ({
    key: option.key,
    label: option.label,
    active: option.key === historyFilter.value
  }))
)

const toolbarActions = computed<WorkspaceToolbarAction[]>(() => [
  {
    key: 'clear-history',
    label: total.value > 0 ? '清空历史' : '暂无历史',
    tone: 'danger',
    disabled: total.value === 0,
    loading: pendingToolbarActionKey.value === 'clear-history',
    confirm: {
      title: '确认清空浏览历史？',
      confirmButtonText: '清空',
      cancelButtonText: '取消'
    }
  }
])

const historyItems = computed<WorkspaceHistoryCard[]>(() =>
  historyItemsRaw.value.map((item) => {
    const metaItems = resolveWorkspaceMetaItems(item.targetType, item.meta, item.author).slice(0, 4)

    return {
      id: item.id,
      visitedAt: item.visitedAt,
      business: resolveWorkspaceBusinessKey(item.targetType),
      label: resolveWorkspaceTargetLabel(item.targetType),
      title: item.title,
      description: item.summary?.trim() || '当前内容暂无摘要。',
      metaItems: metaItems.length > 0 ? metaItems : ['继续查看内容详情'],
      metricEntries: resolveWorkspaceMetricEntries(item.meta),
      time: resolveWorkspaceVisitedTimeLabel(item.visitedAt) || '最近浏览',
      coverUrl: resolveWorkspaceMediaUrl(item.coverMedia),
      action: {
        label: resolveWorkspacePrimaryActionLabel(item.targetType),
        to: resolveWorkspaceDetailLocation(item.targetType, item.targetId)
      }
    }
  })
)

const historyGroups = computed<WorkspaceHistoryGroup<WorkspaceHistoryCard>[]>(() =>
  groupWorkspaceHistoryItems(historyItems.value)
)
const stageBoundaryMode = computed(() =>
  boundaryMode.value === 'ready' && historyGroups.value.length === 0 ? 'empty' : boundaryMode.value
)
const canLoadMore = computed(
  () => historyItemsRaw.value.length > 0 && historyItemsRaw.value.length < total.value
)
const autoLoadEnabled = computed(
  () => hasLoaded.value && !isRefreshing.value && canLoadMore.value && !appendError.value
)
const { autoLoading, sentinelRef } = useAutoLoadSentinel({
  enabled: autoLoadEnabled,
  onLoadMore: loadMore
})
const loadingMoreStatusLabel = computed(() =>
  autoLoading.value ? '正在继续加载更多浏览历史…' : '正在加载更多浏览历史…'
)

onMounted(() => {
  void loadHistory()
})

async function loadHistory(): Promise<void> {
  const historyRequestId = ++latestHistoryRequestId
  const requestToken = beginRequest()
  appendError.value = false
  loadingMore.value = false

  try {
    const response = await portalWorkspaceApi.getMyHistory(
      createWorkspaceContentQuery(historyFilter.value, activePage.value, pageSize.value)
    )
    if (historyRequestId !== latestHistoryRequestId || !isLatestRequest(requestToken)) {
      return
    }

    activePage.value = Math.max(WORKSPACE_DEFAULT_PAGE, response.page)
    pageSize.value = Math.max(1, response.limit)
    historyItemsRaw.value = response.items
    total.value = response.total
    resolveSuccess(requestToken)
  } catch (error) {
    const { applied, shouldResetData } = resolveFailure(requestToken, error)
    if (!applied) {
      return
    }

    if (shouldResetData) {
      historyItemsRaw.value = []
      total.value = 0
    }
  }
}

function handleSectionPillClick(key: string): void {
  historyFilter.value = key as WorkspaceContentFilterKey
  activePage.value = WORKSPACE_DEFAULT_PAGE
  void loadHistory()
}

function appendHistoryItems(
  currentItems: WorkspaceHistoryItemResponse[],
  nextItems: WorkspaceHistoryItemResponse[]
): WorkspaceHistoryItemResponse[] {
  const itemMap = new Map(currentItems.map((item) => [item.id, item]))

  for (const item of nextItems) {
    itemMap.set(item.id, item)
  }

  return Array.from(itemMap.values())
}

async function loadMore(): Promise<void> {
  if (!canLoadMore.value || loadingMore.value || isRefreshing.value) {
    return
  }

  const historyRequestId = ++latestHistoryRequestId
  const nextPage = activePage.value + 1

  loadingMore.value = true
  appendError.value = false

  try {
    const response = await portalWorkspaceApi.getMyHistory(
      createWorkspaceContentQuery(historyFilter.value, nextPage, pageSize.value)
    )
    if (historyRequestId !== latestHistoryRequestId) {
      return
    }

    const currentLength = historyItemsRaw.value.length
    const mergedItems = appendHistoryItems(historyItemsRaw.value, response.items)
    const didAppendNewItems = mergedItems.length > currentLength

    activePage.value = Math.max(WORKSPACE_DEFAULT_PAGE, response.page)
    pageSize.value = Math.max(1, response.limit)
    historyItemsRaw.value = mergedItems
    total.value =
      didAppendNewItems || response.items.length > 0 ? response.total : mergedItems.length
  } catch {
    if (historyRequestId !== latestHistoryRequestId) {
      return
    }

    appendError.value = true
  } finally {
    loadingMore.value = false
  }
}

async function retryLoadMore(): Promise<void> {
  if (!appendError.value) {
    return
  }

  await loadMore()
}

function bindSentinelRef(element: Element | ComponentPublicInstance | null): void {
  sentinelRef.value = element instanceof HTMLElement ? element : null
}

function handleToolbarActionClick(key: string): void {
  if (key === 'clear-history') {
    void clearHistory()
  }
}

async function clearHistory(): Promise<void> {
  latestHistoryRequestId += 1
  pendingToolbarActionKey.value = 'clear-history'
  appendError.value = false
  loadingMore.value = false

  try {
    const response = await portalWorkspaceApi.clearMyHistory()
    historyItemsRaw.value = []
    activePage.value = WORKSPACE_DEFAULT_PAGE
    total.value = 0
    ElMessage.success(response.deletedCount > 0 ? '浏览历史已清空。' : '当前没有可清空的浏览历史。')
  } catch {
    // 消息提示由请求层统一处理
  } finally {
    pendingToolbarActionKey.value = ''
  }
}
</script>

<style scoped>
.workspace-history-stage {
  --workspace-accent-current: var(--workspace-accent, var(--workspace-history-accent));
  --workspace-accent-soft-current: var(
    --workspace-accent-soft,
    var(--workspace-history-accent-soft)
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
  --workspace-media-ring-current: var(--workspace-media-ring, var(--workspace-media-base-ring));
  --workspace-history-date-size: 22px;
  --workspace-history-date-line-height: 1.1;
  --workspace-history-title-size: 18px;
  --workspace-history-title-line-height: 1.34;
  --workspace-history-body-size: 13px;
  --workspace-history-body-line-height: 1.68;
  --workspace-history-meta-size: 12px;
  --workspace-history-meta-line-height: 1.35;
  --workspace-history-list-gap: var(--home-card-gap-base);
  --workspace-history-stack-gap: var(--home-card-gap-tight);
  --workspace-history-content-min-height: 80px;
}

.workspace-history-stage__body {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.workspace-history-stage__append {
  display: grid;
  justify-items: center;
  gap: 10px;
}

.workspace-history-stage__hint {
  margin: 0;
  color: color-mix(in srgb, var(--workspace-accent-current) 72%, var(--portal-muted));
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
  text-align: center;
}

.workspace-history-stage__footer-button {
  min-height: 36px;
  padding: 0 16px;
  border: 1px solid color-mix(in srgb, var(--workspace-accent-current) 18%, transparent);
  border-radius: 999px;
  background: color-mix(
    in srgb,
    var(--workspace-accent-current) 10%,
    var(--workspace-card-bg-current)
  );
  color: color-mix(in srgb, var(--workspace-accent-current) 84%, var(--portal-ink));
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    opacity 180ms ease;
}

.workspace-history-stage__footer-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--workspace-accent-current) 24%, transparent);
  box-shadow: 0 12px 24px color-mix(in srgb, var(--workspace-accent-current) 12%, transparent);
}

.workspace-history-stage__footer-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--portal-focus-ring);
}

.workspace-history-stage__footer-button:disabled {
  cursor: wait;
  opacity: 0.56;
  transform: none;
  box-shadow: none;
}

.workspace-history-stage__sentinel {
  width: 100%;
  height: 2px;
}

.workspace-history-groups {
  display: grid;
  gap: 24px;
  padding-top: var(--workspace-stage-top-space);
}

.workspace-history-group {
  display: grid;
  grid-template-columns: var(--workspace-history-group-columns, 112px minmax(0, 1fr));
  gap: 18px;
}

.workspace-history-group__head {
  position: var(--workspace-history-group-head-position, sticky);
  top: var(--portal-workspace-sidebar-top);
  align-self: start;
  display: grid;
  gap: 4px;
}

.workspace-history-group__date,
.workspace-history-group__count {
  margin: 0;
}

.workspace-history-group__date {
  color: var(--portal-ink-strong);
  font-size: var(--workspace-history-date-size);
  font-weight: 800;
  line-height: var(--workspace-history-date-line-height);
  letter-spacing: -0.03em;
}

.workspace-history-group__count {
  color: var(--portal-muted);
  font-size: var(--workspace-history-meta-size);
  font-weight: 600;
  line-height: var(--workspace-history-meta-line-height);
}

.workspace-history-group__track {
  position: relative;
  padding-left: var(--workspace-history-track-padding-left, 28px);
}

.workspace-history-group__track::before {
  content: '';
  position: absolute;
  display: var(--workspace-history-track-line-display, block);
  top: 8px;
  bottom: 8px;
  left: 10px;
  width: 1px;
  background: color-mix(in srgb, var(--workspace-accent-current) 20%, rgba(125, 160, 201, 0.2));
}

.workspace-history-list {
  display: grid;
  gap: var(--workspace-history-list-gap);
}

.workspace-history-card {
  position: relative;
  display: grid;
  grid-template-columns: var(
    --workspace-history-card-columns,
    116px minmax(0, 1fr) var(--workspace-action-column-width)
  );
  align-items: start;
  gap: var(--home-card-gap-base);
  padding: var(--workspace-card-padding);
  border: 1px solid var(--workspace-card-border-current);
  border-radius: 20px;
  background: var(--workspace-card-bg-current);
  box-shadow: var(--workspace-card-shadow-current);
}

.workspace-history-card::before {
  content: '';
  position: absolute;
  display: var(--workspace-history-card-marker-display, block);
  left: -27px;
  top: 28px;
  width: 12px;
  height: 12px;
  border: 3px solid var(--workspace-media-ring-current);
  border-radius: 999px;
  background: var(--workspace-accent-current);
  box-shadow: 0 5px 12px
    color-mix(in srgb, var(--workspace-accent-current) 8%, rgba(18, 41, 74, 0.08));
}

.workspace-history-card__thumb {
  position: relative;
  width: 116px;
  height: 80px;
  overflow: hidden;
  border: 1px solid var(--workspace-media-border-current);
  border-radius: 16px;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--workspace-accent-soft-current) 42%, transparent),
      transparent 78%
    ),
    var(--workspace-media-bg-current);
  box-shadow: var(--workspace-media-shadow-current);
}

.workspace-history-card__thumb.is-article {
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--home-business-article-accent-soft) 58%, transparent),
      transparent 80%
    ),
    var(--workspace-media-bg-current);
}

.workspace-history-card__thumb.is-topic {
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--home-business-topic-accent-soft) 58%, transparent),
      transparent 80%
    ),
    var(--workspace-media-bg-current);
}

.workspace-history-card__thumb.is-gallery {
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--home-business-gallery-accent-soft) 58%, transparent),
      transparent 80%
    ),
    var(--workspace-media-bg-current);
}

.workspace-history-card__thumb.is-book {
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--home-business-bookshelf-accent-soft) 58%, transparent),
      transparent 80%
    ),
    var(--workspace-media-bg-current);
}

.workspace-history-card__content {
  display: grid;
  align-content: start;
  gap: var(--workspace-history-stack-gap);
  min-height: var(--workspace-history-content-min-height);
  min-width: 0;
}

.workspace-history-card__header,
.workspace-history-card__footer {
  display: flex;
  gap: var(--home-card-gap-tight);
  min-width: 0;
}

.workspace-history-card__header {
  align-items: center;
}

.workspace-history-card__footer {
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--home-card-gap-base);
  padding-top: 10px;
  border-top: 1px dashed var(--workspace-meta-divider);
}

.workspace-history-card__meta,
.workspace-history-card__metrics,
.workspace-history-skeleton__meta,
.workspace-history-skeleton__metrics {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--home-card-gap-tight);
  min-width: 0;
}

.workspace-history-card__meta,
.workspace-history-skeleton__meta {
  flex: 1 1 auto;
}

.workspace-history-card__metrics,
.workspace-history-skeleton__metrics {
  flex: 0 0 auto;
  justify-content: flex-end;
}

.workspace-history-card__title {
  margin: 0;
  min-width: 0;
  color: var(--home-ink);
  font-size: var(--workspace-history-title-size);
  font-weight: 800;
  line-height: var(--workspace-history-title-line-height);
}

.workspace-history-card__title-link {
  display: block;
  overflow: hidden;
  color: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-history-card__title-link:hover {
  text-decoration: underline;
}

.workspace-history-card__summary,
.workspace-history-card__time {
  margin: 0;
}

.workspace-history-card__summary {
  min-width: 0;
  overflow: hidden;
  color: color-mix(in srgb, var(--home-muted) 88%, transparent);
  font-size: var(--workspace-history-body-size);
  line-height: var(--workspace-history-body-line-height);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-history-card__aside {
  display: grid;
  align-content: start;
  gap: var(--workspace-action-stack-gap);
  justify-items: var(--workspace-history-aside-justify-items, stretch);
  min-height: var(--workspace-action-column-min-height);
}

.workspace-history-card__aside .workspace-action-button {
  box-sizing: border-box;
  width: 100%;
  height: var(--workspace-action-button-height);
  min-height: var(--workspace-action-button-height);
}

.workspace-history-card__meta,
.workspace-history-card__metrics,
.workspace-history-card__time {
  color: color-mix(in srgb, var(--home-muted) 84%, var(--home-detail-glass-ink) 16%);
  font-size: var(--workspace-history-meta-size);
  font-weight: 600;
  line-height: var(--workspace-history-meta-line-height);
}

.workspace-history-card__time {
  justify-self: end;
}

.workspace-history-card__meta {
  overflow: hidden;
  flex-wrap: nowrap;
}

.workspace-history-card__meta-item,
.workspace-history-card__metric {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.workspace-history-card__meta-item {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-history-card__meta-item:not(:last-child) {
  padding-right: var(--workspace-meta-divider-gap);
}

.workspace-history-card__meta-item:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 0;
  width: 1px;
  height: var(--workspace-meta-divider-height);
  background: var(--workspace-meta-divider);
  transform: translateY(-50%);
}

.workspace-history-card__metric {
  gap: 5px;
}

.workspace-history-card__metric + .workspace-history-card__metric {
  padding-left: var(--workspace-meta-divider-gap);
}

.workspace-history-card__metric + .workspace-history-card__metric::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 1px;
  height: var(--workspace-meta-divider-height);
  background: var(--workspace-meta-divider);
  transform: translateY(-50%);
}

.workspace-history-card__metric-icon {
  flex: 0 0 auto;
  color: color-mix(in srgb, var(--workspace-accent-current) 82%, var(--home-ink) 18%);
}

.workspace-history-groups--skeleton .workspace-history-card {
  pointer-events: none;
}

.workspace-history-skeleton__head,
.workspace-history-skeleton__content,
.workspace-history-skeleton__aside {
  display: grid;
}

.workspace-history-skeleton__head,
.workspace-history-skeleton__content {
  gap: var(--workspace-history-stack-gap);
}

.workspace-history-skeleton__content {
  align-content: start;
  min-height: var(--workspace-history-content-min-height);
}

.workspace-history-skeleton__aside {
  align-content: start;
  gap: var(--workspace-action-stack-gap);
  justify-items: var(--workspace-history-aside-justify-items, stretch);
  min-height: var(--workspace-action-column-min-height);
}

.workspace-history-skeleton__meta {
  flex-wrap: nowrap;
  overflow: hidden;
}

.workspace-history-skeleton__line,
.workspace-history-skeleton__pill,
.workspace-history-skeleton__button,
.workspace-history-skeleton__block {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--home-skeleton-border);
  background: linear-gradient(
    135deg,
    var(--home-skeleton-block-strong),
    var(--home-skeleton-block)
  );
}

.workspace-history-skeleton__line::after,
.workspace-history-skeleton__pill::after,
.workspace-history-skeleton__button::after,
.workspace-history-skeleton__block::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: var(--home-skeleton-shimmer);
  animation: home-skeleton-wave 2.4s ease-in-out infinite;
}

.workspace-history-skeleton__block,
.workspace-history-skeleton__pill,
.workspace-history-skeleton__button {
  border-radius: 999px;
}

.workspace-history-skeleton__button {
  box-sizing: border-box;
  width: 100%;
  height: var(--workspace-action-button-height);
  min-height: var(--workspace-action-button-height);
  padding: 0;
}

.workspace-history-skeleton__block--thumb {
  border-radius: 16px;
}

.workspace-history-skeleton__line {
  box-sizing: border-box;
  display: block;
  border-radius: 999px;
}

.workspace-history-skeleton__line--date {
  width: 72px;
  height: calc(var(--workspace-history-date-size) * var(--workspace-history-date-line-height));
}

.workspace-history-skeleton__line--count {
  width: 56px;
  height: calc(var(--workspace-history-meta-size) * var(--workspace-history-meta-line-height));
}

.workspace-history-skeleton__line--title {
  width: 84%;
  height: calc(var(--workspace-history-title-size) * var(--workspace-history-title-line-height));
}

.workspace-history-skeleton__line--summary {
  width: 100%;
  height: calc(var(--workspace-history-body-size) * var(--workspace-history-body-line-height));
}

.workspace-history-skeleton__line--meta {
  position: relative;
  flex: 0 0 auto;
  width: 60px;
  height: calc(var(--workspace-history-meta-size) * var(--workspace-history-meta-line-height));
}

.workspace-history-skeleton__line--meta:not(:last-child) {
  padding-right: var(--workspace-meta-divider-gap);
}

.workspace-history-skeleton__line--meta:not(:last-child)::before {
  content: '';
  position: absolute;
  top: 50%;
  right: 0;
  width: 1px;
  height: var(--workspace-meta-divider-height);
  background: var(--workspace-meta-divider);
  transform: translateY(-50%);
}

.workspace-history-skeleton__line--time {
  width: 52px;
  height: calc(var(--workspace-history-meta-size) * var(--workspace-history-meta-line-height));
  justify-self: end;
}

.workspace-history-skeleton__pill {
  width: 52px;
  height: 24px;
}

.workspace-history-skeleton__pill--metric {
  box-sizing: border-box;
  flex: 0 0 auto;
  width: 42px;
  height: calc(var(--workspace-history-meta-size) * var(--workspace-history-meta-line-height));
  min-height: calc(var(--workspace-history-meta-size) * var(--workspace-history-meta-line-height));
}
</style>
