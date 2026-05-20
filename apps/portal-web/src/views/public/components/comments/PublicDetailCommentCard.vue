<template>
  <article class="public-detail-comment-card" :class="`public-detail-comment-card--${tone}`">
    <header class="public-detail-comment-card__header">
      <div class="public-detail-comment-card__avatar">
        <img
          v-if="comment.author.avatarUrl"
          class="public-detail-comment-card__avatar-image"
          :src="comment.author.avatarUrl"
          :alt="`${comment.author.name} 的头像`"
        />
        <span v-else>{{ authorInitial }}</span>
      </div>

      <div class="public-detail-comment-card__copy">
        <div class="public-detail-comment-card__meta">
          <strong class="public-detail-comment-card__author">{{ comment.author.name }}</strong>
          <time class="public-detail-comment-card__time">{{ commentTimeLabel }}</time>
        </div>

        <p class="public-detail-comment-card__content">{{ comment.content }}</p>
      </div>
    </header>

    <footer class="public-detail-comment-card__footer">
      <span class="public-detail-comment-card__count">
        {{ formatCompactCount(comment.replyCount) }} 条回复
      </span>

      <button
        v-if="interactive"
        type="button"
        class="public-detail-comment-card__reply-trigger"
        :disabled="replyActionDisabled"
        @click="handleRootReply"
      >
        回复
      </button>
    </footer>

    <div v-if="visibleReplies.length > 0" class="public-detail-comment-card__replies">
      <article
        v-for="reply in visibleReplies"
        :key="reply.replyId"
        class="public-detail-comment-card__reply"
      >
        <div class="public-detail-comment-card__reply-copy">
          <div class="public-detail-comment-card__reply-meta">
            <strong>{{ reply.author.name }}</strong>
            <time>{{ formatTimeLabel(reply.createdAt) }}</time>
          </div>
          <p class="public-detail-comment-card__reply-content">
            <template v-if="reply.mentionedUser">
              回复
              <span class="public-detail-comment-card__mention">
                @{{ reply.mentionedUser.name }}
              </span>
              ：
            </template>
            {{ reply.content }}
          </p>
        </div>

        <button
          v-if="interactive"
          type="button"
          class="public-detail-comment-card__reply-link"
          :disabled="replyActionDisabled"
          @click="handleReplyToUser(reply)"
        >
          回复
        </button>
      </article>

      <button
        v-if="showsExpandReplies"
        type="button"
        class="public-detail-comment-card__expand"
        :disabled="isRepliesLoading"
        @click="$emit('expandReplies', comment.id)"
      >
        {{ isRepliesLoading ? '加载回复中...' : `展开全部 ${comment.replyCount} 条回复` }}
      </button>
    </div>

    <div v-if="isReplyComposerOpen" class="public-detail-comment-card__reply-box">
      <p class="public-detail-comment-card__reply-title">
        {{ replyMentionUser ? `回复 @${replyMentionUser.name}` : '回复当前讨论' }}
      </p>

      <textarea
        class="public-detail-comment-card__reply-textarea"
        :disabled="replySubmitting"
        :placeholder="replyMentionUser ? `回复 ${replyMentionUser.name}` : '写下你的回复'"
        :value="replyDraft"
        @input="handleReplyDraftInput"
      />

      <div class="public-detail-comment-card__reply-actions">
        <button
          type="button"
          class="public-detail-comment-card__reply-cancel"
          :disabled="replySubmitting"
          @click="handleCloseReply"
        >
          取消
        </button>
        <button
          type="button"
          class="public-detail-comment-card__reply-submit"
          :disabled="replySubmitDisabled"
          @click="
            $emit('submitReply', { commentId: comment.id, mentionUserId: replyMentionUser?.userId })
          "
        >
          {{ replySubmitting ? '发送中...' : '发送回复' }}
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { PublicDetailSectionTone } from '@/constants/public-detail'
import {
  type PublicCommentMentionResponse,
  type PublicCommentReplyItemResponse,
  type PublicCommentThreadItemResponse
} from '@/api/public-comments'
import { formatCompactCount, formatPublishTimeLabel } from '@/utils/content'

