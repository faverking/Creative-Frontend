<template>
  <portal-request-boundary
    :id="anchorId"
    as="section"
    class="public-detail-comments-section"
    :class="`public-detail-comments-section--${tone}`"
    :debug-skeleton-toggle="false"
    :error-code="errorCode"
    :mode="boundaryMode"
    primary-label="重试"
    @primary="handleRetry"
  >
    <template #loading>
      <div
        class="public-detail-comments-section__stage public-detail-comments-section__stage--skeleton"
        aria-hidden="true"
      >
        <div
          class="public-detail-comments-section__header public-detail-comments-section__header--skeleton"
        >
          <span
            class="public-detail-comments-section__skeleton-pill public-detail-comments-section__skeleton-pill--heading"
          />
          <span
            class="public-detail-comments-section__skeleton-pill public-detail-comments-section__skeleton-pill--summary"
          />
        </div>

        <div class="public-detail-comments-section__composer-skeleton">
          <span
            class="public-detail-comments-section__skeleton-block public-detail-comments-section__skeleton-block--composer"
          />
          <div class="public-detail-comments-section__composer-skeleton-footer">
            <span
              class="public-detail-comments-section__skeleton-line public-detail-comments-section__skeleton-line--hint"
            />
            <span
              class="public-detail-comments-section__skeleton-pill public-detail-comments-section__skeleton-pill--button"
            />
          </div>
        </div>

        <article
          v-for="(card, index) in commentSkeletonCards"
          :key="`comment-skeleton-${index}`"
          class="public-detail-comments-section__card-skeleton"
        >
          <div class="public-detail-comments-section__card-skeleton-head">
            <span
              class="public-detail-comments-section__skeleton-block public-detail-comments-section__skeleton-block--avatar"
            />
            <div class="public-detail-comments-section__card-skeleton-copy">
              <div class="public-detail-comments-section__card-skeleton-meta">
                <span
                  class="public-detail-comments-section__skeleton-line public-detail-comments-section__skeleton-line--author"
                />
                <span
                  class="public-detail-comments-section__skeleton-line public-detail-comments-section__skeleton-line--time"
                />
              </div>
              <span
                v-for="width in card.bodyWidths"
                :key="`${index}-body-${width}`"
                class="public-detail-comments-section__skeleton-line"
                :style="{ width }"
              />
            </div>
          </div>

          <div class="public-detail-comments-section__card-skeleton-footer">
            <span
              class="public-detail-comments-section__skeleton-line public-detail-comments-section__skeleton-line--count"
            />
            <span
              class="public-detail-comments-section__skeleton-line public-detail-comments-section__skeleton-line--action"
            />
          </div>

          <div class="public-detail-comments-section__card-skeleton-replies">
            <article
              v-for="(reply, replyIndex) in card.replyRows"
              :key="`${index}-reply-${replyIndex}`"
              class="public-detail-comments-section__reply-skeleton"
            >
              <div class="public-detail-comments-section__reply-skeleton-copy">
                <div class="public-detail-comments-section__reply-skeleton-meta">
                  <span
                    class="public-detail-comments-section__skeleton-line public-detail-comments-section__skeleton-line--reply-author"
                  />
                  <span
                    class="public-detail-comments-section__skeleton-line public-detail-comments-section__skeleton-line--reply-time"
                  />
                </div>
                <span
                  v-for="width in reply.bodyWidths"
                  :key="`${index}-reply-${replyIndex}-${width}`"
                  class="public-detail-comments-section__skeleton-line public-detail-comments-section__skeleton-line--reply"
                  :style="{ width }"
                />
              </div>
              <span
                class="public-detail-comments-section__skeleton-line public-detail-comments-section__skeleton-line--reply-action"
              />
            </article>
          </div>
        </article>
      </div>
    </template>

    <div class="public-detail-comments-section__stage" :aria-busy="isRefreshing ? 'true' : 'false'">
      <div class="public-detail-comments-section__header">
        <public-detail-section-heading icon-name="message" title="讨论区" :tone="tone" />
        <span class="public-detail-comments-section__summary">{{ discussionSummaryLabel }}</span>
      </div>

      <public-detail-comment-composer
        v-model="rootDraft"
        :interactive="interactive"
        :is-authenticated="isAuthenticated"
        :submitting="pendingRootSubmit"
        :tone="tone"
        @submit="handleRootSubmit"
      />

      <div v-if="commentThreads.length > 0" class="public-detail-comments-section__list">
        <public-detail-comment-card
          v-for="comment in commentThreads"
          :key="comment.id"
          :comment="comment"
          :interactive="interactive"
          :is-authenticated="isAuthenticated"
          :is-replies-expanded="Boolean(expandedRepliesMap[comment.id])"
          :is-replies-loading="expandedRepliesLoadingId === comment.id"
          :is-reply-composer-open="activeReplyCommentId === comment.id"
          :reply-action-locked="Boolean(pendingReplyCommentId)"
          :reply-draft="activeReplyCommentId === comment.id ? replyDraft : ''"
          :reply-mention-user="activeReplyCommentId === comment.id ? replyMentionUser : null"
          :reply-submitting="pendingReplyCommentId === comment.id"
          :tone="tone"
          :visible-replies="expandedRepliesMap[comment.id] ?? comment.replies"
          @close-reply-composer="handleCloseReplyComposer"
          @expand-replies="handleExpandReplies"
          @open-reply-composer="handleOpenReplyComposer"
          @submit-reply="handleReplySubmit"
          @update-reply-draft="replyDraft = $event"
        />

        <portal-module-pagination
          :current-page="activePage"
          :disabled="isRefreshing"
          :page-size="COMMENTS_PAGE_SIZE"
          :total="totalRootComments"
          @change="handlePageChange"
        />
      </div>
    </div>
  </portal-request-boundary>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'

