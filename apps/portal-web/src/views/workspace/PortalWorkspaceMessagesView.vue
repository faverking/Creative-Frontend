<template>
  <portal-workspace-page-shell
    page-key="messages"
    :section-pills="sectionPills"
    :title="title"
    :toolbar-actions="toolbarActions"
    @section-pill-click="handleSectionPillClick"
    @toolbar-action-click="handleToolbarActionClick"
  >
    <portal-request-boundary
      as="section"
      class="workspace-message-stage"
      :mode="stageBoundaryMode"
      :error-code="errorCode"
      primary-label="重试"
      @primary="loadMessages"
    >
      <template #loading>
        <div class="workspace-message-list workspace-message-list--skeleton" aria-hidden="true">
          <article
            v-for="index in 3"
            :key="`message-skeleton-${index}`"
            class="workspace-message-card"
          >
            <div class="workspace-message-card__avatar-rail">
              <div
                class="workspace-message-card__avatar workspace-message-skeleton__block workspace-message-skeleton__block--avatar"
              />
            </div>

            <div class="workspace-message-card__body">
              <div class="workspace-message-card__top">
                <div class="workspace-message-card__headline workspace-message-skeleton__headline">
                  <span class="workspace-message-skeleton__pill" />
                  <span
                    class="workspace-message-skeleton__line workspace-message-skeleton__line--headline"
                  />
                </div>
                <span
                  class="workspace-message-skeleton__line workspace-message-skeleton__line--time"
                />
              </div>

              <div class="workspace-message-card__context workspace-message-skeleton__context">
                <span
                  class="workspace-message-skeleton__line workspace-message-skeleton__line--label"
                />
                <span
                  class="workspace-message-skeleton__line workspace-message-skeleton__line--body"
                />
                <span
                  class="workspace-message-skeleton__line workspace-message-skeleton__line--body-short"
                />
              </div>

              <div class="workspace-message-card__reference">
                <div
                  class="workspace-message-card__reference-copy workspace-message-skeleton__reference-copy"
                >
                  <div class="workspace-message-card__reference-header">
                    <span class="workspace-message-skeleton__pill" />
                  </div>
                  <h2 class="workspace-message-card__reference-title">
                    <span
                      class="workspace-message-skeleton__line workspace-message-skeleton__line--reference-title"
                    />
                  </h2>
                </div>
                <div class="workspace-message-card__actions workspace-message-skeleton__actions">
                  <span class="workspace-message-skeleton__button" />
                  <span class="workspace-message-skeleton__text-action" />
                </div>
              </div>
            </div>
          </article>
        </div>
      </template>

      <div :aria-busy="isRefreshing ? 'true' : 'false'">
        <div v-if="messageItems.length > 0" class="workspace-message-list">
          <article
            v-for="item in messageItems"
            :key="item.id"
            class="workspace-message-card"
            :class="{ 'is-unread': item.unread }"
          >
            <div class="workspace-message-card__avatar-rail">
              <div class="workspace-message-card__avatar">
                <img
                  v-if="item.actorAvatarUrl"
                  class="workspace-message-card__avatar-image"
                  :src="item.actorAvatarUrl"
                  :alt="`${item.actor} 的头像`"
                />
                <span v-else>{{ item.actorInitial }}</span>
              </div>
              <span v-if="item.unread" class="workspace-message-card__dot" aria-hidden="true" />
            </div>

            <div class="workspace-message-card__body">
              <div class="workspace-message-card__top">
                <div class="workspace-message-card__headline">
                  <span class="workspace-badge" :class="`workspace-badge--${item.kind}`">
                    {{ item.kindLabel }}
                  </span>
                  <p class="workspace-message-card__actionline">
                    <strong>{{ item.actor }}</strong>
                    {{ item.action }}
                  </p>
                </div>

                <time class="workspace-message-card__time">{{ item.time }}</time>
              </div>

              <div
                v-if="item.context"
                class="workspace-message-card__context workspace-message-card__context--reply"
              >
                <p class="workspace-message-card__context-text">
                  <span class="workspace-message-card__context-label">我的原评论：</span>
                  {{ item.context }}
                </p>
              </div>

              <div class="workspace-message-card__context">
                <p class="workspace-message-card__context-text">
                  <span class="workspace-message-card__context-label">{{ item.quoteLabel }}：</span>
                  {{ item.quote }}
                </p>
              </div>

              <div class="workspace-message-card__reference">
                <div class="workspace-message-card__reference-copy">
                  <div class="workspace-message-card__reference-header">
                    <span
                      class="workspace-badge"
                      :class="`workspace-badge--${item.reference.business}`"
                    >
                      {{ item.reference.label }}
                    </span>
                  </div>
                  <h2 class="workspace-message-card__reference-title">
                    <router-link
                      :to="item.reference.to"
                      class="workspace-message-card__reference-title-link"
                    >
                      {{ item.reference.title }}
                    </router-link>
                  </h2>
                </div>

                <div class="workspace-message-card__actions">
                  <button
                    v-if="item.canReply"
                    type="button"
                    class="workspace-action-button workspace-action-button--primary"
                    :disabled="Boolean(pendingReplyMessageId)"
                    @click="handleOpenReplyComposer(item)"
                  >
                    {{
                      pendingReplyMessageId === item.id
                        ? '发送中...'
                        : activeReplyMessageId === item.id
                          ? '收起回复'
                          : '回复'
                    }}
                  </button>
                  <button
                    v-if="item.canMarkRead"
                    type="button"
                    class="workspace-message-card__text-action"
                    :disabled="
                      pendingNotificationId === item.id || pendingReplyMessageId === item.id
                    "
                    @click="handleMarkRead(item.id)"
                  >
                    {{ pendingNotificationId === item.id ? '处理中...' : '标为已读' }}
                  </button>
                  <span v-else class="workspace-action-note">已读</span>
                </div>
              </div>

              <div
                v-if="activeReplyMessageId === item.id && item.canReply"
                class="workspace-message-card__reply-box"
              >
                <p class="workspace-message-card__reply-title">{{ item.replyLabel }}</p>
                <textarea
                  class="workspace-message-card__reply-textarea"
                  :disabled="pendingReplyMessageId === item.id"
                  :placeholder="item.replyLabel"
                  :value="replyDraft"
                  @input="handleReplyDraftInput"
                />
                <div class="workspace-message-card__reply-actions">
                  <button
                    type="button"
                    class="workspace-action-button"
                    :disabled="pendingReplyMessageId === item.id"
                    @click="handleCloseReplyComposer(item.id)"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    class="workspace-action-button workspace-action-button--primary"
                    :disabled="pendingReplyMessageId === item.id || replyDraft.trim().length === 0"
                    @click="handleMessageReply(item)"
                  >
                    {{ pendingReplyMessageId === item.id ? '发送中...' : '发送回复' }}
                  </button>
                </div>
              </div>
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

