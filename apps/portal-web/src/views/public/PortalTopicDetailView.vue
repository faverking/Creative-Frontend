<template>
  <portal-request-boundary
    class="portal-topic-detail-page"
    :mode="topicBoundaryMode"
    :error-code="topicErrorCode"
    primary-label="重试"
    @primary="handleTopicRetry"
  >
    <template #loading>
      <public-detail-loading-state variant="topic" />
    </template>

    <div class="portal-topic-detail-page__content">
      <section class="portal-topic-detail-page__layout">
        <public-detail-panel
          as="article"
          class="portal-topic-detail-page__body-panel"
          padding="none"
          variant="main"
        >
          <public-detail-hero
            class="portal-topic-detail-page__detail-head"
            accent="topic"
            :actions="resolvedActions"
            :cover-alt="topicTitle"
            :cover-url="topicCoverUrl"
            :is-authenticated="isAuthenticated"
            :meta-tag="heroPrimaryTag"
            :title="topicTitle"
            :meta="detailMeta"
            :stats="heroStats"
            @action="handleAction"
          />

          <public-detail-rich-text
            accent="topic"
            class="portal-topic-detail-page__body"
            :html="topicContentHtml"
          />

          <public-detail-comment-anchor
            :anchor-id="COMMENTS_ANCHOR_ID"
            :discussion-count="discussionCount"
            :interactive="Boolean(topicDetail)"
            :is-authenticated="isAuthenticated"
            :login-location="loginPromptTarget"
            :target-id="topicDetail?.id || topicId"
            target-type="topic"
            tone="topic"
            @discussion-count-change="handleDiscussionCountChange"
          />
        </public-detail-panel>

        <aside class="portal-topic-detail-page__side">
          <public-detail-side-rail class="portal-topic-detail-page__side-rail">
            <public-detail-author-section
              class="public-detail-side-rail__section"
              accent="topic"
              :avatar-url="authorAvatarUrl"
              :bio="authorBioLabel"
              :name="topicAuthorName"
              :tags="authorStatTags"
            />

            <public-detail-related-section
              class="public-detail-side-rail__section"
              accent="topic"
              :boundary-error-code="relatedErrorCode"
              :boundary-mode="relatedBoundaryMode"
              @primary="handleTopicRetry"
            >
              <public-detail-related-media-card
                v-for="related in relatedItems"
                :key="related.id"
                accent="topic"
                :cover-url="related.coverUrl"
                :publish-time="related.publishTime"
                :summary="related.summary"
                :tags="related.tags"
                :title="related.title"
                :to="related.to"
              />
            </public-detail-related-section>

            <section
              class="public-detail-side-rail__section portal-topic-detail-page__resource-panel"
            >
              <public-detail-section-heading icon-name="download" title="游戏资源" tone="topic" />

              <public-detail-resource-state
                accent="topic"
                :action-label="resourceActionLabel"
                :detail="resourceStatusDetail"
                :meta-tag="resourceMetaTag"
                :state="resourceState"
                :label="resourceLabel"
                :title="resourceStatusTitle"
                @action="handleResourceAction"
              />
            </section>
          </public-detail-side-rail>
        </aside>
      </section>
    </div>
  </portal-request-boundary>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { useUserStore } from '@frontend/store'

import {
  createTopicDetailActions,
  resolvePublicTopicFeatureFlagLabels,
  resolvePublicTopicSectionLabel,
  resolvePublicTopicThemeLabel,
  type PublicDetailActionItem
} from '@/constants/public-detail'
import {
  portalPublicDetailApi,
  resolvePublicDetailMediaUrl,
  type PublicTopicDetailPageData
} from '@/api/public-detail'
import { buildProtectedAuthDialogLocation } from '@/utils/auth-dialog'
import {
  isInternalDownloadUrl,
  normalizeDownloadFileName,
  triggerUrlDownload
} from '@/utils/download'
import {
  copyTextToClipboard,
  formatCompactCount,
  formatPublishTimeLabel,
  normalizeCopyableUrl,
  normalizeRichTextHtml,
  resolveDisplayName,
  resolveMetricTags,
  resolvePortalContentDetailLocation
} from '@/utils/content'
import PublicDetailCommentAnchor from '@/views/public/components/comments/PublicDetailCommentAnchor.vue'
import PublicDetailRichText from '@/views/public/components/content/PublicDetailRichText.vue'
import PublicDetailHero from '@/views/public/components/hero/PublicDetailHero.vue'
import PublicDetailPanel from '@/views/public/components/layout/PublicDetailPanel.vue'
import PublicDetailSectionHeading from '@/views/public/components/layout/PublicDetailSectionHeading.vue'
import PublicDetailSideRail from '@/views/public/components/layout/PublicDetailSideRail.vue'
import PublicDetailLoadingState from '@/views/public/components/loading/PublicDetailLoadingState.vue'
import PublicDetailAuthorSection from '@/views/public/components/side/PublicDetailAuthorSection.vue'
import PublicDetailRelatedMediaCard from '@/views/public/components/side/PublicDetailRelatedMediaCard.vue'
import PublicDetailRelatedSection from '@/views/public/components/side/PublicDetailRelatedSection.vue'
import PublicDetailResourceState from '@/views/public/components/side/PublicDetailResourceState.vue'
import { useCopyFeedback } from '@/views/public/composables/useCopyFeedback'
import { usePublicDetailReloadTriggers } from '@/views/public/composables/usePublicDetailReloadTriggers'
import { usePublicDetailRequestState } from '@/views/public/composables/usePublicDetailRequestState'

