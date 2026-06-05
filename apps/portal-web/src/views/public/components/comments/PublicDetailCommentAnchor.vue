<template>
  <public-detail-comments-section
    v-if="targetId && targetType"
    :anchor-id="anchorId"
    :discussion-count="discussionCount"
    :interactive="interactive"
    :is-authenticated="isAuthenticated"
    :login-location="loginLocation"
    :target-id="targetId"
    :target-type="targetType"
    :tone="tone"
    @discussion-count-change="$emit('discussionCountChange', $event)"
  />

  <div v-else :id="anchorId" class="public-detail-comment-anchor">
    <strong>评论暂未开放</strong>
    <p>敬请期待。</p>
  </div>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

import PublicDetailCommentsSection from './PublicDetailCommentsSection.vue'
import type { PublicCommentTargetType } from '@/api/public-comments'
import type { PublicDetailSectionTone } from '@/constants/public-detail'

withDefaults(
  defineProps<{
    anchorId: string
    discussionCount?: number
    interactive?: boolean
    isAuthenticated?: boolean
    loginLocation?: RouteLocationRaw
    targetId?: string
    targetType?: PublicCommentTargetType
    tone?: PublicDetailSectionTone
  }>(),
  {
    discussionCount: 0,
    interactive: true,
    isAuthenticated: false,
    loginLocation: '/',
    targetId: '',
    targetType: undefined,
    tone: 'article'
  }
)

defineEmits<{
  discussionCountChange: [delta: number]
}>()
</script>

<style scoped>
.public-detail-comment-anchor {
  display: grid;
  gap: 5px;
  width: 100%;
  margin-top: var(--public-detail-comments-gap-before, 0);
  padding-top: var(--public-detail-comments-divider-gap, var(--home-detail-comments-divider-gap));
  border-top: 1px solid var(--home-line);
}

.public-detail-comment-anchor strong {
  color: color-mix(in srgb, var(--home-ink) 86%, transparent);
  font-size: 13px;
  font-weight: 700;
}

.public-detail-comment-anchor p {
  margin: 0;
  max-width: 720px;
  color: color-mix(in srgb, var(--home-muted) 90%, transparent);
  font-size: 12px;
  line-height: 1.7;
}
</style>
