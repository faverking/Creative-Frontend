<template>
  <header
    class="public-detail-hero"
    :class="[
      `public-detail-hero--${accent}`,
      {
        'public-detail-hero--with-cover': hasCover,
        'public-detail-hero--with-actions': normalizedActions.length > 0
      }
    ]"
  >
    <div v-if="hasCover" class="public-detail-hero__cover-shell">
      <slot name="cover">
        <div class="public-detail-hero__cover-frame">
          <portal-image
            :src="normalizedCoverUrl"
            class="public-detail-hero__cover-image"
            fit="cover"
            :alt="normalizedCoverAlt"
          />
        </div>
      </slot>
    </div>

    <div class="public-detail-hero__body">
      <div class="public-detail-hero__copy">
        <h1 class="public-detail-hero__title" :title="title">{{ title }}</h1>
        <p v-if="normalizedSummary" class="public-detail-hero__summary">{{ normalizedSummary }}</p>
      </div>

      <div v-if="hasMetaRow" class="public-detail-hero__meta-row">
        <div class="public-detail-hero__meta-stream">
          <div v-if="normalizedTags.length > 0" class="public-detail-hero__tag-list">
            <span
              v-for="tag in normalizedTags"
              :key="`${tag.tone}-${tag.label}`"
              class="public-detail-hero__pill"
              :class="`public-detail-hero__pill--${tag.tone}`"
            >
              {{ tag.label }}
            </span>
          </div>

          <div v-if="normalizedMeta.length > 0" class="public-detail-hero__meta-list">
            <template v-for="(item, index) in normalizedMeta" :key="item">
              <span class="public-detail-hero__meta-item">{{ item }}</span>
              <span
                v-if="index < normalizedMeta.length - 1"
                class="public-detail-hero__meta-divider"
                aria-hidden="true"
              />
            </template>
          </div>

          <div v-if="normalizedStats.length > 0" class="public-detail-hero__metric-list">
            <span
              v-for="stat in normalizedStats"
              :key="stat.label"
              class="public-detail-hero__metric"
              :aria-label="`${stat.label} ${stat.value}`"
            >
              <portal-svg-icon
                :name="stat.iconName"
                class="public-detail-hero__metric-icon"
                aria-hidden="true"
                size="1.8rem"
              />
              <strong class="public-detail-hero__metric-value">{{ stat.value }}</strong>
            </span>
          </div>
        </div>

        <div v-if="normalizedMetaTag" class="public-detail-hero__meta-tag">
          <span
            class="public-detail-hero__pill"
            :class="`public-detail-hero__pill--${normalizedMetaTag.tone}`"
          >
            {{ normalizedMetaTag.label }}
          </span>
        </div>
      </div>

      <public-detail-action-panel
        v-if="normalizedActions.length > 0"
        :actions="normalizedActions"
        :accent="accent"
        :is-authenticated="isAuthenticated"
        @action="emit('action', $event)"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

import PublicDetailActionPanel from './PublicDetailActionPanel.vue'

import type { PortalIconName } from '@/components/icons/portalIconRegistry'
import { type PublicDetailAccent, type PublicDetailActionItem } from '@/constants/public-detail'

type PublicDetailHeroTagTone = 'primary' | 'secondary' | 'muted'

interface PublicDetailHeroTag {
  label: string
  tone?: PublicDetailHeroTagTone
}

interface PublicDetailHeroStat {
  iconName: PortalIconName
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{
    title: string
    summary?: string
    accent?: PublicDetailAccent
    tags?: PublicDetailHeroTag[]
    metaTag?: PublicDetailHeroTag | null
    meta?: string[]
    stats?: PublicDetailHeroStat[]
    actions?: PublicDetailActionItem[]
    isAuthenticated?: boolean
    coverUrl?: string
    coverAlt?: string
  }>(),
  {
    accent: 'article',
    summary: '',
    tags: () => [],
    metaTag: null,
    meta: () => [],
    stats: () => [],
    actions: () => [],
    isAuthenticated: false,
    coverUrl: '',
    coverAlt: ''
  }
)

