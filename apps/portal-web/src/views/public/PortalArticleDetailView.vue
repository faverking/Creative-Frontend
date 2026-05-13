<template>
  <portal-request-boundary
    class="portal-article-detail-page"
    :mode="articleBoundaryMode"
    :error-code="articleErrorCode"
    primary-label="重试"
    @primary="handleArticleRetry"
  >
    <template #loading>
      <public-detail-loading-state variant="article" />
    </template>

    <div class="portal-article-detail-page__content">
      <section class="portal-article-detail-page__layout">
        <public-detail-panel
          as="article"
          class="portal-article-detail-page__body-panel"
          padding="none"
          variant="main"
        >
          <public-detail-hero
            class="portal-article-detail-page__detail-head"
            accent="article"
            :actions="resolvedActions"
            :cover-alt="articleTitle"
            :cover-url="articleCoverUrl"
            :is-authenticated="isAuthenticated"
            :meta-tag="heroPrimaryTag"
            :title="articleTitle"
            :meta="detailMeta"
            :stats="heroStats"
            @action="handleAction"
          />

          <public-detail-rich-text
            accent="article"
            class="portal-article-detail-page__body"
            :html="articleContentHtml"
          />

          <public-detail-comment-anchor
            :anchor-id="COMMENTS_ANCHOR_ID"
            :discussion-count="discussionCount"
            :interactive="Boolean(articleDetail)"
            :is-authenticated="isAuthenticated"
            :login-location="loginPromptTarget"
            :target-id="articleDetail?.id || articleId"
            target-type="article"
            tone="article"
            @discussion-count-change="handleDiscussionCountChange"
          />
        </public-detail-panel>

        <aside class="portal-article-detail-page__side">
          <public-detail-side-rail class="portal-article-detail-page__side-rail">
            <public-detail-author-section
              class="public-detail-side-rail__section"
              accent="article"
              :avatar-url="authorAvatarUrl"
              :bio="authorBioLabel"
              :name="articleAuthorName"
              :tags="authorStatTags"
            />

            <public-detail-related-section
              class="public-detail-side-rail__section"
              accent="article"
              :boundary-error-code="relatedErrorCode"
              :boundary-mode="relatedBoundaryMode"
              @primary="handleArticleRetry"
            >
              <public-detail-related-media-card
                v-for="related in relatedItems"
                :key="related.id"
                accent="article"
                :cover-url="related.coverUrl"
                :publish-time="related.publishTime"
                :summary="related.summary"
                :tags="related.tags"
                :title="related.title"
                :to="related.to"
              />
            </public-detail-related-section>
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
  createArticleDetailActions,
  resolvePublicArticleThemeLabel,
  type PublicDetailActionItem
} from '@/constants/public-detail'
import {
  portalPublicDetailApi,
  resolvePublicDetailMediaUrl,
  type PublicArticleDetailPageData
} from '@/api/public-detail'
import PublicDetailCommentAnchor from '@/views/public/components/comments/PublicDetailCommentAnchor.vue'
import PublicDetailRichText from '@/views/public/components/content/PublicDetailRichText.vue'
import PublicDetailHero from '@/views/public/components/hero/PublicDetailHero.vue'
import PublicDetailPanel from '@/views/public/components/layout/PublicDetailPanel.vue'
import PublicDetailSideRail from '@/views/public/components/layout/PublicDetailSideRail.vue'
import PublicDetailLoadingState from '@/views/public/components/loading/PublicDetailLoadingState.vue'
import PublicDetailAuthorSection from '@/views/public/components/side/PublicDetailAuthorSection.vue'
import PublicDetailRelatedMediaCard from '@/views/public/components/side/PublicDetailRelatedMediaCard.vue'
import PublicDetailRelatedSection from '@/views/public/components/side/PublicDetailRelatedSection.vue'
import { useCopyFeedback } from '@/views/public/composables/useCopyFeedback'
import { usePublicDetailReloadTriggers } from '@/views/public/composables/usePublicDetailReloadTriggers'
import { usePublicDetailRequestState } from '@/views/public/composables/usePublicDetailRequestState'
import { buildProtectedAuthDialogLocation } from '@/utils/auth-dialog'
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