const props = withDefaults(
  defineProps<{
    comment: PublicCommentThreadItemResponse
    interactive?: boolean
    isAuthenticated: boolean
    replyActionLocked?: boolean
    isRepliesExpanded?: boolean
    isRepliesLoading?: boolean
    isReplyComposerOpen?: boolean
    replyDraft?: string
    replyMentionUser?: PublicCommentMentionResponse | null
    replySubmitting?: boolean
    tone?: PublicDetailSectionTone
    visibleReplies?: PublicCommentReplyItemResponse[]
  }>(),
  {
    interactive: true,
    isRepliesExpanded: false,
    isRepliesLoading: false,
    isReplyComposerOpen: false,
    replyActionLocked: false,
    replyDraft: '',
    replyMentionUser: null,
    replySubmitting: false,
    tone: 'article',
    visibleReplies: () => []
  }
)

const emit = defineEmits<{
  closeReplyComposer: [commentId: string]
  expandReplies: [commentId: string]
  openReplyComposer: [
    payload: {
      commentId: string
      mentionUser?: PublicCommentMentionResponse | null
    }
  ]
  submitReply: [
    payload: {
      commentId: string
      mentionUserId?: string
    }
  ]
  updateReplyDraft: [value: string]
}>()

const authorInitial = computed(() => props.comment.author.name.trim().slice(0, 1) || '评')
const commentTimeLabel = computed(() => formatTimeLabel(props.comment.createdAt))
const showsExpandReplies = computed(
  () => !props.isRepliesExpanded && props.comment.replyCount > props.visibleReplies.length
)
const replyActionDisabled = computed(
  () => !props.interactive || !props.isAuthenticated || props.replyActionLocked
)
const replySubmitDisabled = computed(
  () => replyActionDisabled.value || props.replySubmitting || props.replyDraft.trim().length === 0
)

