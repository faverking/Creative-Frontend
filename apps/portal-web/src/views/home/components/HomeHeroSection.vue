<template>
  <section class="home-hero">
    <article class="home-hero__feature">
      <portal-section-heading variant="featured" title="本周精选" />

      <portal-request-boundary
        class="home-hero__feature-stage"
        :mode="featureBoundaryMode"
        :error-code="errorCode"
        primary-label="重试"
        transition-name="home-section-stage"
        @primary="emit('retry')"
      >
        <template #loading>
          <div key="feature-skeleton" class="home-hero__feature-card" aria-hidden="true">
            <div class="home-hero__feature-main">
              <div class="home-hero__feature-stamp home-hero__feature-stamp--skeleton">
                <span class="home-hero__skeleton-block home-hero__skeleton-block--stamp" />
              </div>

              <div class="home-hero__cover home-hero__cover--skeleton">
                <div class="home-hero__cover-frame" />
              </div>

              <div class="home-hero__copy">
                <span class="home-hero__skeleton-pill home-hero__skeleton-pill--kicker" />

                <div class="home-hero__skeleton-lines home-hero__skeleton-lines--title">
                  <span
                    class="home-hero__skeleton-text-row home-hero__skeleton-text-row--feature-title"
                  >
                    <span class="home-hero__skeleton-block home-hero__skeleton-block--title" />
                  </span>
                  <span
                    class="home-hero__skeleton-text-row home-hero__skeleton-text-row--feature-title"
                  >
                    <span
                      class="home-hero__skeleton-block home-hero__skeleton-block--title-short"
                    />
                  </span>
                </div>

                <div class="home-hero__skeleton-lines home-hero__skeleton-lines--summary">
                  <span
                    class="home-hero__skeleton-text-row home-hero__skeleton-text-row--feature-summary"
                  >
                    <span class="home-hero__skeleton-block home-hero__skeleton-block--summary" />
                  </span>
                  <span
                    class="home-hero__skeleton-text-row home-hero__skeleton-text-row--feature-summary"
                  >
                    <span
                      class="home-hero__skeleton-block home-hero__skeleton-block--summary-short"
                    />
                  </span>
                </div>

                <div class="home-hero__tags">
                  <span class="home-hero__skeleton-pill home-hero__skeleton-pill--tag" />
                  <span
                    class="home-hero__skeleton-pill home-hero__skeleton-pill--tag home-hero__skeleton-pill--tag-short"
                  />
                </div>
              </div>
            </div>

            <div class="home-hero__feature-nav home-hero__feature-nav--footer">
              <span
                v-for="index in HOME_FEATURED_NAV_COUNT"
                :key="`feature-nav-skeleton-${index}`"
                class="home-hero__feature-nav-item home-hero__feature-nav-item--skeleton"
              />
            </div>
          </div>
        </template>

        <div
          key="feature-content"
          class="home-hero__feature-card"
          :class="{ 'is-featured-paused': featuredAutoplayPaused }"
          :style="featuredMotionStyle"
          @mouseenter="pauseFeaturedAutoplay"
          @mouseleave="resumeFeaturedAutoplay"
          @focusin="handleFeaturedFocusIn"
          @focusout="handleFeaturedFocusOut"
        >
          <div
            class="home-hero__feature-main-stage"
            :class="`home-hero__feature-main-stage--${featuredTransitionDirection}`"
          >
            <div
              v-for="(item, index) in featuredItems"
              :key="item.id"
              class="home-hero__feature-main portal-interactive-surface"
              :class="{
                'is-active': index === activeFeaturedIndex,
                'is-leaving': index === previousFeaturedIndex && index !== activeFeaturedIndex
              }"
              :aria-hidden="index !== activeFeaturedIndex"
            >
              <router-link
                v-if="index === activeFeaturedIndex"
                class="home-hero__feature-link-layer portal-link-layer"
                :to="resolvePortalContentDetailLocation(item.type, item.id)"
                :aria-label="`查看${item.title}详情`"
                :title="item.title"
              />

              <div class="home-hero__feature-stamp" aria-hidden="true">
                <span class="home-hero__feature-stamp-text">
                  {{ formatPublishTimeLabel(item.publishTime) }}
                </span>
              </div>

              <div class="home-hero__cover">
                <portal-image
                  :src="resolveFeaturedCoverUrl(item)"
                  class="home-hero__cover-image"
                  loading="eager"
                  position="center"
                />
                <div class="home-hero__cover-frame" />
              </div>

              <div class="home-hero__copy">
                <span
                  class="home-hero__copy-kicker"
                  :class="`home-hero__copy-kicker--${item.type}`"
                >
                  {{ formatFeaturedMetaLabel(item.type, item.recommendLabel) }}
                </span>
                <h3>{{ item.title }}</h3>
                <p>
                  {{ formatFeaturedDescription(item.kicker, item.summary) }}
                </p>

                <div class="home-hero__tags">
                  <span
                    v-for="tag in resolveFeaturedTags(item)"
                    :key="tag.label"
                    :class="`home-hero__tag home-hero__tag--${tag.tone}`"
                  >
                    {{ tag.label }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            class="home-hero__feature-nav home-hero__feature-nav--footer"
            role="tablist"
            aria-label="Featured navigation"
          >
            <button
              v-for="(item, index) in featuredItems"
              :key="item.id"
              type="button"
              class="home-hero__feature-nav-item"
              :class="{ 'is-active': index === activeFeaturedIndex }"
              :aria-label="`View featured item ${index + 1}`"
              :aria-pressed="index === activeFeaturedIndex"
              :title="item.title"
              @click="selectFeatured(index)"
            />
          </div>
        </div>
      </portal-request-boundary>
    </article>

    <aside class="home-hero__aside">
      <portal-section-heading variant="catalog" title="推荐版块" />

      <portal-request-boundary
        class="home-hero__aside-stage"
        :mode="mode"
        :error-code="errorCode"
        primary-label="重试"
        transition-name="home-section-stage"
        @primary="emit('retry')"
      >
        <template #loading>
          <div key="quick-skeleton" class="home-hero__quick-skeleton-list" aria-hidden="true">
            <article
              v-for="item in quickEntries"
              :key="`skeleton-${item.key}`"
              class="home-hero__quick-item home-hero__quick-item--skeleton"
            >
              <div
                class="home-hero__quick-icon"
                :style="{
                  '--home-quick-icon-glow': item.glow,
                  '--home-quick-icon-shadow': item.shadow
                }"
              >
                <span class="home-hero__skeleton-orb" />
              </div>

              <div class="home-hero__quick-copy">
                <span
                  class="home-hero__skeleton-text-row home-hero__skeleton-text-row--quick-title"
                >
                  <span class="home-hero__skeleton-block home-hero__skeleton-block--quick-title" />
                </span>
                <span class="home-hero__skeleton-text-row home-hero__skeleton-text-row--quick-copy">
                  <span class="home-hero__skeleton-block home-hero__skeleton-block--quick-copy" />
                </span>
              </div>

              <div class="home-hero__quick-side">
                <span class="home-hero__skeleton-pill home-hero__skeleton-pill--meta" />
                <span class="home-hero__skeleton-dot" />
              </div>
            </article>
          </div>
        </template>

        <div key="quick-content" class="home-hero__quick-list">
          <article
            v-for="item in quickEntries"
            :key="item.key"
            class="home-hero__quick-item portal-interactive-surface"
          >
            <router-link
              class="portal-link-layer"
              :to="item.to"
              :aria-label="`查看${item.title}模块`"
              :title="item.title"
            />

            <div
              class="home-hero__quick-icon"
              :style="{
                '--home-quick-icon-glow': item.glow,
                '--home-quick-icon-shadow': item.shadow
              }"
            >
              <portal-svg-icon :name="item.iconName" class="home-hero__quick-icon-svg" />
            </div>

            <div class="home-hero__quick-copy">
              <strong class="home-hero__quick-copy-title">{{ item.title }}</strong>
              <span class="home-hero__quick-copy-text">{{ item.description }}</span>
            </div>

            <div class="home-hero__quick-side">
              <span class="home-hero__quick-meta">
                {{ formatQuickEntryCountLabel(item.count, item.unit) }}
              </span>
              <span class="home-hero__quick-arrow" aria-hidden="true">&#8594;</span>
            </div>
          </article>
        </div>
      </portal-request-boundary>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type {
  PortalRequestBoundaryErrorCode,
  PortalRequestBoundaryMode
} from '@/components/PortalRequestBoundary.vue'
import type { HomeFeaturedResponse, SearchFeaturedTotalsResponse } from '@/api/content'
import { resolveHomeMediaUrl } from '@/api/content'
import {
  HOME_FEATURED_AUTOPLAY_MS,
  HOME_FEATURED_NAV_COUNT,
  HOME_FEATURED_TAG_LIMIT,
  HOME_QUICK_ENTRY_CONTENT_TYPES,
  HOME_QUICK_ENTRY_PRESENTATIONS,
  HOME_TAG_TONES
} from '@/constants/home'
import {
  createToneTagList,
  formatFeaturedDescription,
  formatFeaturedMetaLabel,
  formatQuickEntryCountLabel
} from '@/utils/home'
import {
  formatPublishTimeLabel,
  resolvePortalContentDetailLocation,
  resolvePortalContentModuleLocation
} from '@/utils/content'

