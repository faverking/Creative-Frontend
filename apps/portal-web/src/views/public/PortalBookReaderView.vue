<template>
  <portal-request-boundary
    as="section"
    class="portal-book-reader-page"
    :mode="readerBoundaryMode"
    :error-code="readerErrorCode"
    :title="readerErrorTitle"
    primary-label="重试"
    :secondary-label="readerBackLabel"
    @primary="handleReaderRetry"
    @secondary="goBackToBook"
  >
    <template #loading>
      <section
        class="portal-book-reader-page__stage portal-book-reader-page__stage--loading"
        :class="{ 'portal-book-reader-page__stage--comic': isReaderSkeletonComic }"
      >
        <div class="portal-book-reader-page__toolbar">
          <span
            class="portal-book-reader-page__skeleton-block portal-book-reader-page__skeleton-block--back"
          />
          <div class="portal-book-reader-page__skeleton-title-stack">
            <span
              class="portal-book-reader-page__skeleton-line portal-book-reader-page__skeleton-line--title"
            />
            <span
              class="portal-book-reader-page__skeleton-line portal-book-reader-page__skeleton-line--meta"
            />
          </div>
        </div>

        <div class="portal-book-reader-page__loading-tools">
          <template v-if="!isReaderSkeletonComic">
            <span
              class="portal-book-reader-page__skeleton-line portal-book-reader-page__skeleton-line--tool"
            />
            <span
              class="portal-book-reader-page__skeleton-line portal-book-reader-page__skeleton-line--tool"
            />
          </template>
          <span
            class="portal-book-reader-page__skeleton-line portal-book-reader-page__skeleton-line--catalog-button"
          />
          <span
            class="portal-book-reader-page__skeleton-line portal-book-reader-page__skeleton-line--progress-panel"
          />
        </div>

        <div class="portal-book-reader-page__layout portal-book-reader-page__layout--loading">
          <div
            class="portal-book-reader-page__paper portal-book-reader-page__paper--loading"
            :class="{
              'portal-book-reader-page__paper--comic': isReaderSkeletonComic
            }"
          >
            <template v-if="!isReaderSkeletonComic">
              <header class="portal-book-reader-page__paper-head">
                <span
                  class="portal-book-reader-page__skeleton-line portal-book-reader-page__skeleton-line--chapter-meta"
                />
                <span
                  class="portal-book-reader-page__skeleton-line portal-book-reader-page__skeleton-line--chapter-title"
                />
              </header>
              <div class="portal-book-reader-page__skeleton-paragraphs" aria-hidden="true">
                <span
                  v-for="(width, index) in readerSkeletonParagraphWidths"
                  :key="`reader-paragraph-${index}`"
                  class="portal-book-reader-page__skeleton-line portal-book-reader-page__skeleton-line--paragraph"
                  :style="{ width }"
                />
              </div>
            </template>

            <div v-else class="portal-book-reader-page__skeleton-comic-pages" aria-hidden="true">
              <span
                v-for="(height, index) in readerSkeletonComicPageHeights"
                :key="`reader-comic-page-${index}`"
                class="portal-book-reader-page__skeleton-block portal-book-reader-page__skeleton-block--comic-page"
                :style="{ height }"
              />
            </div>
          </div>
        </div>

        <footer class="portal-book-reader-page__footer">
          <span
            v-for="index in 3"
            :key="`reader-nav-${index}`"
            class="portal-book-reader-page__skeleton-block portal-book-reader-page__skeleton-block--nav"
          />
        </footer>
      </section>
    </template>

    <article
      v-if="readerData"
      class="portal-book-reader-page__stage"
      :class="{ 'portal-book-reader-page__stage--comic': isComicReader }"
      :style="readerStyle"
    >
      <header class="portal-book-reader-page__toolbar">
        <router-link class="portal-book-reader-page__breadcrumb-link" :to="bookModuleLocation">
          书库
        </router-link>
        <span class="portal-book-reader-page__breadcrumb-separator">/</span>
        <router-link
          class="portal-book-reader-page__breadcrumb-link"
          :to="bookDetailLocation"
          :title="`返回 ${bookTitle}`"
        >
          {{ bookTitle }}
        </router-link>
        <span class="portal-book-reader-page__breadcrumb-separator">/</span>
        <span class="portal-book-reader-page__breadcrumb-current" :title="chapterTitle">
          {{ chapterTitle }}
        </span>
      </header>

      <div class="portal-book-reader-page__layout">
        <section
          ref="paperRef"
          class="portal-book-reader-page__paper"
          :class="{ 'portal-book-reader-page__paper--comic': isComicReader }"
          aria-label="章节正文"
        >
          <header v-if="!isComicReader" class="portal-book-reader-page__paper-head">
            <span>{{ chapterProgressLabel }}</span>
            <h1>{{ chapterTitle }}</h1>
          </header>

          <template
            v-for="(item, index) in readerData.content.items"
            :key="`${item.type}-${index}`"
          >
            <p v-if="item.type === 'paragraph'">
              {{ item.text }}
            </p>
            <figure v-else-if="item.type === 'image'" class="portal-book-reader-page__image-block">
              <book-comic-enhanced-image
                v-if="isComicReader && item.enhance !== false"
                :src="item.src"
                :alt="item.alt"
                :loading="item.loading"
                :request-headers="item.requestHeaders"
                class="portal-book-reader-page__content-image"
              />
              <portal-image
                v-else
                :src="item.src"
                :alt="item.alt"
                :fill="false"
                :loading="item.loading"
                referrerpolicy="no-referrer"
                fit="contain"
                class="portal-book-reader-page__content-image"
              />
            </figure>
          </template>
        </section>
      </div>

      <aside class="portal-book-reader-page__floating-tools" aria-label="阅读工具">
        <div v-if="!isComicReader" class="portal-book-reader-page__font-tools">
          <button
            type="button"
            class="portal-book-reader-page__tool-button"
            :disabled="!canDecreaseFont"
            title="缩小字号"
            aria-label="缩小字号"
            @click="decreaseReaderFontSize"
          >
            A-
          </button>
          <span class="portal-book-reader-page__font-value">{{ readerFontSizeLabel }}</span>
          <button
            type="button"
            class="portal-book-reader-page__tool-button"
            :disabled="!canIncreaseFont"
            title="放大字号"
            aria-label="放大字号"
            @click="increaseReaderFontSize"
          >
            A+
          </button>
        </div>

        <button
          type="button"
          class="portal-book-reader-page__catalog-toggle"
          :class="{ 'is-active': catalogExpanded }"
          :aria-expanded="catalogExpanded"
          title="切换目录"
          @click="catalogExpanded = !catalogExpanded"
        >
          目录
        </button>

        <div class="portal-book-reader-page__progress-panel" :style="progressPanelStyle">
          <span class="portal-book-reader-page__progress-label">阅读进度</span>
          <strong class="portal-book-reader-page__progress-value">{{
            readingProgressLabel
          }}</strong>
          <span class="portal-book-reader-page__progress-track" aria-hidden="true">
            <span class="portal-book-reader-page__progress-bar" />
          </span>
          <span class="portal-book-reader-page__progress-meta-row">
            <span class="portal-book-reader-page__progress-meta">{{ chapterIndexLabel }}</span>
            <span v-if="isComicReader" class="portal-book-reader-page__progress-meta">
              {{ comicPageIndexLabel }}
            </span>
          </span>
        </div>
      </aside>

      <aside
        v-if="catalogExpanded"
        ref="catalogPanelRef"
        class="portal-book-reader-page__catalog"
        aria-label="章节目录"
      >
        <div class="portal-book-reader-page__catalog-head">
          <strong>章节目录</strong>
          <span>{{ readerData.chapters.length }} 章</span>
        </div>

        <el-scrollbar ref="catalogScrollbarRef" class="portal-book-reader-page__catalog-scrollbar">
          <nav class="portal-book-reader-page__catalog-list">
            <router-link
              v-for="(chapter, index) in readerData.chapters"
              :key="chapter.id"
              :data-reader-catalog-chapter-id="String(chapter.id)"
              class="portal-book-reader-page__catalog-item"
              :class="{ 'is-active': isActiveChapter(chapter) }"
              :to="resolveChapterLocation(chapter)"
              :title="resolveChapterTitle(chapter, index)"
            >
              {{ resolveChapterTitle(chapter, index) }}
            </router-link>
          </nav>
        </el-scrollbar>
      </aside>

      <footer class="portal-book-reader-page__footer">
        <router-link
          v-if="previousChapter"
          class="portal-book-reader-page__nav-action"
          :to="resolveChapterLocation(previousChapter)"
        >
          <portal-svg-icon name="big-prev" aria-hidden="true" />
          <span>上一章</span>
        </router-link>
        <span v-else class="portal-book-reader-page__nav-action is-disabled">
          <portal-svg-icon name="big-prev" aria-hidden="true" />
          <span>上一章</span>
        </span>

        <router-link class="portal-book-reader-page__nav-action" :to="bookDetailLocation">
          <span>返回书库页</span>
        </router-link>

        <router-link
          v-if="nextChapter"
          class="portal-book-reader-page__nav-action"
          :to="resolveChapterLocation(nextChapter)"
        >
          <span>下一章</span>
          <portal-svg-icon name="big-next" aria-hidden="true" />
        </router-link>
        <span v-else class="portal-book-reader-page__nav-action is-disabled">
          <span>下一章</span>
          <portal-svg-icon name="big-next" aria-hidden="true" />
        </span>
      </footer>
    </article>
  </portal-request-boundary>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  PORTAL_BOOK_READER_ROUTE_NAME,
  PORTAL_DETAIL_ROUTE_NAMES,
  PORTAL_MODULE_ROUTE_NAMES
} from '@/constants/portal-business'
import {
  portalPublicDetailApi,
  type PublicBookChapterItemResponse,
  type PublicBookDetailResponse
} from '@/api/public-detail'
import {
  fetchMangaCopyComicChapter,
  fetchWmanhuaComicChapter,
  fetchWenku8NovelChapter,
  resolveBookReaderSource,
  type BookReaderChapterContent,
  type BookReaderMode,
  type BookReaderSourceResolution
} from '@/views/public/book-reader/source'
import BookComicEnhancedImage from '@/views/public/book-reader/components/BookComicEnhancedImage.vue'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import { usePublicDetailRequestState } from '@/views/public/composables/usePublicDetailRequestState'

