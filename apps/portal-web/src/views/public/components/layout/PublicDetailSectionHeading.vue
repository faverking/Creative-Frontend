<template>
  <header class="public-detail-section-heading" :class="`public-detail-section-heading--${tone}`">
    <portal-svg-icon
      :name="iconName"
      class="public-detail-section-heading__icon"
      aria-hidden="true"
    />
    <h2 class="public-detail-section-heading__title">{{ title }}</h2>
    <span class="public-detail-section-heading__accent" aria-hidden="true" />
  </header>
</template>

<script setup lang="ts">
import type { PortalIconName } from '@/components/icons/portalIconRegistry'
import type { PublicDetailSectionTone } from '@/constants/public-detail'

withDefaults(
  defineProps<{
    iconName: PortalIconName
    title: string
    tone?: PublicDetailSectionTone
  }>(),
  {
    tone: 'neutral'
  }
)
</script>

<style scoped>
.public-detail-section-heading {
  --public-detail-section-heading-accent: var(--public-detail-heading-accent-neutral);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  color: var(--portal-content-ink);
}

.public-detail-section-heading--article {
  --public-detail-section-heading-accent: var(--portal-content-article-accent);
}

.public-detail-section-heading--topic {
  --public-detail-section-heading-accent: var(--portal-content-topic-accent);
}

.public-detail-section-heading--book {
  --public-detail-section-heading-accent: var(--portal-content-bookshelf-accent);
}

.public-detail-section-heading--gallery {
  --public-detail-section-heading-accent: var(--portal-content-gallery-accent);
}

.public-detail-section-heading--bookshelf {
  --public-detail-section-heading-accent: var(--portal-content-bookshelf-accent);
}

.public-detail-section-heading__icon {
  --portal-icon-size: 18px;
  flex: 0 0 auto;
  color: var(--public-detail-glass-ink);
  filter: var(--public-detail-section-icon-shadow);
}

.public-detail-section-heading__title {
  margin: 0;
  min-width: 0;
  color: var(--portal-content-ink);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
}

.public-detail-section-heading__accent {
  display: inline-flex;
  margin-left: 6px;
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: var(--public-detail-section-heading-accent);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--public-detail-section-heading-accent) 16%, transparent),
    0 2px 6px color-mix(in srgb, var(--public-detail-section-heading-accent) 22%, transparent);
  opacity: 0.94;
}
</style>