const emit = defineEmits<{
  action: [action: PublicDetailActionItem]
}>()

const slots = useSlots()

const normalizedCoverUrl = computed(() => props.coverUrl.trim())
const normalizedCoverAlt = computed(() => props.coverAlt.trim() || props.title.trim())
const normalizedSummary = computed(() => props.summary.trim())

const hasCover = computed(() => Boolean(slots.cover) || Boolean(normalizedCoverUrl.value))

const normalizedTags = computed(() =>
  props.tags
    .map((tag) => ({
      label: tag.label.trim(),
      tone: tag.tone ?? 'muted'
    }))
    .filter((tag) => Boolean(tag.label))
)

const normalizedMetaTag = computed(() => {
  if (!props.metaTag?.label?.trim()) {
    return null
  }

  return {
    label: props.metaTag.label.trim(),
    tone: props.metaTag.tone ?? 'primary'
  }
})

const normalizedMeta = computed(() => props.meta.map((item) => item.trim()).filter(Boolean))

const normalizedStats = computed(() =>
  props.stats
    .map((stat) => ({
      iconName: stat.iconName,
      label: stat.label.trim(),
      value: stat.value.trim()
    }))
    .filter((stat) => Boolean(stat.label) && Boolean(stat.value))
)

const hasMetaRow = computed(
  () =>
    normalizedTags.value.length > 0 ||
    normalizedMeta.value.length > 0 ||
    normalizedStats.value.length > 0 ||
    Boolean(normalizedMetaTag.value)
)

const normalizedActions = computed(() =>
  props.actions
    .map((action) => ({
      ...action,
      label: action.label.trim()
    }))
    .filter((action) => Boolean(action.label))
)
</script>

<style scoped>
.public-detail-hero {
  --public-detail-hero-accent: var(--home-business-article-accent);
  --public-detail-hero-tag-bg: var(--home-business-article-tag-bg);
  --public-detail-hero-tag-border: var(--home-business-article-tag-border);
  --public-detail-hero-tag-ink: var(--home-business-article-tag-ink);
  display: grid;
  gap: 0;
  width: 100%;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--home-line);
}

.public-detail-hero--topic {
  --public-detail-hero-accent: var(--home-business-topic-accent);
  --public-detail-hero-tag-bg: var(--home-business-topic-tag-bg);
  --public-detail-hero-tag-border: var(--home-business-topic-tag-border);
  --public-detail-hero-tag-ink: var(--home-business-topic-tag-ink);
}

.public-detail-hero--book {
  --public-detail-hero-accent: var(--home-business-bookshelf-accent);
  --public-detail-hero-tag-bg: var(--home-business-bookshelf-tag-bg);
  --public-detail-hero-tag-border: var(--home-business-bookshelf-tag-border);
  --public-detail-hero-tag-ink: var(--home-business-bookshelf-tag-ink);
}

.public-detail-hero--gallery {
  --public-detail-hero-accent: var(--home-business-gallery-accent);
  --public-detail-hero-tag-bg: var(--home-business-gallery-tag-bg);
  --public-detail-hero-tag-border: var(--home-business-gallery-tag-border);
  --public-detail-hero-tag-ink: var(--home-business-gallery-tag-ink);
}

.public-detail-hero__cover-shell {
  width: 100%;
  margin-bottom: 16px;
}

.public-detail-hero__cover-frame {
  position: relative;
  width: 100%;
  min-height: 116px;
  aspect-ratio: 16 / 3.2;
  border: 1px solid color-mix(in srgb, var(--home-detail-card-border) 90%, transparent);
  border-radius: 24px;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, rgba(255, 255, 255, 0.14) 74%, transparent),
      rgba(255, 255, 255, 0) 42%
    ),
    var(--home-detail-card-bg);
  box-shadow: var(--home-card-shadow);
  overflow: hidden;
}