const COMMENTS_ANCHOR_ID = 'topic-comments-anchor'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const topicData = ref<PublicTopicDetailPageData | null>(null)
const isFavoriteSubmitting = ref(false)
const authorProfileLoadFailed = ref(false)
const favorited = ref(false)
const favoriteCount = ref(0)
const relatedLoadFailed = ref(false)
const relatedErrorCode = ref<401 | 403 | 404 | 500>(500)
const { copied, markCopied } = useCopyFeedback()
const {
  boundaryMode: topicBoundaryMode,
  beginLoad: beginTopicLoad,
  errorCode: topicErrorCode,
  isLatestLoad: isLatestTopicLoad,
  setErrorMode: setTopicErrorMode,
  setLiveMode: setTopicLiveMode
} = usePublicDetailRequestState()

const topicId = computed(() => (typeof route.params.id === 'string' ? route.params.id.trim() : ''))
const isAuthenticated = computed(() => Boolean(userStore.profile?.id))
const loginPromptTarget = computed(() => buildProtectedAuthDialogLocation(route, 'login'))
const topicDetail = computed(() => topicData.value?.detail ?? null)
const topicAuthorProfile = computed(() => topicData.value?.authorProfile ?? null)
const topicTitle = computed(() => topicDetail.value?.title?.trim() || '未命名游戏')
const topicCoverUrl = computed(() => resolvePublicDetailMediaUrl(topicDetail.value?.coverMedia))
const topicAuthorName = computed(() =>
  resolveDisplayName(topicAuthorProfile.value?.name, topicDetail.value?.author?.name, '匿名作者')
)
const topicThemeLabel = computed(() => resolvePublicTopicThemeLabel(topicDetail.value?.topicId))
const topicSectionLabel = computed(() => resolvePublicTopicSectionLabel(topicDetail.value?.typeId))
const topicFeatureLabels = computed(() =>
  resolvePublicTopicFeatureFlagLabels(topicDetail.value?.featureFlagLabels).filter(
    (label) => normalizeTopicLabel(label) !== normalizeTopicLabel(topicSectionLabel.value)
  )
)
const topicFeatureLabelText = computed(() => topicFeatureLabels.value.slice(0, 2).join('、'))
const publishTimeLabel = computed(() =>
  formatPublishTimeLabel(topicDetail.value?.postTime || topicDetail.value?.updateTime)
)
const heroPrimaryTag = computed(() => ({
  tone: 'primary' as const,
  label: topicSectionLabel.value
}))
const detailMeta = computed(() =>
  [topicFeatureLabelText.value, topicAuthorName.value, publishTimeLabel.value].filter(Boolean)
)
const discussionCount = computed(() => Math.max(0, topicDetail.value?.replyCount ?? 0))
const heroStats = computed(() => [
  {
    iconName: 'view' as const,
    label: '浏览',
    value: formatCompactCount(topicDetail.value?.viewCount ?? 0)
  },
  {
    iconName: 'message' as const,
    label: '回复',
    value: formatCompactCount(topicDetail.value?.replyCount ?? 0)
  },
  {
    iconName: 'favorite' as const,
    label: '收藏',
    value: formatCompactCount(favoriteCount.value)
  }
])
const topicContentHtml = computed(() => normalizeRichTextHtml(topicDetail.value?.content, ''))
const relatedItems = computed(() =>
  (topicData.value?.related ?? [])
    .filter((related) => related.id !== topicDetail.value?.id)
    .slice(0, 3)
    .map((related) => ({
      id: related.id,
      title: related.title?.trim() || '',
      summary: related.summary?.trim() || '',
      tags: [
        related.tags?.[0]?.trim() || topicThemeLabel.value,
        related.tags?.[1]?.trim() || topicSectionLabel.value
      ].filter(Boolean),
      publishTime: related.publishTime || '',
      coverUrl: resolvePublicDetailMediaUrl(related.cover),
      to: resolvePortalContentDetailLocation('topic', related.id)
    }))
)
const showRelatedErrorState = computed(
  () => relatedLoadFailed.value && relatedItems.value.length === 0
)
const relatedBoundaryMode = computed(() => {
  if (showRelatedErrorState.value) {
    return 'error'
  }

  return relatedItems.value.length === 0 ? 'empty' : 'ready'
})
type TopicResourceState = 'internal' | 'external' | 'locked' | 'empty'
const topicDownloadUrl = computed(() => topicDetail.value?.downloadUrl?.trim() || '')
const imageCount = computed(() => topicDetail.value?.imageAssets?.length ?? 0)
const resourceState = computed<TopicResourceState>(() => {
  if (topicDownloadUrl.value) {
    return isInternalDownloadUrl(topicDownloadUrl.value) ? 'internal' : 'external'
  }

  if (!isAuthenticated.value && imageCount.value > 0) {
    return 'locked'
  }

  return 'empty'
})
const resourceLabel = computed(() => {
  switch (resourceState.value) {
    case 'internal':
      return '资源包'
    case 'external':
      return '外部链接'
    case 'locked':
      return '资源入口'
    default:
      return '暂未开放'
  }
})
const resourceMetaTag = computed(() => {
  if (resourceState.value === 'locked') {
    return '登录后可见'
  }

  return imageCount.value > 0 ? `导览图 ${imageCount.value} 张` : ''
})
const resourceStatusTitle = computed(() => {
  switch (resourceState.value) {
    case 'internal':
      return '资源已就绪'
    case 'external':
      return '可前往获取资源'
    case 'locked':
      return '登录后查看资源'
    default:
      return '暂未提供资源'
  }
})
const resourceStatusDetail = computed(() => {
  switch (resourceState.value) {
    case 'internal':
      return '点击下方按钮即可下载。'
    case 'external':
      return '点击按钮后会在新页面打开。'
    case 'locked':
      return '登录后即可继续领取。'
    default:
      return '后续如有补充会在这里更新。'
  }
})
const resourceActionLabel = computed(() => {
  switch (resourceState.value) {
    case 'internal':
      return '领取资源'
    case 'external':
      return '前往获取'
    case 'locked':
      return '立即登录'
    default:
      return ''
  }
})
const topicDownloadFileName = computed(() =>
  normalizeDownloadFileName(
    `${topicTitle.value || 'topic'}-${topicFeatureLabelText.value.replaceAll('、', '-') || 'resources'}`,
    'topic-package',
    'zip'
  )
)
const authorBioLabel = computed(() =>
  authorProfileLoadFailed.value
    ? '作者资料暂时不可用。'
    : topicAuthorProfile.value?.bio?.trim() || '这个人还没有留下简介。'
)
const authorStatTags = computed(() =>
  resolveMetricTags([], [topicThemeLabel.value, topicSectionLabel.value])
)
const authorAvatarUrl = computed(
  () => topicAuthorProfile.value?.avatarUrl || topicDetail.value?.author?.avatarUrl || ''
)
const resolvedActions = computed(() =>
  createTopicDetailActions().map((action) => ({
    ...action,
    label: resolveActionLabel(action)
  }))
)

