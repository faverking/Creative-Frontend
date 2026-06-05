<template>
  <portal-request-boundary
    class="portal-gallery-detail-page"
    :mode="galleryBoundaryMode"
    :error-code="galleryErrorCode"
    primary-label="重试"
    @primary="handleGalleryRetry"
  >
    <template #loading>
      <public-detail-loading-state variant="gallery" />
    </template>

    <div class="portal-gallery-detail-page__content">
      <section class="portal-gallery-detail-page__layout">
        <public-detail-panel
          as="div"
          class="portal-gallery-detail-page__viewer"
          padding="none"
          variant="main"
        >
          <public-detail-hero
            class="portal-gallery-detail-page__detail-head"
            accent="gallery"
            :actions="resolvedActions"
            :is-authenticated="isAuthenticated"
            :meta-tag="heroPrimaryTag"
            :title="galleryTitle"
            :meta="detailMeta"
            :stats="heroStats"
            @action="handleAction"
          >
            <template #cover>
              <div class="portal-gallery-detail-page__hero-cover">
                <div class="portal-gallery-detail-page__preview">
                  <el-carousel
                    ref="carouselRef"
                    :autoplay="false"
                    arrow="always"
                    indicator-position="none"
                    height="100%"
                    @change="handleCarouselChange"
                  >
                    <el-carousel-item v-for="(preview, index) in galleryPreviews" :key="preview.id">
                      <button
                        type="button"
                        class="portal-gallery-detail-page__preview-media"
                        :style="
                          galleryPreviewStyle(
                            resolvePreviewDisplayUrl(preview, index),
                            preview.filter
                          )
                        "
                        :aria-label="`${preview.label}，点击全屏查看`"
                        @click="openLightbox(index)"
                      >
                        <span
                          class="portal-gallery-detail-page__preview-media-backdrop"
                          aria-hidden="true"
                        />
                        <portal-image
                          :src="resolvePreviewDisplayUrl(preview, index)"
                          class="portal-gallery-detail-page__preview-media-image"
                          fit="contain"
                        />
                      </button>
                    </el-carousel-item>
                  </el-carousel>

                  <button
                    type="button"
                    class="portal-gallery-detail-page__preview-expand"
                    @click="openLightbox()"
                  >
                    <portal-svg-icon name="detail-preview" size="1.5rem" />
                    <span>全屏查看</span>
                  </button>

                  <div class="portal-gallery-detail-page__preview-label">
                    {{ currentPreviewOrderLabel }}
                  </div>
                </div>

                <div class="portal-gallery-detail-page__preview-footer">
                  <el-scrollbar
                    ref="thumbScrollbarRef"
                    class="portal-gallery-detail-page__thumb-scrollbar"
                    always
                    @wheel.prevent="handleThumbWheel"
                  >
                    <div class="portal-gallery-detail-page__thumb-strip">
                      <button
                        v-for="(preview, index) in galleryPreviews"
                        :key="preview.id"
                        :ref="(element) => setThumbRef(element, index)"
                        type="button"
                        class="portal-gallery-detail-page__thumb-card"
                        :class="{ 'is-active': index === currentPreviewIndex }"
                        :aria-label="preview.label"
                        :aria-pressed="index === currentPreviewIndex"
                        @click="selectPreview(index)"
                      >
                        <portal-image
                          :src="preview.thumbnailUrl"
                          class="portal-gallery-detail-page__thumb-image"
                          :style="galleryImageStyle(preview.filter)"
                        />
                      </button>
                    </div>
                  </el-scrollbar>
                </div>
              </div>
            </template>
          </public-detail-hero>

          <public-detail-comment-anchor
            :anchor-id="COMMENTS_ANCHOR_ID"
            :discussion-count="discussionCount"
            :interactive="Boolean(galleryDetail)"
            :is-authenticated="isAuthenticated"
            :login-location="loginPromptTarget"
            :target-id="galleryDetail?.id || galleryId"
            target-type="image"
            tone="gallery"
            @discussion-count-change="handleDiscussionCountChange"
          />
        </public-detail-panel>

        <aside class="portal-gallery-detail-page__side">
          <public-detail-side-rail class="portal-gallery-detail-page__side-rail">
            <public-detail-author-section
              class="public-detail-side-rail__section"
              accent="gallery"
              :avatar-url="galleryAuthorAvatarUrl"
              :bio="galleryAuthorBio"
              :name="galleryAuthorName"
              :tags="galleryInfoItems.map((item) => item.value)"
            />

            <public-detail-related-section
              class="public-detail-side-rail__section"
              accent="gallery"
              :boundary-error-code="relatedErrorCode"
              :boundary-mode="relatedBoundaryMode"
              :content-gap="12"
              @primary="handleGalleryRetry"
            >
              <public-detail-related-media-card
                v-for="related in relatedItems"
                :key="related.id"
                accent="gallery"
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

      <public-detail-gallery-lightbox
        :open="isLightboxOpen"
        :items="galleryPreviews"
        :current-index="currentPreviewIndex"
        :title="galleryTitle"
        @close="closeLightbox"
        @update:current-index="handleLightboxPreviewChange"
      />
    </div>
  </portal-request-boundary>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, type ComponentPublicInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { useUserStore } from '@frontend/store'

