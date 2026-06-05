<template>
  <portal-request-boundary
    class="portal-book-detail-page"
    :mode="bookBoundaryMode"
    :error-code="bookErrorCode"
    primary-label="重试"
    @primary="handleBookRetry"
  >
    <template #loading>
      <public-detail-loading-state variant="book" />
    </template>

    <div class="portal-book-detail-page__content">
      <section class="portal-book-detail-page__layout">
        <public-detail-panel
          as="article"
          class="portal-book-detail-page__body-panel"
          padding="none"
          variant="main"
        >
          <section class="portal-book-detail-page__showcase">
            <div class="portal-book-detail-page__showcase-media">
              <div class="portal-book-detail-page__cover-stage">
                <span
                  class="portal-book-detail-page__cover-stack portal-book-detail-page__cover-stack--back"
                />
                <span
                  class="portal-book-detail-page__cover-stack portal-book-detail-page__cover-stack--mid"
                />

                <div
                  class="portal-book-detail-page__cover-shell"
                  :class="{ 'is-empty': !bookCoverUrl }"
                >
                  <portal-image
                    v-if="bookCoverUrl"
                    :src="bookCoverUrl"
                    class="portal-book-detail-page__cover-image"
                    fit="cover"
                    :alt="bookTitle"
                  />
                  <div v-else class="portal-book-detail-page__cover-placeholder">
                    <span class="portal-book-detail-page__cover-mark">BOOK</span>
                    <strong>{{ bookTitle }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div class="portal-book-detail-page__showcase-body">
              <div class="portal-book-detail-page__showcase-copy">
                <h1 class="portal-book-detail-page__showcase-title">{{ bookTitle }}</h1>
                <p class="portal-book-detail-page__showcase-author">作者 {{ bookAuthorLabel }}</p>
              </div>

              <div
                v-if="bookTagGroups.length > 0 || statusDetailText"
                class="portal-book-detail-page__showcase-meta"
              >
                <div
                  v-if="bookTagGroups.length > 0"
                  class="portal-book-detail-page__detail-list portal-book-detail-page__detail-list--tags"
                >
                  <div
                    v-for="group in bookTagGroups"
                    :key="group.key"
                    class="portal-book-detail-page__detail-row"
                  >
                    <span class="portal-book-detail-page__detail-label">{{ group.label }}</span>
                    <div
                      class="portal-book-detail-page__detail-value portal-book-detail-page__detail-value--tags"
                    >
                      <span
                        v-for="tag in group.tags"
                        :key="`${group.key}-${tag}`"
                        class="portal-book-detail-page__tag"
                        :class="
                          group.tone === 'primary'
                            ? 'portal-book-detail-page__tag--primary'
                            : 'portal-book-detail-page__tag--style'
                        "
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>
                </div>

                <div v-if="statusDetailText" class="portal-book-detail-page__detail-row">
                  <span class="portal-book-detail-page__detail-label">状态</span>
                  <p class="portal-book-detail-page__status-line">
                    {{ statusDetailText }}
                  </p>
                </div>
              </div>

              <div
                v-if="introPreviewText"
                class="portal-book-detail-page__detail-row portal-book-detail-page__detail-row--intro"
              >
                <span class="portal-book-detail-page__detail-label">简介</span>
                <div
                  class="portal-book-detail-page__detail-value portal-book-detail-page__showcase-intro"
                >
                  <p
                    class="portal-book-detail-page__showcase-intro-copy"
                    :class="{ 'is-expanded': introExpanded }"
                  >
                    {{ introPreviewText }}
                  </p>

                  <button
                    v-if="showIntroToggle"
                    type="button"
                    class="portal-book-detail-page__section-toggle"
                    @click="toggleIntroExpanded"
                  >
                    {{ introExpanded ? '收起内容' : '展开更多' }}
                  </button>
                </div>
              </div>

              <div class="portal-book-detail-page__showcase-footer">
                <public-detail-action-panel
                  class="portal-book-detail-page__showcase-actions"
                  :actions="resolvedActions"
                  accent="book"
                  :is-authenticated="isAuthenticated"
                  @action="handleAction"
                />

                <div class="portal-book-detail-page__showcase-stats">
                  <span
                    v-for="stat in bookStats"
                    :key="stat.iconName"
                    class="portal-book-detail-page__showcase-stat"
                    :aria-label="`${stat.label} ${stat.value}`"
                    :title="`${stat.label} ${stat.value}`"
                  >
                    <portal-svg-icon :name="stat.iconName" size="1.6rem" aria-hidden="true" />
                    <strong>{{ stat.value }}</strong>
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section
            v-if="selectedChapterItems.length > 0"
            class="portal-book-detail-page__section portal-book-detail-page__section--chapters"
          >
            <div class="portal-book-detail-page__section-head">
              <public-detail-section-heading
                icon-name="detail-related"
                title="章节列表"
                tone="book"
              />

              <div
                class="portal-book-detail-page__chapter-groups"
                role="tablist"
                aria-label="章节分组"
              >
                <button
                  v-for="group in chapterGroups"
                  :key="group.key"
                  type="button"
                  class="portal-book-detail-page__chapter-group"
                  :class="{ 'is-active': group.key === selectedChapterGroupKey }"
                  role="tab"
                  :aria-selected="group.key === selectedChapterGroupKey"
                  @click="selectedChapterGroupKey = group.key"
                >
                  {{ group.label }}
                </button>
              </div>
            </div>

            <div class="portal-book-detail-page__chapter-list">
              <router-link
                v-for="chapter in selectedChapterItems"
                :key="chapter.id"
                :title="chapter.title?.trim() || resolveUntitledChapterTitle(chapter.order)"
                class="portal-book-detail-page__chapter"
                :to="resolveChapterReaderLocation(chapter)"
              >
                <strong>{{
                  chapter.title?.trim() || resolveUntitledChapterTitle(chapter.order)
                }}</strong>
              </router-link>
            </div>
          </section>

          <public-detail-comment-anchor
            :anchor-id="COMMENTS_ANCHOR_ID"
            :discussion-count="discussionCount"
            :interactive="Boolean(bookDetail)"
            :is-authenticated="isAuthenticated"
            :login-location="loginPromptTarget"
            :target-id="bookDetail?.id || bookId"
            target-type="book"
            tone="bookshelf"
            @discussion-count-change="handleDiscussionCountChange"
          />
        </public-detail-panel>

        <aside class="portal-book-detail-page__side">
          <public-detail-side-rail class="portal-book-detail-page__side-rail">
            <public-detail-related-section
              class="public-detail-side-rail__section"
              accent="book"
              :boundary-error-code="relatedErrorCode"
              :boundary-mode="relatedBoundaryMode"
              @primary="handleBookRetry"
            >
              <public-detail-related-media-card
                v-for="related in relatedItems"
                :key="related.id"
                accent="book"
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
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { useUserStore } from '@frontend/store'

import { PORTAL_BOOK_READER_ROUTE_NAME } from '@/constants/portal-business'
import {
  createBookDetailActions,
  resolvePublicBookAreaLabel,
  resolvePublicBookPartLabel,
  resolvePublicBookStatusLabel,
  type PublicDetailActionItem
} from '@/constants/public-detail'
import {
  portalPublicDetailApi,
  resolvePublicDetailFavoriteState,
  resolvePublicDetailMediaUrl,
  type PublicBookDetailPageData
} from '@/api/public-detail'
import PublicDetailCommentAnchor from '@/views/public/components/comments/PublicDetailCommentAnchor.vue'
import PublicDetailActionPanel from '@/views/public/components/hero/PublicDetailActionPanel.vue'
import PublicDetailPanel from '@/views/public/components/layout/PublicDetailPanel.vue'
import PublicDetailSectionHeading from '@/views/public/components/layout/PublicDetailSectionHeading.vue'
import PublicDetailSideRail from '@/views/public/components/layout/PublicDetailSideRail.vue'
import PublicDetailLoadingState from '@/views/public/components/loading/PublicDetailLoadingState.vue'
import PublicDetailRelatedMediaCard from '@/views/public/components/side/PublicDetailRelatedMediaCard.vue'
import PublicDetailRelatedSection from '@/views/public/components/side/PublicDetailRelatedSection.vue'
import { useCopyFeedback } from '@/views/public/composables/useCopyFeedback'
import { usePublicDetailReloadTriggers } from '@/views/public/composables/usePublicDetailReloadTriggers'
import { usePublicDetailRequestState } from '@/views/public/composables/usePublicDetailRequestState'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import { buildProtectedAuthDialogLocation } from '@/utils/auth-dialog'
import {
  copyTextToClipboard,
  formatCompactCount,
  formatUnixTimestampLabel,
  normalizeCopyableUrl,
  resolvePortalContentDetailLocation
} from '@/utils/content'
import { resolvePublicBookDisplayTagLabels } from '@/utils/public-book-tags'

const COMMENTS_ANCHOR_ID = 'book-comments-anchor'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const bookData = ref<PublicBookDetailPageData | null>(null)
const introExpanded = ref(false)
const isFavoriteSubmitting = ref(false)
const favorited = ref(false)
const favoriteCount = ref(0)
const relatedLoadFailed = ref(false)
const relatedErrorCode = ref<401 | 403 | 404 | 500>(500)
const selectedChapterGroupKey = ref('')
const { copied, markCopied } = useCopyFeedback()
const {
  boundaryMode: bookBoundaryMode,
  beginLoad: beginBookLoad,
  errorCode: bookErrorCode,
  isLatestLoad: isLatestBookLoad,
  setErrorMode: setBookErrorMode,
  setLiveMode: setBookLiveMode
} = usePublicDetailRequestState()

const bookId = computed(() => (typeof route.params.id === 'string' ? route.params.id.trim() : ''))
const isAuthenticated = computed(() => Boolean(userStore.profile?.id))
const loginPromptTarget = computed(() => buildProtectedAuthDialogLocation(route, 'login'))
const bookDetail = computed(() => bookData.value?.detail ?? null)
const bookTitle = computed(
  () => bookDetail.value?.title?.trim() || bookDetail.value?.name?.trim() || '未命名书库'
)
const bookCoverUrl = computed(() => resolvePublicDetailMediaUrl(bookDetail.value?.coverMedia))
const bookAuthorLabel = computed(() => {
  const names = bookDetail.value?.authorNames ?? bookDetail.value?.author ?? []
  const normalizedNames = names.map((name) => name.trim()).filter(Boolean)

  return normalizedNames.length > 0 ? normalizedNames.join(' / ') : '匿名整理'
})
const bookPartLabel = computed(() => resolvePublicBookPartLabel(bookDetail.value?.part))
const bookAreaLabel = computed(() => resolvePublicBookAreaLabel(bookDetail.value?.area))
const bookStatusLabel = computed(() => resolvePublicBookStatusLabel(bookDetail.value?.status))
const bookTagLabels = computed(() => {
  return resolvePublicBookDisplayTagLabels({
    tags: bookDetail.value?.tags,
    styles: bookDetail.value?.style,
    excludedLabels: [bookPartLabel.value, bookAreaLabel.value],
    limit: 4
  })
})
const releaseTimeLabel = computed(() => formatUnixTimestampLabel(bookDetail.value?.releaseTime))
const updateTimeLabel = computed(() => formatUnixTimestampLabel(bookDetail.value?.updateTime))
const discussionCount = computed(() => Math.max(0, bookDetail.value?.replyCount ?? 0))
const isBookCompleted = computed(() => bookDetail.value?.status === 2)
const bookStats = computed(() => [
  {
    iconName: 'view' as const,
    label: '浏览',
    value: formatCompactCount(bookDetail.value?.viewCount ?? 0)
  },
  {
    iconName: 'favorite' as const,
    label: '收藏',
    value: formatCompactCount(favoriteCount.value)
  },
  {
    iconName: 'message' as const,
    label: '评论',
    value: formatCompactCount(discussionCount.value)
  }
])
const introParagraphs = computed(() => {
  const paragraphs = [bookDetail.value?.summary, bookDetail.value?.desc]
    .flatMap((value) => (value?.split(/\n{2,}/) ?? []).map((item) => item.trim()))
    .filter(Boolean)

  return Array.from(new Set(paragraphs))
})
const introPreviewText = computed(() => introParagraphs.value.join('\n\n'))
const showIntroToggle = computed(
  () => introPreviewText.value.length > 100 || introParagraphs.value.length > 1
)
const chapterItems = computed(() =>
  [...(bookDetail.value?.chapterList ?? [])].sort((left, right) => left.order - right.order)
)
const chapterCount = computed(() => bookDetail.value?.total ?? chapterItems.value.length ?? 0)
const bookTagGroups = computed(() =>
  [
    {
      key: 'part',
      label: '类型',
      tags: bookPartLabel.value ? [bookPartLabel.value] : [],
      tone: 'primary' as const
    },
    {
      key: 'area',
      label: '地区',
      tags: bookAreaLabel.value ? [bookAreaLabel.value] : [],
      tone: 'primary' as const
    },
    {
      key: 'tags',
      label: '标签',
      tags: bookTagLabels.value,
      tone: 'style' as const
    }
  ].filter((group) => group.tags.length > 0)
)
const statusDetailText = computed(() => {
  const segments: string[] = []

  if (bookStatusLabel.value) {
    segments.push(bookStatusLabel.value)
  }

  if (chapterCount.value > 0) {
    segments.push(`${isBookCompleted.value ? '共' : '更新至'} ${chapterCount.value} 章`)
  }

  if (!isBookCompleted.value) {
    const activeTimeLabel = updateTimeLabel.value || releaseTimeLabel.value

    if (activeTimeLabel) {
      segments.push(activeTimeLabel)
    }
  }

  return segments.join(' · ')
})
const chapterGroups = computed(() => {
  const groupSize = 50
  const groups: Array<{ key: string; label: string; items: typeof chapterItems.value }> = []

  for (let index = 0; index < chapterItems.value.length; index += groupSize) {
    const items = chapterItems.value.slice(index, index + groupSize)
    const firstOrder = items[0]?.order ?? index + 1
    const lastOrder = items[items.length - 1]?.order ?? firstOrder

    groups.push({
      key: `${firstOrder}-${lastOrder}`,
      label: `${resolveChapterOrderLabel(firstOrder)} - ${resolveChapterOrderLabel(lastOrder)}`,
      items
    })
  }

  return groups
})
const selectedChapterGroup = computed(
  () =>
    chapterGroups.value.find((group) => group.key === selectedChapterGroupKey.value) ??
    chapterGroups.value[0] ??
    null
)
const selectedChapterItems = computed(() =>
  selectedChapterGroup.value ? [...selectedChapterGroup.value.items] : []
)
const relatedItems = computed(() =>
  (bookData.value?.related ?? [])
    .filter((related) => related.id !== bookDetail.value?.id)
    .slice(0, 4)
    .map((related) => ({
      id: related.id,
      title: related.title?.trim() || '',
      summary: related.summary?.trim() || '',
      tags: [
        related.tags?.[0]?.trim() || bookPartLabel.value,
        related.tags?.[1]?.trim() || bookAreaLabel.value
      ].filter(Boolean),
      publishTime: related.publishTime || '',
      coverUrl: resolvePublicDetailMediaUrl(related.cover),
      to: resolvePortalContentDetailLocation('book', related.id)
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
const resolvedActions = computed(() =>
  createBookDetailActions().map((action) => ({
    ...action,
    active: action.key === 'favorite' ? favorited.value : false,
    label: resolveActionLabel(action)
  }))
)
const bookDocumentTitle = computed(() => (bookDetail.value ? bookTitle.value : '书库详情'))

useDocumentTitle(bookDocumentTitle)

watch(
  chapterGroups,
  (groups) => {
    if (!groups.some((group) => group.key === selectedChapterGroupKey.value)) {
      selectedChapterGroupKey.value = groups[0]?.key ?? ''
    }
  },
  {
    immediate: true
  }
)

function resolveActionLabel(action: PublicDetailActionItem): string {
  if (action.key === 'favorite' && favorited.value) {
    return '已收藏书库'
  }

  if (action.key === 'share' && copied.value) {
    return '链接已复制'
  }

  return action.label
}

function resolveChapterOrderLabel(order: number): string {
  return String(Math.max(order, 1)).padStart(3, '0')
}

function resolveUntitledChapterTitle(order: number): string {
  return `第 ${resolveChapterOrderLabel(order)} 章`
}

function resolveChapterReaderLocation(chapter: { id: number }) {
  return {
    name: PORTAL_BOOK_READER_ROUTE_NAME,
    params: {
      id: bookId.value,
      chapterId: String(chapter.id)
    }
  }
}

function toggleIntroExpanded(): void {
  introExpanded.value = !introExpanded.value
}

async function loadBookDetail(): Promise<void> {
  const loadToken = beginBookLoad()
  bookData.value = null
  introExpanded.value = false
  relatedLoadFailed.value = false
  relatedErrorCode.value = 500

  if (!bookId.value) {
    setBookErrorMode(404)
    favorited.value = false
    favoriteCount.value = 0
    return
  }

  const result = await portalPublicDetailApi.getBookDetailPageData(bookId.value)

  if (!isLatestBookLoad(loadToken)) {
    return
  }

  if (!result.data) {
    setBookErrorMode(result.meta.detailErrorCode ?? 500)
    favorited.value = false
    favoriteCount.value = 0
    return
  }

  const nextData = result.data
  const favoriteState = resolvePublicDetailFavoriteState(nextData.detail)
  bookData.value = nextData
  setBookLiveMode()
  favorited.value = favoriteState.favorited
  favoriteCount.value = favoriteState.favoriteCount
  relatedLoadFailed.value = result.meta.relatedError
  relatedErrorCode.value = result.meta.relatedErrorCode ?? 500
}

usePublicDetailReloadTriggers(bookId, loadBookDetail)

function handleBookRetry(): void {
  void loadBookDetail()
}

async function openLoginDialog(): Promise<void> {
  await router.push(loginPromptTarget.value)
}

function handleDiscussionCountChange(delta: number): void {
  if (!bookData.value?.detail) {
    return
  }

  bookData.value.detail.replyCount = Math.max(0, (bookData.value.detail.replyCount ?? 0) + delta)
}

async function copyCurrentBookLink(): Promise<void> {
  const copiedToClipboard = await copyTextToClipboard(normalizeCopyableUrl(route.fullPath))

  if (!copiedToClipboard) {
    ElMessage.warning('当前页面链接暂时无法复制')
    return
  }

  markCopied()
}

async function toggleBookFavorite(): Promise<void> {
  if (isFavoriteSubmitting.value) {
    return
  }

  isFavoriteSubmitting.value = true

  try {
    const response = await portalPublicDetailApi.toggleFavorite(
      'book',
      bookDetail.value?.id || bookId.value
    )

    favorited.value = response.favored
    favoriteCount.value = Math.max(0, favoriteCount.value + (response.favored ? 1 : -1))
  } catch {
    ElMessage.error('当前书库暂时无法收藏')
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
    await toggleBookFavorite()
    return
  }

  await copyCurrentBookLink()
}
</script>

<style scoped>
.portal-book-detail-page {
  width: min(var(--portal-detail-stage-max-width), 100%);
  margin: 0 auto;
  padding: var(--portal-stage-padding-top) var(--portal-stage-padding-inline) 0;
  display: grid;
  gap: var(--portal-detail-stage-gap);
}

.portal-book-detail-page__content {
  display: grid;
  gap: var(--portal-detail-stage-gap);
  min-width: 0;
}

.portal-book-detail-page :deep(.portal-request-boundary__state) {
  --portal-request-boundary-accent: var(--home-business-bookshelf-accent);
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

.portal-book-detail-page__layout {
  display: grid;
  grid-template-columns: var(--portal-detail-layout-columns);
  gap: var(--home-detail-column-gap);
  align-items: start;
}

.portal-book-detail-page__body-panel {
  --portal-book-detail-shell-width: 936px;
  --portal-book-detail-section-gap: 24px;
  --public-detail-comments-gap-before: 0;
  --public-detail-comments-divider-gap: var(--home-detail-comments-divider-gap);
  --public-detail-panel-padding-override: var(--home-detail-main-panel-padding-top)
    var(--home-detail-main-panel-padding-inline) var(--home-detail-main-panel-padding-bottom);
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 0;
}

.portal-book-detail-page__showcase,
.portal-book-detail-page__section {
  width: min(100%, var(--portal-book-detail-shell-width));
}

.portal-book-detail-page__showcase {
  display: grid;
  grid-template-columns: minmax(212px, 252px) minmax(0, 1fr);
  gap: 24px;
  padding-bottom: 20px;
  align-items: stretch;
}

.portal-book-detail-page__showcase-media {
  display: grid;
  align-content: start;
  gap: 16px;
}

.portal-book-detail-page__cover-stage {
  position: relative;
  min-height: 364px;
  padding: 8px 0 12px 10px;
}

.portal-book-detail-page__cover-stack {
  position: absolute;
  border: 1px solid var(--home-bookshelf-stack-border);
  border-radius: 26px;
  background: var(--home-bookshelf-stack-a);
  box-shadow: var(--home-bookshelf-stack-shadow);
}

.portal-book-detail-page__cover-stack--back {
  inset: 20px 24px 0 6px;
  opacity: 0.54;
  transform: rotate(-5deg);
}

.portal-book-detail-page__cover-stack--mid {
  inset: 12px 12px 8px 10px;
  background: var(--home-bookshelf-stack-b);
  opacity: 0.72;
  transform: rotate(-2deg);
}

.portal-book-detail-page__cover-shell {
  position: relative;
  z-index: 2;
  width: 100%;
  aspect-ratio: 0.72;
  border: 1px solid var(--home-bookshelf-cover-border);
  border-radius: 26px;
  background: var(--home-bookshelf-media-bg);
  box-shadow: var(--home-bookshelf-cover-shadow);
  overflow: hidden;
}

.portal-book-detail-page__cover-shell::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, var(--home-bookshelf-cover-sheen), transparent 30%),
    var(--home-bookshelf-media-overlay);
  pointer-events: none;
}

.portal-book-detail-page__cover-shell.is-empty {
  display: grid;
  place-items: center;
  background:
    linear-gradient(
      165deg,
      color-mix(in srgb, var(--home-business-bookshelf-accent) 22%, white 78%),
      color-mix(in srgb, var(--home-business-bookshelf-accent-soft) 16%, white 84%)
    ),
    var(--home-bookshelf-media-bg);
}

.portal-book-detail-page__cover-image {
  width: 100%;
  height: 100%;
}

.portal-book-detail-page__cover-placeholder {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: end;
  gap: 14px;
  width: 100%;
  height: 100%;
  padding: 22px;
}

.portal-book-detail-page__cover-placeholder strong {
  display: -webkit-box;
  overflow: hidden;
  color: color-mix(in srgb, var(--home-ink) 92%, transparent);
  font-size: 18px;
  line-height: 1.44;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.portal-book-detail-page__cover-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  height: 26px;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, var(--home-bookshelf-cover-mark-border) 88%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--home-bookshelf-cover-mark-bg) 88%, transparent);
  color: var(--home-detail-glass-ink);
  font-size: 12px;
  font-weight: 700;
  line-height: 26px;
  letter-spacing: 0.08em;
}

.portal-book-detail-page__showcase-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  min-height: 100%;
  padding-top: 12px;
}

.portal-book-detail-page__showcase-copy {
  display: grid;
  gap: 8px;
  order: 1;
}

.portal-book-detail-page__showcase-title {
  margin: 0;
  color: var(--home-ink);
  font-size: 28px;
  line-height: 1.14;
  letter-spacing: 0;
}

.portal-book-detail-page__showcase-author {
  margin: 0;
  color: color-mix(in srgb, var(--home-muted) 84%, transparent);
  font-size: 14px;
  line-height: 1.6;
}

.portal-book-detail-page__showcase-meta {
  display: grid;
  gap: 14px;
  order: 2;
}

.portal-book-detail-page__detail-list {
  display: grid;
  gap: 14px;
}

.portal-book-detail-page__detail-row {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 6px;
  align-items: center;
}

.portal-book-detail-page__detail-label {
  color: var(--home-detail-info-row-label-ink);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.7;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.portal-book-detail-page__detail-value {
  min-width: 0;
}

.portal-book-detail-page__detail-row--intro {
  align-items: start;
  order: 3;
}

.portal-book-detail-page__detail-row--intro .portal-book-detail-page__detail-label {
  color: color-mix(in srgb, var(--home-ink) 90%, transparent);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.72;
  letter-spacing: 0;
}

.portal-book-detail-page__detail-value--tags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.portal-book-detail-page__tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 26px;
  white-space: nowrap;
}

.portal-book-detail-page__tag--primary {
  border: 1px solid color-mix(in srgb, var(--home-business-bookshelf-tag-border) 90%, transparent);
  background: color-mix(in srgb, var(--home-business-bookshelf-tag-bg) 94%, transparent);
  color: color-mix(in srgb, var(--home-business-bookshelf-tag-ink) 94%, transparent);
}

.portal-book-detail-page__tag--style {
  border: 1px solid color-mix(in srgb, var(--home-feature-tag-soft-border) 90%, transparent);
  background: color-mix(in srgb, var(--home-feature-tag-soft-bg) 96%, transparent);
  color: color-mix(in srgb, var(--home-feature-tag-soft-ink) 92%, transparent);
}

.portal-book-detail-page__showcase-intro {
  display: grid;
  gap: 10px;
}

.portal-book-detail-page__showcase-intro-copy {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: color-mix(in srgb, var(--home-ink) 92%, transparent);
  font-size: 14px;
  line-height: 1.72;
  white-space: pre-line;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.portal-book-detail-page__showcase-intro-copy.is-expanded {
  display: block;
}

.portal-book-detail-page__showcase-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px 14px;
  flex-wrap: wrap;
  margin-top: auto;
  order: 4;
}

.portal-book-detail-page__showcase-actions {
  flex: 0 0 auto;
  min-width: 0;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.portal-book-detail-page__showcase-stats {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  align-self: flex-end;
  gap: 10px 16px;
  min-width: 0;
  flex: 1 1 auto;
  flex-wrap: wrap;
}

.portal-book-detail-page__showcase-stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: color-mix(in srgb, var(--home-muted) 84%, transparent);
  font-size: 13px;
  line-height: 1;
  white-space: nowrap;
}

.portal-book-detail-page__showcase-stat strong {
  color: var(--home-ink);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.1;
}

.portal-book-detail-page__status-line {
  margin: 0;
  color: color-mix(in srgb, var(--home-muted) 86%, transparent);
  font-size: 13px;
  line-height: 1.7;
}

.portal-book-detail-page__section {
  display: grid;
  gap: 18px;
  padding-bottom: var(--portal-book-detail-section-gap);
}

.portal-book-detail-page__section--chapters {
  padding-top: 14px;
}

.portal-book-detail-page__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.portal-book-detail-page__section-head :deep(.public-detail-section-heading) {
  flex-shrink: 0;
}

.portal-book-detail-page__section-toggle {
  min-height: 34px;
  padding: 0 16px;
  border: 1px solid color-mix(in srgb, var(--home-detail-button-border) 86%, transparent);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.04)),
    color-mix(in srgb, var(--home-detail-card-bg) 86%, white 14%);
  color: color-mix(in srgb, var(--home-ink) 82%, white 18%);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.portal-book-detail-page__chapter-groups {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.portal-book-detail-page__chapter-group {
  min-height: 32px;
  padding: 0 14px;
  border: 1px solid color-mix(in srgb, var(--home-detail-button-border) 84%, transparent);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.03)),
    color-mix(in srgb, var(--home-detail-card-bg) 88%, white 12%);
  color: color-mix(in srgb, var(--home-ink) 82%, transparent);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.portal-book-detail-page__chapter-group.is-active {
  border-color: color-mix(in srgb, var(--home-business-bookshelf-tag-border) 90%, transparent);
  background: color-mix(in srgb, var(--home-business-bookshelf-tag-bg) 92%, transparent);
  color: color-mix(in srgb, var(--home-business-bookshelf-tag-ink) 96%, transparent);
}

