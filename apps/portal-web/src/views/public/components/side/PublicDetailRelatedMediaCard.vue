<template>
  <router-link
    :to="to"
    class="public-detail-related-media-card"
    :class="`public-detail-related-media-card--${accent}`"
  >
    <div class="public-detail-related-media-card__cover">
      <portal-image :src="coverUrl" class="public-detail-related-media-card__cover-image" />
    </div>

    <div class="public-detail-related-media-card__copy">
      <h3 class="public-detail-related-media-card__title">{{ title }}</h3>
      <p v-if="summaryLabel" class="public-detail-related-media-card__summary">
        {{ summaryLabel }}
      </p>

      <div class="public-detail-related-media-card__meta">
        <div v-if="displayTags.length > 0" class="public-detail-related-media-card__tags">
          <span
            v-for="(tag, index) in displayTags"
            :key="`${tag}-${index}`"
            class="public-detail-related-media-card__tag"
            :class="{ 'is-primary': index === 0 }"
          >
            {{ tag }}
          </span>
        </div>

        <span v-if="publishTimeLabel" class="public-detail-related-media-card__date">
          {{ publishTimeLabel }}
        </span>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

import { formatPublishTimeLabel } from '@/utils/content'
import type { PublicDetailAccent } from '@/constants/public-detail'

const props = withDefaults(
  defineProps<{
    accent?: PublicDetailAccent
    coverUrl: string
    publishTime?: string
    summary?: string
    tags?: string[]
    title: string
    to: RouteLocationRaw
  }>(),
  {
    accent: 'article',
    publishTime: '',
    summary: '',
    tags: () => []
  }
)

const displayTags = computed(() =>
  props.tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 2)
)
const publishTimeLabel = computed(() => formatPublishTimeLabel(props.publishTime))
const summaryLabel = computed(() => props.summary.trim())
</script>

<style scoped>
.public-detail-related-media-card {
  --public-detail-related-tag-bg: var(--portal-content-article-tag-bg);
  --public-detail-related-tag-border: var(--portal-content-article-tag-border);
  --public-detail-related-tag-ink: var(--portal-content-article-tag-ink);
  --public-detail-related-accent: var(--portal-content-article-accent);
  --public-detail-related-divider: color-mix(
    in srgb,
    var(--public-detail-divider) 82%,
    transparent
  );
  --public-detail-related-motion-duration: 180ms;
  --public-detail-related-motion-ease: ease;
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  position: relative;
  padding: 4px 0 16px;
  color: inherit;
  text-decoration: none;
  transition: border-color var(--public-detail-related-motion-duration)
    var(--public-detail-related-motion-ease);
}

.public-detail-related-media-card::after {
  content: '';
  position: absolute;
  right: 8px;
  bottom: 0;
  left: 8px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--public-detail-related-divider) 12%,
    var(--public-detail-related-divider) 88%,
    transparent 100%
  );
  pointer-events: none;
}

.public-detail-related-media-card:last-child {
  padding-bottom: 0;
}

.public-detail-related-media-card:last-child::after {
  content: none;
}

.public-detail-related-media-card:hover,
.public-detail-related-media-card:focus-visible {
  --public-detail-related-divider: color-mix(
    in srgb,
    var(--public-detail-related-accent) 18%,
    var(--public-detail-divider)
  );
}

.public-detail-related-media-card--topic {
  --public-detail-related-tag-bg: var(--portal-content-topic-tag-bg);
  --public-detail-related-tag-border: var(--portal-content-topic-tag-border);
  --public-detail-related-tag-ink: var(--portal-content-topic-tag-ink);
  --public-detail-related-accent: var(--portal-content-topic-accent);
}

.public-detail-related-media-card--book {
  --public-detail-related-tag-bg: var(--portal-content-bookshelf-tag-bg);
  --public-detail-related-tag-border: var(--portal-content-bookshelf-tag-border);
  --public-detail-related-tag-ink: var(--portal-content-bookshelf-tag-ink);
  --public-detail-related-accent: var(--portal-content-bookshelf-accent);
}