import {
  createGalleryDetailActions,
  type PublicDetailActionItem,
  resolvePublicGalleryThemeLabel
} from '@/constants/public-detail'
import {
  portalPublicDetailApi,
  resolvePublicDetailFavoriteState,
  resolvePublicDetailMediaUrl,
  resolvePublicDetailOriginalMediaUrl,
  type PublicGalleryDetailPageData,
  type PublicMediaAsset
} from '@/api/public-detail'
import PublicDetailCommentAnchor from '@/views/public/components/comments/PublicDetailCommentAnchor.vue'
import PublicDetailGalleryLightbox from '@/views/public/components/hero/PublicDetailGalleryLightbox.vue'
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
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import { buildProtectedAuthDialogLocation } from '@/utils/auth-dialog'
import { normalizeDownloadFileName, triggerBlobDownload } from '@/utils/download'
import {
  buildCssVarsStyle,
  copyTextToClipboard,
  formatCompactCount,
  formatPublishTimeLabel,
  normalizeCopyableUrl,
  resolvePortalContentDetailLocation
} from '@/utils/content'

type CarouselExpose = {
  setActiveItem: (index: number | string) => void
}

type ScrollbarExpose = {
  wrapRef?: HTMLElement | null
}

type GalleryPreviewItem = {
  id: string
  label: string
  imageUrl: string
  thumbnailUrl: string
  copyUrl: string
  mediaId?: string
  filter?: string
}

const COMMENTS_ANCHOR_ID = 'gallery-comments-anchor'
const GALLERY_PREVIEW_FILTERS = [
  'none',
  'hue-rotate(8deg) saturate(1.05)',
  'hue-rotate(-10deg) saturate(1.03)',
  'hue-rotate(16deg) saturate(1.08)',
  'hue-rotate(-14deg) saturate(1.04)',
  'hue-rotate(4deg) saturate(1.06)'
] as const

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const galleryData = ref<PublicGalleryDetailPageData | null>(null)
const carouselRef = ref<CarouselExpose | null>(null)
const thumbScrollbarRef = ref<ScrollbarExpose | null>(null)
const thumbRefs = ref<Array<HTMLElement | null>>([])
const currentPreviewIndex = ref(0)
const isLightboxOpen = ref(false)
const isFavoriteSubmitting = ref(false)
const favorited = ref(false)
const favoriteCount = ref(0)
const relatedLoadFailed = ref(false)
const relatedErrorCode = ref<401 | 403 | 404 | 500>(500)
const { copied, markCopied } = useCopyFeedback()
const {
  boundaryMode: galleryBoundaryMode,
  beginLoad: beginGalleryLoad,
  errorCode: galleryErrorCode,
  isLatestLoad: isLatestGalleryLoad,
  setErrorMode: setGalleryErrorMode,
  setLiveMode: setGalleryLiveMode
} = usePublicDetailRequestState()

