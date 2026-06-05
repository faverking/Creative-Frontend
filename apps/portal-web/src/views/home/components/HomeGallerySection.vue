<template>
  <section class="home-gallery-section">
    <portal-section-heading variant="gallery" title="图包" />

    <portal-request-boundary
      class="home-gallery-section__stage"
      :mode="mode"
      :error-code="errorCode"
      primary-label="重试"
      transition-name="home-section-stage"
      @primary="emit('retry')"
    >
      <template #loading>
        <div key="gallery-skeleton" class="home-gallery-section__grid" aria-hidden="true">
          <article
            v-for="(item, itemIndex) in section.items"
            :key="`gallery-skeleton-${item.id || itemIndex}`"
            class="home-gallery-section__card"
          >
            <div class="home-gallery-section__mosaic-shell">
              <div class="home-gallery-section__mosaic">
                <span
                  v-for="tileIndex in HOME_GALLERY_TILE_COUNT"
                  :key="`gallery-skeleton-tile-${itemIndex}-${tileIndex}`"
                  class="home-gallery-section__tile home-gallery-section__tile--skeleton"
                  :data-badge="tileIndex === 1 ? resolveGalleryBadge(item) : undefined"
                />
              </div>
            </div>

            <div class="home-gallery-section__copy">
              <div
                class="home-gallery-section__skeleton-lines home-gallery-section__skeleton-lines--title"
              >
                <span
                  class="home-gallery-section__skeleton-line home-gallery-section__skeleton-line--title"
                >
                  <span
                    class="home-gallery-section__skeleton-block home-gallery-section__skeleton-block--title"
                  />
                </span>
              </div>

              <div
                class="home-gallery-section__skeleton-lines home-gallery-section__skeleton-lines--meta"
              >
                <span
                  class="home-gallery-section__skeleton-line home-gallery-section__skeleton-line--meta"
                >
                  <span
                    class="home-gallery-section__skeleton-block home-gallery-section__skeleton-block--meta"
                  />
                </span>
              </div>
            </div>
          </article>
        </div>
      </template>

      <div key="gallery-content" class="home-gallery-section__grid">
        <article
          v-for="item in section.items"
          :key="item.id"
          class="home-gallery-section__card home-gallery-section__card--link portal-interactive-surface"
        >
          <router-link
            class="home-gallery-section__link-layer portal-link-layer"
            :to="resolvePortalContentDetailLocation('image', item.id)"
            :aria-label="`查看${item.title}详情`"
            :title="item.title"
          />
          <div class="home-gallery-section__mosaic-shell">
            <div class="home-gallery-section__mosaic">
              <span
                v-for="(tile, tileIndex) in galleryTileUrls(item.images)"
                :key="`${item.id}-${tileIndex}`"
                class="home-gallery-section__tile"
                :data-badge="
                  tileIndex === 0 && resolveGalleryBadge(item)
                    ? resolveGalleryBadge(item)
                    : undefined
                "
              >
                <portal-image :src="tile" />
                <span v-if="tile" class="home-gallery-section__tile-overlay" aria-hidden="true" />
              </span>
            </div>
          </div>

          <div class="home-gallery-section__copy">
            <h3>{{ item.title }}</h3>
            <p>{{ item.meta }}</p>
          </div>
        </article>
      </div>
    </portal-request-boundary>
  </section>
</template>

<script setup lang="ts">
import type {
  PortalRequestBoundaryErrorCode,
  PortalRequestBoundaryMode
} from '@/components/PortalRequestBoundary.vue'
import type { HomeGalleryItemResponse, HomeGallerySectionResponse } from '@/api/content'
import { resolveHomeMediaUrl } from '@/api/content'
import { HOME_GALLERY_TILE_COUNT } from '@/constants/home'
import { resolvePortalContentDetailLocation } from '@/utils/content'

const emit = defineEmits<{
  retry: []
}>()

withDefaults(
  defineProps<{
    errorCode?: PortalRequestBoundaryErrorCode
    section: HomeGallerySectionResponse
    mode?: PortalRequestBoundaryMode
  }>(),
  {
    errorCode: 500,
    mode: 'ready'
  }
)

function galleryTileUrls(images: HomeGalleryItemResponse['images']) {
  const normalized = images
    .map((image) => resolveHomeMediaUrl(image))
    .filter((url) => url.length > 0)
    .slice(0, HOME_GALLERY_TILE_COUNT)

  while (normalized.length < HOME_GALLERY_TILE_COUNT) {
    normalized.push('')
  }

  return normalized
}

function resolveGalleryBadge(item: HomeGalleryItemResponse): string {
  return item.qualityLabel || item.badge
}
</script>

<style scoped>
.home-gallery-section {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: var(--home-section-heading-gap);
  height: 100%;
}

.home-gallery-section > .portal-section-heading {
  margin: 0;
}

.home-gallery-section__stage {
  position: relative;
  display: grid;
}

.home-gallery-section__stage :deep(.portal-request-boundary__state) {
  --portal-request-boundary-accent: var(--home-business-gallery-accent);
  min-height: 256px;
  padding: var(--portal-browse-state-padding);
  border: 1px solid
    color-mix(
      in srgb,
      var(--portal-request-boundary-accent) 14%,
      var(--portal-request-state-border)
    );
  border-radius: var(--portal-browse-feature-radius);
  background: var(--portal-browse-state-surface);
  box-shadow: var(--portal-browse-feature-shadow);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.home-gallery-section__stage > * {
  grid-area: 1 / 1;
}

.home-gallery-section__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--home-card-gap-loose);
  min-height: 100%;
  height: 100%;
  align-content: start;
}