.public-detail-hero__cover-frame::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 34%);
  pointer-events: none;
}

.public-detail-hero__cover-image {
  width: 100%;
  height: 100%;
}

.public-detail-hero__body {
  display: grid;
  gap: 0;
  min-width: 0;
}

.public-detail-hero__copy {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.public-detail-hero__title {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--home-ink);
  font-size: 28px;
  line-height: 1.14;
  letter-spacing: 0;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.public-detail-hero__summary {
  display: -webkit-box;
  max-width: 720px;
  margin: 0;
  overflow: hidden;
  color: color-mix(in srgb, var(--home-muted) 82%, transparent);
  font-size: 14px;
  line-height: 1.74;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.public-detail-hero__meta-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px 16px;
  align-items: center;
  min-width: 0;
  margin-top: 14px;
}

.public-detail-hero__meta-stream {
  display: flex;
  align-items: center;
  gap: 10px 12px;
  min-width: 0;
  flex-wrap: wrap;
}

.public-detail-hero__meta-tag {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.public-detail-hero__tag-list,
.public-detail-hero__meta-list,
.public-detail-hero__metric-list {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  flex-wrap: wrap;
}

.public-detail-hero__tag-list {
  gap: 6px;
}

.public-detail-hero__meta-list {
  gap: 12px;
  color: color-mix(in srgb, var(--home-muted) 88%, transparent);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.018em;
}

.public-detail-hero__tag-list + .public-detail-hero__meta-list,
.public-detail-hero__meta-list + .public-detail-hero__metric-list,
.public-detail-hero__tag-list + .public-detail-hero__metric-list {
  padding-left: 12px;
  position: relative;
}

.public-detail-hero__tag-list + .public-detail-hero__meta-list::before,
.public-detail-hero__meta-list + .public-detail-hero__metric-list::before,
.public-detail-hero__tag-list + .public-detail-hero__metric-list::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 1px;
  height: 16px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--home-line) 90%, white 10%);
  transform: translateY(-50%);
}

.public-detail-hero__pill {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 0 11px;
  border: 1px solid var(--home-feature-tag-soft-border);
  border-radius: 999px;
  background: var(--home-feature-tag-soft-bg);
  color: var(--home-feature-tag-soft-ink);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.public-detail-hero__pill--primary {
  border-color: var(--public-detail-hero-tag-border);
  background: var(--public-detail-hero-tag-bg);
  color: var(--public-detail-hero-tag-ink);
}

.public-detail-hero__pill--secondary {
  border-color: color-mix(
    in srgb,
    var(--public-detail-hero-accent) 18%,
    var(--home-feature-tag-soft-border)
  );
  background: color-mix(
    in srgb,
    var(--public-detail-hero-accent) 10%,
    var(--home-feature-tag-soft-bg)
  );
  color: color-mix(in srgb, var(--public-detail-hero-accent) 74%, var(--home-ink) 26%);
}

.public-detail-hero__meta-item {
  min-width: 0;
  white-space: nowrap;
}

.public-detail-hero__meta-divider {
  width: 18px;
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in srgb, var(--home-line) 90%, white 10%) 18%,
    color-mix(in srgb, var(--home-line) 90%, white 10%) 82%,
    transparent 100%
  );
}

.public-detail-hero__metric-list {
  gap: 12px;
}

.public-detail-hero__metric {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 20px;
  color: color-mix(in srgb, var(--home-muted) 90%, transparent);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.public-detail-hero__metric-icon {
  --portal-icon-size: 18px;
  flex: 0 0 auto;
  color: color-mix(in srgb, var(--public-detail-hero-accent) 66%, var(--home-ink) 34%);
}

.public-detail-hero__metric-value {
  color: color-mix(in srgb, var(--home-ink) 96%, transparent);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.public-detail-hero :deep(.public-detail-action-panel) {
  margin-top: 16px;
}
</style>