const galleryId = computed(() =>
  typeof route.params.id === 'string' ? route.params.id.trim() : ''
)
const isAuthenticated = computed(() => Boolean(userStore.profile?.id))
const loginPromptTarget = computed(() => buildProtectedAuthDialogLocation(route, 'login'))
const galleryDetail = computed(() => galleryData.value?.detail ?? null)
const galleryTitle = computed(() => galleryDetail.value?.title?.trim() || '未命名图包')
const galleryPreviews = computed<GalleryPreviewItem[]>(() => {
  const previewAssets = resolveGalleryPreviewAssets(
    galleryDetail.value?.imageAssets,
    galleryDetail.value?.coverMedia,
    galleryDetail.value?.cover
  )

  return previewAssets.map((asset, index) => {
    const imageUrl = resolvePublicDetailOriginalMediaUrl(asset)
    const thumbnailUrl = resolvePublicDetailMediaUrl(asset) || imageUrl

    return {
      id: `${galleryDetail.value?.id || galleryId.value}-preview-${index + 1}`,
      label: `图包预览 ${String(index + 1).padStart(2, '0')}`,
      imageUrl,
      thumbnailUrl,
      copyUrl: imageUrl,
      ...(asset?.id?.trim() ? { mediaId: asset.id.trim() } : {}),
      filter: GALLERY_PREVIEW_FILTERS[index % GALLERY_PREVIEW_FILTERS.length]
    }
  })
})
const samplePreviewCount = computed(() => galleryPreviews.value.length)
const activePreview = computed(
  () => galleryPreviews.value[currentPreviewIndex.value] ?? galleryPreviews.value[0]
)
const galleryDownloadMediaIds = computed(() =>
  (galleryDetail.value?.imageAssets ?? [])
    .map((asset) => asset.id?.trim() || '')
    .filter((id): id is string => Boolean(id))
)
const galleryArchiveFileName = computed(() =>
  normalizeDownloadFileName(
    `${galleryTitle.value || 'gallery'}-${galleryDetail.value?.total ?? samplePreviewCount.value}P`,
    'gallery-package',
    'zip'
  )
)
const galleryThemeLabel = computed(() =>
  resolvePublicGalleryThemeLabel(galleryDetail.value?.themeId)
)
const galleryAuthorName = computed(
  () => galleryDetail.value?.author?.name?.trim() || '鍖垮悕浣滆€?'
)
const galleryAuthorAvatarUrl = computed(() => galleryDetail.value?.author?.avatarUrl || '')
const gallerySourceLabel = computed(
  () =>
    galleryDetail.value?.source?.trim() || galleryDetail.value?.qualityLabel?.trim() || '公开图包'
)
const publishTimeLabel = computed(() => formatPublishTimeLabel(galleryDetail.value?.uploadTime))
const detailMeta = computed(() =>
  [galleryDetail.value?.author?.name?.trim() || '匿名作者', publishTimeLabel.value].filter(
    (item): item is string => Boolean(item)
  )
)
const currentPreviewOrderLabel = computed(() =>
  formatPreviewOrder(currentPreviewIndex.value + 1, samplePreviewCount.value)
)
const heroPrimaryTag = computed(() => ({
  tone: 'primary' as const,
  label: galleryThemeLabel.value
}))
const discussionCount = computed(() => Math.max(0, galleryDetail.value?.replyCount ?? 0))
const heroStats = computed(() => [
  {
    iconName: 'view' as const,
    label: '浏览',
    value: formatCompactCount(galleryDetail.value?.viewCount ?? 0)
  },
  {
    iconName: 'message' as const,
    label: '回复',
    value: formatCompactCount(discussionCount.value)
  },
  {
    iconName: 'favorite' as const,
    label: '收藏',
    value: formatCompactCount(favoriteCount.value)
  }
])
const galleryResolutionLabel = computed(() => {
  const qualityLabel = galleryDetail.value?.qualityLabel?.trim() || ''
  const resolutionLabel = galleryDetail.value?.resolution?.trim() || ''

  if (qualityLabel && resolutionLabel) {
    return `${qualityLabel} / ${resolutionLabel}`
  }

  return qualityLabel || resolutionLabel || '未提供'
})
const galleryAuthorBio = computed(
  () =>
    galleryDetail.value?.summary?.trim() ||
    galleryDetail.value?.desc?.trim() ||
    galleryDetail.value?.meta?.trim() ||
    `鏀跺綍 ${galleryDetail.value?.total ?? samplePreviewCount.value}P 鍏紑棰勮`
)
const galleryInfoItems = computed(() => [
  { id: 'count', label: '图片数量', value: `${galleryDetail.value?.total ?? 0}P` },
  { id: 'resolution', label: '预览规格', value: galleryResolutionLabel.value },
  { id: 'source', label: '素材来源', value: gallerySourceLabel.value }
])
const relatedItems = computed(() =>
  (galleryData.value?.related ?? [])
    .filter((related) => related.id !== galleryDetail.value?.id)
    .slice(0, 3)
    .map((related) => ({
      id: related.id,
      title: related.title?.trim() || '',
      summary: related.summary?.trim() || '',
      tags: [related.tags?.[0]?.trim() || galleryThemeLabel.value].filter(Boolean),
      publishTime: related.publishTime || '',
      coverUrl: resolvePublicDetailMediaUrl(related.cover),
      to: resolvePortalContentDetailLocation('image', related.id)
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
  createGalleryDetailActions().map((action) => ({
    ...action,
    active: action.key === 'favorite' ? favorited.value : false,
    label: resolveActionLabel(action)
  }))
)
const galleryDocumentTitle = computed(() => (galleryDetail.value ? galleryTitle.value : '图包详情'))

useDocumentTitle(galleryDocumentTitle)

function resolveActionLabel(action: PublicDetailActionItem): string {
  if (action.key === 'favorite' && favorited.value) {
    return '已收藏图包'
  }

  if (action.key === 'share' && copied.value) {
    return '图片地址已复制'
  }

  return action.label
}

watch(
  currentPreviewIndex,
  async () => {
    await nextTick()
    scrollActiveThumbIntoView()
  },
  { immediate: true }
)

function formatPreviewOrder(current: number, total: number): string {
  if (total <= 0) {
    return '0 / 0'
  }

  return `${String(Math.min(Math.max(current, 1), total))} / ${String(total)}`
}

function galleryImageStyle(filter?: string) {
  return buildCssVarsStyle({
    '--portal-gallery-detail-filter': filter
  })
}

function resolvePreviewDisplayUrl(preview: GalleryPreviewItem, index: number): string {
  return index === currentPreviewIndex.value ? preview.imageUrl : preview.thumbnailUrl
}

function galleryPreviewStyle(imageUrl: string, filter?: string) {
  return buildCssVarsStyle({
    '--portal-gallery-detail-filter': filter,
    '--portal-gallery-preview-backdrop-image': imageUrl ? `url("${imageUrl}")` : 'none'
  })
}

function resolveGalleryPreviewAssets(
  imageAssets?: PublicMediaAsset[],
  coverMedia?: PublicMediaAsset | null,
  cover?: string
): PublicMediaAsset[] {
  if (imageAssets?.length) {
    return imageAssets
  }

  const coverUrlCandidate = cover?.trim() || ''

  if (!coverMedia && !coverUrlCandidate) {
    return []
  }

  return [
    {
      ...(coverMedia ?? {}),
      previewPath: coverMedia?.previewPath || coverMedia?.downloadPath || coverUrlCandidate,
      downloadPath: coverMedia?.downloadPath || coverMedia?.previewPath || coverUrlCandidate
    }
  ]
}

function setThumbRef(element: Element | ComponentPublicInstance | null, index: number): void {
  thumbRefs.value[index] = element instanceof HTMLElement ? element : null
}

function scrollActiveThumbIntoView(): void {
  const activeThumb = thumbRefs.value[currentPreviewIndex.value]

  activeThumb?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center'
  })
}

function handleThumbWheel(event: WheelEvent): void {
  const wrap = thumbScrollbarRef.value?.wrapRef

  if (!wrap) {
    return
  }

  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY

  if (!delta) {
    return
  }

  wrap.scrollLeft += delta
}

function setActivePreview(index: number): void {
  carouselRef.value?.setActiveItem(index)
  currentPreviewIndex.value = index
}

function openLightbox(index = currentPreviewIndex.value): void {
  if (galleryPreviews.value.length === 0) {
    return
  }

  setActivePreview(index)
  isLightboxOpen.value = true
}

function closeLightbox(): void {
  isLightboxOpen.value = false
}

function handleLightboxPreviewChange(index: number): void {
  setActivePreview(index)
}

function handleCarouselChange(index: number): void {
  currentPreviewIndex.value = index
}

function selectPreview(index: number): void {
  setActivePreview(index)
}

async function loadGalleryDetail(): Promise<void> {
  const loadToken = beginGalleryLoad()
  galleryData.value = null
  relatedLoadFailed.value = false
  relatedErrorCode.value = 500

  if (!galleryId.value) {
    setGalleryErrorMode(404)
    isLightboxOpen.value = false
    currentPreviewIndex.value = 0
    favorited.value = false
    favoriteCount.value = 0
    thumbRefs.value = []
    return
  }

  const result = await portalPublicDetailApi.getGalleryDetailPageData(galleryId.value)

  if (!isLatestGalleryLoad(loadToken)) {
    return
  }

  if (!result.data) {
    setGalleryErrorMode(result.meta.detailErrorCode ?? 500)
    isLightboxOpen.value = false
    currentPreviewIndex.value = 0
    favorited.value = false
    favoriteCount.value = 0
    thumbRefs.value = []
    return
  }

  const nextData = result.data
  const favoriteState = resolvePublicDetailFavoriteState(nextData.detail)
  galleryData.value = nextData
  setGalleryLiveMode()
  isLightboxOpen.value = false
  currentPreviewIndex.value = 0
  favorited.value = favoriteState.favorited
  favoriteCount.value = favoriteState.favoriteCount
  relatedLoadFailed.value = result.meta.relatedError
  relatedErrorCode.value = result.meta.relatedErrorCode ?? 500
  thumbRefs.value = []

  await nextTick()
  carouselRef.value?.setActiveItem(0)
}

usePublicDetailReloadTriggers(galleryId, loadGalleryDetail)

function handleGalleryRetry(): void {
  void loadGalleryDetail()
}

async function openLoginDialog(): Promise<void> {
  await router.push(loginPromptTarget.value)
}

function handleDiscussionCountChange(delta: number): void {
  if (!galleryData.value?.detail) {
    return
  }

  galleryData.value.detail.replyCount = Math.max(
    0,
    (galleryData.value.detail.replyCount ?? 0) + delta
  )
}

async function handleAction(action: PublicDetailActionItem): Promise<void> {
  if (action.protected && !isAuthenticated.value) {
    await openLoginDialog()
    return
  }

  if (action.key === 'favorite') {
    await toggleGalleryFavorite()
    return
  }

  if (action.key === 'download') {
    await downloadGalleryArchive()
    return
  }

  await copyCurrentPreviewImageUrl()
}

async function toggleGalleryFavorite(): Promise<void> {
  if (isFavoriteSubmitting.value) {
    return
  }

  isFavoriteSubmitting.value = true

  try {
    const response = await portalPublicDetailApi.toggleFavorite(
      'image',
      galleryDetail.value?.id || galleryId.value
    )

    favorited.value = response.favored
    favoriteCount.value = Math.max(0, favoriteCount.value + (response.favored ? 1 : -1))
  } catch {
    ElMessage.error('当前图包暂时无法收藏')
  } finally {
    isFavoriteSubmitting.value = false
  }
}

async function downloadGalleryArchive(): Promise<void> {
  if (galleryDownloadMediaIds.value.length === 0) {
    ElMessage.warning('当前图包暂无可打包下载的原图资源')
    return
  }

  try {
    const archiveBlob = await portalPublicDetailApi.downloadMediaZip({
      mediaIds: galleryDownloadMediaIds.value,
      fileName: galleryArchiveFileName.value
    })

    triggerBlobDownload(archiveBlob, galleryArchiveFileName.value)
  } catch {
    ElMessage.error('图包下载失败，请稍后再试')
  }
}

async function copyCurrentPreviewImageUrl(): Promise<void> {
  const currentPreviewUrl = normalizeCopyableUrl(activePreview.value?.copyUrl?.trim() || '')

  if (!currentPreviewUrl) {
    ElMessage.warning('当前预览图地址暂时无法复制')
    return
  }

  const copiedToClipboard = await copyTextToClipboard(currentPreviewUrl)

  if (!copiedToClipboard) {
    ElMessage.warning('当前预览图地址暂时无法复制')
    return
  }

  markCopied()
}
</script>

<style scoped>
.portal-gallery-detail-page {
  width: min(var(--portal-gallery-detail-stage-max-width), 100%);
  margin: 0 auto;
  padding: var(--portal-stage-padding-top) var(--portal-stage-padding-inline) 0;
  display: grid;
  gap: var(--portal-detail-stage-gap);
}

.portal-gallery-detail-page__content {
  display: grid;
  gap: var(--portal-detail-stage-gap);
  min-width: 0;
}

.portal-gallery-detail-page :deep(.portal-request-boundary__state) {
  --portal-request-boundary-accent: var(--home-business-gallery-accent);
  min-height: 280px;
  padding: var(--portal-boundary-panel-padding-block) var(--portal-boundary-panel-padding-inline);
  border: 1px solid
    color-mix(
      in srgb,
      var(--portal-request-boundary-accent) 14%,
      var(--portal-request-state-border)
    );
  border-radius: var(--home-detail-panel-radius);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--portal-request-boundary-accent) 10%, transparent),
      transparent 74%
    ),
    var(--portal-request-state-bg);
  box-shadow: var(--home-detail-panel-shadow);
}

