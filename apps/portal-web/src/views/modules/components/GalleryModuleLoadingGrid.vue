<template>
  <div class="gallery-module-loading-grid" aria-hidden="true">
    <div
      v-for="(column, columnIndex) in loadingColumns"
      :key="`gallery-module-loading-column-${columnIndex}`"
      class="gallery-module-loading-grid__column"
    >
      <article
        v-for="{ item: cardIndex, index } in column"
        :key="`gallery-module-loading-${cardIndex}`"
        class="gallery-module-loading-card"
        :class="`gallery-module-loading-card--${variants[index % variants.length]}`"
      >
        <div class="gallery-module-loading-card__media">
          <span class="gallery-module-loading-card__pill gallery-module-loading-card__pill--left" />
          <span
            class="gallery-module-loading-card__pill gallery-module-loading-card__pill--right"
          />
          <div class="gallery-module-loading-card__cover" />
        </div>

        <div class="gallery-module-loading-card__copy">
          <div class="gallery-module-loading-card__title">
            <span
              class="gallery-module-loading-card__line gallery-module-loading-card__line--title"
            >
              <span
                class="gallery-module-loading-card__block gallery-module-loading-card__block--title"
              />
            </span>
            <span
              class="gallery-module-loading-card__line gallery-module-loading-card__line--title-secondary"
            >
              <span
                class="gallery-module-loading-card__block gallery-module-loading-card__block--title-short"
              />
            </span>
          </div>
          <div class="gallery-module-loading-card__footer">
            <span
              class="gallery-module-loading-card__line gallery-module-loading-card__line--stats"
            >
              <span
                class="gallery-module-loading-card__block gallery-module-loading-card__block--stats"
              />
            </span>
            <span class="gallery-module-loading-card__line gallery-module-loading-card__line--time">
              <span
                class="gallery-module-loading-card__block gallery-module-loading-card__block--time"
              />
            </span>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useGalleryModuleMasonryColumns } from './gallery-module-masonry'

const props = withDefaults(
  defineProps<{
    count?: number
  }>(),
  {
    count: 18
  }
)

const variants = ['balanced', 'tall', 'wide', 'balanced', 'tall', 'wide'] as const
const loadingItems = computed(() =>
  Array.from({ length: props.count }, (_value, index) => index + 1)
)
const { columns: loadingColumns } = useGalleryModuleMasonryColumns(loadingItems)
</script>

<style scoped src="./gallery-module-card-shared.css"></style>

<style scoped>
.gallery-module-loading-grid {
  --gallery-module-card-gap-local: var(--portal-content-card-gap-tight);
  --gallery-module-card-meta-height-local: 22px;
  --gallery-module-card-meta-width-local: 72px;
  --gallery-module-card-meta-width-wide-local: 74px;
  --gallery-module-card-title-line-height-local: calc(14px * 1.38);
  --gallery-module-card-footer-line-height-local: calc(12px * 1.5);
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
}

.gallery-module-loading-grid__column {
  display: grid;
  min-width: 0;
  align-content: start;
}

.gallery-module-loading-card__cover,
.gallery-module-loading-card__block {
  position: relative;
}

.gallery-module-loading-card__cover,
.gallery-module-loading-card__block,
.gallery-module-loading-card__pill {
  overflow: hidden;
  border: 1px solid var(--portal-skeleton-border);
  background: linear-gradient(
    135deg,
    var(--portal-skeleton-block-strong),
    var(--portal-skeleton-block)
  );
}

.gallery-module-loading-card__cover::after,
.gallery-module-loading-card__block::after,
.gallery-module-loading-card__pill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--portal-skeleton-shimmer);
  animation: portal-skeleton-wave 2.4s ease-in-out infinite;
  transform: translateX(-100%);
}

.gallery-module-loading-card__pill {
  position: absolute;
  top: var(--gallery-module-card-meta-top-local);
  z-index: 2;
  display: inline-flex;
  height: var(--gallery-module-card-meta-height-local);
  border-radius: 999px;
}

.gallery-module-loading-card__pill--left {
  left: var(--gallery-module-card-meta-side-local);
  width: var(--gallery-module-card-meta-width-local);
  border-radius: 10px 15px 13px 10px;
}

.gallery-module-loading-card__pill--left::before {
  content: '';
  position: absolute;
  top: 5px;
  left: 8px;
  z-index: 1;
  width: 4px;
  height: 12px;
  border-radius: 999px;
  background: var(--portal-skeleton-block-strong);
}

.gallery-module-loading-card__pill--right {
  right: var(--gallery-module-card-meta-side-local);
  width: var(--gallery-module-card-meta-width-wide-local);
}

.gallery-module-loading-card__cover {
  box-shadow: var(--portal-browse-media-shadow);
}

.gallery-module-loading-card__copy {
  gap: 4px;
}

.gallery-module-loading-card__title {
  display: grid;
  gap: 0;
  min-height: calc(var(--gallery-module-card-title-line-height-local) * 2);
}

.gallery-module-loading-card__line {
  display: flex;
  align-items: center;
}

.gallery-module-loading-card__line--title,
.gallery-module-loading-card__line--title-secondary {
  height: var(--gallery-module-card-title-line-height-local);
}

.gallery-module-loading-card__line--title {
  width: 84%;
}

.gallery-module-loading-card__line--title-secondary {
  width: 68%;
}

.gallery-module-loading-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--portal-content-card-gap-tight);
}

.gallery-module-loading-card__line--stats,
.gallery-module-loading-card__line--time {
  height: var(--gallery-module-card-footer-line-height-local);
}

.gallery-module-loading-card__line--stats {
  width: 58%;
}

.gallery-module-loading-card__line--time {
  width: 30%;
  justify-content: flex-end;
}

.gallery-module-loading-card__block {
  display: inline-flex;
  border-radius: 999px;
}

.gallery-module-loading-card__block--title {
  width: 100%;
  height: var(--portal-skeleton-title-sm-height);
}

.gallery-module-loading-card__block--title-short {
  width: 100%;
  height: var(--portal-skeleton-title-sm-height);
}

.gallery-module-loading-card__block--stats {
  width: 100%;
  height: var(--portal-skeleton-copy-12-height);
}

.gallery-module-loading-card__block--time {
  width: 100%;
  height: var(--portal-skeleton-copy-12-height);
}
</style>