const COMMENTS_ANCHOR_ID = 'article-comments-anchor'
const ARTICLE_SECTION_LABEL = '文字详情'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const articleData = ref<PublicArticleDetailPageData | null>(null)
const isFavoriteSubmitting = ref(false)
const authorProfileLoadFailed = ref(false)
const favorited = ref(false)
const favoriteCount = ref(0)
const relatedLoadFailed = ref(false)
const relatedErrorCode = ref<401 | 403 | 404 | 500>(500)
const { copied, markCopied } = useCopyFeedback()
const {
  boundaryMode: articleBoundaryMode,
  beginLoad: beginArticleLoad,
  errorCode: articleErrorCode,
  isLatestLoad: isLatestArticleLoad,
  setErrorMode: setArticleErrorMode,
  setLiveMode: setArticleLiveMode
} = usePublicDetailRequestState()

const articleId = computed(() =>
  typeof route.params.id === 'string' ? route.params.id.trim() : ''
)
const isAuthenticated = computed(() => Boolean(userStore.profile?.id))
const loginPromptTarget = computed(() => buildProtectedAuthDialogLocation(route, 'login'))
const articleDetail = computed(() => articleData.value?.detail ?? null)
const articleAuthorProfile = computed(() => articleData.value?.authorProfile ?? null)
const articleTitle = computed(() => articleDetail.value?.title?.trim() || '未命名情报')
const articleCoverUrl = computed(() => resolvePublicDetailMediaUrl(articleDetail.value?.coverMedia))
const articleAuthorName = computed(() =>
  resolveDisplayName(
    articleAuthorProfile.value?.name,
    articleDetail.value?.author?.name,
    '匿名作者'
  )
)
const articleThemeLabel = computed(() =>
  resolvePublicArticleThemeLabel(articleDetail.value?.themeId)
)
const publishTimeLabel = computed(() => formatPublishTimeLabel(articleDetail.value?.postTime))
const heroPrimaryTag = computed(() => ({
  tone: 'primary' as const,
  label: articleThemeLabel.value
}))
const detailMeta = computed(() => [articleAuthorName.value, publishTimeLabel.value].filter(Boolean))
const discussionCount = computed(() => Math.max(0, articleDetail.value?.replyCount ?? 0))
const heroStats = computed(() => [
  {
    iconName: 'view' as const,
    label: '浏览',
    value: formatCompactCount(articleDetail.value?.viewCount ?? 0)
  },
  {
    iconName: 'message' as const,
    label: '回复',
    value: formatCompactCount(articleDetail.value?.replyCount ?? 0)
  },
  {
    iconName: 'favorite' as const,
    label: '收藏',
    value: formatCompactCount(favoriteCount.value)
  }
])
const articleContentHtml = computed(() => normalizeRichTextHtml(articleDetail.value?.content, ''))
const relatedItems = computed(() =>
  (articleData.value?.related ?? [])
    .filter((related) => related.id !== articleDetail.value?.id)
    .slice(0, 3)
    .map((related) => ({
      id: related.id,
      title: related.title?.trim() || '',
      summary: related.summary?.trim() || '',
      coverUrl: resolvePublicDetailMediaUrl(related.cover),
      publishTime: related.publishTime || '',
      tags: [related.tags?.[0]?.trim() || articleThemeLabel.value].filter(Boolean),
      to: resolvePortalContentDetailLocation('article', related.id)
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
const authorBioLabel = computed(() =>
  authorProfileLoadFailed.value
    ? '作者资料暂时不可用。'
    : articleAuthorProfile.value?.bio?.trim() || '这个人还没有留下简介。'
)
const authorStatTags = computed(() =>
  resolveMetricTags([], [articleThemeLabel.value, ARTICLE_SECTION_LABEL])
)
const authorAvatarUrl = computed(
  () => articleAuthorProfile.value?.avatarUrl || articleDetail.value?.author?.avatarUrl || ''
)
const resolvedActions = computed(() =>
  createArticleDetailActions().map((action) => ({
    ...action,
    label: resolveActionLabel(action)
  }))
)

function resolveActionLabel(action: PublicDetailActionItem): string {
  if (action.key === 'favorite' && favorited.value) {
    return '已收藏情报'
  }

  if (action.key === 'share' && copied.value) {
    return '链接已复制'
  }

  return action.label
}

async function loadArticleDetail(): Promise<void> {
  const loadToken = beginArticleLoad()
  articleData.value = null
  authorProfileLoadFailed.value = false
  relatedLoadFailed.value = false
  relatedErrorCode.value = 500

  if (!articleId.value) {
    setArticleErrorMode(404)
    favorited.value = false
    favoriteCount.value = 0
    return
  }

  const result = await portalPublicDetailApi.getArticleDetailPageData(articleId.value)

  if (!isLatestArticleLoad(loadToken)) {
    return
  }

  if (!result.data) {
    setArticleErrorMode(result.meta.detailErrorCode ?? 500)
    favorited.value = false
    favoriteCount.value = 0
    return
  }

  const nextData = result.data
  articleData.value = nextData
  setArticleLiveMode()
  authorProfileLoadFailed.value = result.meta.authorProfileError
  favorited.value = false
  favoriteCount.value = nextData.detail.favorCount ?? 0
  relatedLoadFailed.value = result.meta.relatedError
  relatedErrorCode.value = result.meta.relatedErrorCode ?? 500
}

usePublicDetailReloadTriggers(articleId, loadArticleDetail)

function handleArticleRetry(): void {
  void loadArticleDetail()
}

async function openLoginDialog(): Promise<void> {
  await router.push(loginPromptTarget.value)
}

function handleDiscussionCountChange(delta: number): void {
  if (!articleData.value?.detail) {
    return
  }

  articleData.value.detail.replyCount = Math.max(
    0,
    (articleData.value.detail.replyCount ?? 0) + delta
  )
}

async function copyCurrentArticleLink(): Promise<void> {
  const copiedToClipboard = await copyTextToClipboard(normalizeCopyableUrl(route.fullPath))

  if (!copiedToClipboard) {
    ElMessage.warning('当前页面链接暂时无法复制')
    return
  }

  markCopied()
}

async function toggleArticleFavorite(): Promise<void> {
  if (isFavoriteSubmitting.value) {
    return
  }

  isFavoriteSubmitting.value = true

  try {
    const response = await portalPublicDetailApi.toggleFavorite(
      'article',
      articleDetail.value?.id || articleId.value
    )

    favorited.value = response.favored
    favoriteCount.value = Math.max(0, favoriteCount.value + (response.favored ? 1 : -1))
  } catch {
    ElMessage.error('当前情报暂时无法收藏')
  } finally {
    isFavoriteSubmitting.value = false
  }
}

async function handleAction(action: PublicDetailActionItem): Promise<void> {
  if (action.protected && !isAuthenticated.value) {
    await openLoginDialog()
    return
  }

  if (action.key === 'favorite') {
    await toggleArticleFavorite()
    return
  }

  await copyCurrentArticleLink()
}
</script>

<style scoped>
.portal-article-detail-page {
  width: min(var(--portal-detail-stage-max-width), 100%);
  margin: 0 auto;
  padding: var(--portal-stage-padding-top) var(--portal-stage-padding-inline) 0;
  display: grid;
  gap: var(--portal-detail-stage-gap);
}

.portal-article-detail-page__content {
  display: grid;
  gap: var(--portal-detail-stage-gap);
  min-width: 0;
}

.portal-article-detail-page :deep(.portal-request-boundary__state) {
  --portal-request-boundary-accent: var(--home-business-article-accent);
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

.portal-article-detail-page__layout {
  display: grid;
  grid-template-columns: var(--portal-detail-layout-columns);
  gap: var(--home-detail-column-gap);
  align-items: start;
}

.portal-article-detail-page__body-panel {
  --portal-article-detail-body-max-width: 756px;
  --portal-article-detail-shell-width: 936px;
  --portal-article-detail-section-gap: var(--home-detail-main-section-gap);
  --public-detail-comments-gap-before: var(--portal-article-detail-section-gap);
  --public-detail-comments-divider-gap: var(--home-detail-comments-divider-gap);
  --public-detail-panel-padding-override: var(--home-detail-main-panel-padding-top)
    var(--home-detail-main-panel-padding-inline) var(--home-detail-main-panel-padding-bottom);
  display: grid;
  justify-items: center;
  align-content: start;
}

.portal-article-detail-page__detail-head {
  width: min(100%, var(--portal-article-detail-shell-width));
  margin-bottom: var(--portal-article-detail-section-gap);
}

.portal-article-detail-page__body {
  --public-detail-rich-text-max-width: var(--portal-article-detail-body-max-width);
  --public-detail-rich-text-outset: var(--home-detail-rich-text-outset);
  --public-detail-rich-text-flow-space: 12px;
  --public-detail-rich-text-flow-space-lg: 18px;
  --public-detail-rich-text-heading-top-lg: 24px;
  --public-detail-rich-text-heading-top-md: 20px;
  --public-detail-rich-text-intro-size: 18px;
  --public-detail-rich-text-intro-line-height: 1.74;
}

.portal-article-detail-page__side {
  position: sticky;
  top: var(--portal-detail-sticky-top);
  display: grid;
  gap: var(--home-detail-side-stack-gap);
  align-content: start;
}
</style>