const emit = defineEmits<{
  retry: []
}>()

type HomeQuickEntryKey = keyof typeof HOME_QUICK_ENTRY_PRESENTATIONS
type FeaturedTransitionDirection = 'forward' | 'backward'

const props = withDefaults(
  defineProps<{
    errorCode?: PortalRequestBoundaryErrorCode
    featuredItems: HomeFeaturedResponse[]
    totals: SearchFeaturedTotalsResponse
    mode?: PortalRequestBoundaryMode
  }>(),
  {
    errorCode: 500,
    mode: 'ready'
  }
)

const activeFeaturedIndex = ref(0)
const previousFeaturedIndex = ref<number | null>(null)
const featuredHoverPaused = ref(false)
const featuredFocusPaused = ref(false)
const featuredDocumentHidden = ref(false)
const featuredReducedMotion = ref(false)
const featuredTransitionDirection = ref<FeaturedTransitionDirection>('forward')

const featuredItems = computed(() => props.featuredItems.slice(0, HOME_FEATURED_NAV_COUNT))
const quickEntries = computed(() =>
  (Object.keys(HOME_QUICK_ENTRY_PRESENTATIONS) as HomeQuickEntryKey[]).map((key) => {
    const presentation = HOME_QUICK_ENTRY_PRESENTATIONS[key]
    const count =
      key === 'articles'
        ? props.totals.articles
        : key === 'columns'
          ? props.totals.topics
          : key === 'books'
            ? props.totals.books
            : props.totals.images

    return {
      key,
      title: presentation.title,
      description: presentation.description,
      count,
      unit: presentation.unit,
      to: resolvePortalContentModuleLocation(HOME_QUICK_ENTRY_CONTENT_TYPES[key]),
      iconName: presentation.iconName,
      glow: presentation.glow,
      shadow: presentation.shadow
    }
  })
)
const featureBoundaryMode = computed<PortalRequestBoundaryMode>(() =>
  props.mode === 'ready' && featuredItems.value.length === 0 ? 'empty' : props.mode
)
const featuredAutoplayPaused = computed(
  () =>
    featuredHoverPaused.value ||
    featuredFocusPaused.value ||
    featuredDocumentHidden.value ||
    featuredReducedMotion.value
)
const featuredMotionStyle = computed(() => ({
  '--home-featured-progress-duration': `${HOME_FEATURED_AUTOPLAY_MS}ms`
}))