.home-gallery-section__card {
  position: relative;
  display: grid;
  grid-template-rows: auto var(--home-block-title-md-1) var(--home-block-body-md-1);
  gap: var(--home-card-gap-loose);
  padding: var(--portal-browse-card-padding);
  border: 1px solid var(--portal-browse-card-border);
  border-radius: var(--portal-browse-card-radius);
  background: var(--portal-browse-card-surface);
  box-shadow: var(--portal-browse-card-shadow);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.home-gallery-section__card--link {
  --portal-interactive-hover-background: var(--portal-browse-card-hover-surface);
  --portal-interactive-hover-border: var(--home-column-module-divider-strong);
  --portal-interactive-hover-shadow: var(--portal-browse-card-hover-shadow);
}

.home-gallery-section__link-layer {
  z-index: 2;
}

.home-gallery-section__mosaic-shell {
  position: relative;
  padding: 5px 8px 10px 5px;
  isolation: isolate;
}

.home-gallery-section__mosaic-shell::before,
.home-gallery-section__mosaic-shell::after {
  content: '';
  position: absolute;
  border: 1px solid var(--home-gallery-stack-border);
  border-radius: 18px;
  background: var(--home-gallery-stack-bg);
  box-shadow: var(--home-gallery-stack-shadow);
  pointer-events: none;
}

.home-gallery-section__mosaic-shell::before {
  inset: 12px 0 0 14px;
  transform: rotate(2.9deg);
}

.home-gallery-section__mosaic-shell::after {
  inset: 5px 7px 4px 7px;
  opacity: 0.92;
  transform: rotate(-1.9deg);
}

.home-gallery-section__mosaic {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: 92px 54px;
  gap: 10px;
}

.home-gallery-section__tile {
  position: relative;
  display: inline-flex;
  overflow: hidden;
  border: 1px solid var(--home-media-panel-border);
  border-radius: 14px;
  background: linear-gradient(145deg, rgba(96, 129, 168, 0.24), rgba(18, 24, 35, 0.52));
  box-shadow: var(--portal-browse-media-shadow);
}

.home-gallery-section__tile--skeleton {
  background: linear-gradient(
    135deg,
    var(--home-skeleton-block-strong),
    var(--home-skeleton-block)
  );
}

.home-gallery-section__tile::before {
  content: '';
  position: absolute;
  inset: 6px;
  z-index: 2;
  border: 1px solid var(--home-media-frame-border);
  border-radius: 10px;
  opacity: 0.72;
}

.home-gallery-section__tile-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: var(--home-gallery-tile-bg);
}

.home-gallery-section__tile[data-badge]::after {
  content: attr(data-badge);
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  border: 1px solid var(--home-gallery-badge-border);
  border-radius: 999px;
  background: var(--home-gallery-badge-bg);
  color: var(--home-gallery-badge-ink);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.home-gallery-section__tile:nth-child(1) {
  filter: hue-rotate(-6deg) saturate(1.06);
}

.home-gallery-section__tile:nth-child(2) {
  filter: hue-rotate(12deg) saturate(1.12);
}

.home-gallery-section__tile:nth-child(3) {
  filter: hue-rotate(24deg) saturate(1.08);
}

.home-gallery-section__tile:nth-child(4) {
  filter: hue-rotate(-18deg) saturate(1.04);
}

.home-gallery-section__copy {
  display: grid;
  grid-template-rows: var(--home-block-title-md-1) var(--home-block-body-md-1);
  gap: 10px;
}

.home-gallery-section__copy h3 {
  margin: 0;
  color: var(--home-ink);
  height: var(--home-block-title-md-1);
  overflow: hidden;
  font-size: var(--home-font-size-title-md);
  line-height: var(--home-line-size-title-md);
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.home-gallery-section__copy p {
  margin: 0;
  color: var(--home-muted);
  height: var(--home-block-body-md-1);
  overflow: hidden;
  font-size: 12px;
  line-height: var(--home-line-size-body-md);
  opacity: 0.9;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.home-gallery-section__skeleton-lines {
  display: grid;
  align-content: start;
  gap: 0;
}

.home-gallery-section__skeleton-lines--title {
  height: var(--home-block-title-md-1);
}

.home-gallery-section__skeleton-lines--meta {
  height: var(--home-block-body-md-1);
}

.home-gallery-section__skeleton-line {
  display: flex;
  align-items: center;
}

.home-gallery-section__skeleton-line--title {
  height: var(--home-line-size-title-md);
}

.home-gallery-section__skeleton-line--meta {
  height: var(--home-line-size-body-md);
}

.home-gallery-section__skeleton-block {
  position: relative;
  display: inline-flex;
  overflow: hidden;
  border: 1px solid var(--home-skeleton-border);
  border-radius: 999px;
  background: linear-gradient(
    135deg,
    var(--home-skeleton-block-strong),
    var(--home-skeleton-block)
  );
}

.home-gallery-section__skeleton-block::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--home-skeleton-shimmer);
  animation: home-skeleton-wave 2.4s ease-in-out infinite;
  transform: translateX(-100%);
}

.home-gallery-section__skeleton-block--title {
  width: 86%;
  height: var(--home-skeleton-title-md-height);
}

.home-gallery-section__skeleton-block--meta {
  width: 72%;
  height: var(--home-skeleton-copy-12-height);
}
</style>