function resolveActionLabel(action: PublicDetailActionItem): string {
  if (action.key === 'favorite' && favorited.value) {
    return '已收藏游戏'
  }

  if (action.key === 'share' && copied.value) {
    return '链接已复制'
  }

  return action.label
}

function normalizeTopicLabel(label: string): string {
  return label.trim().toLocaleLowerCase()
}

async function loadTopicDetail(): Promise<void> {
  const loadToken = beginTopicLoad()
  topicData.value = null
  authorProfileLoadFailed.value = false
  relatedLoadFailed.value = false
  relatedErrorCode.value = 500

  if (!topicId.value) {
    setTopicErrorMode(404)
    favorited.value = false
    favoriteCount.value = 0
    return
  }

  const result = await portalPublicDetailApi.getTopicDetailPageData(topicId.value)

  if (!isLatestTopicLoad(loadToken)) {
    return
  }

  if (!result.data) {
    setTopicErrorMode(result.meta.detailErrorCode ?? 500)
    favorited.value = false
    favoriteCount.value = 0
    return
  }

  const nextData = result.data
  topicData.value = nextData
  setTopicLiveMode()
  authorProfileLoadFailed.value = result.meta.authorProfileError
  favorited.value = false
  favoriteCount.value = nextData.detail.favorCount ?? 0
  relatedLoadFailed.value = result.meta.relatedError
  relatedErrorCode.value = result.meta.relatedErrorCode ?? 500
}

usePublicDetailReloadTriggers(topicId, loadTopicDetail)

function handleTopicRetry(): void {
  void loadTopicDetail()
}

async function openLoginDialog(): Promise<void> {
  await router.push(loginPromptTarget.value)
}

