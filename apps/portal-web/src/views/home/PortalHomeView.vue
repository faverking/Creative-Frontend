<template>
  <div class="portal-home-page">
    <home-hero-section
      :featured-items="featuredData.items"
      :totals="featuredData.totals"
      :error-code="featuredErrorCode"
      :mode="featuredBoundaryMode"
      @retry="handleFeaturedRetry"
    />

    <div class="portal-home-page__row portal-home-page__row--center">
      <home-article-section
        :error-code="homeSectionsErrorCode"
        :section="homeData.articleSection"
        :mode="articleSectionBoundaryMode"
        @retry="handleHomeSectionsRetry"
      />
      <home-column-section
        :error-code="homeSectionsErrorCode"
        :section="homeData.columnSection"
        :mode="columnSectionBoundaryMode"
        @retry="handleHomeSectionsRetry"
      />
    </div>

    <div class="portal-home-page__row portal-home-page__row--bottom">
      <home-book-section
        :error-code="homeSectionsErrorCode"
        :section="homeData.bookshelfSection"
        :mode="bookshelfSectionBoundaryMode"
        @retry="handleHomeSectionsRetry"
      />
      <home-gallery-section
        :error-code="homeSectionsErrorCode"
        :section="homeData.gallerySection"
        :mode="gallerySectionBoundaryMode"
        @retry="handleHomeSectionsRetry"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import HomeArticleSection from './components/HomeArticleSection.vue'
import HomeBookSection from './components/HomeBookSection.vue'
import HomeColumnSection from './components/HomeColumnSection.vue'
import HomeGallerySection from './components/HomeGallerySection.vue'
import HomeHeroSection from './components/HomeHeroSection.vue'
import type {
  PortalRequestBoundaryErrorCode,
  PortalRequestBoundaryMode
} from '@/components/PortalRequestBoundary.vue'
import { portalContentApi, type HomeResponse, type SearchFeaturedResponse } from '@/api/content'
import { useStaleWhileRevalidateCache } from '@/composables/useStaleWhileRevalidateCache'

type HomeSectionMode = 'error' | 'live'

const HOME_CACHE_FRESH_TTL_MS = 2 * 60_000
const HOME_CACHE_STALE_WHILE_REVALIDATE_TTL_MS = 10 * 60_000

const featuredCache = useStaleWhileRevalidateCache<SearchFeaturedResponse>({
  freshTtlMs: HOME_CACHE_FRESH_TTL_MS,
  key: 'portal-home:featured',
  staleWhileRevalidateTtlMs: HOME_CACHE_STALE_WHILE_REVALIDATE_TTL_MS
})
const homeSectionsCache = useStaleWhileRevalidateCache<HomeResponse>({
  freshTtlMs: HOME_CACHE_FRESH_TTL_MS,
  key: 'portal-home:sections',
  staleWhileRevalidateTtlMs: HOME_CACHE_STALE_WHILE_REVALIDATE_TTL_MS
})
const initialFeaturedSnapshot = featuredCache.readSnapshot()
const initialHomeSectionsSnapshot = homeSectionsCache.readSnapshot()

const featuredData = ref<SearchFeaturedResponse>(
  initialFeaturedSnapshot?.data ?? createEmptyFeaturedResponse()
)
const homeData = ref<HomeResponse>(initialHomeSectionsSnapshot?.data ?? createEmptyHomeResponse())
const featuredLoading = ref(!initialFeaturedSnapshot)
const homeSectionsLoading = ref(!initialHomeSectionsSnapshot)
const featuredMode = ref<HomeSectionMode>('live')
const homeSectionsMode = ref<HomeSectionMode>('live')
const featuredErrorCode = ref<PortalRequestBoundaryErrorCode>(500)
const homeSectionsErrorCode = ref<PortalRequestBoundaryErrorCode>(500)

const featuredBoundaryMode = computed<PortalRequestBoundaryMode>(() =>
  resolveBoundaryMode(featuredLoading.value, featuredMode.value)
)
const homeSectionsBoundaryMode = computed<PortalRequestBoundaryMode>(() =>
  resolveBoundaryMode(homeSectionsLoading.value, homeSectionsMode.value)
)
const articleSectionBoundaryMode = computed<PortalRequestBoundaryMode>(() =>
  resolveSectionBoundaryMode(
    homeSectionsBoundaryMode.value,
    Boolean(homeData.value.articleSection.featured) ||
      homeData.value.articleSection.items.length > 0
  )
)
const columnSectionBoundaryMode = computed<PortalRequestBoundaryMode>(() =>
  resolveSectionBoundaryMode(
    homeSectionsBoundaryMode.value,
    homeData.value.columnSection.items.length > 0
  )
)
const bookshelfSectionBoundaryMode = computed<PortalRequestBoundaryMode>(() =>
  resolveSectionBoundaryMode(
    homeSectionsBoundaryMode.value,
    homeData.value.bookshelfSection.items.length > 0
  )
)
const gallerySectionBoundaryMode = computed<PortalRequestBoundaryMode>(() =>
  resolveSectionBoundaryMode(
    homeSectionsBoundaryMode.value,
    homeData.value.gallerySection.items.length > 0
  )
)

async function loadFeaturedSection(options: { force?: boolean } = {}) {
  const snapshot = options.force ? null : featuredCache.readSnapshot()
  if (snapshot) {
    applyFeaturedResponse(snapshot.data)
    featuredLoading.value = false
    if (snapshot.state === 'stale') {
      void refreshFeaturedSection({ silent: true })
    }
    return
  }

  await refreshFeaturedSection()
}

