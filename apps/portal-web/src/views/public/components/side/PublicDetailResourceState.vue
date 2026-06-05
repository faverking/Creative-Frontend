<template>
  <div
    class="public-detail-resource-state"
    :class="[
      `public-detail-resource-state--${accent}`,
      `public-detail-resource-state--${resolvedState}`
    ]"
  >
    <div class="public-detail-resource-state__copy">
      <div class="public-detail-resource-state__eyebrow">
        <span class="public-detail-resource-state__label-pill">{{ label }}</span>
        <span v-if="metaTagLabel" class="public-detail-resource-state__meta-tag">
          {{ metaTagLabel }}
        </span>
      </div>

      <strong class="public-detail-resource-state__title">{{ title }}</strong>
      <p class="public-detail-resource-state__detail">{{ detail }}</p>
    </div>

    <div v-if="showAction" class="public-detail-resource-state__actions">
      <button type="button" class="public-detail-resource-state__action" @click="emit('action')">
        <span>{{ resolvedActionLabel }}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            :d="actionIconPath"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { PublicDetailAccent } from '@/constants/public-detail'

type PublicDetailResourceStateKind = 'internal' | 'external' | 'locked' | 'empty'

const props = withDefaults(
  defineProps<{
    accent?: PublicDetailAccent
    actionLabel?: string
    detail: string
    label?: string
    metaTag?: string
    state?: PublicDetailResourceStateKind
    title: string
  }>(),
  {
    accent: 'topic',
    actionLabel: '',
    label: '资源包',
    metaTag: '',
    state: 'empty'
  }
)

const emit = defineEmits<{
  action: []
}>()

const resolvedState = computed<PublicDetailResourceStateKind>(() => props.state ?? 'empty')

const showAction = computed(
  () => resolvedState.value !== 'empty' && Boolean(props.actionLabel.trim())
)

const resolvedActionLabel = computed(() => props.actionLabel.trim())

const metaTagLabel = computed(() => props.metaTag.trim())

const actionIconPath = computed(() => {
  if (resolvedState.value === 'internal') {
    return 'M12 4V13M8.5 9.5L12 13L15.5 9.5M6 18H18'
  }

  if (resolvedState.value === 'external') {
    return 'M14 5H19V10M19 5L11 13M10 7H8A2 2 0 0 0 6 9V16A2 2 0 0 0 8 18H15A2 2 0 0 0 17 16V14'
  }

  return 'M8 5L16 12L8 19'
})
</script>

<style scoped>
.public-detail-resource-state {
  --public-detail-resource-accent: color-mix(
    in srgb,
    var(--home-business-topic-accent) 72%,
    white 28%
  );
  --public-detail-resource-label-border-local: color-mix(
    in srgb,
    var(--public-detail-resource-accent) 24%,
    var(--home-detail-glass-border) 76%
  );
  --public-detail-resource-label-bg-local:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.01)),
    color-mix(in srgb, var(--public-detail-resource-accent) 14%, var(--home-surface) 86%);
  --public-detail-resource-label-ink-local: color-mix(
    in srgb,
    var(--public-detail-resource-accent) 72%,
    var(--home-ink) 28%
  );
  --public-detail-resource-label-shadow-local: inset 0 1px 0 rgba(255, 255, 255, 0.12);
  --public-detail-resource-control-border-local: color-mix(
    in srgb,
    var(--home-detail-button-border) 84%,
    transparent
  );
  --public-detail-resource-control-bg-local: var(--home-detail-button-bg);
  --public-detail-resource-meta-ink-local: color-mix(in srgb, var(--home-muted) 84%, transparent);
  --public-detail-resource-action-border-local: color-mix(
    in srgb,
    var(--public-detail-resource-accent) 22%,
    var(--home-detail-button-border) 78%
  );
  --public-detail-resource-action-bg-local:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.01)),
    color-mix(in srgb, var(--public-detail-resource-accent) 10%, var(--home-surface) 90%);
  --public-detail-resource-action-ink-local: color-mix(
    in srgb,
    var(--public-detail-resource-accent) 72%,
    var(--home-ink) 28%
  );
  --public-detail-resource-action-shadow-local:
    0 8px 16px rgba(18, 41, 74, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.14);
  --public-detail-resource-action-hover-border-local: color-mix(
    in srgb,
    var(--public-detail-resource-accent) 30%,
    var(--home-detail-button-border) 70%
  );
  --public-detail-resource-action-hover-shadow-local:
    0 10px 18px rgba(18, 41, 74, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.16);
  --public-detail-resource-locked-border-local: color-mix(
    in srgb,
    var(--home-feature-tag-amber-ink) 24%,
    var(--home-detail-button-border) 76%
  );
  --public-detail-resource-locked-bg-local:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.01)),
    color-mix(in srgb, var(--home-feature-tag-amber-bg) 24%, var(--home-surface) 76%);
  --public-detail-resource-locked-ink-local: color-mix(
    in srgb,
    var(--home-feature-tag-amber-ink) 72%,
    var(--home-ink) 28%
  );
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 16px;
  width: 100%;
  padding: 18px 20px;
  border: 1px solid color-mix(in srgb, var(--home-detail-glass-border) 68%, transparent);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.01)),
    var(--home-detail-glass-bg);
  box-shadow:
    0 10px 18px rgba(18, 41, 74, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.public-detail-resource-state::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--home-detail-glass-gloss);
  pointer-events: none;
}

