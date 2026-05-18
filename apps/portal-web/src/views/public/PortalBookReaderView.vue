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
      <section class="portal-book-reader-page__stage portal-book-reader-page__stage--loading">
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
          <span
            class="portal-book-reader-page__skeleton-line portal-book-reader-page__skeleton-line--tool"
          />
          <span
            class="portal-book-reader-page__skeleton-line portal-book-reader-page__skeleton-line--tool"
          />
          <span
            class="portal-book-reader-page__skeleton-line portal-book-reader-page__skeleton-line--catalog-button"
          />
          <span
            class="portal-book-reader-page__skeleton-line portal-book-reader-page__skeleton-line--progress-panel"
          />
        </div>

        <div class="portal-book-reader-page__layout portal-book-reader-page__layout--loading">
          <div class="portal-book-reader-page__paper portal-book-reader-page__paper--loading">
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
              <portal-image
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

        <div class="portal-book-reader-page__progress-panel">
          <span>{{ chapterIndexLabel }}</span>
          <strong>{{ readingProgressLabel }}</strong>
        </div>
      </aside>

      <aside v-if="catalogExpanded" class="portal-book-reader-page__catalog" aria-label="章节目录">
        <div class="portal-book-reader-page__catalog-head">
          <strong>章节目录</strong>
          <span>{{ readerData.chapters.length }} 章</span>
        </div>

        <nav class="portal-book-reader-page__catalog-list">
          <router-link
            v-for="(chapter, index) in readerData.chapters"
            :key="chapter.id"
            class="portal-book-reader-page__catalog-item"
            :class="{ 'is-active': isActiveChapter(chapter) }"
            :to="resolveChapterLocation(chapter)"
            :title="resolveChapterTitle(chapter, index)"
          >
            {{ resolveChapterTitle(chapter, index) }}
          </router-link>
        </nav>
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
  fetchWmanhuaComicChapter,
  fetchWenku8NovelChapter,
  resolveBookReaderSource,
  type BookReaderChapterContent,
  type BookReaderSourceResolution
} from '@/views/public/book-reader'
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

const route = useRoute()
const router = useRouter()
const readerData = ref<BookReaderPageData | null>(null)
const cachedBookDetail = ref<{ bookId: string; detail: PublicBookDetailResponse } | null>(null)
const chapterContentCache = new Map<string, BookReaderChapterContent>()
const readerErrorTitle = ref('章节正文暂时无法加载，请稍后再试。')
const catalogExpanded = ref(false)
const paperRef = ref<HTMLElement | null>(null)
const readingProgressPercent = ref(0)
const readerFontSize = ref(READER_FONT_SIZE_DEFAULT)
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

  return `第 ${readerData.value.chapterIndex + 1} / ${readerData.value.chapters.length} 章`
})
const chapterIndexLabel = computed(() => {
  if (!readerData.value) {
    return '- / -'
  }

  return `${readerData.value.chapterIndex + 1} / ${readerData.value.chapters.length}`
})
const readingProgressLabel = computed(() => {
  const progress = readingProgressPercent.value
  return `${progress <= 0 ? 0 : Math.ceil(progress)}%`
})
const isComicReader = computed(() => readerData.value?.source.mode === 'comic')
const readerStyle = computed(() =>
  isComicReader.value ? {} : { '--portal-book-reader-font-size': `${readerFontSize.value}px` }
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

onMounted(() => {
  window.addEventListener('scroll', updateReadingProgress, { passive: true })
  window.addEventListener('resize', updateReadingProgress)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateReadingProgress)
  window.removeEventListener('resize', updateReadingProgress)
})