interface BookReaderPageData {
  chapter: PublicBookChapterItemResponse
  chapterIndex: number
  chapters: PublicBookChapterItemResponse[]
  content: BookReaderChapterContent
  detail: PublicBookDetailResponse
  source: BookReaderSourceResolution
}

const READER_FONT_SIZE_MIN = 18
const READER_FONT_SIZE_MAX = 28
const READER_FONT_SIZE_DEFAULT = 22
const CATALOG_SCROLL_OBSERVER_TIMEOUT_MS = 3000

interface BookReaderCatalogScrollbarExpose {
  setScrollTop: (value: number) => void
  update?: () => void
  wrapRef?: HTMLElement | null
}

interface BookReaderCatalogScrollElements {
  scrollWrap: HTMLElement
  scrollbar: BookReaderCatalogScrollbarExpose
  targetItem: HTMLElement
}

const route = useRoute()
const router = useRouter()
const readerData = ref<BookReaderPageData | null>(null)
const pendingReaderMode = ref<BookReaderMode | null>(null)
const cachedBookDetail = ref<{ bookId: string; detail: PublicBookDetailResponse } | null>(null)
const chapterContentCache = new Map<string, BookReaderChapterContent>()
const readerErrorTitle = ref('章节正文暂时无法加载，请稍后再试。')
const catalogExpanded = ref(false)
const catalogPanelRef = ref<HTMLElement | null>(null)
const catalogScrollbarRef = ref<BookReaderCatalogScrollbarExpose | null>(null)
const paperRef = ref<HTMLElement | null>(null)
const currentComicPageIndex = ref(1)
const readingProgressPercent = ref(0)
const readerFontSize = ref(READER_FONT_SIZE_DEFAULT)
let catalogScrollRequestToken = 0
let catalogScrollObserver: MutationObserver | null = null
let catalogScrollFrame = 0
let catalogScrollTimeout = 0
let lastReadingProgressScrollY = 0
const {
  boundaryMode: readerBoundaryMode,
  beginLoad: beginReaderLoad,
  errorCode: readerErrorCode,
  isLatestLoad: isLatestReaderLoad,
  setErrorMode: setReaderErrorMode,
  setLiveMode: setReaderLiveMode
} = usePublicDetailRequestState()

