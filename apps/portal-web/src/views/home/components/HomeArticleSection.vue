<template>
  <section class="home-article-section">
    <portal-section-heading variant="article" title="情报" />

    <portal-request-boundary
      class="home-article-section__stage"
      :mode="mode"
      :error-code="errorCode"
      primary-label="重试"
      transition-name="home-section-stage"
      @primary="emit('retry')"
    >
      <template #loading>
        <div key="article-skeleton" class="home-article-section__layout" aria-hidden="true">
          <article class="home-article-section__feature">
            <div
              class="home-article-section__feature-cover home-article-section__feature-cover--skeleton"
            >
              <span
                class="home-article-section__skeleton-pill home-article-section__skeleton-pill--badge"
              />
            </div>

            <div class="home-article-section__feature-copy">
              <div
                class="home-article-section__skeleton-lines home-article-section__skeleton-lines--title"
              >
                <span
                  class="home-article-section__skeleton-line home-article-section__skeleton-line--title"
                >
                  <span
                    class="home-article-section__skeleton-block home-article-section__skeleton-block--title"
                  />
                </span>
                <span
                  class="home-article-section__skeleton-line home-article-section__skeleton-line--title"
                >
                  <span
                    class="home-article-section__skeleton-block home-article-section__skeleton-block--title-short"
                  />
                </span>
              </div>

              <div
                class="home-article-section__skeleton-lines home-article-section__skeleton-lines--summary"
              >
                <span
                  class="home-article-section__skeleton-line home-article-section__skeleton-line--summary"
                >
                  <span
                    class="home-article-section__skeleton-block home-article-section__skeleton-block--summary"
                  />
                </span>
                <span
                  class="home-article-section__skeleton-line home-article-section__skeleton-line--summary"
                >
                  <span
                    class="home-article-section__skeleton-block home-article-section__skeleton-block--summary-short"
                  />
                </span>
              </div>

              <div class="home-article-section__meta">
                <span
                  class="home-article-section__skeleton-pill home-article-section__skeleton-pill--tag"
                />
                <span
                  class="home-article-section__skeleton-pill home-article-section__skeleton-pill--tag home-article-section__skeleton-pill--tag-short"
                />
                <span
                  class="home-article-section__skeleton-pill home-article-section__skeleton-pill--tag home-article-section__skeleton-pill--tag-mid"
                />
              </div>
            </div>
          </article>

          <div class="home-article-section__list">
            <article
              v-for="index in HOME_ARTICLE_SECTION_LIMIT"
              :key="`article-skeleton-${index}`"
              class="home-article-section__item"
            >
              <div class="home-article-section__thumb home-article-section__thumb--skeleton" />

              <div class="home-article-section__item-copy">
                <div
                  class="home-article-section__skeleton-lines home-article-section__skeleton-lines--item-title"
                >
                  <span
                    class="home-article-section__skeleton-line home-article-section__skeleton-line--item-title"
                  >
                    <span
                      class="home-article-section__skeleton-block home-article-section__skeleton-block--item-title"
                    />
                  </span>
                </div>

                <span
                  class="home-article-section__skeleton-pill home-article-section__skeleton-pill--time"
                />

                <div
                  class="home-article-section__skeleton-lines home-article-section__skeleton-lines--item-summary"
                >
                  <span
                    class="home-article-section__skeleton-line home-article-section__skeleton-line--item-summary"
                  >
                    <span
                      class="home-article-section__skeleton-block home-article-section__skeleton-block--item-summary"
                    />
                  </span>
                  <span
                    class="home-article-section__skeleton-line home-article-section__skeleton-line--item-summary"
                  >
                    <span
                      class="home-article-section__skeleton-block home-article-section__skeleton-block--item-summary-short"
                    />
                  </span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </template>

      <div key="article-content" class="home-article-section__layout">
        <article
          class="home-article-section__feature home-article-section__feature--link portal-interactive-surface"
        >
          <router-link
            class="home-article-section__link-layer portal-link-layer"
            :to="resolvePortalContentDetailLocation('article', featuredArticle.id)"
            :aria-label="`查看${featuredArticle.title}详情`"
            :title="featuredArticle.title"
          />
          <div class="home-article-section__feature-cover">
            <portal-image :src="resolveCoverUrl(featuredArticle.cover)" />
            <span class="home-article-section__feature-badge">
              {{ formatArticleViewCountBadge(featuredArticle.viewCount) }}
            </span>
          </div>

          <div class="home-article-section__feature-copy">
            <h3>{{ featuredArticle.title }}</h3>
            <p>{{ featuredArticle.summary }}</p>

            <div class="home-article-section__meta">
              <span
                v-for="item in featuredTags"
                :key="item.label"
                :class="`home-article-section__meta-tag home-article-section__meta-tag--${item.tone}`"
              >
                {{ item.label }}
              </span>
            </div>
          </div>
        </article>

        <div class="home-article-section__list">
          <article
            v-for="item in section.items"
            :key="item.id"
            class="home-article-section__item portal-interactive-surface"
          >
            <router-link
              class="home-article-section__link-layer portal-link-layer"
              :to="resolvePortalContentDetailLocation('article', item.id)"
              :aria-label="`查看${item.title}详情`"
              :title="item.title"
            />
            <div class="home-article-section__thumb">
              <portal-image :src="resolveCoverUrl(item.cover)" />
            </div>

            <div class="home-article-section__item-copy">
              <h4>{{ item.title }}</h4>
              <span class="home-article-section__item-time">
                {{ formatPublishTimeLabel(item.publishTime) }}
              </span>
              <p>{{ item.summary }}</p>
            </div>
          </article>
        </div>
      </div>
    </portal-request-boundary>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type {
  PortalRequestBoundaryErrorCode,
  PortalRequestBoundaryMode
} from '@/components/PortalRequestBoundary.vue'
import type { HomeArticleFeaturedResponse, HomeArticleSectionResponse } from '@/api/content'
import { resolveHomeMediaUrl } from '@/api/content'
import { HOME_ARTICLE_SECTION_LIMIT, HOME_TAG_TONES } from '@/constants/home'
import { formatPublishTimeLabel, resolvePortalContentDetailLocation } from '@/utils/content'
import { createToneTagList, formatArticleViewCountBadge } from '@/utils/home'

