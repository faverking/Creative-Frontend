<template>
  <section class="home-book-section">
    <portal-section-heading variant="bookshelf" title="书库" />

    <portal-request-boundary
      class="home-book-section__stage"
      :mode="mode"
      :error-code="errorCode"
      primary-label="重试"
      transition-name="home-section-stage"
      @primary="emit('retry')"
    >
      <template #loading>
        <div key="book-skeleton" class="home-book-section__list" aria-hidden="true">
          <article
            v-for="(item, itemIndex) in section.items"
            :key="`book-skeleton-${item.id || itemIndex}`"
            class="home-book-section__card"
          >
            <div class="home-book-section__media">
              <span
                class="home-book-section__stack home-book-section__stack--back home-book-section__stack--skeleton"
                aria-hidden="true"
              />
              <span
                class="home-book-section__stack home-book-section__stack--mid home-book-section__stack--skeleton"
                aria-hidden="true"
              />

              <div
                class="home-book-section__cover home-book-section__cover--skeleton"
                aria-hidden="true"
              >
                <span
                  class="home-book-section__skeleton-pill home-book-section__skeleton-pill--cover-mark"
                />
                <span
                  class="home-book-section__cover-illustration home-book-section__cover-illustration--skeleton"
                />
                <span
                  class="home-book-section__cover-lines home-book-section__cover-lines--skeleton"
                >
                  <span
                    class="home-book-section__skeleton-block home-book-section__skeleton-block--cover-line"
                  />
                  <span
                    class="home-book-section__skeleton-block home-book-section__skeleton-block--cover-line-short"
                  />
                </span>
              </div>
            </div>

            <div class="home-book-section__copy">
              <div
                class="home-book-section__skeleton-lines home-book-section__skeleton-lines--title"
              >
                <span
                  class="home-book-section__skeleton-line home-book-section__skeleton-line--title"
                >
                  <span
                    class="home-book-section__skeleton-block home-book-section__skeleton-block--title"
                  />
                </span>
              </div>

              <div
                class="home-book-section__skeleton-lines home-book-section__skeleton-lines--summary"
              >
                <span
                  class="home-book-section__skeleton-line home-book-section__skeleton-line--summary"
                >
                  <span
                    class="home-book-section__skeleton-block home-book-section__skeleton-block--summary"
                  />
                </span>
                <span
                  class="home-book-section__skeleton-line home-book-section__skeleton-line--summary"
                >
                  <span
                    class="home-book-section__skeleton-block home-book-section__skeleton-block--summary-short"
                  />
                </span>
              </div>

              <div class="home-book-section__tags">
                <span
                  class="home-book-section__skeleton-pill home-book-section__skeleton-pill--tag"
                />
                <span
                  class="home-book-section__skeleton-pill home-book-section__skeleton-pill--tag home-book-section__skeleton-pill--tag-short"
                />
                <span
                  class="home-book-section__skeleton-pill home-book-section__skeleton-pill--tag home-book-section__skeleton-pill--tag-mid"
                />
              </div>
            </div>
          </article>
        </div>
      </template>

      <div key="book-content" class="home-book-section__list">
        <article
          v-for="(item, itemIndex) in section.items"
          :key="item.id"
          class="home-book-section__card home-book-section__card--link portal-interactive-surface"
        >
          <router-link
            class="home-book-section__link-layer portal-link-layer"
            :to="resolvePortalContentDetailLocation('book', item.id)"
            :aria-label="`查看${item.title}详情`"
            :title="item.title"
          />
          <div class="home-book-section__media">
            <span
              class="home-book-section__stack home-book-section__stack--back"
              aria-hidden="true"
            />
            <span
              class="home-book-section__stack home-book-section__stack--mid"
              aria-hidden="true"
            />

            <div
              class="home-book-section__cover"
              :class="{ 'home-book-section__cover--alt': itemIndex === 1 }"
              aria-hidden="true"
            >
              <portal-image :src="resolveCoverUrl(item.cover)" />
              <span class="home-book-section__cover-mark" />
              <span
                class="home-book-section__cover-illustration"
                :class="{ 'home-book-section__cover-illustration--alt': itemIndex === 1 }"
              />
              <span class="home-book-section__cover-lines">
                <span />
                <span />
              </span>
            </div>
          </div>

          <div class="home-book-section__copy">
            <h3>{{ item.title }}</h3>
            <p>{{ item.summary }}</p>

            <div class="home-book-section__tags">
              <span
                v-for="tag in resolveBookTags(item)"
                :key="`${item.title}-${tag.label}`"
                :class="`home-book-section__tag home-book-section__tag--${tag.tone}`"
              >
                {{ tag.label }}
              </span>
            </div>
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
import type { HomeBookshelfSectionResponse } from '@/api/content'
import { resolveHomeMediaUrl } from '@/api/content'
import { HOME_TAG_TONES } from '@/constants/home'
import { resolvePortalContentDetailLocation } from '@/utils/content'
import { createToneTagList } from '@/utils/home'