const readerSkeletonParagraphWidths = [
  '100%',
  '96%',
  '99%',
  '88%',
  '94%',
  '100%',
  '91%',
  '97%',
  '84%'
]
const readerSkeletonComicPageHeights = ['56rem', '62rem', '52rem']
const bookId = computed(() => (typeof route.params.id === 'string' ? route.params.id.trim() : ''))
const chapterId = computed(() =>
  typeof route.params.chapterId === 'string' ? route.params.chapterId.trim() : ''
)
const activeBookDetail = computed(
  () => readerData.value?.detail ?? cachedBookDetail.value?.detail ?? null
)
const bookDetailLocation = computed(() => ({
  name: PORTAL_DETAIL_ROUTE_NAMES.book,
  params: {
    id: bookId.value
  }
}))
const bookModuleLocation = computed(() => ({
  name: PORTAL_MODULE_ROUTE_NAMES.book
}))
const bookTitle = computed(
  () =>
    activeBookDetail.value?.title?.trim() || activeBookDetail.value?.name?.trim() || '未命名书库'
)
const readerBackLabel = computed(() =>
  bookTitle.value === '未命名书库' ? '返回书库' : `返回 ${bookTitle.value}`
)
const chapterTitle = computed(() =>
  resolveChapterTitle(readerData.value?.chapter ?? null, readerData.value?.chapterIndex ?? 0)
)
const chapterProgressLabel = computed(() => {
  if (!readerData.value) {
    return ''
  }

  return `章节 ${readerData.value.chapterIndex + 1} / ${readerData.value.chapters.length}`
})
const chapterIndexLabel = computed(() => {
  if (!readerData.value) {
    return '章 -/-'
  }

  return `章 ${readerData.value.chapterIndex + 1}/${readerData.value.chapters.length}`
})
const readingProgressLabel = computed(() => {
  const progress = readingProgressPercent.value
  return `${progress <= 0 ? 0 : Math.ceil(progress)}%`
})
const isComicReader = computed(() => readerData.value?.source.mode === 'comic')
const isReaderSkeletonComic = computed(() => pendingReaderMode.value === 'comic')
const comicPageCount = computed(
  () => readerData.value?.content.items.filter((item) => item.type === 'image').length ?? 0
)
const comicPageIndexLabel = computed(() => {
  const pageCount = comicPageCount.value
  if (pageCount <= 0) {
    return '页 -/-'
  }

  return `页 ${Math.min(currentComicPageIndex.value, pageCount)}/${pageCount}`
})
const progressPanelStyle = computed(() => ({
  '--portal-book-reader-progress-ratio': String(
    Math.min(Math.max(readingProgressPercent.value, 0), 100) / 100
  )
}))
const readerStyle = computed(() =>
  isComicReader.value ? {} : { '--portal-book-reader-font-size': `${readerFontSize.value / 10}rem` }
)
const readerFontSizeLabel = computed(() => `${readerFontSize.value}px`)
const canDecreaseFont = computed(() => readerFontSize.value > READER_FONT_SIZE_MIN)
const canIncreaseFont = computed(() => readerFontSize.value < READER_FONT_SIZE_MAX)
const previousChapter = computed(() => {
  if (!readerData.value) {
    return null
  }

  return readerData.value.chapters[readerData.value.chapterIndex - 1] ?? null
})
const nextChapter = computed(() => {
  if (!readerData.value) {
    return null
  }

  return readerData.value.chapters[readerData.value.chapterIndex + 1] ?? null
})
const readerDocumentTitle = computed(() => {
  if (!readerData.value) {
    return '章节阅读'
  }

  return `${chapterTitle.value} - ${bookTitle.value}`
})

useDocumentTitle(readerDocumentTitle)

watch(
  [bookId, chapterId],
  () => {
    void loadReader()
  },
  { immediate: true }
)

watch(
  catalogExpanded,
  (isExpanded) => {
    if (isExpanded) {
      scheduleActiveCatalogChapterScroll()
    }
  },
  { flush: 'post' }
)

onMounted(() => {
  window.addEventListener('scroll', updateReadingProgress, { passive: true })
  window.addEventListener('resize', handleReaderViewportResize)
  scheduleActiveCatalogChapterScroll()
})

onBeforeUnmount(() => {
  catalogScrollRequestToken += 1
  stopCatalogScrollObservation()
  window.removeEventListener('scroll', updateReadingProgress)
  window.removeEventListener('resize', handleReaderViewportResize)
})

async function loadReader(): Promise<void> {
  const loadToken = beginReaderLoad()
  readerData.value = null
  pendingReaderMode.value = null
  currentComicPageIndex.value = 1
  lastReadingProgressScrollY = window.scrollY
  readingProgressPercent.value = 0
  readerErrorTitle.value = '章节正文暂时无法加载，请稍后再试。'

  if (!bookId.value || !chapterId.value) {
    readerErrorTitle.value = '章节地址不完整。'
    setReaderErrorMode(404)
    return
  }

  const detail = await resolveReaderBookDetail(loadToken)
  if (!detail || !isLatestReaderLoad(loadToken)) {
    return
  }

  const chapters = resolveSortedChapters(detail.chapterList)
  const chapterIndex = findChapterIndex(chapters, chapterId.value)
  const chapter = chapters[chapterIndex]
  if (!chapter) {
    readerErrorTitle.value = '当前章节不存在。'
    setReaderErrorMode(404)
    return
  }

  const source = resolveBookReaderSource(detail, chapter)
  pendingReaderMode.value = source.mode
  if (source.sourceType === 'unsupported') {
    readerErrorTitle.value = '当前章节暂不支持在线阅读。'
    setReaderErrorMode(500)
    return
  }

  if (!source.proxyUrl) {
    readerErrorTitle.value = '章节来源信息不完整。'
    setReaderErrorMode(500)
    return
  }

  try {
    const content = await resolveReaderChapterContent(source, chapter, loadToken)
    if (!content || !isLatestReaderLoad(loadToken)) {
      return
    }

    readerData.value = {
      chapter,
      chapterIndex,
      chapters,
      content,
      detail,
      source
    }
    setReaderLiveMode()
    await nextTick()
    if (!isLatestReaderLoad(loadToken)) {
      return
    }
    updateReadingProgress()
    scrollActiveCatalogChapterAfterReaderDataSet(chapter, loadToken)
  } catch {
    if (!isLatestReaderLoad(loadToken)) {
      return
    }

    readerErrorTitle.value = '章节正文暂时无法加载，请稍后再试。'
    setReaderErrorMode(500)
  }
}