import type { WorkspaceNotificationItemResponse } from '@/api'
import { portalPublicCommentsApi, portalWorkspaceApi } from '@/api'
import {
  WORKSPACE_DEFAULT_PAGE,
  WORKSPACE_PAGE_SIZE,
  WORKSPACE_MESSAGE_FILTER_OPTIONS,
  type WorkspaceMessageFilterKey,
  type WorkspacePageOption,
  type WorkspaceToolbarAction
} from '@/constants/workspace'
import {
  createWorkspaceNotificationsQuery,
  resolveWorkspaceAvatarUrl,
  resolveWorkspaceActionLocation,
  resolveWorkspaceBusinessKey,
  resolveWorkspaceDetailLocation,
  resolveWorkspaceNotificationAction,
  resolveWorkspaceNotificationExcerptLabel,
  resolveWorkspaceNotificationTimeLabel,
  resolveWorkspaceTargetLabel
} from '@/utils/workspace'

interface WorkspaceMessageCard {
  action: string
  actor: string
  actorAvatarUrl: string
  actorInitial: string
  canMarkRead: boolean
  canReply: boolean
  commentId: string
  context: string
  id: string
  kind: 'comment' | 'reply'
  kindLabel: string
  mentionUserId?: string
  quote: string
  quoteLabel: string
  replyLabel: string
  reference: {
    business: 'article' | 'book' | 'gallery' | 'topic'
    label: string
    title: string
    to: RouteLocationRaw
  }
  time: string
  unread: boolean
}