const emit = defineEmits<{
  retry: []
}>()

withDefaults(
  defineProps<{
    errorCode?: PortalRequestBoundaryErrorCode
    section: HomeBookshelfSectionResponse
    mode?: PortalRequestBoundaryMode
  }>(),
  {
    errorCode: 500,
    mode: 'ready'
  }
)

function resolveCoverUrl(cover: HomeBookshelfSectionResponse['items'][number]['cover']) {
  return resolveHomeMediaUrl(cover)
}

function resolveBookTags(item: HomeBookshelfSectionResponse['items'][number]) {
  return createToneTagList(item.tags.length > 0 ? item.tags : item.authorNames, HOME_TAG_TONES, 3)
}
</script>

<style scoped>
.home-book-section {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: var(--home-section-heading-gap);
  height: 100%;
}

.home-book-section > .portal-section-heading {
  margin: 0;
}

.home-book-section__stage {
  position: relative;
  display: grid;
}

.home-book-section__stage :deep(.portal-request-boundary__state) {
  --portal-request-boundary-accent: var(--home-business-bookshelf-accent);
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

.home-book-section__stage > * {
  grid-area: 1 / 1;
}

.home-book-section__list {
  display: grid;
  gap: var(--home-card-gap-loose);
  min-height: 100%;
  height: 100%;
  align-content: start;
}

.home-book-section__card {
  position: relative;
  display: grid;
  grid-template-columns: 148px minmax(0, 1fr);
  gap: var(--home-card-gap-loose);
  padding: var(--portal-browse-card-padding);
  border: 1px solid var(--portal-browse-card-border);
  border-radius: var(--portal-browse-card-radius);
  background: var(--portal-browse-card-surface);
  box-shadow: var(--portal-browse-card-shadow);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.home-book-section__card--link {
  --portal-interactive-hover-background: var(--portal-browse-card-hover-surface);
  --portal-interactive-hover-border: color-mix(
    in srgb,
    var(--home-business-bookshelf-accent) 24%,
    var(--home-column-module-divider) 76%
  );
  --portal-interactive-hover-shadow: var(--portal-browse-card-hover-shadow);
}

.home-book-section__link-layer {
  z-index: 2;
}

.home-book-section__media {
  position: relative;
  min-height: 118px;
  border: 1px solid var(--home-media-panel-border);
  border-radius: 20px;
  background: var(--home-bookshelf-media-bg);
  overflow: hidden;
  isolation: isolate;
}

.home-book-section__media::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--home-bookshelf-media-overlay);
  pointer-events: none;
}

.home-book-section__stack,
.home-book-section__cover {
  position: absolute;
  border: 1px solid var(--home-bookshelf-stack-border);
  box-shadow: var(--home-bookshelf-stack-shadow);
}

.home-book-section__stack {
  border-radius: 12px;
  background: var(--home-bookshelf-stack-a);
}

.home-book-section__stack--back {
  top: 12px;
  right: 18px;
  width: 72px;
  height: 96px;
  transform: rotate(5deg);
  opacity: 0.36;
}

.home-book-section__stack--mid {
  top: 9px;
  right: 26px;
  width: 78px;
  height: 102px;
  transform: rotate(2deg);
  background: var(--home-bookshelf-stack-b);
  opacity: 0.54;
}

.home-book-section__stack--skeleton {
  background: linear-gradient(
    135deg,
    var(--home-skeleton-block-strong),
    var(--home-skeleton-block)
  );
}

.home-book-section__cover {
  top: 6px;
  left: 24px;
  display: grid;
  align-content: start;
  gap: 10px;
  width: 82px;
  height: 110px;
  padding: 12px 10px 10px;
  border-color: var(--home-bookshelf-cover-border);
  border-radius: 12px;
  background: var(--home-bookshelf-cover-a);
  box-shadow: var(--home-bookshelf-cover-shadow);
  transform: rotate(-1.25deg);
  overflow: hidden;
  z-index: 1;
}

.home-book-section__cover--skeleton {
  background: linear-gradient(
    135deg,
    var(--home-skeleton-block-strong),
    var(--home-skeleton-block)
  );
}

.home-book-section__cover--alt {
  background: var(--home-bookshelf-cover-b);
  transform: rotate(-1deg);
}

.home-book-section__cover::before,
.home-book-section__cover::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.home-book-section__cover::before {
  inset: 0;
  background: linear-gradient(180deg, var(--home-bookshelf-cover-sheen), transparent 38%);
}

.home-book-section__cover::after {
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  background: linear-gradient(180deg, var(--home-bookshelf-cover-spine), transparent 80%);
}

.home-book-section__cover-mark,
.home-book-section__cover-illustration,
.home-book-section__cover-lines {
  position: relative;
  z-index: 1;
}

.home-book-section__cover-mark {
  width: 24px;
  height: 10px;
  border: 1px solid var(--home-bookshelf-cover-mark-border);
  border-radius: 999px;
  background: var(--home-bookshelf-cover-mark-bg);
}