.portal-gallery-detail-page__layout {
  display: grid;
  grid-template-columns: var(--portal-detail-layout-columns);
  gap: var(--home-detail-column-gap);
  align-items: start;
}

.portal-gallery-detail-page__viewer {
  --portal-gallery-detail-section-gap: 22px;
  --public-detail-comments-gap-before: 0;
  --public-detail-comments-divider-gap: var(--home-detail-comments-divider-gap);
  --public-detail-panel-padding-override: var(--home-detail-main-panel-padding-top)
    var(--home-detail-main-panel-padding-inline) var(--home-detail-main-panel-padding-bottom);
  display: grid;
  gap: 0;
}

.portal-gallery-detail-page__detail-head {
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-bottom: var(--portal-gallery-detail-section-gap);
  border-bottom: 0;
}

.portal-gallery-detail-page__detail-head :deep(.public-detail-hero__body) {
  order: 1;
}

.portal-gallery-detail-page__detail-head :deep(.public-detail-hero__cover-shell) {
  order: 2;
  margin-top: 18px;
  margin-bottom: 0;
}

.portal-gallery-detail-page__hero-cover {
  display: grid;
  gap: 12px;
}

.portal-gallery-detail-page__detail-head :deep(.public-detail-hero__copy) {
  gap: 10px;
  max-width: 860px;
}