import PublicDetailSectionHeading from '../layout/PublicDetailSectionHeading.vue'
import PublicDetailCommentCard from './PublicDetailCommentCard.vue'
import PublicDetailCommentComposer from './PublicDetailCommentComposer.vue'

import type {
  PortalRequestBoundaryErrorCode,
  PortalRequestBoundaryMode
} from '@/components/PortalRequestBoundary.vue'
import type { PublicDetailSectionTone } from '@/constants/public-detail'
import {
  portalPublicCommentsApi,
  type PublicCommentMentionResponse,
  type PublicCommentReplyItemResponse,
  type PublicCommentThreadItemResponse,
  type PublicCommentTargetType
} from '@/api/public-comments'
import { formatCompactCount } from '@/utils/content'
import { portalMessage } from '@/utils/portal-message'

const COMMENTS_PAGE_SIZE = 10
const COMMENT_REPLY_PREVIEW_LIMIT = 3
const COMMENT_REPLIES_LIMIT_MAX = 200

const commentSkeletonCards = [
  {
    bodyWidths: ['100%', '92%'],
    replyRows: [{ bodyWidths: ['86%'] }]
  },
  {
    bodyWidths: ['96%', '74%'],
    replyRows: [{ bodyWidths: ['82%'] }, { bodyWidths: ['88%', '64%'] }]
  }
] as const

const props = withDefaults(
  defineProps<{
    anchorId: string
    discussionCount: number
    interactive?: boolean
    isAuthenticated: boolean
    loginLocation: RouteLocationRaw
    targetId: string
    targetType: PublicCommentTargetType
    tone?: PublicDetailSectionTone
  }>(),
  {
    interactive: true,
    tone: 'article'
  }
)

const emit = defineEmits<{
  discussionCountChange: [delta: number]
}>()

const router = useRouter()

const boundaryMode = ref<PortalRequestBoundaryMode>('loading')
const errorCode = ref<PortalRequestBoundaryErrorCode>(500)
const isRefreshing = ref(false)
const activePage = ref(1)
const commentThreads = ref<PublicCommentThreadItemResponse[]>([])
const totalRootComments = ref(0)
const rootDraft = ref('')
const pendingRootSubmit = ref(false)
const activeReplyCommentId = ref('')
const replyDraft = ref('')
const replyMentionUser = ref<PublicCommentMentionResponse | null>(null)
const pendingReplyCommentId = ref('')
const expandedRepliesMap = ref<Record<string, PublicCommentReplyItemResponse[]>>({})
const expandedRepliesLoadingId = ref('')

const normalizedTargetId = computed(() => props.targetId.trim())
const discussionSummaryLabel = computed(
  () => `${formatCompactCount(Math.max(0, props.discussionCount))} 条讨论`
)

let latestLoadToken = 0

watch(
  () => [normalizedTargetId.value, props.targetType, props.interactive] as const,
  () => {
    activePage.value = 1
    void loadCommentThreads(true)
  },
  {
    immediate: true
  }
)