async function loadReader(): Promise<void> {
  const loadToken = beginReaderLoad()
  readerData.value = null
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
    updateReadingProgress()
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

  const content =
    source.sourceType === 'wmanhuaComic'
      ? await fetchWmanhuaComicChapter(source.proxyUrl)
      : await fetchWenku8NovelChapter(source.proxyUrl)
  if (!isLatestReaderLoad(loadToken)) {
    return null
  }

  chapterContentCache.set(cacheKey, content)
  return content
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

function updateReadingProgress(): void {
  const paper = paperRef.value
  if (!paper) {
    readingProgressPercent.value = 0
    return
  }

  const paperTop = paper.getBoundingClientRect().top + window.scrollY
  const viewportBottom = window.scrollY + window.innerHeight
  const paperBottom = paperTop + paper.scrollHeight
  if (viewportBottom >= paperBottom - 2) {
    readingProgressPercent.value = 100
    return
  }

  const readableHeight = Math.max(paper.scrollHeight - window.innerHeight * 0.72, 1)
  const currentOffset = window.scrollY - paperTop
  const nextProgress = Math.min(Math.max((currentOffset / readableHeight) * 100, 0), 100)
  readingProgressPercent.value = nextProgress
}
</script>

<style scoped>
.portal-book-reader-page {
  --portal-book-reader-accent: var(--home-business-bookshelf-accent);
  --portal-book-reader-tool-bg: color-mix(in srgb, var(--home-detail-panel-bg) 86%, transparent);
  --portal-book-reader-border: color-mix(
    in srgb,
    var(--home-business-bookshelf-tag-border) 54%,
    var(--home-detail-panel-border)
  );
  min-height: calc(100vh - var(--portal-topbar-height));
  overflow-x: clip;
  padding: 28px 24px 56px;
}

.portal-book-reader-page :deep(.portal-request-boundary__state) {
  min-height: 520px;
}

.portal-book-reader-page__stage {
  display: grid;
  grid-template-columns: minmax(0, 1040px);
  grid-template-areas:
    'toolbar'
    'content'
    'footer';
  gap: 18px;
  align-items: start;
  width: min(100%, 1040px);
  margin: 0 auto;
  position: relative;
}

.portal-book-reader-page__stage--comic {
  grid-template-columns: minmax(0, 1120px);
  width: min(100%, 1120px);
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
  border-radius: var(--home-detail-panel-radius);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--home-surface) 98%, transparent), transparent),
    color-mix(in srgb, var(--home-surface) 88%, transparent);
  backdrop-filter: blur(calc(var(--home-panel-blur) * 0.52));
  -webkit-backdrop-filter: blur(calc(var(--home-panel-blur) * 0.52));
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
  background: color-mix(in srgb, var(--home-detail-card-bg) 76%, transparent);
  color: color-mix(in srgb, var(--home-business-bookshelf-tag-ink) 92%, var(--home-ink));
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
  color: color-mix(in srgb, var(--home-ink) 84%, transparent);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
}

.portal-book-reader-page__breadcrumb-separator {
  color: color-mix(in srgb, var(--home-muted) 72%, transparent);
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
  background: color-mix(in srgb, var(--home-business-bookshelf-tag-bg) 72%, white);
  box-shadow: 0 8px 18px color-mix(in srgb, var(--portal-book-reader-accent) 9%, transparent);
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
  transform: translateX(calc(-100% - 28px));
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
  border-radius: var(--home-detail-panel-radius);
  background: var(--portal-book-reader-tool-bg);
  box-shadow: 0 12px 24px rgba(18, 41, 74, 0.06);
  backdrop-filter: blur(calc(var(--home-panel-blur) * 0.58));
  -webkit-backdrop-filter: blur(calc(var(--home-panel-blur) * 0.58));
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
  color: color-mix(in srgb, var(--home-muted) 88%, var(--home-ink));
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.portal-book-reader-page__catalog-toggle {
  min-height: 38px;
  border-radius: var(--home-detail-panel-radius);
  background: var(--portal-book-reader-tool-bg);
  box-shadow: 0 12px 24px rgba(18, 41, 74, 0.06);
  backdrop-filter: blur(calc(var(--home-panel-blur) * 0.58));
  -webkit-backdrop-filter: blur(calc(var(--home-panel-blur) * 0.58));
}

.portal-book-reader-page__catalog-toggle.is-active {
  border-color: color-mix(in srgb, var(--portal-book-reader-accent) 44%, transparent);
  background: color-mix(in srgb, var(--home-business-bookshelf-tag-bg) 70%, white);
}

.portal-book-reader-page__layout {
  grid-area: content;
  display: grid;
}

.portal-book-reader-page__paper {
  display: grid;
  gap: calc(var(--portal-book-reader-font-size, 22px) * 0.98);
  width: 100%;
  min-height: 560px;
  padding: 40px 64px 50px;
  border: 1px solid color-mix(in srgb, var(--portal-book-reader-border) 78%, transparent);
  border-radius: var(--home-detail-panel-radius);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, white 12%, transparent),
      color-mix(in srgb, var(--home-business-bookshelf-accent-soft) 4%, transparent)
    ),
    color-mix(in srgb, var(--home-detail-panel-bg) 92%, white);
  box-shadow:
    0 14px 30px rgba(18, 41, 74, 0.055),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  color: var(--home-ink);
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
  color: var(--home-muted);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
}

.portal-book-reader-page__paper-head h1 {
  color: var(--home-ink);
  font-size: 24px;
  line-height: 1.4;
}