.portal-gallery-detail-page__detail-head :deep(.public-detail-hero__meta-stream) {
  gap: 10px 14px;
}

.portal-gallery-detail-page__preview {
  position: relative;
  height: 540px;
  border: 2px solid var(--home-detail-preview-frame-border);
  border-radius: 24px;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--home-detail-preview-label-bg) 22%, transparent),
      transparent 28%
    ),
    var(--home-gallery-tile-bg);
  overflow: hidden;
  isolation: isolate;
  box-shadow:
    0 0 0 4px var(--home-detail-preview-frame-ring),
    var(--home-detail-preview-frame-shadow);
}

.portal-gallery-detail-page__thumb-card::before {
  content: '';
  position: absolute;
  inset: 8px;
  border: 1px solid var(--home-media-frame-border);
  border-radius: inherit;
  opacity: 0.72;
  pointer-events: none;
}

.portal-gallery-detail-page__preview :deep(.el-carousel),
.portal-gallery-detail-page__preview :deep(.el-carousel__container),
.portal-gallery-detail-page__preview :deep(.el-carousel__item) {
  height: 100%;
}

.portal-gallery-detail-page__preview::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 3;
  background: var(--home-detail-preview-sheen);
  pointer-events: none;
}

.portal-gallery-detail-page__preview-media {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  padding: 22px 24px 24px;
  border: 0;
  background: transparent;
  cursor: zoom-in;
  isolation: isolate;
  will-change: transform;
}