function resetThreadUiState(): void {
  activeReplyCommentId.value = ''
  replyDraft.value = ''
  replyMentionUser.value = null
  pendingReplyCommentId.value = ''
  expandedRepliesMap.value = {}
  expandedRepliesLoadingId.value = ''
}

function resolveErrorStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) {
    return null
  }

  if ('status' in error && typeof error.status === 'number') {
    return error.status
  }

  if ('response' in error && typeof error.response === 'object' && error.response !== null) {
    const response = error.response as { status?: unknown }
    return typeof response.status === 'number' ? response.status : null
  }

  return null
}

async function handleLogin(): Promise<void> {
  await router.push(props.loginLocation)
}

async function loadCommentThreads(forceLoading = false): Promise<boolean> {
  latestLoadToken += 1
  const requestToken = latestLoadToken

  if (!props.interactive || !normalizedTargetId.value) {
    boundaryMode.value = 'ready'
    errorCode.value = 500
    isRefreshing.value = false
    commentThreads.value = []
    totalRootComments.value = 0
    resetThreadUiState()
    return true
  }

  const hasReadyData = boundaryMode.value === 'ready' && commentThreads.value.length > 0

  if (forceLoading || !hasReadyData) {
    boundaryMode.value = 'loading'
  } else {
    isRefreshing.value = true
  }

  const result = await portalPublicCommentsApi.getCommentThreads(
    props.targetType,
    normalizedTargetId.value,
    {
      limit: COMMENTS_PAGE_SIZE,
      page: activePage.value,
      replyLimit: COMMENT_REPLY_PREVIEW_LIMIT
    }
  )

  if (requestToken !== latestLoadToken) {
    return false
  }

  isRefreshing.value = false

  if (!result.data) {
    if (!hasReadyData || forceLoading) {
      boundaryMode.value = 'error'
      errorCode.value = result.errorCode ?? 500
      commentThreads.value = []
      totalRootComments.value = 0
      resetThreadUiState()
    } else {
      portalMessage.error('加载失败，请稍后再试。')
    }

    return false
  }

  commentThreads.value = result.data.items
  totalRootComments.value = result.data.total
  boundaryMode.value = 'ready'
  errorCode.value = 500
  resetThreadUiState()
  return true
}

function handleRetry(): void {
  void loadCommentThreads(true)
}

async function handlePageChange(page: number): Promise<void> {
  if (page === activePage.value) {
    return
  }

  const previousPage = activePage.value
  activePage.value = page

  const success = await loadCommentThreads(false)
  if (!success) {
    activePage.value = previousPage
  }
}

function appendRecentReplies(
  replies: PublicCommentReplyItemResponse[],
  nextReply: PublicCommentReplyItemResponse
): PublicCommentReplyItemResponse[] {
  return [...replies, nextReply].slice(-COMMENT_REPLY_PREVIEW_LIMIT)
}

function updateCommentThreadReply(
  commentId: string,
  replyCount: number,
  latestReply: PublicCommentReplyItemResponse
): void {
  commentThreads.value = commentThreads.value.map((comment) =>
    comment.id === commentId
      ? {
          ...comment,
          replyCount,
          replies: appendRecentReplies(comment.replies, latestReply)
        }
      : comment
  )

  if (expandedRepliesMap.value[commentId]) {
    expandedRepliesMap.value = {
      ...expandedRepliesMap.value,
      [commentId]: [...expandedRepliesMap.value[commentId], latestReply]
    }
  }
}

async function handleRootSubmit(): Promise<void> {
  if (!props.interactive) {
    portalMessage.warning('评论暂未开放。')
    return
  }

  if (!props.isAuthenticated) {
    return
  }

  const content = rootDraft.value.trim()
  if (!content || pendingRootSubmit.value) {
    return
  }

  pendingRootSubmit.value = true

  try {
    const createdComment = await portalPublicCommentsApi.createComment(
      props.targetType,
      normalizedTargetId.value,
      { content }
    )

    rootDraft.value = ''
    emit('discussionCountChange', 1)

    if (activePage.value === 1) {
      commentThreads.value = [createdComment, ...commentThreads.value].slice(0, COMMENTS_PAGE_SIZE)
      totalRootComments.value += 1
      boundaryMode.value = 'ready'
      return
    }

    const previousPage = activePage.value
    activePage.value = 1
    const success = await loadCommentThreads(true)
    if (!success) {
      activePage.value = previousPage
    }
  } catch (error) {
    const status = resolveErrorStatus(error)

    if (status === 401) {
      await handleLogin()
      return
    }

    portalMessage.error('评论失败，请稍后再试。')
  } finally {
    pendingRootSubmit.value = false
  }
}