const title = '消息中心'
const messageFilter = ref<WorkspaceMessageFilterKey>('all')
const messageItemsRaw = ref<WorkspaceNotificationItemResponse[]>([])
const activePage = ref(WORKSPACE_DEFAULT_PAGE)
const pageSize = ref(WORKSPACE_PAGE_SIZE)
const total = ref(0)
const unreadTotal = ref(0)
const pendingToolbarActionKey = ref('')
const pendingNotificationId = ref('')
const activeReplyMessageId = ref('')
const replyDraft = ref('')
const pendingReplyMessageId = ref('')
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
  WORKSPACE_MESSAGE_FILTER_OPTIONS.map((option) => ({
    key: option.key,
    label: option.label,
    active: option.key === messageFilter.value
  }))
)

const toolbarActions = computed<WorkspaceToolbarAction[]>(() => [
  {
    key: 'mark-all-read',
    label: unreadTotal.value > 0 ? '全部已读' : '暂无未读',
    tone: 'primary',
    disabled: unreadTotal.value === 0,
    loading: pendingToolbarActionKey.value === 'mark-all-read',
    confirm: {
      title: '确认将全部未读消息标记为已读？',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    }
  }
])

const messageItems = computed<WorkspaceMessageCard[]>(() =>
  messageItemsRaw.value.map((item) => {
    const business = resolveWorkspaceBusinessKey(item.target.type)
    const primaryActionTo =
      resolveWorkspaceActionLocation(item.primaryAction) ??
      resolveWorkspaceDetailLocation(item.target.type, item.target.id)
    const commentId = item.commentId?.trim() || ''
    const actorName = item.actor.name.trim()
    const mentionUserId = item.kind === 'reply' ? item.actor.id.trim() || undefined : undefined

    return {
      id: item.id,
      unread: item.unread,
      actor: actorName,
      actorAvatarUrl: resolveWorkspaceAvatarUrl(item.actor.avatarUrl),
      actorInitial: actorName.slice(0, 1) || '访',
      kind: item.kind,
      kindLabel: item.kind === 'reply' ? '回复' : '评论',
      action: resolveWorkspaceNotificationAction(item.kind, item.target.type),
      time: resolveWorkspaceNotificationTimeLabel(item.createdAt),
      commentId,
      canReply: Boolean(commentId),
      context: item.context?.trim() || '',
      quoteLabel: resolveWorkspaceNotificationExcerptLabel(item.kind),
      quote: item.excerpt,
      mentionUserId,
      replyLabel: item.kind === 'reply' && actorName ? `回复 @${actorName}` : '回复这条评论',
      reference: {
        business,
        label: resolveWorkspaceTargetLabel(item.target.type),
        title: item.target.title,
        to: primaryActionTo
      },
      canMarkRead: Boolean(
        item.unread &&
        item.secondaryAction?.type === 'mark-read' &&
        item.secondaryAction.notificationId === item.id
      )
    }
  })
)
const stageBoundaryMode = computed(() =>
  boundaryMode.value === 'ready' && messageItems.value.length === 0 ? 'empty' : boundaryMode.value
)

onMounted(() => {
  void loadMessages()
})

