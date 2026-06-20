<template>
  <section class="home-column-section">
    <portal-section-heading variant="column" title="游戏" />

    <portal-request-boundary
      class="home-column-section__stage"
      :mode="mode"
      :error-code="errorCode"
      primary-label="重试"
      transition-name="home-section-stage"
      @primary="emit('retry')"
    >
      <template #loading>
        <div key="column-skeleton" class="home-column-section__grid" aria-hidden="true">
          <article
            v-for="index in HOME_COLUMN_SECTION_LIMIT"
            :key="`column-skeleton-${index}`"
            class="home-column-section__card"
          >
            <div class="home-column-section__media">
              <div class="home-column-section__cover home-column-section__cover--skeleton" />
              <span
                class="home-column-section__clip home-column-section__clip--skeleton"
                aria-hidden="true"
              />
            </div>

            <div
              class="home-column-section__skeleton-lines home-column-section__skeleton-lines--title"
            >
              <span
                class="home-column-section__skeleton-line home-column-section__skeleton-line--title"
              >
                <span
                  class="home-column-section__skeleton-block home-column-section__skeleton-block--title"
                />
              </span>
              <span
                class="home-column-section__skeleton-line home-column-section__skeleton-line--title"
              >
                <span
                  class="home-column-section__skeleton-block home-column-section__skeleton-block--title-short"
                />
              </span>
            </div>

            <div
              class="home-column-section__skeleton-lines home-column-section__skeleton-lines--summary"
            >
              <span
                class="home-column-section__skeleton-line home-column-section__skeleton-line--summary"
              >
                <span
                  class="home-column-section__skeleton-block home-column-section__skeleton-block--summary"
                />
              </span>
              <span
                class="home-column-section__skeleton-line home-column-section__skeleton-line--summary"
              >
                <span
                  class="home-column-section__skeleton-block home-column-section__skeleton-block--summary-short"
                />
              </span>
            </div>

            <div class="home-column-section__meta">
              <span
                class="home-column-section__skeleton-pill home-column-section__skeleton-pill--meta-feature"
              />
              <span
                class="home-column-section__skeleton-pill home-column-section__skeleton-pill--meta-topic"
              />
            </div>
          </article>
        </div>
      </template>

      <div key="column-content" class="home-column-section__grid">
        <article
          v-for="(item, index) in section.items"
          :key="item.id"
          class="home-column-section__card home-column-section__card--link portal-interactive-surface"
        >
          <router-link
            class="home-column-section__link-layer portal-link-layer"
            :to="resolvePortalContentDetailLocation('topic', item.id)"
            :aria-label="`查看${item.title}详情`"
            :title="item.title"
          />
          <div class="home-column-section__media">
            <div class="home-column-section__cover" :style="coverStyle(index)">
              <portal-image
                :src="resolveCoverUrl(item.cover)"
                loading="eager"
                fetch-priority="auto"
              />
            </div>
            <span class="home-column-section__clip" aria-hidden="true" />
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.summary }}</p>

          <div class="home-column-section__meta">
            <span v-if="resolvePrimaryFeatureLabel(item)" class="home-column-section__meta-feature">
              {{ resolvePrimaryFeatureLabel(item) }}
            </span>
            <span class="home-column-section__meta-topic">
              {{ resolveTopicLabel(item) }}
            </span>
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
import type { HomeColumnSectionResponse } from '@/api/content'
import { resolveHomeMediaUrl } from '@/api/content'
import {
  HOME_COLUMN_COVER_BACKGROUNDS,
  HOME_COLUMN_SECTION_LIMIT,
  HOME_COLUMN_TONES
} from '@/constants/home'
import {
  resolvePublicTopicFeatureFlagLabels,
  resolvePublicTopicThemeLabel
} from '@/constants/public-detail'
import { buildCssVarsStyle, resolvePortalContentDetailLocation } from '@/utils/content'

const emit = defineEmits<{
  retry: []
}>()

withDefaults(
  defineProps<{
    errorCode?: PortalRequestBoundaryErrorCode
    section: HomeColumnSectionResponse
    mode?: PortalRequestBoundaryMode
  }>(),
  {
    errorCode: 500,
    mode: 'ready'
  }
)