.portal-book-detail-page__chapter-list {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.portal-book-detail-page__chapter {
  display: grid;
  align-items: center;
  min-width: 0;
  min-height: 42px;
  padding: 8px 12px;
  border: 1px solid color-mix(in srgb, var(--home-detail-card-border) 88%, transparent);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.02)),
    color-mix(in srgb, var(--home-detail-card-bg) 96%, transparent);
  box-shadow: 0 6px 12px rgba(18, 41, 74, 0.03);
  color: inherit;
  text-decoration: none;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
}

.portal-book-detail-page__chapter:hover,
.portal-book-detail-page__chapter:focus-visible {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--home-business-bookshelf-tag-border) 74%, transparent);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.04)),
    color-mix(in srgb, var(--home-business-bookshelf-tag-bg) 42%, var(--home-detail-card-bg));
  box-shadow: 0 10px 20px rgba(18, 41, 74, 0.06);
}

.portal-book-detail-page__chapter:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px var(--portal-focus-ring),
    0 10px 20px rgba(18, 41, 74, 0.06);
}

.portal-book-detail-page__chapter strong {
  display: block;
  min-width: 0;
  overflow: hidden;
  color: var(--home-ink);
  font-size: 13px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.portal-book-detail-page__side {
  position: sticky;
  top: var(--portal-detail-sticky-top);
  display: grid;
  gap: var(--home-detail-side-stack-gap);
  align-content: start;
}
</style>