async function loadMessages(): Promise<void> {
  const requestToken = beginRequest()

  try {
    const response = await portalWorkspaceApi.getMyNotifications(
      createWorkspaceNotificationsQuery(messageFilter.value, activePage.value, pageSize.value)
    )
    if (!isLatestRequest(requestToken)) {
      return
    }

    activePage.value = Math.max(WORKSPACE_DEFAULT_PAGE, response.page)
    pageSize.value = Math.max(1, response.limit)
    messageItemsRaw.value = response.items
    total.value = response.total
    unreadTotal.value = response.unreadTotal
    resolveSuccess(requestToken)
  } catch (error) {
    const { applied, shouldResetData } = resolveFailure(requestToken, error)
    if (!applied) {
      return
    }

    if (shouldResetData) {
      messageItemsRaw.value = []
      total.value = 0
      unreadTotal.value = 0
    }
  }
}

function handleSectionPillClick(key: string): void {
  resetReplyComposer()
  messageFilter.value = key as WorkspaceMessageFilterKey
  activePage.value = WORKSPACE_DEFAULT_PAGE
  void loadMessages()
}

function handlePageChange(page: number): void {
  if (page === activePage.value) {
    return
  }

  resetReplyComposer()
  activePage.value = page
  void loadMessages()
}

function handleToolbarActionClick(key: string): void {
  if (key === 'mark-all-read') {
    void markAllNotificationsRead()
  }
}

function resetReplyComposer(): void {
  activeReplyMessageId.value = ''
  replyDraft.value = ''
}

function handleOpenReplyComposer(item: WorkspaceMessageCard): void {
  if (!item.canReply || pendingReplyMessageId.value) {
    return
  }

  if (activeReplyMessageId.value === item.id) {
    handleCloseReplyComposer(item.id)
    return
  }

  activeReplyMessageId.value = item.id
  replyDraft.value = ''
}

function handleCloseReplyComposer(messageId?: string): void {
  if (messageId && activeReplyMessageId.value !== messageId) {
    return
  }

  if (pendingReplyMessageId.value === activeReplyMessageId.value) {
    return
  }

  resetReplyComposer()
}

function handleReplyDraftInput(event: Event): void {
  replyDraft.value = (event.target as HTMLTextAreaElement).value
}

async function handleMessageReply(item: WorkspaceMessageCard): Promise<void> {
  if (
    !item.canReply ||
    activeReplyMessageId.value !== item.id ||
    pendingReplyMessageId.value === item.id
  ) {
    return
  }

  const content = replyDraft.value.trim()
  if (!content) {
    return
  }

  pendingReplyMessageId.value = item.id

  try {
    await portalPublicCommentsApi.replyComment(item.commentId, {
      content,
      mentionUserId: item.mentionUserId
    })
    ElMessage.success('回复已发送。')
    resetReplyComposer()
  } catch {
    // 消息提示由请求层统一处理
  } finally {
    pendingReplyMessageId.value = ''
  }
}

async function markAllNotificationsRead(): Promise<void> {
  pendingToolbarActionKey.value = 'mark-all-read'

  try {
    const response = await portalWorkspaceApi.markAllNotificationsRead()

    if (response.updatedCount > 0) {
      ElMessage.success('全部消息已标记为已读。')
    }

    if (messageFilter.value === 'unread') {
      resetReplyComposer()
      messageItemsRaw.value = []
      total.value = 0
      unreadTotal.value = 0
      activePage.value = WORKSPACE_DEFAULT_PAGE
      return
    }

    messageItemsRaw.value = messageItemsRaw.value.map((item) => ({
      ...item,
      unread: false,
      secondaryAction: undefined
    }))
    unreadTotal.value = 0
  } catch {
    // 消息提示由请求层统一处理
  } finally {
    pendingToolbarActionKey.value = ''
  }
}