const emit = defineEmits<{
  retry: []
}>()

const props = withDefaults(
  defineProps<{
    errorCode?: PortalRequestBoundaryErrorCode
    section: HomeArticleSectionResponse
    mode?: PortalRequestBoundaryMode
  }>(),
  {
    errorCode: 500,
    mode: 'ready'
  }
)

const featuredArticle = computed<HomeArticleFeaturedResponse>(
  () =>
    props.section.featured ?? {
      id: '',
      title: '',
      summary: '',
      cover: null,
      badge: '',
      tags: [],
      viewCount: 0,
      replyCount: 0,
      publishTime: ''
    }
)
const featuredTags = computed(() =>
  createToneTagList(featuredArticle.value.tags, HOME_TAG_TONES, 3)
)

function resolveCoverUrl(cover: HomeArticleFeaturedResponse['cover']) {
  return resolveHomeMediaUrl(cover)
}
</script>

<style scoped>
.home-article-section {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: var(--home-section-heading-gap);
  height: 100%;
}

.home-article-section > .portal-section-heading {
  margin: 0;
}

.home-article-section__stage {
  position: relative;
  display: grid;
  min-height: 100%;
}

.home-article-section__stage :deep(.portal-request-boundary__state) {
  --portal-request-boundary-accent: var(--home-business-article-accent);
  min-height: 296px;
  padding: 18px;
  border: 1px solid
    color-mix(
      in srgb,
      var(--portal-request-boundary-accent) 14%,
      var(--portal-request-state-border)
    );
  border-radius: 24px;
  background: var(--home-card-sheen), var(--home-panel-deep);
  box-shadow: var(--home-card-shadow);
  backdrop-filter: blur(calc(var(--home-panel-blur) * 0.72));
  -webkit-backdrop-filter: blur(calc(var(--home-panel-blur) * 0.72));
}

.home-article-section__stage > * {
  grid-area: 1 / 1;
}

.home-article-section__layout {
  display: grid;
  grid-template-columns: var(--home-article-feature-col) var(--home-article-list-col);
  gap: var(--home-card-gap-loose);
  min-height: 100%;
  height: 100%;
  align-items: stretch;
}

.home-article-section__feature,
.home-article-section__list {
  border: 1px solid var(--home-line);
  background: var(--home-card-sheen), var(--home-panel-deep);
  box-shadow: var(--home-card-shadow);
  backdrop-filter: blur(calc(var(--home-panel-blur) * 0.72));
  -webkit-backdrop-filter: blur(calc(var(--home-panel-blur) * 0.72));
}

.home-article-section__feature {
  position: relative;
  display: grid;
  gap: var(--home-card-gap-base);
  padding: var(--home-card-padding-md);
  border-radius: 24px;
}

.home-article-section__feature--link {
  --portal-interactive-hover-shadow: var(--home-card-hover-shadow);
  --portal-interactive-hover-filter: var(--home-card-hover-filter);
}