let featuredAutoplayTimer: ReturnType<typeof setTimeout> | null = null
let featuredReducedMotionMedia: MediaQueryList | null = null

function clearFeaturedAutoplay() {
  if (featuredAutoplayTimer !== null) {
    clearTimeout(featuredAutoplayTimer)
    featuredAutoplayTimer = null
  }
}

function stepFeatured(offset: number) {
  const total = featuredItems.value.length
  if (total <= 1) {
    return
  }

  setActiveFeaturedIndex(
    (activeFeaturedIndex.value + offset + total) % total,
    offset >= 0 ? 'forward' : 'backward'
  )
}

function syncFeaturedAutoplay() {
  clearFeaturedAutoplay()

  if (props.mode !== 'ready' || featuredAutoplayPaused.value || featuredItems.value.length <= 1) {
    return
  }

  featuredAutoplayTimer = setTimeout(() => {
    stepFeatured(1)
    syncFeaturedAutoplay()
  }, HOME_FEATURED_AUTOPLAY_MS)
}

function selectFeatured(index: number) {
  if (index === activeFeaturedIndex.value) {
    syncFeaturedAutoplay()
    return
  }

  setActiveFeaturedIndex(index, index > activeFeaturedIndex.value ? 'forward' : 'backward')
  syncFeaturedAutoplay()
}

function setActiveFeaturedIndex(index: number, direction: FeaturedTransitionDirection) {
  previousFeaturedIndex.value = activeFeaturedIndex.value
  featuredTransitionDirection.value = direction
  activeFeaturedIndex.value = index
}

function resolveFeaturedCoverUrl(item: HomeFeaturedResponse) {
  return resolveHomeMediaUrl(item.cover)
}

function resolveFeaturedTags(item: HomeFeaturedResponse) {
  return createToneTagList(item.tags, HOME_TAG_TONES, HOME_FEATURED_TAG_LIMIT)
}

function pauseFeaturedAutoplay() {
  featuredHoverPaused.value = true
}

function resumeFeaturedAutoplay() {
  featuredHoverPaused.value = false
}

function handleFeaturedFocusIn() {
  featuredFocusPaused.value = true
}