.portal-gallery-detail-page__preview-media::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  background: var(--home-detail-preview-overlay);
  pointer-events: none;
}

.portal-gallery-detail-page__preview-media::after {
  content: '';
  position: absolute;
  inset: 18px 20px 20px;
  z-index: 0;
  border: 1px solid color-mix(in srgb, var(--home-detail-preview-frame-border) 22%, transparent);
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--home-detail-card-bg) 92%, white 8%),
    color-mix(in srgb, var(--home-detail-card-bg) 98%, transparent)
  );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
  pointer-events: none;
}

.portal-gallery-detail-page__preview-media-backdrop {
  position: absolute;
  inset: 56px 64px;
  z-index: 0;
  border-radius: 28px;
  background-image: var(--portal-gallery-preview-backdrop-image, none);
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  filter: var(--portal-gallery-detail-filter, none) blur(34px) saturate(1.12);
  opacity: 0.34;
  transform: scale(1.16);
  pointer-events: none;
}

.portal-gallery-detail-page__preview-expand {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid var(--home-detail-button-border);
  border-radius: 999px;
  background: var(--home-detail-button-bg);
  color: var(--home-ink);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  box-shadow: var(--home-detail-button-shadow);
  backdrop-filter: blur(calc(var(--home-panel-blur) * 0.66));
  -webkit-backdrop-filter: blur(calc(var(--home-panel-blur) * 0.66));
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.portal-gallery-detail-page__preview-expand:hover {
  border-color: var(--home-feature-ribbon-border);
  box-shadow: var(--home-detail-preview-label-shadow);
  transform: translateY(-1px);
}

.portal-gallery-detail-page__preview-media-image {
  z-index: 1;
  filter: var(--portal-gallery-detail-filter, none);
}

.portal-gallery-detail-page__preview :deep(.el-carousel__arrow) {
  width: 42px;
  height: 42px;
  border: 1px solid var(--home-detail-button-border);
  background: var(--home-detail-button-bg);
  color: var(--home-ink);
  box-shadow: var(--home-detail-button-shadow);
  backdrop-filter: blur(calc(var(--home-panel-blur) * 0.72));
  -webkit-backdrop-filter: blur(calc(var(--home-panel-blur) * 0.72));
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.portal-gallery-detail-page__preview :deep(.el-carousel__arrow:hover) {
  border-color: var(--home-feature-ribbon-border);
  box-shadow: var(--home-detail-button-shadow);
  transform: translateY(-50%) scale(1.02);
}

.portal-gallery-detail-page__preview :deep(.el-carousel__arrow--left) {
  left: 14px;
}

.portal-gallery-detail-page__preview :deep(.el-carousel__arrow--right) {
  right: 14px;
}

.portal-gallery-detail-page__preview :deep(.el-carousel__arrow i) {
  font-size: 16px;
  font-weight: 700;
}

.portal-gallery-detail-page__preview-label {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  min-height: var(--home-chip-height-sm);
  padding: 0 13px;
  border: 1px solid var(--home-detail-preview-label-border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--home-detail-preview-label-bg) 86%, white 14%);
  color: var(--home-ink);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  font-variant-numeric: tabular-nums;
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--home-detail-thumb-active-ring) 52%, transparent),
    var(--home-detail-preview-label-shadow);
  backdrop-filter: blur(calc(var(--home-panel-blur) * 0.66));
  -webkit-backdrop-filter: blur(calc(var(--home-panel-blur) * 0.66));
}