function handleOpenReplyComposer(payload: {
  commentId: string
  mentionUser?: PublicCommentMentionResponse | null
}): void {
  if (pendingReplyCommentId.value) {
    return
  }

  if (activeReplyCommentId.value !== payload.commentId) {
    replyDraft.value = ''
  }

  activeReplyCommentId.value = payload.commentId
  replyMentionUser.value = payload.mentionUser ?? null
}

function handleCloseReplyComposer(commentId: string): void {
  if (activeReplyCommentId.value !== commentId) {
    return
  }

  if (pendingReplyCommentId.value === commentId) {
    return
  }

  activeReplyCommentId.value = ''
  replyDraft.value = ''
  replyMentionUser.value = null
  pendingReplyCommentId.value = ''
}

async function handleReplySubmit(payload: {
  commentId: string
  mentionUserId?: string
}): Promise<void> {
  if (!props.interactive) {
    portalMessage.warning('评论暂未开放。')
    return
  }

  if (!props.isAuthenticated) {
    return
  }

  const content = replyDraft.value.trim()
  if (!content || pendingReplyCommentId.value) {
    return
  }

  pendingReplyCommentId.value = payload.commentId

  try {
    const response = await portalPublicCommentsApi.replyComment(payload.commentId, {
      content,
      mentionUserId: payload.mentionUserId
    })

    updateCommentThreadReply(payload.commentId, response.replyCount, response.latestReply)
    emit('discussionCountChange', 1)
    handleCloseReplyComposer(payload.commentId)
  } catch (error) {
    const status = resolveErrorStatus(error)

    if (status === 401) {
      await handleLogin()
      return
    }

    portalMessage.error('回复失败，请稍后再试。')
  } finally {
    pendingReplyCommentId.value = ''
  }
}

async function handleExpandReplies(commentId: string): Promise<void> {
  if (expandedRepliesLoadingId.value === commentId || expandedRepliesMap.value[commentId]) {
    return
  }

  const targetComment = commentThreads.value.find((comment) => comment.id === commentId)
  if (!targetComment) {
    return
  }

  expandedRepliesLoadingId.value = commentId

  try {
    const result = await portalPublicCommentsApi.getCommentReplies(commentId, {
      limit: Math.max(
        COMMENT_REPLY_PREVIEW_LIMIT,
        Math.min(targetComment.replyCount, COMMENT_REPLIES_LIMIT_MAX)
      )
    })

    if (!result.data) {
      portalMessage.error('加载失败，请稍后再试。')
      return
    }

    expandedRepliesMap.value = {
      ...expandedRepliesMap.value,
      [commentId]: result.data.replies
    }
  } finally {
    expandedRepliesLoadingId.value = ''
  }
}
</script>

<style scoped>
.public-detail-comments-section {
  --public-detail-comments-accent: var(--portal-content-article-accent);
  width: 100%;
  margin-top: var(--public-detail-comments-gap-before, 0);
  padding-top: var(--public-detail-comments-divider-gap);
  border-top: 1px solid var(--portal-content-line);
}

.public-detail-comments-section--topic {
  --public-detail-comments-accent: var(--portal-content-topic-accent);
}

.public-detail-comments-section--gallery {
  --public-detail-comments-accent: var(--portal-content-gallery-accent);
}

.public-detail-comments-section--bookshelf {
  --public-detail-comments-accent: var(--portal-content-bookshelf-accent);
}

.public-detail-comments-section__stage {
  display: grid;
  gap: 18px;
}

.public-detail-comments-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.public-detail-comments-section__summary {
  color: color-mix(in srgb, var(--portal-content-muted) 90%, transparent);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
}

.public-detail-comments-section__list {
  display: grid;
  gap: 0;
}

.public-detail-comments-section__list :deep(.public-detail-comment-card:last-child) {
  padding-bottom: 0;
  border-bottom: 0;
}

.public-detail-comments-section__list :deep(.portal-module-pagination) {
  margin-top: 16px;
}

.public-detail-comments-section__stage--skeleton {
  gap: 16px;
}