function handleFeaturedFocusOut(event: FocusEvent) {
  const currentTarget = event.currentTarget as HTMLElement | null
  const nextTarget = event.relatedTarget as Node | null

  if (currentTarget?.contains(nextTarget)) {
    return
  }

  featuredFocusPaused.value = false
}

function handleFeaturedReducedMotionChange(event: MediaQueryListEvent) {
  featuredReducedMotion.value = event.matches
}

function handleDocumentVisibilityChange() {
  featuredDocumentHidden.value = document.visibilityState !== 'visible'
}

watch(
  featuredItems,
  (items) => {
    if (items.length === 0) {
      activeFeaturedIndex.value = 0
      previousFeaturedIndex.value = null
      clearFeaturedAutoplay()
      return
    }

    if (activeFeaturedIndex.value >= items.length) {
      activeFeaturedIndex.value = 0
      previousFeaturedIndex.value = null
    }

    if (previousFeaturedIndex.value !== null && previousFeaturedIndex.value >= items.length) {
      previousFeaturedIndex.value = null
    }

    syncFeaturedAutoplay()
  },
  { immediate: true }
)

watch(
  () => props.mode,
  () => {
    syncFeaturedAutoplay()
  }
)

watch(featuredAutoplayPaused, () => {
  syncFeaturedAutoplay()
})

onMounted(() => {
  if (typeof window !== 'undefined' && 'matchMedia' in window) {
    featuredReducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
    featuredReducedMotion.value = featuredReducedMotionMedia.matches
    featuredReducedMotionMedia.addEventListener('change', handleFeaturedReducedMotionChange)
  }

  if (typeof document !== 'undefined') {
    featuredDocumentHidden.value = document.visibilityState !== 'visible'
    document.addEventListener('visibilitychange', handleDocumentVisibilityChange)
  }
})

onBeforeUnmount(() => {
  clearFeaturedAutoplay()

  if (featuredReducedMotionMedia) {
    featuredReducedMotionMedia.removeEventListener('change', handleFeaturedReducedMotionChange)
  }

  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', handleDocumentVisibilityChange)
  }
})
</script>

<style scoped>
.home-hero {
  display: grid;
  grid-template-columns: var(--home-main-col) var(--home-side-col);
  gap: var(--home-section-gap-x);
  align-items: end;
}

.home-hero__feature,
.home-hero__aside {
  position: relative;
  display: grid;
  align-content: start;
  gap: var(--home-section-heading-gap);
}

.home-hero__feature > .portal-section-heading,
.home-hero__aside > .portal-section-heading {
  margin: 0;
}

.home-hero__feature-stage,
.home-hero__aside-stage {
  position: relative;
  display: grid;
}

.home-hero__feature-stage :deep(.portal-request-boundary__state),
.home-hero__aside-stage :deep(.portal-request-boundary__state) {
  padding: var(--portal-browse-state-padding);
  border: 1px solid
    color-mix(
      in srgb,
      var(--portal-request-boundary-accent) 14%,
      var(--portal-request-state-border)
    );
  background: var(--portal-browse-state-surface);
  box-shadow: var(--portal-browse-feature-shadow);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.home-hero__feature-stage {
  min-height: var(--home-hero-feature-shell-min-height);
}

.home-hero__feature-stage :deep(.portal-request-boundary__state) {
  --portal-request-boundary-accent: var(--home-feature-tag-cyan-ink);
  min-height: var(--home-hero-feature-shell-min-height);
  border-radius: var(--portal-browse-feature-radius);
}

.home-hero__aside-stage {
  min-height: var(--home-hero-quick-panel-min-height);
}

.home-hero__aside-stage :deep(.portal-request-boundary__state) {
  --portal-request-boundary-accent: var(--home-feature-tag-cyan-ink);
  min-height: var(--home-hero-quick-panel-min-height);
  border-radius: var(--portal-browse-card-radius);
}

.home-hero__feature-stage > *,
.home-hero__aside-stage > * {
  grid-area: 1 / 1;
}

.home-hero__feature-card {
  --home-featured-progress-duration: 5600ms;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  min-height: var(--home-hero-feature-shell-min-height);
  border: 1px solid var(--portal-browse-card-border);
  border-radius: var(--portal-browse-feature-radius);
  background: var(--portal-browse-card-surface);
  box-shadow: var(--portal-browse-feature-shadow);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.home-hero__feature-main-stage {
  position: relative;
  display: grid;
  min-height: var(--home-hero-feature-panel-min-height);
}

.home-hero__feature-main-stage > * {
  grid-area: 1 / 1;
}

.home-hero__feature-main {
  position: relative;
  display: grid;
  grid-template-columns: var(--home-hero-feature-cover-width) minmax(0, 1fr);
  gap: calc(var(--home-card-gap-loose) + 4px);
  min-height: var(--home-hero-feature-panel-min-height);
  padding: var(--portal-browse-feature-padding);
  align-items: end;
}

.home-hero__feature-main {
  --portal-interactive-hover-filter: var(--home-card-hover-filter);
}

.home-hero__feature-link-layer {
  z-index: 4;
}

.home-hero__feature-main:focus-within .home-hero__cover,
.home-hero__feature-main:hover .home-hero__cover {
  box-shadow: var(--portal-browse-media-shadow);
}

.home-hero__feature-main:focus-within .home-hero__copy-kicker,
.home-hero__feature-main:hover .home-hero__copy-kicker {
  border-color: var(--home-feature-ribbon-border);
}

.home-hero__feature-main:focus-within .home-hero__copy-kicker--topic,
.home-hero__feature-main:hover .home-hero__copy-kicker--topic {
  border-color: rgb(from var(--home-business-topic-tag-bg) r g b / 0.42);
}

.home-hero__feature-main:focus-within .home-hero__copy-kicker--book,
.home-hero__feature-main:hover .home-hero__copy-kicker--book {
  border-color: rgb(from var(--home-business-bookshelf-tag-bg) r g b / 0.42);
}

.home-hero__feature-main:focus-within .home-hero__copy-kicker--image,
.home-hero__feature-main:hover .home-hero__copy-kicker--image {
  border-color: rgb(from var(--home-business-gallery-tag-bg) r g b / 0.42);
}

.home-hero__feature-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--home-featured-nav-gap);
}