.portal-book-reader-page__paper p {
  font-size: var(--portal-book-reader-font-size, 22px);
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
  border-radius: 14px;
  background: color-mix(in srgb, var(--home-detail-card-bg) 72%, transparent);
  box-shadow: 0 14px 28px rgba(18, 41, 74, 0.08);
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
  width: min(100%, 960px);
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.portal-book-reader-page__catalog {
  grid-area: content;
  position: sticky;
  top: calc(var(--portal-topbar-height) + 104px);
  justify-self: end;
  transform: translateX(calc(100% + 28px));
  z-index: 13;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 12px;
  max-height: calc(100vh - var(--portal-topbar-height) - 120px);
  width: 320px;
  min-height: 380px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--portal-book-reader-border) 78%, transparent);
  border-radius: var(--home-detail-panel-radius);
  background:
    linear-gradient(180deg, color-mix(in srgb, white 12%, transparent), transparent),
    color-mix(in srgb, var(--home-detail-panel-bg) 92%, transparent);
  box-shadow: 0 18px 36px rgba(18, 41, 74, 0.11);
  backdrop-filter: blur(calc(var(--home-panel-blur) * 0.62));
  -webkit-backdrop-filter: blur(calc(var(--home-panel-blur) * 0.62));
}

.portal-book-reader-page__catalog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-right: 28px;
  min-width: 0;
}

.portal-book-reader-page__catalog-head strong {
  color: var(--home-ink);
  font-size: 15px;
  line-height: 1.25;
}

.portal-book-reader-page__catalog-head span {
  color: var(--home-muted);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.portal-book-reader-page__catalog-list {
  display: grid;
  align-content: start;
  gap: 6px;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.portal-book-reader-page__catalog-item {
  display: block;
  min-width: 0;
  padding: 8px 9px;
  border: 1px solid transparent;
  border-radius: 10px;
  color: color-mix(in srgb, var(--home-ink) 86%, transparent);
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
  border-color: color-mix(in srgb, var(--home-business-bookshelf-tag-border) 72%, transparent);
  background: color-mix(in srgb, var(--home-business-bookshelf-tag-bg) 72%, transparent);
  color: color-mix(in srgb, var(--home-business-bookshelf-tag-ink) 94%, var(--home-ink));
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
  gap: 5px;
  margin-top: auto;
  padding: 9px;
  border: 1px solid color-mix(in srgb, var(--portal-book-reader-border) 58%, transparent);
  border-radius: var(--home-detail-panel-radius);
  background: color-mix(in srgb, var(--home-detail-panel-bg) 72%, transparent);
  color: color-mix(in srgb, var(--home-muted) 86%, var(--home-ink));
  text-align: center;
  box-shadow: 0 10px 20px rgba(18, 41, 74, 0.045);
  backdrop-filter: blur(calc(var(--home-panel-blur) * 0.5));
  -webkit-backdrop-filter: blur(calc(var(--home-panel-blur) * 0.5));
}

.portal-book-reader-page__stage--comic .portal-book-reader-page__progress-panel {
  margin-top: 0;
}

.portal-book-reader-page__progress-panel span,
.portal-book-reader-page__progress-panel strong {
  font-size: 12px;
  line-height: 1.2;
}

.portal-book-reader-page__progress-panel span {
  font-weight: 700;
}

.portal-book-reader-page__progress-panel strong {
  color: color-mix(in srgb, var(--portal-book-reader-accent) 72%, var(--home-ink));
  font-weight: 800;
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
    var(--home-skeleton-block-strong),
    var(--home-skeleton-block)
  );
}

.portal-book-reader-page__skeleton-block::after,
.portal-book-reader-page__skeleton-line::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--home-skeleton-shimmer);
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
  gap: calc(var(--portal-book-reader-font-size, 22px) * 0.76);
  width: min(100%, 760px);
  padding-inline: 2em;
}

.portal-book-reader-page__skeleton-line--paragraph {
  justify-self: center;
  max-width: 100%;
  height: 20px;
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
  height: 54px;
  margin-top: auto;
  border-radius: var(--home-detail-panel-radius);
}

@media (max-width: 1320px) {
  .portal-book-reader-page__stage {
    grid-template-columns: minmax(0, 960px);
    width: min(100%, 960px);
  }

  .portal-book-reader-page__stage--comic {
    grid-template-columns: minmax(0, 1000px);
    width: min(100%, 1000px);
  }

  .portal-book-reader-page__paper {
    padding-inline: 56px;
  }

  .portal-book-reader-page__paper--comic {
    padding-inline: 0;
  }

  .portal-book-reader-page__catalog {
    width: 300px;
  }
}

@media (max-width: 1560px) {
  .portal-book-reader-page__catalog {
    transform: none;
  }
}
</style>