async function handleMarkRead(notificationId: string): Promise<void> {
  if (pendingNotificationId.value) {
    return
  }

  const currentItem = messageItemsRaw.value.find((item) => item.id === notificationId)
  if (!currentItem?.unread) {
    return
  }

  pendingNotificationId.value = notificationId

  try {
    await portalWorkspaceApi.markNotificationRead(notificationId)

    unreadTotal.value = Math.max(0, unreadTotal.value - 1)

    if (messageFilter.value === 'unread') {
      const nextTotal = Math.max(0, total.value - 1)
      const nextTotalPages = Math.max(WORKSPACE_DEFAULT_PAGE, Math.ceil(nextTotal / pageSize.value))

      if (activeReplyMessageId.value === notificationId) {
        resetReplyComposer()
      }

      if (
        messageItemsRaw.value.length === 1 &&
        nextTotal > 0 &&
        activePage.value > nextTotalPages
      ) {
        total.value = nextTotal
        activePage.value = nextTotalPages
        await loadMessages()
        return
      }

      messageItemsRaw.value = messageItemsRaw.value.filter((item) => item.id !== notificationId)
      total.value = nextTotal
      if (nextTotal === 0) {
        activePage.value = WORKSPACE_DEFAULT_PAGE
      }
      return
    }

    messageItemsRaw.value = messageItemsRaw.value.map((item) =>
      item.id === notificationId
        ? {
            ...item,
            unread: false,
            secondaryAction: undefined
          }
        : item
    )
  } catch {
    // 消息提示由请求层统一处理
  } finally {
    pendingNotificationId.value = ''
  }
}
</script>

<style scoped>
.workspace-message-list {
  --workspace-accent-current: var(--workspace-accent, var(--workspace-messages-accent));
  --workspace-accent-soft-current: var(
    --workspace-accent-soft,
    var(--workspace-messages-accent-soft)
  );
  --workspace-card-bg-current: var(--workspace-card-bg, var(--workspace-card-base-bg));
  --workspace-card-border-current: var(--workspace-card-border, var(--workspace-card-base-border));
  --workspace-card-shadow-current: var(--workspace-card-shadow, var(--workspace-card-base-shadow));
  --workspace-card-emphasis-bg-current: var(
    --workspace-card-emphasis-bg,
    var(--workspace-card-bg-current)
  );
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
  --workspace-message-actionline-size: 13px;
  --workspace-message-actionline-line-height: 1.65;
  --workspace-message-title-size: 15px;
  --workspace-message-title-line-height: 1.34;
  --workspace-message-body-size: 13px;
  --workspace-message-body-line-height: 1.68;
  --workspace-message-meta-size: 12px;
  --workspace-message-meta-line-height: 1.35;
  --workspace-message-list-gap: var(--home-card-gap-base);
  --workspace-message-stack-gap: 10px;
  --workspace-message-inline-gap: var(--home-card-gap-tight);
}

.workspace-message-list {
  display: grid;
  gap: var(--workspace-message-list-gap);
  padding-top: var(--workspace-stage-top-space);
}

.workspace-message-card {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: var(--home-card-gap-base);
  padding: var(--workspace-card-padding);
  border: 1px solid var(--workspace-card-border-current);
  border-radius: var(--workspace-card-radius);
  background: var(--workspace-card-bg-current);
  box-shadow: var(--workspace-card-shadow-current);
}

.workspace-message-card.is-unread {
  border-color: color-mix(in srgb, var(--workspace-accent-current) 18%, transparent);
  background: var(--workspace-card-emphasis-bg-current);
}

.workspace-message-card__avatar-rail {
  position: relative;
}

.workspace-message-card__avatar {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border: 1px solid var(--workspace-media-border-current);
  border-radius: var(--workspace-media-radius);
  background: var(--workspace-media-bg-current);
  color: var(--portal-ink-strong);
  font-size: 15px;
  font-weight: 700;
  box-shadow: var(--workspace-media-shadow-current);
}

.workspace-message-card__avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.workspace-message-card__dot {
  position: absolute;
  top: -2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border: 2px solid var(--workspace-media-ring-current);
  border-radius: 999px;
  background: var(--workspace-accent-current);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--workspace-accent-current) 10%, transparent);
}

.workspace-message-card__body {
  display: grid;
  gap: var(--workspace-message-stack-gap);
  min-width: 0;
}