.home-book-section__cover-illustration {
  display: block;
  height: 44px;
  border-radius: 12px;
  background:
    radial-gradient(circle at 28% 28%, rgba(255, 255, 255, 0.42), transparent 34%),
    var(--home-bookshelf-cover-art-a);
}

.home-book-section__cover-illustration--skeleton {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.04));
}

.home-book-section__cover-illustration--alt {
  background:
    radial-gradient(circle at 72% 24%, rgba(255, 255, 255, 0.38), transparent 32%),
    var(--home-bookshelf-cover-art-b);
}

.home-book-section__cover-lines {
  display: grid;
  gap: 6px;
  margin-top: auto;
}

.home-book-section__cover-lines > span {
  display: block;
  height: 5px;
  border-radius: 999px;
  background: var(--home-bookshelf-cover-line);
}

.home-book-section__cover-lines > span:last-child {
  width: 76%;
  opacity: 0.72;
}

.home-book-section__cover-lines--skeleton > span {
  background: none;
}

.home-book-section__copy {
  display: grid;
  grid-template-rows: var(--home-block-title-md-1) var(--home-block-body-md-2) auto;
  align-content: start;
  gap: 10px;
  padding-top: 2px;
}

.home-book-section__copy h3 {
  margin: 0;
  display: block;
  height: var(--home-block-title-md-1);
  overflow: hidden;
  color: var(--home-ink);
  font-size: var(--home-font-size-title-md);
  line-height: var(--home-line-size-title-md);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.home-book-section__copy p {
  margin: 0;
  color: var(--home-muted);
  display: -webkit-box;
  height: var(--home-block-body-md-2);
  overflow: hidden;
  font-size: var(--home-font-size-body-md);
  line-height: var(--home-line-size-body-md);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  max-width: 40ch;
  opacity: 0.78;
}

.home-book-section__tags {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: start;
  min-height: var(--home-chip-height-sm);
  padding-top: 10px;
}

.home-book-section__tags::before {
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

.home-book-section__tag {
  display: inline-flex;
  align-items: center;
  height: var(--home-chip-height-sm);
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.home-book-section__tag--cyan {
  background: var(--home-feature-tag-cyan-bg);
  border-color: var(--home-feature-tag-cyan-border);
  color: var(--home-feature-tag-cyan-ink);
}

.home-book-section__tag--sky {
  background: var(--home-feature-tag-sky-bg);
  border-color: var(--home-feature-tag-sky-border);
  color: var(--home-feature-tag-sky-ink);
}

.home-book-section__tag--iris {
  background: var(--home-feature-tag-iris-bg);
  border-color: var(--home-feature-tag-iris-border);
  color: var(--home-feature-tag-iris-ink);
}

.home-book-section__tag--soft {
  background: var(--home-feature-tag-soft-bg);
  border-color: var(--home-feature-tag-soft-border);
  color: var(--home-feature-tag-soft-ink);
}

.home-book-section__skeleton-lines {
  display: grid;
  align-content: start;
  gap: 0;
}

.home-book-section__skeleton-lines--title {
  height: var(--home-block-title-md-1);
}

.home-book-section__skeleton-lines--summary {
  height: var(--home-block-body-md-2);
}

.home-book-section__skeleton-line {
  display: flex;
  align-items: center;
}

.home-book-section__skeleton-line--title {
  height: var(--home-line-size-title-md);
}

.home-book-section__skeleton-line--summary {
  height: var(--home-line-size-body-md);
}

.home-book-section__skeleton-block,
.home-book-section__skeleton-pill {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--home-skeleton-border);
  background: linear-gradient(
    135deg,
    var(--home-skeleton-block-strong),
    var(--home-skeleton-block)
  );
}

.home-book-section__skeleton-block::after,
.home-book-section__skeleton-pill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--home-skeleton-shimmer);
  animation: home-skeleton-wave 2.4s ease-in-out infinite;
  transform: translateX(-100%);
}

.home-book-section__skeleton-block {
  display: inline-flex;
  border-radius: 999px;
}

.home-book-section__skeleton-block--title {
  width: 84%;
  height: var(--home-skeleton-title-md-height);
}

.home-book-section__skeleton-block--summary {
  width: 100%;
  height: var(--home-skeleton-copy-13-height);
}

.home-book-section__skeleton-block--summary-short {
  width: 84%;
  height: var(--home-skeleton-copy-13-height);
}

.home-book-section__skeleton-block--cover-line {
  width: 100%;
  height: 5px;
}

.home-book-section__skeleton-block--cover-line-short {
  width: 76%;
  height: 5px;
}

.home-book-section__skeleton-pill {
  display: inline-flex;
  border-radius: 999px;
}

.home-book-section__skeleton-pill--cover-mark {
  width: 24px;
  height: 10px;
}

.home-book-section__skeleton-pill--tag {
  width: 72px;
  height: var(--home-chip-height-sm);
}

.home-book-section__skeleton-pill--tag-short {
  width: 60px;
}

.home-book-section__skeleton-pill--tag-mid {
  width: 82px;
}
</style>