.public-detail-related-media-card--gallery {
  --public-detail-related-tag-bg: var(--portal-content-gallery-tag-bg);
  --public-detail-related-tag-border: var(--portal-content-gallery-tag-border);
  --public-detail-related-tag-ink: var(--portal-content-gallery-tag-ink);
  --public-detail-related-accent: var(--portal-content-gallery-accent);
}

.public-detail-related-media-card__cover {
  position: relative;
  height: 122px;
  border: 1px solid color-mix(in srgb, var(--portal-browse-media-panel-border) 88%, transparent);
  border-radius: 16px;
  background:
    var(--portal-browse-media-overlay-soft), var(--portal-browse-media-placeholder-surface);
  box-shadow: var(--public-detail-card-shadow);
  overflow: hidden;
  transition:
    border-color var(--public-detail-related-motion-duration)
      var(--public-detail-related-motion-ease),
    box-shadow var(--public-detail-related-motion-duration) var(--public-detail-related-motion-ease),
    transform var(--public-detail-related-motion-duration) var(--public-detail-related-motion-ease);
}

.public-detail-related-media-card__cover-image {
  filter: saturate(0.94) contrast(0.98);
  transition: filter var(--public-detail-related-motion-duration)
    var(--public-detail-related-motion-ease);
}

.public-detail-related-media-card__copy {
  display: grid;
  align-content: start;
  min-width: 0;
  padding: 4px 0 2px;
}

.public-detail-related-media-card__title,
.public-detail-related-media-card__summary {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
}

.public-detail-related-media-card__title {
  color: var(--portal-content-ink);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.46;
  letter-spacing: 0;
  transition: color var(--public-detail-related-motion-duration)
    var(--public-detail-related-motion-ease);
}

.public-detail-related-media-card__summary {
  color: color-mix(in srgb, var(--portal-content-muted) 84%, transparent);
  font-size: 12px;
  line-height: 1.5;
}

.public-detail-related-media-card__title + .public-detail-related-media-card__summary,
.public-detail-related-media-card__title + .public-detail-related-media-card__meta {
  margin-top: 8px;
}

.public-detail-related-media-card__summary + .public-detail-related-media-card__meta {
  margin-top: 16px;
}

.public-detail-related-media-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.public-detail-related-media-card__tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.public-detail-related-media-card__tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  padding: 0 8px;
  border: 1px solid
    color-mix(in srgb, var(--portal-content-feature-tag-soft-border) 80%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--portal-content-feature-tag-soft-bg) 90%, transparent);
  color: color-mix(in srgb, var(--portal-content-feature-tag-soft-ink) 92%, transparent);
  font-size: 12px;
  font-weight: 700;
  line-height: 20px;
  white-space: nowrap;
}

.public-detail-related-media-card__tag.is-primary {
  border-color: color-mix(in srgb, var(--public-detail-related-tag-border) 86%, transparent);
  background: color-mix(in srgb, var(--public-detail-related-tag-bg) 92%, transparent);
  color: color-mix(in srgb, var(--public-detail-related-tag-ink) 94%, transparent);
}

.public-detail-related-media-card__date {
  flex: 0 0 auto;
  color: color-mix(in srgb, var(--portal-content-muted) 84%, transparent);
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
}

.public-detail-related-media-card:hover .public-detail-related-media-card__title,
.public-detail-related-media-card:focus-visible .public-detail-related-media-card__title {
  color: color-mix(in srgb, var(--public-detail-related-accent) 76%, var(--portal-content-ink));
}

.public-detail-related-media-card:hover .public-detail-related-media-card__cover,
.public-detail-related-media-card:focus-visible .public-detail-related-media-card__cover {
  border-color: color-mix(
    in srgb,
    var(--public-detail-related-accent) 22%,
    var(--portal-browse-media-panel-border)
  );
  box-shadow: var(--public-detail-card-shadow);
}

.public-detail-related-media-card:hover .public-detail-related-media-card__cover-image,
.public-detail-related-media-card:focus-visible .public-detail-related-media-card__cover-image {
  filter: saturate(0.98) contrast(1);
}
</style>