async function resolveReaderBookDetail(
  loadToken: number
): Promise<PublicBookDetailResponse | null> {
  if (cachedBookDetail.value?.bookId === bookId.value) {
    return cachedBookDetail.value.detail
  }

  const detailResult = await portalPublicDetailApi.getBookDetail(bookId.value)
  if (!isLatestReaderLoad(loadToken)) {
    return null
  }

  if (!detailResult.data) {
    readerErrorTitle.value = '书库内容不存在或暂时无法访问。'
    setReaderErrorMode(detailResult.errorCode ?? 500)
    return null
  }

  cachedBookDetail.value = {
    bookId: bookId.value,
    detail: detailResult.data
  }
  chapterContentCache.clear()

  return detailResult.data
}

async function resolveReaderChapterContent(
  source: BookReaderSourceResolution,
  chapter: PublicBookChapterItemResponse,
  loadToken: number
): Promise<BookReaderChapterContent | null> {
  const cacheKey = `${bookId.value}:${chapter.id}:${source.sourceType}:${source.sourcePath}`
  const cachedContent = chapterContentCache.get(cacheKey)
  if (cachedContent) {
    return cachedContent
  }

  const content = await fetchReaderSourceContent(source)
  if (!isLatestReaderLoad(loadToken)) {
    return null
  }

  chapterContentCache.set(cacheKey, content)
  return content
}

async function fetchReaderSourceContent(
  source: BookReaderSourceResolution
): Promise<BookReaderChapterContent> {
  if (source.sourceType === 'wmanhuaComic') {
    return fetchWmanhuaComicChapter(source.proxyUrl)
  }

  if (source.sourceType === 'mangaCopyComic') {
    return fetchMangaCopyComicChapter(source.proxyUrl)
  }

  return fetchWenku8NovelChapter(source.proxyUrl)
}

function resolveSortedChapters(
  chapters: PublicBookDetailResponse['chapterList']
): PublicBookChapterItemResponse[] {
  return [...(chapters ?? [])].sort((left, right) => left.order - right.order)
}

function findChapterIndex(
  chapters: PublicBookChapterItemResponse[],
  targetChapterId: string
): number {
  return chapters.findIndex((chapter) => String(chapter.id) === targetChapterId)
}

function isActiveChapter(chapter: PublicBookChapterItemResponse): boolean {
  return String(chapter.id) === chapterId.value
}

function resolveChapterTitle(
  chapter: PublicBookChapterItemResponse | null,
  chapterIndex: number
): string {
  return chapter?.title?.trim() || `第 ${String(chapterIndex + 1).padStart(3, '0')} 章`
}

function resolveChapterLocation(chapter: PublicBookChapterItemResponse) {
  return {
    name: PORTAL_BOOK_READER_ROUTE_NAME,
    params: {
      id: bookId.value,
      chapterId: String(chapter.id)
    }
  }
}

function decreaseReaderFontSize(): void {
  readerFontSize.value = Math.max(READER_FONT_SIZE_MIN, readerFontSize.value - 1)
  void nextTick(updateReadingProgress)
}

function increaseReaderFontSize(): void {
  readerFontSize.value = Math.min(READER_FONT_SIZE_MAX, readerFontSize.value + 1)
  void nextTick(updateReadingProgress)
}

function handleReaderRetry(): void {
  void loadReader()
}

async function goBackToBook(): Promise<void> {
  await router.push(bookDetailLocation.value)
}

function handleReaderViewportResize(): void {
  updateReadingProgress()
  if (catalogExpanded.value) {
    scheduleActiveCatalogChapterScroll()
  }
}

function scheduleActiveCatalogChapterScroll(): void {
  const scrollToken = beginCatalogScrollRequest()
  observeAndScrollCatalogChapter(readerData.value?.chapter ?? null, scrollToken)
}

function scrollActiveCatalogChapterAfterReaderDataSet(
  chapter: PublicBookChapterItemResponse,
  loadToken: number
): void {
  const scrollToken = beginCatalogScrollRequest()
  if (!catalogExpanded.value || !isLatestReaderLoad(loadToken)) {
    return
  }

  observeAndScrollCatalogChapter(chapter, scrollToken, () => isLatestReaderLoad(loadToken))
}

function beginCatalogScrollRequest(): number {
  catalogScrollRequestToken += 1
  stopCatalogScrollObservation()
  return catalogScrollRequestToken
}

function observeAndScrollCatalogChapter(
  chapter: PublicBookChapterItemResponse | null,
  scrollToken: number,
  isStillCurrent: () => boolean = () => true
): void {
  const targetChapterId = resolveCatalogTargetChapterId(chapter)
  if (!targetChapterId || !catalogExpanded.value) {
    return
  }

  void nextTick(() => {
    if (!isCatalogScrollRequestActive(scrollToken, isStillCurrent)) {
      return
    }

    if (typeof MutationObserver !== 'undefined') {
      catalogScrollObserver = new MutationObserver(() => {
        requestCatalogScrollCheck(targetChapterId, scrollToken, isStillCurrent)
      })
      catalogScrollObserver.observe(document.body, {
        attributeFilter: ['class', 'style'],
        attributes: true,
        childList: true,
        subtree: true
      })
      catalogScrollTimeout = window.setTimeout(() => {
        if (scrollToken === catalogScrollRequestToken) {
          stopCatalogScrollObservation()
        }
      }, CATALOG_SCROLL_OBSERVER_TIMEOUT_MS)
    }

    requestCatalogScrollCheck(targetChapterId, scrollToken, isStillCurrent)
  })
}

function requestCatalogScrollCheck(
  targetChapterId: string,
  scrollToken: number,
  isStillCurrent: () => boolean
): void {
  if (catalogScrollFrame) {
    return
  }

  catalogScrollFrame = requestNextFrame(() => {
    catalogScrollFrame = 0
    if (!isCatalogScrollRequestActive(scrollToken, isStillCurrent)) {
      stopCatalogScrollObservation()
      return
    }

    catalogScrollbarRef.value?.update?.()
    if (scrollCatalogChapterIntoView(targetChapterId)) {
      stopCatalogScrollObservation()
    }
  })
}