.portal-gallery-detail-page__preview-footer {
  position: relative;
  padding: 12px 12px 8px;
  border: 1px solid var(--home-detail-card-border);
  border-radius: var(--home-detail-card-radius);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--home-detail-card-bg) 92%, white 8%),
    var(--home-detail-card-bg)
  );
  overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

.portal-gallery-detail-page__preview-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 18px;
  right: 18px;
  height: 1px;
  background: var(--home-detail-footer-highlight);
  pointer-events: none;
}

.portal-gallery-detail-page__thumb-scrollbar {
  width: 100%;
}

.portal-gallery-detail-page__thumb-scrollbar :deep(.el-scrollbar__wrap) {
  overflow-y: hidden;
}

.portal-gallery-detail-page__thumb-scrollbar :deep(.el-scrollbar__bar.is-horizontal) {
  height: 6px;
}

.portal-gallery-detail-page__thumb-scrollbar :deep(.el-scrollbar__thumb) {
  background: var(--home-detail-scrollbar-thumb-bg);
  border: 1px solid var(--home-detail-scrollbar-thumb-border);
  opacity: 1;
}

.portal-gallery-detail-page__thumb-scrollbar :deep(.el-scrollbar__thumb:hover) {
  background: var(--home-detail-scrollbar-thumb-hover-bg);
}