.home-article-section__link-layer {
  z-index: 2;
}

.home-article-section__item {
  --portal-interactive-hover-filter: var(--home-card-hover-filter);
  --portal-interactive-hover-background: rgba(255, 255, 255, 0.12);
}

.home-article-section__feature--link:hover .home-article-section__feature-cover,
.home-article-section__feature--link:focus-within .home-article-section__feature-cover {
  box-shadow: var(--home-media-hover-shadow-strong);
}

.home-article-section__feature-cover {
  position: relative;
  min-height: 170px;
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(94, 123, 158, 0.28), rgba(18, 24, 35, 0.55));
  overflow: hidden;
}

.home-article-section__feature-cover--skeleton {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 82%),
    linear-gradient(135deg, var(--home-skeleton-block-strong), var(--home-skeleton-block));
}

.home-article-section__feature-cover::after {
  content: '';
  position: absolute;
  z-index: 2;
  right: 16px;
  bottom: 16px;
  width: 146px;
  height: 78px;
  border: 1px solid var(--home-media-deco-border);
  border-radius: 20px;
  background: var(--home-media-deco-bg);
  backdrop-filter: blur(6px);
}

.home-article-section__feature-cover::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: var(--home-media-overlay-strong), var(--home-article-cover-art);
}

.home-article-section__feature-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  height: var(--home-chip-height-lg);
  padding: 0 14px;
  border: 1px solid var(--home-feature-badge-border);
  border-radius: 999px;
  background: var(--home-feature-badge-bg);
  color: var(--home-feature-badge-ink);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.home-article-section__feature-copy {
  display: grid;
  grid-template-rows: var(--home-block-title-lg-2) var(--home-block-body-md-2) auto;
  gap: var(--home-copy-gap-loose);
}

.home-article-section__feature-copy h3 {
  margin: 0;
  color: var(--home-ink);
  display: -webkit-box;
  height: var(--home-block-title-lg-2);
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  font-size: var(--home-font-size-title-lg);
  line-height: var(--home-line-size-title-lg);
}

.home-article-section__feature-copy p {
  margin: 0;
  color: var(--home-muted);
  display: -webkit-box;
  font-size: var(--home-font-size-body-md);
  line-height: var(--home-line-size-body-md);
  height: var(--home-block-body-md-2);
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.home-article-section__meta {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: var(--home-card-gap-base);
  min-height: var(--home-chip-height-md);
  padding-top: 10px;
}

.home-article-section__meta::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 1px;
  background: var(--home-divider-fade);
  transform: scaleY(var(--home-divider-scale-y));
  transform-origin: center top;
  opacity: var(--home-divider-opacity);
}

.home-article-section__meta-tag {
  display: inline-flex;
  align-items: center;
  height: var(--home-chip-height-md);
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}

.home-article-section__meta-tag--cyan {
  background: var(--home-business-article-tag-bg);
  border-color: var(--home-business-article-tag-border);
  color: var(--home-business-article-tag-ink);
}

.home-article-section__meta-tag--sky {
  background: var(--home-feature-tag-sky-bg);
  border-color: var(--home-feature-tag-sky-border);
  color: var(--home-feature-tag-sky-ink);
}

.home-article-section__meta-tag--iris {
  background: var(--home-feature-tag-iris-bg);
  border-color: var(--home-feature-tag-iris-border);
  color: var(--home-feature-tag-iris-ink);
}

.home-article-section__meta-tag--soft {
  background: var(--home-feature-tag-soft-bg);
  border-color: var(--home-feature-tag-soft-border);
  color: var(--home-feature-tag-soft-ink);
}

.home-article-section__list {
  display: grid;
  grid-template-rows: repeat(3, 1fr);
  gap: 0;
  min-height: 100%;
  height: 100%;
  padding: 6px;
  border-radius: 24px;
  background: var(--home-article-list-surface);
}

.home-article-section__item {
  position: relative;
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: var(--home-card-gap-base);
  padding: var(--home-card-padding-sm);
  border-radius: 18px;
  box-shadow: var(--home-article-item-inset-shadow);
}

.home-article-section__item:hover .home-article-section__thumb,
.home-article-section__item:focus-within .home-article-section__thumb {
  box-shadow: var(--home-media-hover-shadow-soft);
}

.home-article-section__item + .home-article-section__item::before {
  content: '';
  position: absolute;
  top: 0;
  right: 12px;
  left: 12px;
  height: 1px;
  background: var(--home-divider-fade);
  transform: scaleY(var(--home-divider-scale-y));
  transform-origin: center top;
  opacity: var(--home-divider-opacity);
}