function isCatalogScrollRequestActive(scrollToken: number, isStillCurrent: () => boolean): boolean {
  return scrollToken === catalogScrollRequestToken && catalogExpanded.value && isStillCurrent()
}

function stopCatalogScrollObservation(): void {
  if (catalogScrollFrame) {
    cancelNextFrame(catalogScrollFrame)
    catalogScrollFrame = 0
  }

  if (catalogScrollTimeout) {
    window.clearTimeout(catalogScrollTimeout)
    catalogScrollTimeout = 0
  }

  catalogScrollObserver?.disconnect()
  catalogScrollObserver = null
}

function resolveCatalogTargetChapterId(
  chapter: PublicBookChapterItemResponse | null
): string | null {
  const targetChapterId = String(chapter?.id ?? readerData.value?.chapter.id ?? chapterId.value)
  return targetChapterId.trim() || null
}

function requestNextFrame(callback: (timestamp: number) => void): number {
  if (window.requestAnimationFrame) {
    return window.requestAnimationFrame(callback)
  }

  return window.setTimeout(() => {
    callback(window.performance.now())
  }, 0)
}

function cancelNextFrame(frameId: number): void {
  window.cancelAnimationFrame?.(frameId)
  window.clearTimeout(frameId)
}

function scrollCatalogChapterIntoView(targetChapterId: string): boolean {
  const elements = resolveActiveCatalogScrollElements(targetChapterId)
  if (!elements) {
    return false
  }

  const { scrollWrap, scrollbar, targetItem } = elements
  const itemRect = targetItem.getBoundingClientRect()
  const wrapRect = scrollWrap.getBoundingClientRect()
  const centeredTop =
    scrollWrap.scrollTop +
    itemRect.top -
    wrapRect.top -
    (scrollWrap.clientHeight - itemRect.height) / 2
  const maxTop = Math.max(scrollWrap.scrollHeight - scrollWrap.clientHeight, 0)
  const nextTop = Math.min(Math.max(centeredTop, 0), maxTop)

  scrollbar.setScrollTop(nextTop)
  scrollbar.update?.()
  return true
}

function resolveActiveCatalogScrollElements(
  targetChapterId: string
): BookReaderCatalogScrollElements | null {
  const panel = catalogPanelRef.value
  const scrollbar = catalogScrollbarRef.value
  if (!catalogExpanded.value || !panel || !scrollbar) {
    return null
  }

  const targetItem = panel.querySelector<HTMLElement>(
    '.portal-book-reader-page__catalog-item.is-active'
  )
  if (targetItem?.dataset.readerCatalogChapterId !== targetChapterId) {
    return null
  }

  const scrollWrap =
    scrollbar.wrapRef ??
    panel.querySelector<HTMLElement>(
      '.portal-book-reader-page__catalog-scrollbar .el-scrollbar__wrap'
    )
  if (!scrollWrap || scrollWrap.clientHeight <= 0 || !targetItem.isConnected) {
    return null
  }

  return {
    scrollWrap,
    scrollbar,
    targetItem
  }
}

function updateReadingProgress(): void {
  const paper = paperRef.value
  if (!paper) {
    currentComicPageIndex.value = 1
    readingProgressPercent.value = 0
    return
  }

  if (isComicReader.value) {
    updateComicReadingProgress(paper)
    return
  }

  updateNovelReadingProgress(paper)
}

function updateNovelReadingProgress(paper: HTMLElement): void {
  const paperTop = paper.getBoundingClientRect().top + window.scrollY
  const viewportBottom = window.scrollY + window.innerHeight
  const paperBottom = paperTop + paper.scrollHeight
  if (viewportBottom >= paperBottom - 2) {
    readingProgressPercent.value = 100
    lastReadingProgressScrollY = window.scrollY
    return
  }

  const readableHeight = Math.max(paper.scrollHeight - window.innerHeight * 0.72, 1)
  const currentOffset = window.scrollY - paperTop
  const nextProgress = Math.min(Math.max((currentOffset / readableHeight) * 100, 0), 100)
  const isScrollingForward = window.scrollY >= lastReadingProgressScrollY
  readingProgressPercent.value = isScrollingForward
    ? Math.max(readingProgressPercent.value, nextProgress)
    : nextProgress
  lastReadingProgressScrollY = window.scrollY
}

function updateComicReadingProgress(paper: HTMLElement): void {
  const pageCount = comicPageCount.value
  if (pageCount <= 0) {
    currentComicPageIndex.value = 1
    readingProgressPercent.value = 0
    lastReadingProgressScrollY = window.scrollY
    return
  }

  const paperTop = paper.getBoundingClientRect().top + window.scrollY
  const paperBottom = paperTop + paper.scrollHeight
  const viewportBottom = window.scrollY + window.innerHeight
  if (viewportBottom >= paperBottom - 2) {
    currentComicPageIndex.value = pageCount
    readingProgressPercent.value = 100
    lastReadingProgressScrollY = window.scrollY
    return
  }

  const nextPageIndex = resolveVisibleComicPageIndex(paper)
  const isScrollingForward = window.scrollY >= lastReadingProgressScrollY
  currentComicPageIndex.value = isScrollingForward
    ? Math.max(currentComicPageIndex.value, nextPageIndex)
    : nextPageIndex

  const progressBase = Math.max(pageCount - 1, 1)
  readingProgressPercent.value =
    pageCount === 1 ? 0 : ((currentComicPageIndex.value - 1) / progressBase) * 100
  lastReadingProgressScrollY = window.scrollY
}

function resolveVisibleComicPageIndex(paper: HTMLElement): number {
  const pageBlocks = Array.from(
    paper.querySelectorAll<HTMLElement>('.portal-book-reader-page__image-block')
  )
  if (pageBlocks.length === 0) {
    return 1
  }

  const viewportAnchor = window.innerHeight * 0.44
  let closestPageIndex = 1
  let closestDistance = Number.POSITIVE_INFINITY
  pageBlocks.forEach((pageBlock, index) => {
    const rect = pageBlock.getBoundingClientRect()
    if (rect.top <= viewportAnchor && rect.bottom >= viewportAnchor) {
      closestPageIndex = index + 1
      closestDistance = 0
      return
    }

    const distance = Math.min(
      Math.abs(rect.top - viewportAnchor),
      Math.abs(rect.bottom - viewportAnchor)
    )
    if (distance < closestDistance) {
      closestDistance = distance
      closestPageIndex = index + 1
    }
  })

  return Math.min(Math.max(closestPageIndex, 1), Math.max(comicPageCount.value, 1))
}
</script>