.workspace-message-card__top {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.workspace-message-card__headline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.workspace-message-card__actionline {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  color: var(--portal-ink-strong);
  font-size: var(--workspace-message-actionline-size);
  line-height: var(--workspace-message-actionline-line-height);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-message-card__actionline strong {
  font-weight: 700;
}

.workspace-message-card__time {
  color: var(--portal-muted);
  font-size: var(--workspace-message-meta-size);
  font-weight: 600;
  line-height: var(--workspace-message-meta-line-height);
  white-space: nowrap;
}

.workspace-message-card__context {
  padding-left: 14px;
  border-left: 2px solid color-mix(in srgb, var(--workspace-accent-current) 16%, transparent);
  color: var(--portal-ink);
  font-size: var(--workspace-message-body-size);
  line-height: var(--workspace-message-body-line-height);
}

.workspace-message-card__context--reply {
  border-left-color: color-mix(in srgb, var(--workspace-accent-current) 26%, transparent);
}

.workspace-message-card__context-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.workspace-message-card__context-label {
  color: var(--portal-muted);
  font-size: var(--workspace-message-meta-size);
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: var(--workspace-message-meta-line-height);
}

.workspace-message-card__reference {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding-left: 14px;
  border-left: 2px solid color-mix(in srgb, var(--workspace-card-border-current) 92%, transparent);
}

.workspace-message-card__reference-copy {
  flex: 1 1 240px;
  display: grid;
  align-content: start;
  gap: 6px;
  min-width: 0;
}

.workspace-message-card__reference-header {
  display: flex;
  gap: var(--home-card-gap-tight);
  min-width: 0;
  align-items: center;
}

.workspace-message-card__reference-title {
  margin: 0;
  min-width: 0;
  color: var(--home-ink);
  font-size: var(--workspace-message-title-size);
  font-weight: 700;
  line-height: var(--workspace-message-title-line-height);
}

.workspace-message-card__reference-title-link {
  display: block;
  overflow: hidden;
  color: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-message-card__reference-title-link:hover {
  text-decoration: underline;
}

.workspace-message-card__actions {
  flex: 0 1 auto;
  display: grid;
  align-content: center;
  gap: 8px;
  justify-items: stretch;
  min-width: max-content;
}

.workspace-message-card__actions .workspace-action-button,
.workspace-message-skeleton__button {
  box-sizing: border-box;
  width: auto;
  min-width: 96px;
  height: var(--workspace-action-button-height);
  min-height: var(--workspace-action-button-height);
}

.workspace-message-card__text-action,
.workspace-message-skeleton__text-action {
  min-height: 20px;
  color: color-mix(in srgb, var(--workspace-accent-current) 82%, var(--portal-ink));
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
}

.workspace-message-card__text-action {
  appearance: none;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition:
    color 180ms ease,
    opacity 180ms ease;
}

.workspace-message-card__text-action:hover:not(:disabled) {
  color: color-mix(in srgb, var(--workspace-accent-current) 92%, var(--portal-ink));
}

.workspace-message-card__text-action:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--portal-focus-ring);
  border-radius: 999px;
}

.workspace-message-card__text-action:disabled {
  cursor: default;
  opacity: 0.52;
}

.workspace-message-card__actions .workspace-action-note {
  width: auto;
  text-align: center;
}

.workspace-message-card__reply-box {
  display: grid;
  gap: 8px;
  padding-left: 14px;
  border-left: 2px solid color-mix(in srgb, var(--workspace-accent-current) 18%, transparent);
}

.workspace-message-card__reply-title {
  margin: 0;
  color: var(--portal-muted);
  font-size: var(--workspace-message-meta-size);
  font-weight: 700;
  line-height: var(--workspace-message-meta-line-height);
}

.workspace-message-card__reply-textarea {
  display: block;
  width: 100%;
  min-height: 76px;
  padding: 9px 12px;
  box-sizing: border-box;
  border: 1px solid color-mix(in srgb, var(--workspace-card-border-current) 92%, transparent);
  border-radius: 16px;
  background: color-mix(
    in srgb,
    var(--workspace-accent-soft-current) 34%,
    var(--workspace-card-bg-current)
  );
  color: var(--portal-ink-strong);
  font: inherit;
  font-size: var(--workspace-message-body-size);
  line-height: var(--workspace-message-body-line-height);
  resize: vertical;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    opacity 180ms ease;
}

.workspace-message-card__reply-textarea::placeholder {
  color: color-mix(in srgb, var(--portal-muted) 92%, transparent);
}

.workspace-message-card__reply-textarea:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--workspace-accent-current) 18%, transparent);
}