.portal-gallery-detail-page__thumb-strip {
  display: flex;
  gap: 10px;
  width: max-content;
  min-width: 100%;
  padding-bottom: 6px;
}

.portal-gallery-detail-page__thumb-card {
  position: relative;
  flex: 0 0 calc((100% - 50px) / 6);
  min-width: calc((100% - 50px) / 6);
  height: 82px;
  border: 1px solid var(--home-media-panel-border);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 48%), var(--home-gallery-tile-bg);
  overflow: hidden;
  cursor: pointer;
  scroll-snap-align: center;
  opacity: 0.58;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    opacity 180ms ease,
    transform 180ms ease;
}

.portal-gallery-detail-page__thumb-image {
  z-index: 0;
  filter: var(--portal-gallery-detail-filter, none);
}

.portal-gallery-detail-page__thumb-card:hover {
  opacity: 0.84;
  transform: translateY(-1px);
}

.portal-gallery-detail-page__thumb-card:hover .portal-gallery-detail-page__thumb-image {
  filter: var(--portal-gallery-detail-filter, none) saturate(0.98) brightness(0.98);
}

.portal-gallery-detail-page__thumb-card::before {
  opacity: 0.56;
}

.portal-gallery-detail-page__thumb-card.is-active {
  border-color: var(--home-detail-thumb-active-ring);
  opacity: 1;
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--home-detail-thumb-active-ring) 82%, white 18%),
    0 10px 18px color-mix(in srgb, var(--home-detail-thumb-active-glow) 58%, transparent),
    inset 0 0 0 1px rgba(255, 255, 255, 0.16);
  transform: translateY(-2px);
}

.portal-gallery-detail-page__thumb-card.is-active .portal-gallery-detail-page__thumb-image {
  filter: var(--portal-gallery-detail-filter, none) saturate(1.08) brightness(1.04);
}

.portal-gallery-detail-page__thumb-card.is-active::before {
  opacity: 0.92;
  border-color: color-mix(in srgb, var(--home-detail-thumb-active-ring) 72%, white 28%);
}

.portal-gallery-detail-page__side {
  position: sticky;
  top: var(--portal-detail-sticky-top);
  display: grid;
  gap: var(--home-detail-side-stack-gap);
  align-self: start;
  align-content: start;
}
</style>