<style scoped>
.portal-book-reader-page {
  --portal-book-reader-accent: var(--portal-content-bookshelf-accent);
  --portal-book-reader-font-size: 22px;
  --portal-book-reader-tool-bg: color-mix(in srgb, var(--public-detail-panel-bg) 86%, transparent);
  --portal-book-reader-hover-shadow: 0 4px 10px
    color-mix(in srgb, var(--portal-book-reader-accent) 8%, transparent);
  --portal-book-reader-panel-shadow: var(--public-detail-panel-shadow);
  --portal-book-reader-card-shadow: var(--public-detail-card-shadow);
  --portal-book-reader-border: color-mix(
    in srgb,
    var(--portal-content-bookshelf-tag-border) 54%,
    var(--public-detail-panel-border)
  );
  min-height: calc(100vh - var(--portal-topbar-height));
  overflow-x: clip;
  padding: 28px 24px 56px;
}

.portal-book-reader-page :deep(.portal-request-boundary__state) {
  min-height: 520px;
  padding: var(--portal-boundary-panel-padding-block) var(--portal-boundary-panel-padding-inline);
  border: 1px solid color-mix(in srgb, var(--portal-book-reader-border) 78%, transparent);
  border-radius: var(--public-detail-panel-radius);
  background: var(--public-detail-panel-bg);
  box-shadow: var(--portal-book-reader-panel-shadow);
}

.portal-book-reader-page__stage {
  --portal-book-reader-content-width: var(--portal-book-reader-novel-content-width);
  --portal-book-reader-side-gap: 28px;
  display: grid;
  grid-template-columns: minmax(0, var(--portal-book-reader-content-width));
  grid-template-areas:
    'toolbar'
    'content'
    'footer';
  gap: 18px;
  align-items: start;
  width: min(100%, var(--portal-book-reader-content-width));
  margin: 0 auto;
  position: relative;
}

.portal-book-reader-page__stage--comic {
  --portal-book-reader-content-width: var(--portal-book-reader-comic-content-width);
}

.portal-book-reader-page__toolbar {
  grid-area: toolbar;
  position: sticky;
  top: calc(var(--portal-topbar-height) + 12px);
  z-index: 8;
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 52px;
  padding: 9px 12px;
  border: 1px solid color-mix(in srgb, var(--portal-book-reader-border) 64%, transparent);
  border-radius: var(--public-detail-panel-radius);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--public-detail-surface) 98%, transparent),
      transparent
    ),
    color-mix(in srgb, var(--public-detail-surface) 88%, transparent);
  backdrop-filter: blur(calc(var(--portal-content-panel-blur) * 0.52));
  -webkit-backdrop-filter: blur(calc(var(--portal-content-panel-blur) * 0.52));
}

.portal-book-reader-page__breadcrumb-link,
.portal-book-reader-page__tool-button,
.portal-book-reader-page__catalog-toggle,
.portal-book-reader-page__nav-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--portal-book-reader-border) 72%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--public-detail-card-bg) 76%, transparent);
  color: color-mix(in srgb, var(--portal-content-bookshelf-tag-ink) 92%, var(--portal-content-ink));
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background 180ms ease,
    color 180ms ease,
    box-shadow 180ms ease;
}

.portal-book-reader-page__breadcrumb-link,
.portal-book-reader-page__breadcrumb-current {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.portal-book-reader-page__breadcrumb-link {
  max-width: 260px;
  min-height: 32px;
  padding: 0 12px;
}

.portal-book-reader-page__breadcrumb-current {
  min-width: 0;
  color: color-mix(in srgb, var(--portal-content-ink) 84%, transparent);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
}

.portal-book-reader-page__breadcrumb-separator {
  color: color-mix(in srgb, var(--portal-content-muted) 72%, transparent);
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
}

.portal-book-reader-page__tool-button :deep(.portal-svg-icon),
.portal-book-reader-page__nav-action :deep(.portal-svg-icon) {
  --portal-icon-size: 16px;
  flex: 0 0 auto;
}

.portal-book-reader-page__breadcrumb-link:hover,
.portal-book-reader-page__tool-button:hover:not(:disabled),
.portal-book-reader-page__catalog-toggle:hover,
.portal-book-reader-page__nav-action:hover:not(.is-disabled) {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--portal-book-reader-accent) 38%, transparent);
  background: color-mix(in srgb, var(--portal-content-bookshelf-tag-bg) 72%, white);
  box-shadow: var(--portal-book-reader-hover-shadow);
}

.portal-book-reader-page__breadcrumb-link:focus-visible,
.portal-book-reader-page__tool-button:focus-visible,
.portal-book-reader-page__catalog-toggle:focus-visible,
.portal-book-reader-page__nav-action:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--portal-focus-ring);
}

.portal-book-reader-page__floating-tools {
  grid-area: content;
  position: sticky;
  top: calc(var(--portal-topbar-height) + 104px);
  justify-self: start;
  transform: translateX(calc(-100% - var(--portal-book-reader-side-gap)));
  z-index: 12;
  display: flex;
  flex-direction: column;
  gap: 9px;
  width: 82px;
  height: calc(100vh - var(--portal-topbar-height) - 136px);
  min-height: 320px;
}

.portal-book-reader-page__stage--comic .portal-book-reader-page__floating-tools {
  height: auto;
  min-height: 0;
}

.portal-book-reader-page__font-tools {
  display: grid;
  gap: 6px;
  padding: 8px;
  border: 1px solid color-mix(in srgb, var(--portal-book-reader-border) 68%, transparent);
  border-radius: var(--public-detail-panel-radius);
  background: var(--portal-book-reader-tool-bg);
  box-shadow: var(--portal-book-reader-card-shadow);
  backdrop-filter: blur(calc(var(--portal-content-panel-blur) * 0.58));
  -webkit-backdrop-filter: blur(calc(var(--portal-content-panel-blur) * 0.58));
}

.portal-book-reader-page__tool-button,
.portal-book-reader-page__catalog-toggle {
  min-height: 34px;
  padding: 0 10px;
}

.portal-book-reader-page__tool-button:disabled {
  cursor: default;
  opacity: 0.44;
}