function coverStyle(index: number) {
  const tone = HOME_COLUMN_TONES[index % HOME_COLUMN_TONES.length]

  return buildCssVarsStyle({
    '--column-cover-fallback': HOME_COLUMN_COVER_BACKGROUNDS[tone]
  })
}

function resolveCoverUrl(cover: HomeColumnSectionResponse['items'][number]['cover']) {
  return resolveHomeMediaUrl(cover)
}

function resolvePrimaryFeatureLabel(item: HomeColumnSectionResponse['items'][number]) {
  return resolvePublicTopicFeatureFlagLabels(item.featureFlagLabels, 1)[0] || ''
}

function resolveTopicLabel(item: HomeColumnSectionResponse['items'][number]) {
  return item.topicId ? resolvePublicTopicThemeLabel(item.topicId, '') : ''
}
</script>

<style scoped>
.home-column-section {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: var(--portal-content-section-heading-gap);
  height: 100%;
}

.home-column-section > .portal-section-heading {
  margin: 0;
}

.home-column-section__stage {
  position: relative;
  display: grid;
  min-height: 100%;
}

.home-column-section__stage :deep(.portal-request-boundary__state) {
  --portal-request-boundary-accent: var(--portal-content-topic-accent);
  min-height: 296px;
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

.home-column-section__stage > * {
  grid-area: 1 / 1;
}

.home-column-section__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--portal-content-card-gap-loose);
  min-height: 100%;
  height: 100%;
  align-content: start;
}

.home-column-section__card {
  position: relative;
  display: grid;
  grid-template-rows:
    auto var(--portal-content-block-title-md-2) var(--portal-content-block-body-md-2)
    auto;
  align-content: start;
  gap: 10px;
  padding: var(--portal-browse-card-padding);
  border: 1px solid var(--portal-browse-card-border);
  border-radius: var(--portal-browse-card-radius);
  background: var(--portal-browse-card-surface);
  box-shadow: var(--portal-browse-card-shadow);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.home-column-section__card--link {
  --portal-interactive-hover-background: var(--portal-browse-card-hover-surface);
  --portal-interactive-hover-border: var(--portal-module-topic-divider-strong);
  --portal-interactive-hover-shadow: var(--portal-browse-card-hover-shadow);
}

.home-column-section__link-layer {
  z-index: 2;
}

.home-column-section__media {
  position: relative;
  justify-self: start;
  width: var(--portal-module-topic-media-width);
  height: var(--portal-module-topic-media-height);
  overflow: visible;
}

.home-column-section__cover {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--portal-browse-media-icon-border);
  border-radius: var(--portal-module-topic-media-radius);
  background: var(--column-cover-fallback, var(--portal-module-topic-cover-blue-bg));
  box-shadow: var(--portal-browse-media-icon-shadow);
}

.home-column-section__cover--skeleton {
  background: linear-gradient(
    135deg,
    var(--portal-skeleton-block-strong),
    var(--portal-skeleton-block)
  );
}

.home-column-section__cover::after {
  content: '';
  position: absolute;
  inset: 8px;
  z-index: 2;
  border: 1px solid var(--portal-browse-media-frame-border);
  border-radius: calc(var(--portal-module-topic-media-radius) - 8px);
}

.home-column-section__cover::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: var(--portal-module-topic-media-overlay);
}

.home-column-section__clip {
  position: absolute;
  top: -8px;
  right: 8px;
  z-index: 2;
  width: 28px;
  height: 18px;
  border: 1px solid var(--portal-module-topic-clip-border);
  border-radius: 9px 9px 10px 10px;
  background: var(--portal-module-topic-clip-bg);
  box-shadow: var(--portal-module-topic-clip-shadow);
  backdrop-filter: blur(10px) saturate(1.06);
  -webkit-backdrop-filter: blur(10px) saturate(1.06);
  transform: rotate(7deg);
}

