<template>
  <div
    class="public-detail-loading-state"
    :class="`public-detail-loading-state--${variant}`"
    aria-busy="true"
    aria-live="polite"
  >
    <section class="public-detail-loading-state__layout">
      <public-detail-panel class="public-detail-loading-state__main" padding="none" variant="main">
        <template v-if="isBook">
          <div class="public-detail-loading-state__book-body">
            <public-detail-loading-book-skeleton />
            <public-detail-loading-comments-skeleton variant="book" />
          </div>
        </template>

        <template v-else>
          <public-detail-loading-hero-skeleton :variant="variant" />

          <div :class="contentBodyClass">
            <div v-if="showArticleCopy" class="public-detail-loading-state__article-copy">
              <span
                v-for="width in bodyLineWidths"
                :key="`body-${width}`"
                class="public-detail-loading-state__line public-detail-loading-state__line--body"
              >
                <span
                  class="public-detail-loading-state__block public-detail-loading-state__block--body"
                  :style="{ width }"
                />
              </span>
            </div>

            <public-detail-loading-comments-skeleton :variant="variant" />
          </div>
        </template>
      </public-detail-panel>

      <aside class="public-detail-loading-state__side">
        <public-detail-loading-side-rail-skeleton :variant="variant" />
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import PublicDetailPanel from '../layout/PublicDetailPanel.vue'
import PublicDetailLoadingBookSkeleton from './PublicDetailLoadingBookSkeleton.vue'
import PublicDetailLoadingCommentsSkeleton from './PublicDetailLoadingCommentsSkeleton.vue'
import PublicDetailLoadingHeroSkeleton from './PublicDetailLoadingHeroSkeleton.vue'
import PublicDetailLoadingSideRailSkeleton from './PublicDetailLoadingSideRailSkeleton.vue'
import type { PublicDetailLoadingVariant } from './public-detail-loading'

const props = withDefaults(
  defineProps<{
    variant?: PublicDetailLoadingVariant
  }>(),
  {
    variant: 'article'
  }
)

const variant = computed(() => props.variant)
const isBook = computed(() => variant.value === 'book')
const isGallery = computed(() => variant.value === 'gallery')
const showArticleCopy = computed(() => variant.value !== 'book' && variant.value !== 'gallery')

const contentBodyClass = computed(() => {
  if (isGallery.value) {
    return 'public-detail-loading-state__gallery'
  }

  return 'public-detail-loading-state__body'
})

const bodyLineWidths = computed(() => {
  if (variant.value === 'topic') {
    return ['100%', '97%', '93%', '88%', '84%', '76%']
  }

  return ['100%', '96%', '92%', '88%', '82%', '74%']
})
</script>

<style src="./public-detail-loading.css"></style>
