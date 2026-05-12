<template>
  <router-link
    :to="resolvePortalContentDetailLocation('image', item.id)"
    class="gallery-module-card"
    :class="`gallery-module-card--${variant}`"
    :aria-label="cardAriaLabel"
    role="listitem"
  >
    <div class="gallery-module-card__media">
      <span
        class="gallery-module-card__meta gallery-module-card__meta--left"
        :style="themeTagStyle"
      >
        {{ themeLabel }}
      </span>
      <span class="gallery-module-card__meta gallery-module-card__meta--right">
        {{ heatLabel }}
      </span>

      <div class="gallery-module-card__cover-shell">
        <portal-image :src="coverUrl" />
        <span class="gallery-module-card__cover-overlay" aria-hidden="true" />
      </div>
    </div>

    <div class="gallery-module-card__copy">
      <h3>{{ title }}</h3>
      <div class="gallery-module-card__footer">
        <div class="gallery-module-card__stats">
          <span class="gallery-module-card__meta-text">{{ metaLabel }}</span>
        </div>
        <span class="gallery-module-card__time">{{ timeLabel }}</span>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { GalleryModuleItemResponse } from '@/api/public-modules'
import { resolveGalleryModuleCoverUrl, resolveGalleryModulePreviewUrls } from '@/api/public-modules'
import { GALLERY_MODULE_TOPICS } from '@/constants/public-modules'
import { resolvePublicGalleryThemeLabel } from '@/constants/public-detail'
import {
  createPortalModuleTagToneStyle,
  resolvePortalModuleCategoryTone
} from '@/utils/public-modules'
import {
  formatCompactCount,
  formatPublishTimeLabel,
  resolvePortalContentDetailLocation
} from '@/utils/content'

const CARD_VARIANTS = ['balanced', 'tall', 'wide', 'balanced', 'tall', 'wide'] as const

type GalleryModuleCardVariant = (typeof CARD_VARIANTS)[number]

const props = defineProps<{
  index: number
  item: GalleryModuleItemResponse
}>()

function normalizeMetric(value: number | undefined | null): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0
}

function parseResolutionRatio(value: string | undefined): number | null {
  const normalized = value?.trim()
  if (!normalized) {
    return null
  }

  const matched = normalized.match(/(\d+)\s*[xX*]\s*(\d+)/)
  if (!matched) {
    return null
  }

  const width = Number.parseInt(matched[1], 10)
  const height = Number.parseInt(matched[2], 10)

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null
  }

  return width / height
}

const defaultVariant = computed<GalleryModuleCardVariant>(
  () => CARD_VARIANTS[props.index % CARD_VARIANTS.length]
)
const previewUrls = computed(() => resolveGalleryModulePreviewUrls(props.item))
const coverUrl = computed(() => previewUrls.value[0] || resolveGalleryModuleCoverUrl(props.item))

const variant = computed<GalleryModuleCardVariant>(() => {
  const ratio = parseResolutionRatio(props.item.resolution)

  if (ratio === null) {
    return defaultVariant.value
  }

  if (ratio >= 1.5) {
    return 'wide'
  }

  if (ratio <= 0.84) {
    return 'tall'
  }

  return 'balanced'
})

const title = computed(() => props.item.title?.trim() || '未命名图包')
const themeLabel = computed(() => resolvePublicGalleryThemeLabel(props.item.themeId))
const qualityLabel = computed(() => props.item.qualityLabel?.trim() || '')
const metaLabel = computed(() => {
  const segments = [qualityLabel.value, props.item.meta?.trim() || ''].filter(
    (segment, index, collection) => segment.length > 0 && collection.indexOf(segment) === index
  )

  return segments.join(' / ') || '公开图包'
})
const themeTagStyle = computed(() =>
  createPortalModuleTagToneStyle(
    resolvePortalModuleCategoryTone(GALLERY_MODULE_TOPICS, props.item.themeId)
  )
)

const heatScore = computed(
  () =>
    normalizeMetric(props.item.viewCount) +
    normalizeMetric(props.item.favorCount) * 8 +
    normalizeMetric(props.item.replyCount) * 12
)

const heatLabel = computed(() =>
  heatScore.value > 0 ? `热度 ${formatCompactCount(heatScore.value)}` : '新上'
)
const timeLabel = computed(() => formatPublishTimeLabel(props.item.uploadTime) || '近期更新')

const cardAriaLabel = computed(
  () =>
    `${title.value}，${themeLabel.value}，${heatLabel.value}，${metaLabel.value}，${timeLabel.value}`
)
</script>

<style scoped src="./gallery-module-card-shared.css"></style>

<style scoped>
.gallery-module-card {
  --gallery-module-card-meta-padding-inline-local: 8px;
  --gallery-module-card-inner-frame-inset-local: 8px;
  --gallery-module-card-inner-frame-radius-local: 14px;
  --gallery-module-card-corner-top-local: 12px;
  --gallery-module-card-corner-right-local: 12px;
  --gallery-module-card-corner-size-local: 30px;
  --gallery-module-card-corner-radius-local: 12px;
  color: inherit;
  text-decoration: none;
}

.gallery-module-card:focus-visible {
  outline: none;
}