function handleDiscussionCountChange(delta: number): void {
  if (!topicData.value?.detail) {
    return
  }

  topicData.value.detail.replyCount = Math.max(0, (topicData.value.detail.replyCount ?? 0) + delta)
}

async function copyCurrentTopicLink(): Promise<void> {
  const copiedToClipboard = await copyTextToClipboard(normalizeCopyableUrl(route.fullPath))

  if (!copiedToClipboard) {
    ElMessage.warning('当前页面链接暂时无法复制')
    return
  }

  markCopied()
}

async function toggleTopicFavorite(): Promise<void> {
  if (isFavoriteSubmitting.value) {
    return
  }

  isFavoriteSubmitting.value = true

  try {
    const response = await portalPublicDetailApi.toggleFavorite(
      'topic',
      topicDetail.value?.id || topicId.value
    )

    favorited.value = response.favored
    favoriteCount.value = Math.max(0, favoriteCount.value + (response.favored ? 1 : -1))
  } catch {
    ElMessage.error('当前游戏暂时无法收藏')
  } finally {
    isFavoriteSubmitting.value = false
  }
}

async function handleResourceAction(): Promise<void> {
  if (resourceState.value === 'locked') {
    await openLoginDialog()
    return
  }

  if (!topicDownloadUrl.value) {
    ElMessage.warning('暂未提供可领取资源')
    return
  }

  triggerUrlDownload(topicDownloadUrl.value, topicDownloadFileName.value)
}

async function handleAction(action: PublicDetailActionItem): Promise<void> {
  if (action.protected && !isAuthenticated.value) {
    await openLoginDialog()
    return
  }

  if (action.key === 'favorite') {
    await toggleTopicFavorite()
    return
  }

  await copyCurrentTopicLink()
}
</script>

<style scoped>
.portal-topic-detail-page {
  width: min(var(--portal-detail-stage-max-width), 100%);
  margin: 0 auto;
  padding: var(--portal-stage-padding-top) var(--portal-stage-padding-inline) 0;
  display: grid;
  gap: var(--portal-detail-stage-gap);
}

.portal-topic-detail-page__content {
  display: grid;
  gap: var(--portal-detail-stage-gap);
  min-width: 0;
}

.portal-topic-detail-page :deep(.portal-request-boundary__state) {
  --portal-request-boundary-accent: var(--home-business-topic-accent);
  min-height: 280px;
  padding: var(--portal-boundary-panel-padding-block) var(--portal-boundary-panel-padding-inline);
  border: 1px solid
    color-mix(
      in srgb,
      var(--portal-request-boundary-accent) 14%,
      var(--portal-request-state-border)
    );
  border-radius: 24px;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--portal-request-boundary-accent) 10%, transparent),
      transparent 74%
    ),
    var(--portal-request-state-bg);
  box-shadow: var(--portal-request-state-shadow);
}

.portal-topic-detail-page__layout {
  display: grid;
  grid-template-columns: var(--portal-detail-layout-columns);
  gap: var(--home-detail-column-gap);
  align-items: start;
}

.portal-topic-detail-page__body-panel {
  --portal-topic-detail-body-max-width: 772px;
  --portal-topic-detail-shell-width: 936px;
  --portal-topic-detail-section-gap: var(--home-detail-main-section-gap);
  --public-detail-comments-gap-before: var(--portal-topic-detail-section-gap);
  --public-detail-comments-divider-gap: var(--home-detail-comments-divider-gap);
  --public-detail-panel-padding-override: var(--home-detail-main-panel-padding-top)
    var(--home-detail-main-panel-padding-inline) var(--home-detail-main-panel-padding-bottom);
  display: grid;
  justify-items: center;
  align-content: start;
}

.portal-topic-detail-page__detail-head {
  width: min(100%, var(--portal-topic-detail-shell-width));
  margin-bottom: var(--portal-topic-detail-section-gap);
}

.portal-topic-detail-page__body {
  --public-detail-rich-text-max-width: var(--portal-topic-detail-body-max-width);
  --public-detail-rich-text-outset: var(--home-detail-rich-text-outset);
  --public-detail-rich-text-flow-space: 12px;
  --public-detail-rich-text-flow-space-lg: 18px;
  --public-detail-rich-text-heading-top-lg: 24px;
  --public-detail-rich-text-heading-top-md: 20px;
  --public-detail-rich-text-intro-size: 18px;
  --public-detail-rich-text-intro-line-height: 1.74;
}

.portal-topic-detail-page__side {
  position: sticky;
  top: var(--portal-detail-sticky-top);
  display: grid;
  gap: var(--home-detail-side-stack-gap);
  align-content: start;
}

.portal-topic-detail-page__resource-panel {
  display: grid;
  gap: 12px;
}
</style>