.public-detail-resource-state--article {
  --public-detail-resource-accent: color-mix(
    in srgb,
    var(--home-business-article-accent) 72%,
    white 28%
  );
}

.public-detail-resource-state--gallery {
  --public-detail-resource-accent: color-mix(
    in srgb,
    var(--home-business-gallery-accent) 72%,
    white 28%
  );
}

.public-detail-resource-state--book {
  --public-detail-resource-accent: color-mix(
    in srgb,
    var(--home-business-bookshelf-accent) 72%,
    white 28%
  );
}

.public-detail-resource-state__copy {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10px;
  min-width: 0;
  padding-left: 16px;
}

.public-detail-resource-state__copy::before {
  content: '';
  position: absolute;
  left: 0;
  top: 7px;
  bottom: 7px;
  width: 3px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--public-detail-resource-accent), rgba(255, 255, 255, 0));
}

.public-detail-resource-state__eyebrow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.public-detail-resource-state__label-pill,
.public-detail-resource-state__meta-tag {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.public-detail-resource-state__label-pill {
  border: 1px solid var(--public-detail-resource-label-border-local);
  background: var(--public-detail-resource-label-bg-local);
  color: var(--public-detail-resource-label-ink-local);
  box-shadow: var(--public-detail-resource-label-shadow-local);
}

.public-detail-resource-state__meta-tag {
  border: 1px solid var(--public-detail-resource-control-border-local);
  background: var(--public-detail-resource-control-bg-local);
  color: var(--public-detail-resource-meta-ink-local);
}

.public-detail-resource-state__title {
  color: color-mix(in srgb, var(--home-ink) 92%, transparent);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: 0;
}

.public-detail-resource-state__detail {
  margin: 0;
  max-width: none;
  color: color-mix(in srgb, var(--home-muted) 84%, transparent);
  font-size: 12px;
  line-height: 1.7;
}

.public-detail-resource-state__actions {
  position: relative;
  z-index: 1;
  display: grid;
  padding-left: 16px;
}

.public-detail-resource-state__action {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid var(--public-detail-resource-action-border-local);
  border-radius: 999px;
  background: var(--public-detail-resource-action-bg-local);
  color: var(--public-detail-resource-action-ink-local);
  box-shadow: var(--public-detail-resource-action-shadow-local);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease,
    background 180ms ease;
}

.public-detail-resource-state__action:hover {
  transform: translateY(-1px);
  border-color: var(--public-detail-resource-action-hover-border-local);
  box-shadow: var(--public-detail-resource-action-hover-shadow-local);
}

.public-detail-resource-state__action:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--portal-focus-ring);
}

.public-detail-resource-state__action svg {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
}

.public-detail-resource-state--locked .public-detail-resource-state__meta-tag,
.public-detail-resource-state--locked .public-detail-resource-state__action {
  border-color: var(--public-detail-resource-locked-border-local);
  background: var(--public-detail-resource-locked-bg-local);
  color: var(--public-detail-resource-locked-ink-local);
}

.public-detail-resource-state--empty {
  gap: 0;
}
</style>
