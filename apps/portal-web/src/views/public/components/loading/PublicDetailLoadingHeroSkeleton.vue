<template>
  <div :class="isGallery ? 'public-detail-loading-state__gallery-header' : undefined">
    <template v-if="isGallery">
      <div class="public-detail-loading-state__preview">
        <span class="public-detail-loading-state__preview-chip" />
        <span class="public-detail-loading-state__preview-order" />
      </div>

      <div class="public-detail-loading-state__preview-footer">
        <div class="public-detail-loading-state__thumb-strip">
          <span
            v-for="index in 6"
            :key="`thumb-${index}`"
            class="public-detail-loading-state__thumb"
          />
        </div>
      </div>
    </template>

    <div
      class="public-detail-loading-state__hero"
      :class="
        isGallery
          ? 'public-detail-loading-state__hero--gallery'
          : 'public-detail-loading-state__hero--with-cover'
      "
    >
      <div v-if="!isGallery" class="public-detail-loading-state__hero-cover" />

      <div class="public-detail-loading-state__lines public-detail-loading-state__lines--title">
        <span
          v-for="width in titleLineWidths"
          :key="`title-${width}`"
          class="public-detail-loading-state__line public-detail-loading-state__line--title"
        >
          <span
            class="public-detail-loading-state__block public-detail-loading-state__block--title"
            :style="{ width }"
          />
        </span>
      </div>

      <div class="public-detail-loading-state__hero-meta-stack">
        <div class="public-detail-loading-state__hero-meta-row">
          <div class="public-detail-loading-state__hero-meta-stream">
            <span
              v-for="width in heroMetaLineWidths"
              :key="`hero-meta-${width}`"
              class="public-detail-loading-state__line public-detail-loading-state__line--meta"
            >
              <span
                class="public-detail-loading-state__block public-detail-loading-state__block--meta-line"
                :style="{ width }"
              />
            </span>

            <span
              v-for="(width, index) in heroMetricWidths"
              :key="`metric-${index}`"
              class="public-detail-loading-state__hero-metric"
              :style="{ width }"
            />
          </div>

          <span
            class="public-detail-loading-state__pill public-detail-loading-state__pill--hero-tag"
            :style="{ width: heroMetaTagWidth }"
          />
        </div>

        <div class="public-detail-loading-state__hero-actions">
          <span
            v-for="(width, index) in heroActionWidths"
            :key="`hero-action-${index}`"
            class="public-detail-loading-state__pill public-detail-loading-state__pill--hero-action"
            :style="{ width }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { PublicDetailLoadingVariant } from './public-detail-loading'

const props = defineProps<{
  variant: PublicDetailLoadingVariant
}>()

const isGallery = computed(() => props.variant === 'gallery')
const isTopic = computed(() => props.variant === 'topic')

const titleLineWidths = computed(() => {
  if (isTopic.value) {
    return ['62%', '84%']
  }

  if (isGallery.value) {
    return ['50%', '76%']
  }

  return ['56%', '82%']
})

const heroMetaTagWidth = computed(() => {
  if (isTopic.value) {
    return '92px'
  }

  if (isGallery.value) {
    return '88px'
  }

  return '84px'
})

const heroMetaLineWidths = computed(() => {
  if (isGallery.value) {
    return ['88px', '96px']
  }

  return ['92px', '104px']
})

const heroMetricWidths = computed(() => {
  if (isGallery.value) {
    return ['72px', '68px', '64px']
  }

  return ['74px', '70px', '66px']
})

const heroActionWidths = computed(() => {
  if (isGallery.value) {
    return ['116px', '106px', '100px']
  }

  if (isTopic.value) {
    return ['118px', '106px', '100px']
  }

  return ['104px', '100px']
})
</script>