.workspace-message-card__reply-textarea:focus-visible {
  outline: none;
  border-color: color-mix(in srgb, var(--workspace-accent-current) 24%, transparent);
  box-shadow: 0 0 0 3px var(--portal-focus-ring);
}

.workspace-message-card__reply-textarea:disabled {
  cursor: default;
  opacity: 0.72;
}

.workspace-message-card__reply-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.workspace-message-card__reply-actions .workspace-action-button {
  min-width: 88px;
}

.workspace-message-list--skeleton .workspace-message-card {
  pointer-events: none;
}

.workspace-message-skeleton__headline,
.workspace-message-skeleton__reference-copy,
.workspace-message-skeleton__context {
  display: grid;
  gap: var(--workspace-message-inline-gap);
}

.workspace-message-skeleton__reference-copy {
  align-content: start;
}

.workspace-message-skeleton__actions {
  flex: 0 1 auto;
  display: grid;
  align-content: center;
  gap: var(--workspace-action-stack-gap);
  justify-items: stretch;
  min-height: auto;
  min-width: max-content;
}

.workspace-message-skeleton__line,
.workspace-message-skeleton__pill,
.workspace-message-skeleton__button,
.workspace-message-skeleton__text-action,
.workspace-message-skeleton__block {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--home-skeleton-border);
  background: linear-gradient(
    135deg,
    var(--home-skeleton-block-strong),
    var(--home-skeleton-block)
  );
}

.workspace-message-skeleton__line::after,
.workspace-message-skeleton__pill::after,
.workspace-message-skeleton__button::after,
.workspace-message-skeleton__text-action::after,
.workspace-message-skeleton__block::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: var(--home-skeleton-shimmer);
  animation: home-skeleton-wave 2.4s ease-in-out infinite;
}

.workspace-message-skeleton__block,
.workspace-message-skeleton__pill,
.workspace-message-skeleton__text-action,
.workspace-message-skeleton__button {
  border-radius: 999px;
}

.workspace-message-skeleton__block--avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--workspace-media-radius);
}

.workspace-message-skeleton__line {
  box-sizing: border-box;
  display: block;
  border-radius: 999px;
}

.workspace-message-skeleton__line--headline {
  width: 240px;
  height: calc(
    var(--workspace-message-actionline-size) * var(--workspace-message-actionline-line-height)
  );
}

.workspace-message-skeleton__line--time {
  width: 84px;
  height: calc(var(--workspace-message-meta-size) * var(--workspace-message-meta-line-height));
}

.workspace-message-skeleton__line--label {
  width: 76px;
  height: calc(var(--workspace-message-meta-size) * var(--workspace-message-meta-line-height));
}

.workspace-message-skeleton__line--body {
  width: 100%;
  height: calc(var(--workspace-message-body-size) * var(--workspace-message-body-line-height));
}

.workspace-message-skeleton__line--body-short {
  width: 68%;
  height: calc(var(--workspace-message-body-size) * var(--workspace-message-body-line-height));
}

.workspace-message-skeleton__line--reference-title {
  width: 92%;
  height: calc(var(--workspace-message-title-size) * var(--workspace-message-title-line-height));
}

.workspace-message-skeleton__pill {
  width: 52px;
  height: 22px;
}

.workspace-message-skeleton__button {
  width: 100%;
  padding: 0;
}

.workspace-message-skeleton__text-action {
  position: relative;
  display: block;
  width: 56px;
  justify-self: center;
}
</style>