function formatTimeLabel(value: string): string {
  const relative = formatPublishTimeLabel(value)

  if (relative) {
    return relative
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}-${day}`
}

function handleRootReply(): void {
  if (replyActionDisabled.value) {
    return
  }

  emit('openReplyComposer', {
    commentId: props.comment.id,
    mentionUser: null
  })
}

function handleReplyToUser(reply: PublicCommentReplyItemResponse): void {
  if (replyActionDisabled.value) {
    return
  }

  emit('openReplyComposer', {
    commentId: props.comment.id,
    mentionUser: {
      userId: reply.author.userId,
      name: reply.author.name
    }
  })
}

function handleCloseReply(): void {
  emit('closeReplyComposer', props.comment.id)
}

function handleReplyDraftInput(event: Event): void {
  emit('updateReplyDraft', (event.target as HTMLTextAreaElement).value)
}
</script>

<style scoped>
.public-detail-comment-card {
  --public-detail-comment-card-accent: var(--home-business-article-accent);
  --public-detail-comment-card-accent-soft: var(--home-business-article-tag-bg);
  display: grid;
  gap: 10px;
  padding: 18px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--home-line) 90%, transparent);
}

.public-detail-comment-card--topic {
  --public-detail-comment-card-accent: var(--home-business-topic-accent);
  --public-detail-comment-card-accent-soft: var(--home-business-topic-tag-bg);
}

.public-detail-comment-card--gallery {
  --public-detail-comment-card-accent: var(--home-business-gallery-accent);
  --public-detail-comment-card-accent-soft: var(--home-business-gallery-tag-bg);
}

.public-detail-comment-card--bookshelf {
  --public-detail-comment-card-accent: var(--home-business-bookshelf-accent);
  --public-detail-comment-card-accent-soft: var(--home-business-bookshelf-tag-bg);
}

.public-detail-comment-card__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.public-detail-comment-card__avatar {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid color-mix(in srgb, var(--public-detail-comment-card-accent) 14%, transparent);
  border-radius: 14px;
  background: color-mix(
    in srgb,
    var(--public-detail-comment-card-accent-soft) 46%,
    var(--home-detail-card-bg)
  );
  color: color-mix(in srgb, var(--public-detail-comment-card-accent) 82%, var(--home-ink));
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  overflow: hidden;
}

.public-detail-comment-card__avatar-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.public-detail-comment-card__copy {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.public-detail-comment-card__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.public-detail-comment-card__author {
  color: var(--home-ink);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.4;
}

.public-detail-comment-card__time {
  color: color-mix(in srgb, var(--home-muted) 92%, transparent);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.public-detail-comment-card__content,
.public-detail-comment-card__reply-content {
  margin: 0;
  color: color-mix(in srgb, var(--home-ink) 92%, transparent);
  font-size: 13px;
  line-height: 1.76;
  white-space: pre-wrap;
  word-break: break-word;
}

.public-detail-comment-card__footer,
.public-detail-comment-card__reply-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding-left: 52px;
}

.public-detail-comment-card__footer {
  justify-content: space-between;
}

.public-detail-comment-card__reply-actions {
  justify-content: flex-end;
}

.public-detail-comment-card__count {
  color: color-mix(in srgb, var(--home-muted) 92%, transparent);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
}

.public-detail-comment-card__reply-trigger,
.public-detail-comment-card__reply-link,
.public-detail-comment-card__expand,
.public-detail-comment-card__reply-cancel,
.public-detail-comment-card__reply-submit {
  appearance: none;
  padding: 0;
  border: 0;
  background: transparent;
  color: color-mix(in srgb, var(--public-detail-comment-card-accent) 86%, var(--home-ink));
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
  cursor: pointer;
  transition:
    color 180ms ease,
    opacity 180ms ease;
}

.public-detail-comment-card__reply-trigger:hover:not(:disabled),
.public-detail-comment-card__reply-link:hover:not(:disabled),
.public-detail-comment-card__expand:hover:not(:disabled),
.public-detail-comment-card__reply-cancel:hover:not(:disabled),
.public-detail-comment-card__reply-submit:hover:not(:disabled) {
  color: color-mix(in srgb, var(--public-detail-comment-card-accent) 96%, var(--home-ink));
}

.public-detail-comment-card__reply-trigger:focus-visible,
.public-detail-comment-card__reply-link:focus-visible,
.public-detail-comment-card__expand:focus-visible,
.public-detail-comment-card__reply-cancel:focus-visible,
.public-detail-comment-card__reply-submit:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--portal-focus-ring);
  border-radius: 999px;
}

.public-detail-comment-card__reply-trigger:disabled,
.public-detail-comment-card__reply-link:disabled,
.public-detail-comment-card__expand:disabled,
.public-detail-comment-card__reply-cancel:disabled,
.public-detail-comment-card__reply-submit:disabled {
  cursor: not-allowed;
  opacity: 0.46;
}

.public-detail-comment-card__replies {
  display: grid;
  gap: 12px;
  margin-left: 52px;
  padding-left: 14px;
  border-left: 2px solid
    color-mix(in srgb, var(--public-detail-comment-card-accent) 14%, transparent);
}

.public-detail-comment-card__reply {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}

.public-detail-comment-card__reply-copy {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.public-detail-comment-card__reply-meta {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}

.public-detail-comment-card__reply-meta strong {
  color: var(--home-ink);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.4;
}

.public-detail-comment-card__reply-meta time {
  color: color-mix(in srgb, var(--home-muted) 90%, transparent);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.public-detail-comment-card__mention {
  color: color-mix(in srgb, var(--public-detail-comment-card-accent) 88%, var(--home-ink));
  font-weight: 700;
}

.public-detail-comment-card__reply-box {
  display: grid;
  gap: 10px;
  margin-left: 52px;
  padding-left: 14px;
  border-left: 2px solid
    color-mix(in srgb, var(--public-detail-comment-card-accent) 18%, transparent);
}

.public-detail-comment-card__reply-title {
  margin: 0;
  color: color-mix(in srgb, var(--home-ink) 92%, transparent);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
}

.public-detail-comment-card__reply-textarea {
  display: block;
  width: 100%;
  min-height: 76px;
  padding: 10px 12px;
  border: 1px solid
    color-mix(in srgb, var(--public-detail-comment-card-accent) 14%, var(--home-detail-card-border));
  border-radius: 16px;
  background: color-mix(in srgb, white 78%, var(--home-detail-card-bg));
  box-sizing: border-box;
  color: var(--home-ink);
  font: inherit;
  font-size: 13px;
  line-height: 1.72;
  resize: vertical;
}

.public-detail-comment-card__reply-textarea:focus-visible {
  outline: none;
  border-color: color-mix(in srgb, var(--public-detail-comment-card-accent) 26%, transparent);
  box-shadow: 0 0 0 3px var(--portal-focus-ring);
}

.public-detail-comment-card__reply-textarea:disabled {
  cursor: default;
  opacity: 0.72;
}
</style>
