<template>
  <public-detail-side-rail class="public-detail-loading-state__side-rail">
    <section
      v-if="showAuthorCard"
      class="public-detail-side-rail__section public-detail-loading-state__side-panel"
    >
      <div class="public-detail-loading-state__section-heading">
        <span
          class="public-detail-loading-state__block public-detail-loading-state__block--side-title"
        />
      </div>

      <div class="public-detail-loading-state__author-card">
        <div class="public-detail-loading-state__author-main">
          <span class="public-detail-loading-state__author-avatar" />
          <div class="public-detail-loading-state__author-copy">
            <span
              class="public-detail-loading-state__block public-detail-loading-state__block--author-name"
            />
            <div
              class="public-detail-loading-state__lines public-detail-loading-state__lines--author"
            >
              <span
                v-for="width in authorLineWidths"
                :key="`author-line-${width}`"
                class="public-detail-loading-state__line public-detail-loading-state__line--author"
              >
                <span
                  class="public-detail-loading-state__block public-detail-loading-state__block--author-bio"
                  :style="{ width }"
                />
              </span>
            </div>
          </div>
        </div>

        <div class="public-detail-loading-state__author-meta">
          <span
            v-for="width in authorMetaWidths"
            :key="`author-meta-${width}`"
            class="public-detail-loading-state__pill public-detail-loading-state__pill--author-tag"
            :style="{ width }"
          />
        </div>
      </div>
    </section>

    <section class="public-detail-side-rail__section public-detail-loading-state__side-panel">
      <div class="public-detail-loading-state__section-heading">
        <span
          class="public-detail-loading-state__block public-detail-loading-state__block--side-title"
        />
      </div>

      <div class="public-detail-loading-state__related-list">
        <article
          v-for="(card, index) in relatedCardSkeletons"
          :key="`${props.variant}-related-${index}`"
          class="public-detail-loading-state__related-media-card"
        >
          <div class="public-detail-loading-state__related-media-cover" />

          <div class="public-detail-loading-state__related-media-copy">
            <span
              class="public-detail-loading-state__line public-detail-loading-state__line--related-title"
            >
              <span
                class="public-detail-loading-state__block public-detail-loading-state__block--related-card-title"
              />
            </span>
            <span class="public-detail-loading-state__line public-detail-loading-state__line--body">
              <span
                class="public-detail-loading-state__block public-detail-loading-state__block--related-summary"
                :style="{ width: card.summaryWidth }"
              />
            </span>

            <div class="public-detail-loading-state__related-media-meta">
              <div class="public-detail-loading-state__related-meta-group">
                <span
                  class="public-detail-loading-state__pill public-detail-loading-state__pill--related-tag"
                />
                <span
                  v-if="isTopic"
                  class="public-detail-loading-state__pill public-detail-loading-state__pill--related-tag-secondary"
                />
              </div>
              <span
                class="public-detail-loading-state__line public-detail-loading-state__line--related-meta"
              >
                <span
                  class="public-detail-loading-state__block public-detail-loading-state__block--related-date"
                />
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section
      v-if="isTopic"
      class="public-detail-side-rail__section public-detail-loading-state__side-panel"
    >
      <div class="public-detail-loading-state__section-heading">
        <span
          class="public-detail-loading-state__block public-detail-loading-state__block--side-title"
        />
      </div>

      <div class="public-detail-loading-state__resource-card">
        <div class="public-detail-loading-state__resource-copy">
          <div class="public-detail-loading-state__resource-eyebrow">
            <span
              v-for="width in resourceBadgeWidths"
              :key="`resource-badge-${width}`"
              class="public-detail-loading-state__pill public-detail-loading-state__pill--resource-badge"
              :style="{ width }"
            />
          </div>

          <span
            class="public-detail-loading-state__line public-detail-loading-state__line--resource-title"
          >
            <span
              class="public-detail-loading-state__block public-detail-loading-state__block--resource-title"
            />
          </span>

          <span
            class="public-detail-loading-state__line public-detail-loading-state__line--resource-detail"
          >
            <span
              class="public-detail-loading-state__block public-detail-loading-state__block--resource-detail"
              :style="{ width: resourceDetailWidth }"
            />
          </span>
        </div>

        <div class="public-detail-loading-state__resource-footer">
          <span
            class="public-detail-loading-state__pill public-detail-loading-state__pill--resource-action"
          />
        </div>
      </div>
    </section>
  </public-detail-side-rail>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import PublicDetailSideRail from '../layout/PublicDetailSideRail.vue'

import type { PublicDetailLoadingVariant } from './public-detail-loading'

const props = defineProps<{
  variant: PublicDetailLoadingVariant
}>()

const isTopic = computed(() => props.variant === 'topic')
const showAuthorCard = computed(() => props.variant !== 'book')

const authorMetaWidths = ['74px', '86px'] as const
const authorLineWidths = ['78%', '92%'] as const
const resourceBadgeWidths = ['92px', '76px'] as const
const resourceDetailWidth = '82%'

const relatedCardSkeletons = computed(() =>
  props.variant === 'book'
    ? [
        { summaryWidth: '86%' },
        { summaryWidth: '78%' },
        { summaryWidth: '82%' },
        { summaryWidth: '74%' }
      ]
    : [{ summaryWidth: '86%' }, { summaryWidth: '78%' }, { summaryWidth: '82%' }]
)
</script>