.public-detail-comments-section__header--skeleton {
  justify-content: space-between;
}

.public-detail-comments-section__composer-skeleton {
  display: grid;
  gap: 10px;
}

.public-detail-comments-section__composer-skeleton-footer,
.public-detail-comments-section__card-skeleton-meta,
.public-detail-comments-section__card-skeleton-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.public-detail-comments-section__card-skeleton {
  display: grid;
  gap: 12px;
  padding: 18px 0;
  border-bottom: 1px solid var(--portal-skeleton-border);
}

.public-detail-comments-section__card-skeleton:last-child {
  border-bottom: 0;
}

.public-detail-comments-section__card-skeleton-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.public-detail-comments-section__card-skeleton-copy,
.public-detail-comments-section__card-skeleton-replies {
  display: grid;
  gap: 8px;
}

.public-detail-comments-section__card-skeleton-replies {
  gap: 12px;
  margin-left: 54px;
  padding-left: 14px;
  border-left: 2px solid var(--portal-skeleton-border);
}

.public-detail-comments-section__reply-skeleton {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}

.public-detail-comments-section__reply-skeleton-copy {
  display: grid;
  gap: 8px;
}

.public-detail-comments-section__reply-skeleton-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.public-detail-comments-section__skeleton-block,
.public-detail-comments-section__skeleton-line,
.public-detail-comments-section__skeleton-pill {
  position: relative;
  overflow: hidden;
}

.public-detail-comments-section__skeleton-block::after,
.public-detail-comments-section__skeleton-line::after,
.public-detail-comments-section__skeleton-pill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--portal-skeleton-shimmer);
  animation: portal-skeleton-wave 2.4s ease-in-out infinite;
  transform: translateX(-100%);
}

.public-detail-comments-section__skeleton-block,
.public-detail-comments-section__skeleton-line,
.public-detail-comments-section__skeleton-pill {
  border: 1px solid var(--portal-skeleton-border);
  background: linear-gradient(
    135deg,
    var(--portal-skeleton-block-strong),
    var(--portal-skeleton-block)
  );
  box-sizing: border-box;
}

.public-detail-comments-section__skeleton-block,
.public-detail-comments-section__skeleton-line {
  border-radius: 999px;
}

.public-detail-comments-section__skeleton-pill {
  border-radius: 999px;
}

.public-detail-comments-section__skeleton-pill--heading {
  width: 118px;
  height: var(--portal-skeleton-title-sm-height);
}

.public-detail-comments-section__skeleton-pill--summary {
  width: 84px;
  height: 24px;
}

.public-detail-comments-section__skeleton-pill--button {
  width: 132px;
  height: 34px;
}

.public-detail-comments-section__skeleton-block--composer {
  width: 100%;
  height: 102px;
  border-radius: 18px;
}

.public-detail-comments-section__skeleton-block--avatar {
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  border-radius: 14px;
}

.public-detail-comments-section__skeleton-line {
  height: var(--portal-skeleton-copy-14-height);
}

.public-detail-comments-section__skeleton-line--hint {
  width: 196px;
}

.public-detail-comments-section__skeleton-line--author {
  width: 96px;
}

.public-detail-comments-section__skeleton-line--time {
  width: 68px;
}

.public-detail-comments-section__skeleton-line--count {
  width: 72px;
}

.public-detail-comments-section__skeleton-line--action {
  width: 42px;
}

.public-detail-comments-section__skeleton-line--reply-author {
  width: 74px;
}

.public-detail-comments-section__skeleton-line--reply-time {
  width: 56px;
}

.public-detail-comments-section__skeleton-line--reply {
  height: var(--portal-skeleton-copy-13-height);
}

.public-detail-comments-section__skeleton-line--reply-action {
  width: 32px;
  height: var(--portal-skeleton-copy-13-height);
}

.public-detail-comments-section :deep(.portal-request-boundary__state) {
  min-height: 220px;
  padding: var(--portal-boundary-panel-padding-block) var(--portal-boundary-panel-padding-inline);
  border: 1px solid
    color-mix(in srgb, var(--public-detail-comments-accent) 14%, var(--portal-request-state-border));
  border-radius: var(--public-detail-panel-radius);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--public-detail-comments-accent) 10%, transparent),
      transparent 74%
    ),
    var(--portal-request-state-bg);
  box-shadow: var(--public-detail-panel-shadow);
}
</style>