.home-hero__feature-nav--footer {
  min-height: var(--home-featured-nav-height);
  box-sizing: border-box;
  padding: 0 var(--portal-browse-feature-padding) var(--portal-browse-feature-padding);
  width: var(--home-featured-nav-width);
  justify-self: start;
  margin-left: calc(
    var(--portal-browse-feature-padding) +
      ((var(--home-hero-feature-cover-width) - var(--home-featured-nav-width)) / 2)
  );
}

.home-hero__feature-nav-item {
  appearance: none;
  position: relative;
  flex: 1 1 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--home-featured-nav-height);
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--home-featured-nav-item-border);
  border-radius: 999px;
  background: var(--home-featured-nav-slot-bg), var(--home-featured-nav-item-bg);
  box-shadow: var(--home-featured-nav-item-shadow), var(--home-featured-nav-slot-shadow);
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.home-hero__feature-nav-item--skeleton {
  cursor: default;
  pointer-events: none;
  border-color: var(--home-skeleton-border);
  background: linear-gradient(
    135deg,
    var(--home-skeleton-block-strong),
    var(--home-skeleton-block)
  );
  box-shadow: none;
}

.home-hero__feature-nav-item::before {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 0;
  z-index: 2;
  height: 2px;
  border-radius: 999px;
  background: var(--home-featured-nav-item-line);
  opacity: 0;
  transform: scaleX(0.56);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
  pointer-events: none;
}

.home-hero__feature-nav-item::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  background: var(--home-featured-nav-fill-bg);
  box-shadow: var(--home-featured-nav-fill-shadow);
  opacity: var(--home-featured-nav-fill-opacity);
  transform: scaleX(0);
  transform-origin: left center;
  transition:
    opacity 220ms ease,
    box-shadow 220ms ease;
  pointer-events: none;
}

.home-hero__feature-nav-item--skeleton::before {
  inset: 0;
  left: 0;
  right: 0;
  bottom: auto;
  z-index: 1;
  height: auto;
  border-radius: inherit;
  background: var(--home-skeleton-shimmer);
  opacity: 1;
  animation: home-skeleton-wave 2.4s ease-in-out infinite;
  transform: translateX(-100%);
}

.home-hero__feature-nav-item--skeleton::after {
  display: none;
}

.home-hero__feature-nav-item:hover,
.home-hero__feature-nav-item:focus-visible {
  border-color: var(--home-featured-nav-item-hover-border);
  background: var(--home-featured-nav-item-hover-bg);
}

.home-hero__feature-nav-item:hover::before,
.home-hero__feature-nav-item:focus-visible::before,
.home-hero__feature-nav-item.is-active::before {
  opacity: 1;
  transform: scaleX(1);
}