.portal-book-reader-page__font-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 30px;
  color: color-mix(in srgb, var(--portal-content-muted) 88%, var(--portal-content-ink));
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.portal-book-reader-page__catalog-toggle {
  min-height: 38px;
  border-radius: var(--public-detail-panel-radius);
  background: var(--portal-book-reader-tool-bg);
  box-shadow: var(--portal-book-reader-card-shadow);
  backdrop-filter: blur(calc(var(--portal-content-panel-blur) * 0.58));
  -webkit-backdrop-filter: blur(calc(var(--portal-content-panel-blur) * 0.58));
}

.portal-book-reader-page__catalog-toggle.is-active {
  border-color: color-mix(in srgb, var(--portal-book-reader-accent) 44%, transparent);
  background: color-mix(in srgb, var(--portal-content-bookshelf-tag-bg) 70%, white);
}

.portal-book-reader-page__layout {
  grid-area: content;
  display: grid;
}

.portal-book-reader-page__paper {
  display: grid;
  gap: calc(var(--portal-book-reader-font-size) * 0.98);
  width: 100%;
  min-height: 560px;
  padding: 40px var(--portal-book-reader-paper-padding-inline) 50px;
  border: 1px solid color-mix(in srgb, var(--portal-book-reader-border) 78%, transparent);
  border-radius: var(--public-detail-panel-radius);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, white 12%, transparent),
      color-mix(in srgb, var(--portal-content-bookshelf-accent-soft) 4%, transparent)
    ),
    color-mix(in srgb, var(--public-detail-panel-bg) 92%, white);
  box-shadow: var(--portal-book-reader-panel-shadow);
  color: var(--portal-content-ink);
}

.portal-book-reader-page__paper--comic {
  justify-items: center;
  gap: 6px;
  min-height: 0;
  padding: 18px 0 40px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.portal-book-reader-page__paper-head {
  display: grid;
  gap: 10px;
  padding-bottom: 18px;
  border-bottom: 1px solid color-mix(in srgb, var(--portal-book-reader-border) 54%, transparent);
  text-align: center;
}

.portal-book-reader-page__paper-head span {
  color: var(--portal-content-muted);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
}

.portal-book-reader-page__paper-head h1 {
  color: var(--portal-content-ink);
  font-size: 24px;
  line-height: 1.4;
}

.portal-book-reader-page__paper p {
  font-size: var(--portal-book-reader-font-size);
  line-height: 1.96;
  overflow-wrap: anywhere;
  text-align: justify;
  text-indent: 2em;
}

.portal-book-reader-page__image-block {
  display: grid;
  justify-items: center;
  margin: 6px 0;
}

.portal-book-reader-page__content-image {
  display: grid;
  justify-items: center;
  width: min(100%, 760px);
  border: 1px solid color-mix(in srgb, var(--portal-book-reader-border) 64%, transparent);
  border-radius: var(--public-detail-card-radius);
  background: color-mix(in srgb, var(--public-detail-card-bg) 72%, transparent);
  box-shadow: var(--portal-book-reader-card-shadow);
}

.portal-book-reader-page__content-image :deep(.portal-image__img) {
  width: auto;
  height: auto;
  min-height: 200px;
}

.portal-book-reader-page__paper--comic .portal-book-reader-page__image-block {
  width: 100%;
  margin: 0;
}

.portal-book-reader-page__paper--comic .portal-book-reader-page__content-image {
  width: min(100%, 1080px);
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.portal-book-reader-page__catalog {
  grid-area: content;
  position: sticky;
  top: calc(var(--portal-topbar-height) + 104px);
  transform: translateX(80%);
  justify-self: end;
  z-index: 13;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px;
  max-height: calc(100vh - var(--portal-topbar-height) - 120px);
  width: var(--portal-book-reader-catalog-width);
  min-height: 380px;
  overflow: hidden;
  padding: 14px 12px 14px 14px;
  border: 1px solid color-mix(in srgb, var(--portal-book-reader-border) 78%, transparent);
  border-radius: var(--public-detail-panel-radius);
  background:
    linear-gradient(180deg, color-mix(in srgb, white 12%, transparent), transparent),
    color-mix(in srgb, var(--public-detail-panel-bg) 92%, transparent);
  box-shadow: var(--portal-book-reader-panel-shadow);
  backdrop-filter: blur(calc(var(--portal-content-panel-blur) * 0.62));
  -webkit-backdrop-filter: blur(calc(var(--portal-content-panel-blur) * 0.62));
}

.portal-book-reader-page__catalog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-right: 4px;
  min-width: 0;
}

.portal-book-reader-page__catalog-head strong {
  color: var(--portal-content-ink);
  font-size: 15px;
  line-height: 1.25;
}

.portal-book-reader-page__catalog-head span {
  color: var(--portal-content-muted);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.portal-book-reader-page__catalog-scrollbar {
  height: 100%;
  min-height: 0;
}

.portal-book-reader-page__catalog-scrollbar :deep(.el-scrollbar__bar.is-vertical) {
  right: 0;
  width: 6px;
  opacity: 0;
  transition: opacity 180ms ease;
}

.portal-book-reader-page__catalog:hover
  .portal-book-reader-page__catalog-scrollbar
  :deep(.el-scrollbar__bar.is-vertical),
.portal-book-reader-page__catalog-scrollbar:focus-within :deep(.el-scrollbar__bar.is-vertical) {
  opacity: 1;
}

.portal-book-reader-page__catalog-scrollbar :deep(.el-scrollbar__thumb) {
  border: 1px solid var(--public-detail-scrollbar-thumb-border);
  background: var(--public-detail-scrollbar-thumb-bg);
  opacity: 1;
}

.portal-book-reader-page__catalog-scrollbar :deep(.el-scrollbar__thumb:hover) {
  background: var(--public-detail-scrollbar-thumb-hover-bg);
}

.portal-book-reader-page__catalog-list {
  display: grid;
  align-content: start;
  gap: 6px;
  min-height: 0;
  padding-right: 10px;
}

.portal-book-reader-page__catalog-item {
  display: block;
  min-width: 0;
  padding: 8px 9px;
  border: 1px solid transparent;
  border-radius: 10px;
  color: color-mix(in srgb, var(--portal-content-ink) 86%, transparent);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.42;
  text-decoration: none;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    color 180ms ease;
}

.portal-book-reader-page__catalog-item:hover,
.portal-book-reader-page__catalog-item:focus-visible,
.portal-book-reader-page__catalog-item.is-active {
  border-color: color-mix(in srgb, var(--portal-content-bookshelf-tag-border) 72%, transparent);
  background: color-mix(in srgb, var(--portal-content-bookshelf-tag-bg) 72%, transparent);
  color: color-mix(in srgb, var(--portal-content-bookshelf-tag-ink) 94%, var(--portal-content-ink));
}

.portal-book-reader-page__catalog-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--portal-focus-ring);
}

