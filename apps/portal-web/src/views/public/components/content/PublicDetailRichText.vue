<template>
  <div
    class="public-detail-rich-text"
    :class="`public-detail-rich-text--${accent}`"
    v-html="html"
  />
</template>

<script setup lang="ts">
import type { PublicDetailAccent } from '@/constants/public-detail'

withDefaults(
  defineProps<{
    html: string
    accent?: PublicDetailAccent
  }>(),
  {
    accent: 'article'
  }
)
</script>

<style scoped>
.public-detail-rich-text {
  --public-detail-rich-text-accent: var(
    --public-detail-rich-text-accent-ink,
    var(--home-business-article-accent)
  );
  width: min(100%, var(--public-detail-rich-text-max-width, 780px));
  color: var(--home-ink);
  font-size: var(--public-detail-rich-text-font-size, 16px);
  line-height: var(--public-detail-rich-text-line-height, 1.76);
}

.public-detail-rich-text--topic {
  --public-detail-rich-text-accent-ink: var(--home-business-topic-accent);
}

.public-detail-rich-text--gallery {
  --public-detail-rich-text-accent-ink: var(--home-business-gallery-accent);
}

.public-detail-rich-text :deep(> :first-child) {
  margin-top: 0;
}

.public-detail-rich-text :deep(> :last-child) {
  margin-bottom: 0;
}

.public-detail-rich-text :deep(> p:first-of-type) {
  color: var(
    --public-detail-rich-text-intro-ink,
    color-mix(in srgb, var(--home-ink) 94%, transparent)
  );
  font-size: var(--public-detail-rich-text-intro-size, 17px);
  line-height: var(--public-detail-rich-text-intro-line-height, 1.72);
  margin-bottom: var(--public-detail-rich-text-intro-gap, 18px);
}

.public-detail-rich-text :deep(p),
.public-detail-rich-text :deep(ul),
.public-detail-rich-text :deep(ol),
.public-detail-rich-text :deep(pre),
.public-detail-rich-text :deep(table),
.public-detail-rich-text :deep(hr) {
  margin: 0 0 var(--public-detail-rich-text-flow-space, 14px);
}

.public-detail-rich-text :deep(figure),
.public-detail-rich-text :deep(blockquote),
.public-detail-rich-text :deep(iframe),
.public-detail-rich-text :deep(.ql-video) {
  margin: 0 0 var(--public-detail-rich-text-flow-space-lg, 20px);
}

.public-detail-rich-text :deep(h2),
.public-detail-rich-text :deep(h3) {
  color: var(--home-ink);
  letter-spacing: -0.024em;
}

.public-detail-rich-text :deep(h2) {
  font-size: var(--public-detail-rich-text-h2-size, 22px);
  line-height: 1.36;
  margin-top: var(--public-detail-rich-text-heading-top-lg, 32px);
  margin-bottom: var(--public-detail-rich-text-heading-bottom, 12px);
}

.public-detail-rich-text :deep(h3) {
  font-size: var(--public-detail-rich-text-h3-size, 18px);
  line-height: 1.42;
  margin-top: var(--public-detail-rich-text-heading-top-md, 26px);
  margin-bottom: var(--public-detail-rich-text-heading-bottom, 12px);
}

.public-detail-rich-text :deep(p) {
  color: color-mix(in srgb, var(--home-ink) 88%, transparent);
}

.public-detail-rich-text :deep(p + p) {
  margin-top: var(--public-detail-rich-text-paragraph-gap, 18px);
}

.public-detail-rich-text :deep(a) {
  color: color-mix(in srgb, var(--public-detail-rich-text-accent) 90%, var(--home-ink) 10%);
  font-weight: 700;
  text-decoration-line: underline;
  text-decoration-thickness: 1px;
  text-decoration-color: color-mix(in srgb, var(--public-detail-rich-text-accent) 46%, transparent);
  text-underline-offset: 0.2em;
  transition:
    color 180ms ease,
    text-decoration-color 180ms ease;
}

.public-detail-rich-text :deep(a:hover) {
  color: color-mix(in srgb, var(--public-detail-rich-text-accent) 96%, white 4%);
  text-decoration-color: color-mix(in srgb, var(--public-detail-rich-text-accent) 74%, transparent);
}