.gallery-module-card::after {
  transition: opacity 180ms ease;
}

.gallery-module-card:hover::after,
.gallery-module-card:focus-visible::after {
  opacity: var(--gallery-module-card-divider-opacity-strong);
}

.gallery-module-card__meta {
  position: absolute;
  top: var(--gallery-module-card-meta-top-local);
  z-index: 2;
  display: inline-flex;
  align-items: center;
  height: var(--gallery-module-card-meta-height-local);
  padding: 0 var(--gallery-module-card-meta-padding-inline-local);
  border: 1px solid var(--gallery-module-card-meta-border);
  border-radius: 999px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 54%),
    var(--gallery-module-card-meta-bg);
  color: var(--gallery-module-card-meta-ink);
  font-size: 12px;
  font-weight: 700;
  line-height: var(--gallery-module-card-meta-height-local);
  letter-spacing: 0.03em;
  box-shadow:
    var(--gallery-module-card-meta-shadow),
    0 8px 16px rgba(18, 41, 74, 0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.gallery-module-card__meta::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.16), transparent 68%);
  pointer-events: none;
}

.gallery-module-card__meta--left {
  left: var(--gallery-module-card-meta-side-local);
  padding-left: 10px;
  border-radius: 10px 15px 13px 10px;
  border-color: color-mix(
    in srgb,
    var(--portal-module-card-tag-border) 76%,
    rgba(255, 255, 255, 0.18)
  );
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 54%),
    color-mix(in srgb, var(--portal-module-card-tag-bg) 86%, rgba(255, 255, 255, 0.18));
  color: color-mix(in srgb, var(--portal-module-card-tag-accent) 82%, var(--home-ink) 18%);
  box-shadow:
    0 8px 16px color-mix(in srgb, var(--portal-module-card-tag-accent) 10%, rgba(18, 41, 74, 0.08)),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.gallery-module-card__meta--left::before {
  content: '';
  width: 4px;
  height: 12px;
  margin-right: 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--portal-module-card-tag-accent) 74%, white 26%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.44);
  flex: 0 0 auto;
  z-index: 1;
}

.gallery-module-card__meta--right {
  right: var(--gallery-module-card-meta-side-local);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0) 56%),
    color-mix(in srgb, var(--gallery-module-card-meta-bg) 84%, rgba(255, 255, 255, 0.12));
  border-color: color-mix(
    in srgb,
    var(--gallery-module-card-meta-border) 72%,
    rgba(255, 255, 255, 0.12)
  );
  letter-spacing: 0.02em;
}

.gallery-module-card__cover-shell {
  position: relative;
  z-index: 1;
  overflow: hidden;
  border: 1px solid var(--home-media-panel-border);
  background: var(--home-gallery-tile-bg);
  box-shadow: var(--home-card-shadow);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    filter 180ms ease;
}

.gallery-module-card:hover .gallery-module-card__cover-shell,
.gallery-module-card:focus-within .gallery-module-card__cover-shell {
  border-color: var(--home-feature-ribbon-border);
  box-shadow: var(--home-card-hover-shadow);
  filter: var(--home-card-hover-filter);
}

.gallery-module-card:focus-visible .gallery-module-card__cover-shell {
  border-color: var(--home-feature-ribbon-border);
  box-shadow:
    0 0 0 4px var(--portal-focus-ring),
    var(--home-card-hover-shadow);
}

.gallery-module-card__cover-shell::before {
  content: '';
  position: absolute;
  inset: var(--gallery-module-card-inner-frame-inset-local);
  z-index: 1;
  border: 1px solid var(--home-media-frame-border);
  border-radius: var(--gallery-module-card-inner-frame-radius-local);
  opacity: var(--gallery-module-card-inner-frame-opacity);
  pointer-events: none;
}

.gallery-module-card__cover-shell::after {
  content: '';
  position: absolute;
  top: var(--gallery-module-card-corner-top-local);
  right: var(--gallery-module-card-corner-right-local);
  width: var(--gallery-module-card-corner-size-local);
  height: var(--gallery-module-card-corner-size-local);
  z-index: 1;
  border-top: 1px solid var(--gallery-module-card-corner-border);
  border-right: 1px solid var(--gallery-module-card-corner-border);
  border-radius: 0 var(--gallery-module-card-corner-radius-local) 0 0;
  opacity: var(--gallery-module-card-corner-opacity);
  pointer-events: none;
}

.gallery-module-card__cover-overlay {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: var(--gallery-module-card-overlay);
}

.gallery-module-card__copy {
  gap: 6px;
}

.gallery-module-card__copy h3 {
  margin: 0;
  min-height: 2.76em;
  color: var(--home-ink);
  font-size: 14px;
  line-height: 1.38;
  letter-spacing: -0.03em;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.gallery-module-card__footer {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.gallery-module-card__stats {
  min-width: 0;
}

.gallery-module-card__meta-text {
  display: block;
  min-width: 0;
  color: color-mix(in srgb, var(--home-detail-glass-ink) 80%, transparent);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gallery-module-card__time {
  flex: 0 0 auto;
  color: color-mix(in srgb, var(--home-muted) 78%, transparent);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
</style>