.home-hero__feature-nav-item.is-active {
  border-color: var(--home-featured-nav-slot-hover-border);
  box-shadow:
    var(--home-featured-nav-item-shadow),
    var(--home-featured-nav-slot-shadow),
    inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.home-hero__feature-nav-item.is-active::after {
  opacity: var(--home-featured-nav-fill-opacity-active);
  animation: home-featured-nav-progress var(--home-featured-progress-duration) linear forwards;
}

.home-hero__feature-card.is-featured-paused .home-hero__feature-nav-item.is-active::after {
  animation-play-state: paused;
}

.home-hero__feature-nav-item:focus-visible {
  outline: none;
}

.home-hero__cover {
  position: relative;
  min-height: var(--home-hero-feature-cover-height);
  height: var(--home-hero-feature-cover-height);
  border-radius: var(--portal-browse-feature-media-radius);
  background: linear-gradient(145deg, rgba(94, 123, 158, 0.28), rgba(18, 24, 35, 0.55));
  box-shadow: var(--portal-browse-media-shadow);
  overflow: hidden;
}

.home-hero__cover-image {
  transform: scale(1.02);
  transform-origin: center;
}

.home-hero__cover--skeleton {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 80%),
    linear-gradient(135deg, var(--home-skeleton-block-strong), var(--home-skeleton-block));
}

.home-hero__cover::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: var(--home-media-overlay-soft), var(--home-hero-cover-art);
}

.home-hero__cover::after {
  content: '';
  position: absolute;
  z-index: 2;
  right: -24px;
  bottom: -20px;
  width: 150px;
  height: 150px;
  border: 1px solid var(--home-media-deco-border);
  border-radius: 32px;
  background: var(--home-media-deco-bg);
  transform: rotate(16deg);
}

.home-hero__cover-frame {
  position: absolute;
  inset: 18px;
  z-index: 2;
  border: 1px solid var(--home-media-frame-border);
  border-radius: 20px;
}

.home-hero__feature-stamp {
  position: absolute;
  top: 20px;
  right: -10px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  padding: 0 20px 0 15px;
  overflow: hidden;
  border-radius: 20px 0 0 20px;
  background: var(--home-feature-ribbon-bg);
  box-shadow:
    var(--home-feature-ribbon-shadow),
    inset 0 0 0 1px var(--home-feature-ribbon-border);
  clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 50%, 100% 100%, 0 100%);
  pointer-events: none;
  transform: rotate(-1.5deg);
  transform-origin: center;
}

.home-hero__feature-stamp--skeleton {
  width: 76px;
}

.home-hero__feature-stamp::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--home-feature-ribbon-gloss), transparent 68%);
  clip-path: inherit;
  pointer-events: none;
}

.home-hero__feature-stamp-text {
  position: relative;
  z-index: 1;
  color: var(--home-feature-ribbon-ink);
  font-size: 12px;
  line-height: 1;
  font-weight: 600;
  font-style: italic;
  letter-spacing: 0.08em;
  transform: translateY(-1px);
}

.home-hero__copy {
  display: grid;
  align-content: center;
  gap: calc(var(--home-copy-gap-loose) + 2px);
  min-width: 0;
  min-height: var(--home-hero-feature-copy-min-height);
}

.home-hero__copy-kicker {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  height: var(--home-chip-height-lg);
  padding: 0 14px;
  border: 1px solid var(--home-feature-badge-border);
  border-radius: 999px;
  background: var(--home-feature-badge-bg);
  color: var(--home-feature-badge-ink);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  backdrop-filter: blur(12px);
}

.home-hero__copy-kicker--topic {
  border-color: rgb(from var(--home-business-topic-tag-bg) r g b / 0.3);
  background: var(--home-business-topic-tag-bg);
  color: var(--home-business-topic-tag-ink);
}

.home-hero__copy-kicker--book {
  border-color: rgb(from var(--home-business-bookshelf-tag-bg) r g b / 0.3);
  background: var(--home-business-bookshelf-tag-bg);
  color: var(--home-business-bookshelf-tag-ink);
}

.home-hero__copy-kicker--image {
  border-color: rgb(from var(--home-business-gallery-tag-bg) r g b / 0.3);
  background: var(--home-business-gallery-tag-bg);
  color: var(--home-business-gallery-tag-ink);
}

.home-hero__copy h3 {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--home-ink);
  font-size: var(--home-font-size-title-hero);
  line-height: var(--home-line-size-title-hero);
  letter-spacing: 0;
  height: var(--home-block-title-hero-2);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.home-hero__copy p {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--home-muted);
  font-size: var(--home-font-size-body-lg);
  line-height: var(--home-line-size-body-lg);
  height: var(--home-block-body-lg-2);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.home-hero__skeleton-lines {
  display: grid;
  align-content: start;
  gap: 0;
}

.home-hero__skeleton-lines--title {
  height: var(--home-block-title-hero-2);
}