.public-detail-rich-text :deep(ul),
.public-detail-rich-text :deep(ol) {
  margin-top: var(--public-detail-rich-text-list-space-top, 16px);
  margin-bottom: var(--public-detail-rich-text-list-space-bottom, 18px);
  padding-left: 1.35em;
}

.public-detail-rich-text :deep(li) {
  color: color-mix(in srgb, var(--home-ink) 88%, transparent);
}

.public-detail-rich-text :deep(li + li) {
  margin-top: var(--public-detail-rich-text-list-gap, 6px);
}

.public-detail-rich-text :deep(li > p) {
  margin-bottom: 0;
}

.public-detail-rich-text :deep(ul li::marker),
.public-detail-rich-text :deep(ol li::marker) {
  color: color-mix(in srgb, var(--public-detail-rich-text-accent) 58%, var(--home-muted) 42%);
  font-weight: 700;
}

.public-detail-rich-text :deep(blockquote) {
  position: relative;
  padding: var(--public-detail-rich-text-quote-padding, 12px 16px);
  border: 1px solid var(--home-detail-glass-border-emphasis);
  border-radius: 18px;
  background: var(--home-detail-glass-bg-emphasis);
  box-shadow: var(--home-detail-glass-shadow-emphasis);
  color: var(--home-ink);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.75;
  margin-top: var(--public-detail-rich-text-quote-space-top, 24px);
  margin-bottom: var(--public-detail-rich-text-quote-space-bottom, 24px);
}

.public-detail-rich-text :deep(blockquote > :first-child) {
  margin-top: 0;
}

.public-detail-rich-text :deep(blockquote > :last-child) {
  margin-bottom: 0;
}

.public-detail-rich-text :deep(blockquote p + p) {
  margin-top: var(--public-detail-rich-text-quote-paragraph-gap, 8px);
}

.public-detail-rich-text :deep(blockquote)::before {
  content: '';
  position: absolute;
  top: 16px;
  bottom: 16px;
  left: 0;
  width: 3px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--public-detail-rich-text-accent), transparent);
}

.public-detail-rich-text :deep(figure) {
  display: grid;
  justify-items: center;
  align-items: start;
  overflow: hidden;
  border: 1px solid var(--home-detail-card-border);
  border-radius: 22px;
  background: var(--home-detail-card-bg);
  box-shadow: var(--home-card-shadow);
}

.public-detail-rich-text :deep(figure > a) {
  display: flex;
  justify-content: center;
  width: 100%;
}

.public-detail-rich-text :deep(img) {
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  margin-inline: auto;
  background: color-mix(in srgb, var(--home-detail-card-bg) 88%, transparent);
}

.public-detail-rich-text :deep(figcaption) {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px 10px;
  border-top: 1px solid color-mix(in srgb, var(--home-line) 78%, transparent);
  color: color-mix(in srgb, var(--home-muted) 88%, transparent);
  font-size: 12px;
  line-height: 1.8;
  letter-spacing: 0.01em;
}

.public-detail-rich-text :deep(iframe),
.public-detail-rich-text :deep(.ql-video) {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: clamp(220px, 36vw, 420px);
  border: 1px solid var(--home-detail-card-border);
  border-radius: 22px;
  background: color-mix(in srgb, var(--home-detail-card-bg) 86%, rgba(8, 18, 38, 0.14));
  box-shadow: var(--home-card-shadow);
  overflow: hidden;
}

.public-detail-rich-text :deep(p > iframe),
.public-detail-rich-text :deep(p > .ql-video) {
  margin-bottom: 0;
}

.public-detail-rich-text :deep(figure),
.public-detail-rich-text :deep(blockquote),
.public-detail-rich-text :deep(iframe),
.public-detail-rich-text :deep(.ql-video) {
  box-sizing: border-box;
  width: calc(100% + (var(--public-detail-rich-text-outset, 0px) * 2));
  margin-left: calc(var(--public-detail-rich-text-outset, 0px) * -1);
}

.public-detail-rich-text :deep(hr) {
  margin-top: var(--public-detail-rich-text-divider-space-top, 28px);
  margin-bottom: var(--public-detail-rich-text-divider-space-bottom, 28px);
  border: 0;
  border-top: 1px solid color-mix(in srgb, var(--home-line) 78%, transparent);
}
</style>