.portal-book-reader-page__footer {
  grid-area: footer;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
}

.portal-book-reader-page__progress-panel {
  display: grid;
  gap: 8px;
  margin-top: auto;
  padding: 9px 8px;
  border: 1px solid color-mix(in srgb, var(--portal-book-reader-border) 62%, transparent);
  border-radius: var(--public-detail-panel-radius);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--portal-content-bookshelf-tag-bg) 42%, transparent),
      transparent 54%
    ),
    color-mix(in srgb, var(--public-detail-panel-bg) 78%, transparent);
  color: color-mix(in srgb, var(--portal-content-muted) 86%, var(--portal-content-ink));
  text-align: center;
  box-shadow: var(--portal-book-reader-card-shadow);
  backdrop-filter: blur(calc(var(--portal-content-panel-blur) * 0.5));
  -webkit-backdrop-filter: blur(calc(var(--portal-content-panel-blur) * 0.5));
}

.portal-book-reader-page__stage--comic .portal-book-reader-page__progress-panel {
  margin-top: 0;
}

.portal-book-reader-page__progress-label,
.portal-book-reader-page__progress-meta {
  font-size: 12px;
}

.portal-book-reader-page__progress-label {
  color: color-mix(in srgb, var(--portal-content-muted) 88%, var(--portal-content-ink));
  font-weight: 600;
  line-height: 1.7;
}

.portal-book-reader-page__progress-value {
  color: color-mix(in srgb, var(--portal-book-reader-accent) 78%, var(--portal-content-ink));
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
}

.portal-book-reader-page__progress-track {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 4px;
  margin: 2px 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--portal-book-reader-border) 42%, transparent);
}

.portal-book-reader-page__progress-bar {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--portal-book-reader-accent) 56%, white),
    color-mix(in srgb, var(--portal-book-reader-accent) 84%, var(--portal-content-ink))
  );
  transform: scaleX(var(--portal-book-reader-progress-ratio, 0));
  transform-origin: left center;
  transition: transform 180ms ease;
}

.portal-book-reader-page__progress-meta-row {
  display: grid;
  gap: 10px;
  justify-items: center;
  min-width: 0;
}

.portal-book-reader-page__progress-meta {
  color: color-mix(in srgb, var(--portal-content-muted) 82%, var(--portal-content-ink));
  font-weight: 600;
  line-height: 1.7;
  white-space: nowrap;
}

.portal-book-reader-page__nav-action {
  gap: 8px;
  min-height: 42px;
  padding: 0 16px;
}

.portal-book-reader-page__nav-action.is-disabled {
  cursor: default;
  opacity: 0.46;
  pointer-events: none;
}

.portal-book-reader-page__stage--loading {
  overflow: visible;
}

.portal-book-reader-page__loading-tools {
  grid-area: content;
  position: absolute;
  top: 0;
  left: calc(-82px - 28px);
  z-index: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
  width: 82px;
  height: calc(100vh - var(--portal-topbar-height) - 136px);
  min-height: 320px;
  pointer-events: none;
}

.portal-book-reader-page__stage--comic .portal-book-reader-page__loading-tools {
  height: auto;
  min-height: 0;
}

.portal-book-reader-page__layout--loading {
  align-items: start;
  position: relative;
  z-index: 1;
}

.portal-book-reader-page__paper--loading {
  align-content: start;
  justify-items: center;
  min-height: 560px;
}

.portal-book-reader-page__skeleton-title-stack {
  display: grid;
  justify-items: center;
  gap: 10px;
  min-width: 0;
}

.portal-book-reader-page__skeleton-block,
.portal-book-reader-page__skeleton-line {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 999px;
  background: linear-gradient(
    135deg,
    var(--portal-skeleton-block-strong),
    var(--portal-skeleton-block)
  );
}

.portal-book-reader-page__skeleton-block::after,
.portal-book-reader-page__skeleton-line::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--portal-skeleton-shimmer);
  animation: home-skeleton-wave 2.4s ease-in-out infinite;
  transform: translateX(-100%);
}

.portal-book-reader-page__skeleton-block--back {
  width: 164px;
  height: 38px;
}

.portal-book-reader-page__skeleton-block--nav {
  width: 100%;
  height: 42px;
}

.portal-book-reader-page__skeleton-line--title {
  width: min(72%, 460px);
  height: 25px;
}

.portal-book-reader-page__skeleton-line--meta {
  width: min(36%, 220px);
  height: 14px;
}

.portal-book-reader-page__skeleton-paragraphs {
  display: grid;
  justify-self: center;
  justify-items: center;
  gap: calc(var(--portal-book-reader-font-size) * 0.76);
  width: min(100%, 760px);
  padding-inline: 2em;
}

.portal-book-reader-page__skeleton-comic-pages {
  display: grid;
  justify-items: center;
  gap: 6px;
  width: 100%;
}

.portal-book-reader-page__skeleton-line--paragraph {
  justify-self: center;
  max-width: 100%;
  height: 20px;
}

.portal-book-reader-page__skeleton-block--comic-page {
  width: min(100%, 960px);
  border-radius: 0;
}

.portal-book-reader-page__skeleton-line--chapter-meta {
  justify-self: center;
  width: min(32%, 160px);
  height: 14px;
}

.portal-book-reader-page__skeleton-line--chapter-title {
  justify-self: center;
  width: min(64%, 560px);
  height: 34px;
}

.portal-book-reader-page__skeleton-line--tool {
  width: 100%;
  height: 34px;
}

.portal-book-reader-page__skeleton-line--catalog-button {
  width: 100%;
  height: 38px;
}

.portal-book-reader-page__skeleton-line--progress-panel {
  width: 100%;
  height: 66px;
  margin-top: auto;
  border-radius: var(--public-detail-panel-radius);
}
</style>