.home-column-section__clip--skeleton {
  background: linear-gradient(
    135deg,
    var(--portal-skeleton-block-strong),
    var(--portal-skeleton-block)
  );
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.home-column-section__clip::before,
.home-column-section__clip::after {
  content: '';
  position: absolute;
}

.home-column-section__clip::before {
  inset: 4px 7px 5px;
  border: 1.5px solid var(--portal-module-topic-clip-ink);
  border-radius: 999px;
}

.home-column-section__clip::after {
  left: 5px;
  right: 5px;
  top: 3px;
  height: 4px;
  border-radius: 999px;
  background: var(--portal-module-topic-clip-highlight);
}

.home-column-section__clip--skeleton::before,
.home-column-section__clip--skeleton::after {
  display: none;
}

.home-column-section__card h3 {
  margin: 0;
  color: var(--portal-content-ink);
  display: -webkit-box;
  height: var(--portal-content-block-title-md-2);
  overflow: hidden;
  font-size: var(--portal-content-font-size-title-md);
  font-weight: 700;
  line-height: var(--portal-content-line-size-title-md);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.home-column-section__card p {
  margin: 0;
  color: var(--portal-content-muted);
  display: -webkit-box;
  height: var(--portal-content-block-body-md-2);
  overflow: hidden;
  font-size: 12px;
  line-height: var(--portal-content-line-size-body-md);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  opacity: 0.72;
}

.home-column-section__meta {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 20px;
  min-width: 0;
  padding-top: 10px;
}

.home-column-section__meta::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  border-top: 1px dashed var(--portal-content-line);
  opacity: 0.82;
}

.home-column-section__meta-feature,
.home-column-section__meta-topic {
  display: block;
  min-width: 0;
  color: var(--portal-content-muted);
  font-size: 12px;
  font-weight: 700;
  line-height: 20px;
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-column-section__meta-feature {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-width: 46px;
  max-width: 46%;
  height: 20px;
  padding: 0 6px;
  border: 1px solid var(--portal-content-feature-tag-soft-border);
  border-radius: 999px;
  background: var(--portal-content-feature-tag-soft-bg);
  color: var(--portal-content-feature-tag-soft-ink);
  line-height: 1;
}

.home-column-section__meta-topic {
  flex: 1 1 0;
  margin-left: auto;
  color: var(--portal-content-ink);
  font-size: 12px;
  font-weight: 700;
  opacity: 0.9;
  text-align: right;
}

.home-column-section__skeleton-lines {
  display: grid;
  align-content: start;
  gap: 0;
}

.home-column-section__skeleton-lines--title {
  height: var(--portal-content-block-title-md-2);
}

.home-column-section__skeleton-lines--summary {
  height: var(--portal-content-block-body-md-2);
}

.home-column-section__skeleton-line {
  display: flex;
  align-items: center;
}

.home-column-section__skeleton-line--title {
  height: var(--portal-content-line-size-title-md);
}

.home-column-section__skeleton-line--summary {
  height: var(--portal-content-line-size-body-md);
}

.home-column-section__skeleton-block,
.home-column-section__skeleton-pill {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--portal-skeleton-border);
  background: linear-gradient(
    135deg,
    var(--portal-skeleton-block-strong),
    var(--portal-skeleton-block)
  );
}

.home-column-section__skeleton-block::after,
.home-column-section__skeleton-pill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--portal-skeleton-shimmer);
  animation: portal-skeleton-wave 2.4s ease-in-out infinite;
  transform: translateX(-100%);
}

.home-column-section__skeleton-block {
  display: inline-flex;
  height: 12px;
  border-radius: 999px;
}

.home-column-section__skeleton-block--title {
  width: 90%;
  height: var(--portal-skeleton-title-md-height);
}

.home-column-section__skeleton-block--title-short {
  width: 72%;
  height: var(--portal-skeleton-title-md-height);
}

.home-column-section__skeleton-block--summary {
  width: 100%;
  height: var(--portal-skeleton-copy-12-height);
}

.home-column-section__skeleton-block--summary-short {
  width: 82%;
  height: var(--portal-skeleton-copy-12-height);
}

.home-column-section__skeleton-pill {
  display: inline-flex;
  height: 20px;
  border-radius: 999px;
}

.home-column-section__skeleton-pill--meta-feature {
  width: 46px;
}

.home-column-section__skeleton-pill--meta-topic {
  margin-left: auto;
  width: 74px;
}
</style>