.home-hero__skeleton-lines--summary {
  height: var(--home-block-body-lg-2);
}

.home-hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--home-card-gap-base);
  align-content: start;
  min-height: var(--home-chip-height-lg);
}

.home-hero__tag {
  display: inline-flex;
  align-items: center;
  height: var(--home-chip-height-lg);
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.home-hero__tag--cyan {
  background: var(--home-feature-tag-cyan-bg);
  border-color: var(--home-feature-tag-cyan-border);
  color: var(--home-feature-tag-cyan-ink);
}

.home-hero__tag--sky {
  background: var(--home-feature-tag-sky-bg);
  border-color: var(--home-feature-tag-sky-border);
  color: var(--home-feature-tag-sky-ink);
}

.home-hero__tag--iris {
  background: var(--home-feature-tag-iris-bg);
  border-color: var(--home-feature-tag-iris-border);
  color: var(--home-feature-tag-iris-ink);
}

.home-hero__tag--soft {
  background: var(--home-feature-tag-soft-bg);
  border-color: var(--home-feature-tag-soft-border);
  color: var(--home-feature-tag-soft-ink);
}

.home-hero__quick-list,
.home-hero__quick-skeleton-list {
  display: grid;
  gap: var(--home-card-gap-base);
  align-content: start;
}

.home-hero__quick-item {
  --portal-interactive-hover-transform: none;
  --portal-interactive-hover-border: var(--home-quick-item-hover-border);
  --portal-interactive-hover-background: var(--home-quick-item-hover-bg);
  --portal-interactive-hover-shadow: var(--home-quick-item-hover-shadow);
  position: relative;
  display: grid;
  grid-template-columns: var(--home-hero-quick-icon-size) minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--home-hero-quick-gap);
  height: var(--home-hero-quick-item-height);
  padding: var(--home-hero-quick-padding-y) var(--home-hero-quick-padding-x);
  border: 1px solid var(--home-quick-item-border);
  border-radius: var(--home-hero-quick-radius);
  background: var(--home-quick-item-bg);
  box-shadow: var(--home-quick-item-shadow);
  backdrop-filter: blur(calc(var(--home-panel-blur) * 0.72));
  -webkit-backdrop-filter: blur(calc(var(--home-panel-blur) * 0.72));
}

.home-hero__quick-item--skeleton {
  cursor: default;
}

.home-hero__quick-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--home-hero-quick-icon-size);
  height: var(--home-hero-quick-icon-size);
  overflow: hidden;
  border: 1px solid var(--home-quick-icon-surface-border);
  border-radius: var(--home-hero-quick-icon-radius);
  background: var(--home-quick-icon-surface-bg);
  box-shadow:
    0 10px 20px var(--home-quick-icon-shadow),
    inset 0 1px 0 var(--home-quick-icon-surface-highlight);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    filter 180ms ease;
}

.home-hero__quick-icon::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 24% 18%, var(--home-quick-icon-glow), transparent 68%);
  pointer-events: none;
}

.home-hero__quick-icon-svg {
  --portal-icon-size: var(--home-hero-quick-icon-glyph-size);
  position: relative;
  z-index: 1;
  filter: var(--home-quick-icon-svg-shadow);
}

.home-hero__skeleton-orb {
  position: relative;
  z-index: 1;
  width: var(--home-hero-quick-icon-orb-size);
  height: var(--home-hero-quick-icon-orb-size);
  border-radius: 999px;
  background: linear-gradient(
    135deg,
    var(--home-skeleton-highlight),
    var(--home-skeleton-block-strong)
  );
}

.home-hero__quick-copy {
  display: grid;
  grid-template-rows: var(--home-block-title-sm-1) var(--home-block-body-md-1);
  align-content: start;
  gap: var(--home-copy-gap-tight);
  min-width: 0;
}

.home-hero__quick-copy-title {
  display: block;
  height: var(--home-block-title-sm-1);
  overflow: hidden;
  color: var(--home-ink);
  font-size: var(--home-font-size-title-sm);
  font-weight: 700;
  line-height: var(--home-line-size-title-sm);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.home-hero__quick-copy-text {
  display: block;
  height: var(--home-block-body-md-1);
  overflow: hidden;
  color: var(--home-muted);
  font-size: var(--home-hero-quick-copy-size);
  line-height: var(--home-line-size-body-md);
  white-space: nowrap;
  text-overflow: ellipsis;
  opacity: 0.72;
}

.home-hero__quick-meta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--home-chip-height-sm);
  min-width: 48px;
  padding: 0 10px;
  border: 1px solid var(--home-quick-meta-border);
  border-radius: 999px;
  background: var(--home-quick-meta-bg);
  color: var(--home-ink);
  font-size: 12px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
  transition:
    background 180ms ease,
    border-color 180ms ease,
    color 180ms ease;
}

