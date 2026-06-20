<template>
  <header class="portal-section-heading" :class="`portal-section-heading--${variant}`">
    <portal-svg-icon
      v-if="resolvedIconName"
      :name="resolvedIconName"
      class="portal-section-heading__icon"
    />
    <div class="portal-section-heading__title-wrap">
      <component :is="headingTag" class="portal-section-heading__title">{{ title }}</component>
      <span class="portal-section-heading__deco" aria-hidden="true">
        <span class="portal-section-heading__deco-block portal-section-heading__deco-block--one" />
        <span class="portal-section-heading__deco-block portal-section-heading__deco-block--two" />
        <span
          class="portal-section-heading__deco-block portal-section-heading__deco-block--three"
        />
      </span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import {
  PORTAL_SECTION_HEADING_ICON_NAMES,
  type PortalSectionHeadingVariant
} from '@/constants/section-heading'

const props = withDefaults(
  defineProps<{
    headingTag?: 'h1' | 'h2' | 'h3'
    iconName?: string
    title: string
    variant: PortalSectionHeadingVariant
  }>(),
  {
    headingTag: 'h2',
    iconName: ''
  }
)

const resolvedIconName = computed(
  () => props.iconName.trim() || PORTAL_SECTION_HEADING_ICON_NAMES[props.variant]
)
</script>

<style scoped>
.portal-section-heading {
  --heading-ink: var(--portal-content-article-accent);
  --heading-ink-soft: var(--portal-content-article-accent-soft);
  display: flex;
  align-items: center;
  gap: var(--portal-browse-section-heading-gap);
}

.portal-section-heading--catalog {
  --heading-ink: var(--portal-content-catalog-accent);
  --heading-ink-soft: var(--portal-content-catalog-accent-soft);
}

.portal-section-heading--featured {
  --heading-ink: var(--portal-content-featured-accent);
  --heading-ink-soft: var(--portal-content-featured-accent-soft);
}

.portal-section-heading--article {
  --heading-ink: var(--portal-content-article-accent);
  --heading-ink-soft: var(--portal-content-article-accent-soft);
}

.portal-section-heading--column {
  --heading-ink: var(--portal-content-topic-accent);
  --heading-ink-soft: var(--portal-content-topic-accent-soft);
}

.portal-section-heading--bookshelf {
  --heading-ink: var(--portal-content-bookshelf-accent);
  --heading-ink-soft: var(--portal-content-bookshelf-accent-soft);
}

.portal-section-heading--gallery {
  --heading-ink: var(--portal-content-gallery-accent);
  --heading-ink-soft: var(--portal-content-gallery-accent-soft);
}

.portal-section-heading__icon {
  --portal-icon-size: var(--portal-browse-section-heading-icon-size);
  flex: 0 0 auto;
  filter: var(--portal-browse-section-heading-icon-filter);
  opacity: var(--portal-browse-section-heading-icon-opacity);
}

.portal-section-heading__title-wrap {
  position: relative;
  display: inline-flex;
  align-items: flex-end;
  min-width: 0;
  padding-right: var(--portal-browse-section-heading-wrap-padding-end);
}

.portal-section-heading__title {
  margin: 0;
  min-width: 0;
  position: relative;
  z-index: 1;
  background: linear-gradient(
    135deg,
    var(--heading-ink) 0%,
    var(--heading-ink-soft) 54%,
    var(--portal-content-ink) 100%
  );
  color: transparent;
  background-clip: text;
  -webkit-background-clip: text;
  font-size: var(--portal-browse-section-heading-title-size);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: var(--portal-browse-section-heading-title-tracking);
  text-shadow: none;
}

.portal-section-heading__deco {
  position: absolute;
  right: var(--portal-browse-section-heading-deco-offset-x);
  bottom: var(--portal-browse-section-heading-deco-offset-y);
  display: inline-flex;
  gap: var(--portal-browse-section-heading-deco-gap);
  color: var(--heading-ink);
  pointer-events: none;
  z-index: 0;
  opacity: 0.6;
}

.portal-section-heading__deco-block {
  display: inline-flex;
  width: var(--portal-browse-section-heading-deco-width);
  border-radius: 999px;
  background: currentColor;
  transform: rotate(var(--portal-browse-section-heading-deco-tilt));
  transform-origin: center bottom;
}

.portal-section-heading__deco-block--one {
  height: var(--portal-browse-section-heading-deco-height-1);
  opacity: var(--portal-browse-section-heading-deco-opacity-1);
}

.portal-section-heading__deco-block--two {
  height: var(--portal-browse-section-heading-deco-height-2);
  opacity: var(--portal-browse-section-heading-deco-opacity-2);
}

.portal-section-heading__deco-block--three {
  height: var(--portal-browse-section-heading-deco-height-3);
  opacity: var(--portal-browse-section-heading-deco-opacity-3);
}
</style>
