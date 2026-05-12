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
        :mode="homeSectionsBoundaryMode"
        @retry="handleHomeSectionsRetry"
      />
      <home-column-section
        :error-code="homeSectionsErrorCode"
        :section="homeData.columnSection"
        :mode="homeSectionsBoundaryMode"
        @retry="handleHomeSectionsRetry"
      />
    </div>

    <div class="portal-home-page__row portal-home-page__row--bottom">
      <home-book-section
        :error-code="homeSectionsErrorCode"
        :section="homeData.bookshelfSection"
        :mode="homeSectionsBoundaryMode"
        @retry="handleHomeSectionsRetry"
      />
      <home-gallery-section
        :error-code="homeSectionsErrorCode"
        :section="homeData.gallerySection"
        :mode="homeSectionsBoundaryMode"
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

type HomeSectionMode = 'error' | 'live'

const featuredData = ref<SearchFeaturedResponse>(createEmptyFeaturedResponse())
const homeData = ref<HomeResponse>(createEmptyHomeResponse())
const featuredLoading = ref(true)
const homeSectionsLoading = ref(true)
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

async function loadFeaturedSection() {
  featuredLoading.value = true
  try {
    const result = await portalContentApi.getFeaturedItems()
    if (result.data) {
      featuredData.value = result.data
      featuredMode.value = 'live'
      featuredErrorCode.value = 500
      return
    }

    featuredMode.value = 'error'
    featuredErrorCode.value = result.errorCode ?? 500
  } finally {
    featuredLoading.value = false
  }
}

async function loadHomeSections() {
  homeSectionsLoading.value = true
  try {
    const result = await portalContentApi.getHomePage()
    if (result.data) {
      homeData.value = result.data
      homeSectionsMode.value = 'live'
      homeSectionsErrorCode.value = 500
      return
    }

    homeSectionsMode.value = 'error'
    homeSectionsErrorCode.value = result.errorCode ?? 500
  } finally {
    homeSectionsLoading.value = false
  }
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

function handleFeaturedRetry(): void {
  void loadFeaturedSection()
}

function handleHomeSectionsRetry(): void {
  void loadHomeSections()
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
  gap: var(--home-section-gap-y);
}

.portal-home-page__row {
  display: grid;
  gap: var(--home-section-gap-x);
  align-items: stretch;
}

.portal-home-page__row--center {
  grid-template-columns: var(--home-middle-main-col) var(--home-middle-side-col);
}

.portal-home-page__row--bottom {
  grid-template-columns: var(--home-bottom-side-col) var(--home-bottom-main-col);
}
</style>