.home-article-section__thumb {
  position: relative;
  height: 78px;
  min-height: 78px;
  border: 1px solid var(--home-media-panel-border);
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(94, 123, 158, 0.24), rgba(18, 24, 35, 0.5));
  box-shadow: var(--home-card-shadow);
  overflow: hidden;
}

.home-article-section__thumb--skeleton {
  background: linear-gradient(
    135deg,
    var(--home-skeleton-block-strong),
    var(--home-skeleton-block)
  );
}

.home-article-section__thumb::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: var(--home-article-thumb-bg);
}

.home-article-section__item-copy {
  display: grid;
  grid-template-rows: var(--home-block-title-sm-1) minmax(0, 1fr) var(--home-block-body-md-2);
  align-content: start;
  min-height: 78px;
  gap: var(--home-copy-gap-base);
  min-width: 0;
}

.home-article-section__item-copy h4 {
  margin: 0;
  display: block;
  color: var(--home-ink);
  font-size: var(--home-font-size-title-sm);
  line-height: var(--home-line-size-title-sm);
  height: var(--home-block-title-sm-1);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.home-article-section__item-copy p {
  margin: 0;
  color: var(--home-muted);
  display: -webkit-box;
  font-size: var(--home-font-size-body-md);
  line-height: var(--home-line-size-body-md);
  height: var(--home-block-body-md-2);
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.home-article-section__item-time {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: end;
  min-width: 68px;
  height: 20px;
  padding: 0 8px;
  border: 1px solid var(--home-article-time-border);
  border-radius: 999px;
  background: var(--home-article-time-bg);
  color: var(--home-article-time-ink);
  font-size: 12px;
  line-height: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.home-article-section__skeleton-lines {
  display: grid;
  align-content: start;
  gap: 0;
}

.home-article-section__skeleton-lines--title {
  height: var(--home-block-title-lg-2);
}

.home-article-section__skeleton-lines--summary {
  height: var(--home-block-body-md-2);
}

.home-article-section__skeleton-lines--item-title {
  height: var(--home-block-title-sm-1);
}

.home-article-section__skeleton-lines--item-summary {
  height: var(--home-block-body-md-2);
}

.home-article-section__skeleton-line {
  display: flex;
  align-items: center;
}

.home-article-section__skeleton-line--title {
  height: var(--home-line-size-title-lg);
}

.home-article-section__skeleton-line--summary {
  height: var(--home-line-size-body-md);
}

.home-article-section__skeleton-line--item-title {
  height: var(--home-line-size-title-sm);
}

.home-article-section__skeleton-line--item-summary {
  height: var(--home-line-size-body-md);
}

.home-article-section__skeleton-block,
.home-article-section__skeleton-pill {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--home-skeleton-border);
  background: linear-gradient(
    135deg,
    var(--home-skeleton-block-strong),
    var(--home-skeleton-block)
  );
}

.home-article-section__skeleton-block::after,
.home-article-section__skeleton-pill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--home-skeleton-shimmer);
  animation: home-skeleton-wave 2.4s ease-in-out infinite;
  transform: translateX(-100%);
}

.home-article-section__skeleton-block {
  display: inline-flex;
  height: 12px;
  border-radius: 999px;
}

.home-article-section__skeleton-block--title {
  width: 92%;
  height: var(--home-skeleton-title-20-height);
}

.home-article-section__skeleton-block--title-short {
  width: 76%;
  height: var(--home-skeleton-title-20-height);
}

.home-article-section__skeleton-block--summary {
  width: 100%;
  height: var(--home-skeleton-copy-13-height);
}

.home-article-section__skeleton-block--summary-short {
  width: 82%;
  height: var(--home-skeleton-copy-13-height);
}

.home-article-section__skeleton-block--item-title {
  width: 82%;
  height: var(--home-skeleton-title-16-height);
}

.home-article-section__skeleton-block--item-summary {
  width: 100%;
  height: var(--home-skeleton-copy-13-height);
}

.home-article-section__skeleton-block--item-summary-short {
  width: 84%;
  height: var(--home-skeleton-copy-13-height);
}

.home-article-section__skeleton-pill {
  display: inline-flex;
  border-radius: 999px;
}

.home-article-section__skeleton-pill--badge {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 94px;
  height: var(--home-chip-height-lg);
}

.home-article-section__skeleton-pill--tag {
  width: 72px;
  height: var(--home-chip-height-md);
}

.home-article-section__skeleton-pill--tag-short {
  width: 62px;
}

.home-article-section__skeleton-pill--tag-mid {
  width: 82px;
}

.home-article-section__skeleton-pill--time {
  justify-self: end;
  width: 68px;
  height: 15px;
}
</style>