async function loadHomeSections(options: { force?: boolean } = {}) {
  const snapshot = options.force ? null : homeSectionsCache.readSnapshot()
  if (snapshot) {
    applyHomeResponse(snapshot.data)
    homeSectionsLoading.value = false
    if (snapshot.state === 'stale') {
      void refreshHomeSections({ silent: true })
    }
    return
  }

  await refreshHomeSections()
}

async function loadHomePage() {
  await Promise.allSettled([loadFeaturedSection(), loadHomeSections()])
}

onMounted(() => {
  void loadHomePage()
})

function resolveBoundaryMode(isLoading: boolean, mode: HomeSectionMode): PortalRequestBoundaryMode {
  if (isLoading) {
    return 'loading'
  }

  return mode === 'error' ? 'error' : 'ready'
}

function resolveSectionBoundaryMode(
  mode: PortalRequestBoundaryMode,
  hasContent: boolean
): PortalRequestBoundaryMode {
  if (mode !== 'ready') {
    return mode
  }

  return hasContent ? 'ready' : 'empty'
}

function handleFeaturedRetry(): void {
  void loadFeaturedSection({ force: true })
}

function handleHomeSectionsRetry(): void {
  void loadHomeSections({ force: true })
}

async function refreshFeaturedSection(options: { silent?: boolean } = {}): Promise<void> {
  if (!options.silent) {
    featuredLoading.value = true
  }

  try {
    const result = await portalContentApi.getFeaturedItems()
    const featuredResponse = resolveFeaturedResponse(result.data)

    if (featuredResponse) {
      featuredCache.write(featuredResponse)
      applyFeaturedResponse(featuredResponse)
      return
    }

    if (!options.silent) {
      featuredMode.value = 'error'
      featuredErrorCode.value = result.errorCode ?? 500
    }
  } finally {
    if (!options.silent) {
      featuredLoading.value = false
    }
  }
}

async function refreshHomeSections(options: { silent?: boolean } = {}): Promise<void> {
  if (!options.silent) {
    homeSectionsLoading.value = true
  }

  try {
    const result = await portalContentApi.getHomePage()
    const homeResponse = resolveHomeResponse(result.data)

    if (homeResponse) {
      homeSectionsCache.write(homeResponse)
      applyHomeResponse(homeResponse)
      return
    }

    if (!options.silent) {
      homeSectionsMode.value = 'error'
      homeSectionsErrorCode.value = result.errorCode ?? 500
    }
  } finally {
    if (!options.silent) {
      homeSectionsLoading.value = false
    }
  }
}

function applyFeaturedResponse(response: SearchFeaturedResponse): void {
  featuredData.value = response
  featuredMode.value = 'live'
  featuredErrorCode.value = 500
}

function applyHomeResponse(response: HomeResponse): void {
  homeData.value = response
  homeSectionsMode.value = 'live'
  homeSectionsErrorCode.value = 500
}

function resolveFeaturedResponse(
  value: SearchFeaturedResponse | null | undefined
): SearchFeaturedResponse | null {
  if (!isRecord(value) || !Array.isArray(value.items) || !isFeaturedTotals(value.totals)) {
    return null
  }

  return value as SearchFeaturedResponse
}

function resolveHomeResponse(value: HomeResponse | null | undefined): HomeResponse | null {
  if (
    !isRecord(value) ||
    !isHomeSection(value.articleSection) ||
    !isHomeSection(value.columnSection) ||
    !isHomeSection(value.bookshelfSection) ||
    !isHomeSection(value.gallerySection)
  ) {
    return null
  }

  return value as HomeResponse
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isHomeSection(value: unknown): value is { items: unknown[] } {
  return isRecord(value) && Array.isArray(value.items)
}

function isFeaturedTotals(value: unknown): value is SearchFeaturedResponse['totals'] {
  return (
    isRecord(value) &&
    typeof value.articles === 'number' &&
    typeof value.books === 'number' &&
    typeof value.images === 'number' &&
    typeof value.topics === 'number'
  )
}

function createEmptyFeaturedResponse(): SearchFeaturedResponse {
  return {
    items: [],
    totals: {
      articles: 0,
      books: 0,
      images: 0,
      topics: 0
    }
  }
}

function createEmptyHomeResponse(): HomeResponse {
  return {
    articleSection: {
      featured: null,
      items: []
    },
    columnSection: {
      items: []
    },
    bookshelfSection: {
      items: []
    },
    gallerySection: {
      items: []
    },
    generatedAt: ''
  }
}
</script>

<style scoped>
.portal-home-page {
  width: min(var(--portal-browse-stage-max-width), 100%);
  margin: 0 auto;
  padding: var(--portal-stage-padding-top) var(--portal-home-stage-padding-inline) 0;
  box-sizing: border-box;
  display: grid;
  gap: var(--portal-content-section-gap-y);
}

.portal-home-page__row {
  display: grid;
  gap: var(--portal-content-section-gap-x);
  align-items: stretch;
}

.portal-home-page__row--center {
  grid-template-columns: var(--home-middle-main-col) var(--home-middle-side-col);
}

.portal-home-page__row--bottom {
  grid-template-columns: var(--home-bottom-side-col) var(--home-bottom-main-col);
}
</style>