.home-hero__quick-side {
  display: inline-grid;
  grid-auto-flow: column;
  align-items: center;
  justify-content: end;
  gap: 6px;
}

.home-hero__quick-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--home-hero-quick-arrow-size);
  height: var(--home-hero-quick-arrow-size);
  border: 1px solid var(--home-quick-arrow-border);
  border-radius: 999px;
  background: var(--home-quick-arrow-bg);
  color: var(--home-quick-arrow-ink);
  font-size: 14px;
  line-height: 1;
  opacity: var(--home-hero-quick-arrow-opacity);
  transform: translateX(-2px);
  transition:
    opacity 180ms ease,
    transform 180ms ease,
    color 180ms ease,
    border-color 180ms ease,
    background 180ms ease;
}

.home-hero__quick-item:not(.home-hero__quick-item--skeleton):hover .home-hero__quick-icon {
  box-shadow:
    0 12px 20px var(--home-quick-icon-shadow),
    inset 0 1px 0 var(--home-quick-icon-surface-highlight);
}

.home-hero__quick-item:not(.home-hero__quick-item--skeleton):hover .home-hero__quick-icon-svg {
  filter: brightness(1.02) var(--home-quick-icon-svg-shadow);
}

.home-hero__quick-item:not(.home-hero__quick-item--skeleton):hover .home-hero__quick-meta {
  color: var(--home-ink);
}

.home-hero__quick-item:not(.home-hero__quick-item--skeleton):hover .home-hero__quick-arrow {
  opacity: 0.72;
  transform: translateX(0);
  color: var(--home-ink);
}

.home-hero__skeleton-block,
.home-hero__skeleton-pill,
.home-hero__skeleton-dot {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--home-skeleton-border);
  background: linear-gradient(
    135deg,
    var(--home-skeleton-block-strong),
    var(--home-skeleton-block)
  );
}

.home-hero__skeleton-block::after,
.home-hero__skeleton-pill::after,
.home-hero__skeleton-dot::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--home-skeleton-shimmer);
  animation: home-skeleton-wave 2.4s ease-in-out infinite;
  transform: translateX(-100%);
}

.home-hero__skeleton-block {
  display: inline-flex;
  height: 12px;
  border-radius: 999px;
}

.home-hero__skeleton-text-row {
  display: flex;
  align-items: center;
}

.home-hero__skeleton-text-row--feature-title {
  height: var(--home-line-size-title-hero);
}

.home-hero__skeleton-text-row--feature-summary {
  height: var(--home-line-size-body-lg);
}

.home-hero__skeleton-text-row--quick-title {
  height: var(--home-block-title-sm-1);
}

.home-hero__skeleton-text-row--quick-copy {
  height: var(--home-block-body-md-1);
}

.home-hero__skeleton-block--stamp {
  width: 68px;
  height: 8px;
  border-radius: 999px;
}

.home-hero__skeleton-block--title {
  width: 90%;
  height: var(--home-skeleton-title-hero-height);
}

.home-hero__skeleton-block--title-short {
  width: 74%;
  height: var(--home-skeleton-title-hero-height);
}

.home-hero__skeleton-block--summary {
  width: 100%;
  height: var(--home-skeleton-copy-14-height);
}

.home-hero__skeleton-block--summary-short {
  width: 82%;
  height: var(--home-skeleton-copy-14-height);
}

.home-hero__skeleton-block--quick-title {
  width: 54%;
  height: var(--home-skeleton-title-sm-height);
}

.home-hero__skeleton-block--quick-copy {
  width: 86%;
  height: var(--home-skeleton-copy-12-height);
}

.home-hero__skeleton-pill {
  display: inline-flex;
  width: 112px;
  height: var(--home-chip-height-md);
  border-radius: 999px;
}

.home-hero__skeleton-pill--kicker {
  width: 164px;
  height: var(--home-chip-height-lg);
}

.home-hero__skeleton-pill--tag {
  width: 88px;
  height: var(--home-chip-height-lg);
}

.home-hero__skeleton-pill--tag-short {
  width: 74px;
}

.home-hero__skeleton-pill--meta {
  width: 50px;
  height: var(--home-chip-height-sm);
}

.home-hero__skeleton-dot {
  width: var(--home-hero-quick-arrow-size);
  height: var(--home-hero-quick-arrow-size);
  border-radius: 999px;
}

@keyframes home-featured-nav-progress {
  from {
    transform: scaleX(0.12);
  }

  to {
    transform: scaleX(1);
  }
}
</style>
