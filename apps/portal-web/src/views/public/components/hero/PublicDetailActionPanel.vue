<template>
  <div class="public-detail-action-panel" :class="`public-detail-action-panel--${accent}`">
    <button
      v-for="action in actions"
      :key="action.key"
      type="button"
      class="public-detail-action-panel__action"
      :class="{
        'public-detail-action-panel__action--primary': action.tone === 'primary',
        'public-detail-action-panel__action--secondary': action.tone !== 'primary',
        'is-active': action.active,
        'is-protected': action.protected && !isAuthenticated
      }"
      :aria-pressed="action.key === 'favorite' ? action.active : undefined"
      @click="$emit('action', action)"
    >
      <span class="public-detail-action-panel__action-icon">
        <portal-svg-icon :name="resolvePublicDetailActionIconName(action.key)" size="1.6rem" />
      </span>
      <span class="public-detail-action-panel__action-label">{{ action.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import {
  resolvePublicDetailActionIconName,
  type PublicDetailAccent,
  type PublicDetailActionItem
} from '@/constants/public-detail'

withDefaults(
  defineProps<{
    actions: PublicDetailActionItem[]
    accent?: PublicDetailAccent
    isAuthenticated?: boolean
  }>(),
  {
    accent: 'article',
    isAuthenticated: false
  }
)

defineEmits<{
  action: [action: PublicDetailActionItem]
}>()
</script>

<style scoped>
.public-detail-action-panel {
  --public-detail-action-primary-bg: var(--portal-content-article-tag-bg);
  --public-detail-action-primary-border: var(--portal-content-article-tag-border);
  --public-detail-action-primary-ink: var(--portal-content-article-tag-ink);
  --public-detail-action-secondary-bg: color-mix(
    in srgb,
    var(--public-detail-card-bg) 82%,
    white 18%
  );
  --public-detail-action-secondary-border: color-mix(
    in srgb,
    var(--public-detail-button-border) 82%,
    white 18%
  );
  --public-detail-action-secondary-ink: color-mix(
    in srgb,
    var(--portal-content-ink) 78%,
    white 22%
  );
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  flex-wrap: nowrap;
}

.public-detail-action-panel--topic {
  --public-detail-action-primary-bg: var(--portal-content-topic-tag-bg);
  --public-detail-action-primary-border: var(--portal-content-topic-tag-border);
  --public-detail-action-primary-ink: var(--portal-content-topic-tag-ink);
}

.public-detail-action-panel--book {
  --public-detail-action-primary-bg: var(--portal-content-bookshelf-tag-bg);
  --public-detail-action-primary-border: var(--portal-content-bookshelf-tag-border);
  --public-detail-action-primary-ink: var(--portal-content-bookshelf-tag-ink);
}

.public-detail-action-panel--gallery {
  --public-detail-action-primary-bg: var(--portal-content-gallery-tag-bg);
  --public-detail-action-primary-border: var(--portal-content-gallery-tag-border);
  --public-detail-action-primary-ink: var(--portal-content-gallery-tag-ink);
}

.public-detail-action-panel__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 13px;
  border: 1px solid var(--public-detail-button-border);
  border-radius: 11px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.04)),
    var(--public-detail-action-secondary-bg);
  color: var(--portal-content-ink);
  box-shadow: var(--public-detail-button-shadow);
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease;
  white-space: nowrap;
}

.public-detail-action-panel__action:hover {
  border-color: color-mix(
    in srgb,
    var(--public-detail-action-primary-border) 54%,
    var(--public-detail-button-border)
  );
  box-shadow: var(--public-detail-button-shadow);
}

.public-detail-action-panel__action.is-active {
  border-color: var(--public-detail-action-primary-border);
  color: var(--public-detail-action-primary-ink);
}

.public-detail-action-panel__action.is-protected {
  border-style: dashed;
}

.public-detail-action-panel__action--primary {
  border-color: var(--public-detail-action-primary-border);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, white 16%, transparent),
      color-mix(in srgb, white 0%, transparent)
    ),
    var(--public-detail-card-primary-bg);
  color: var(--public-detail-action-primary-ink);
  box-shadow: var(--public-detail-button-shadow);
}

.public-detail-action-panel__action--secondary {
  border-color: var(--public-detail-action-secondary-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.03)),
    var(--public-detail-action-secondary-bg);
  color: var(--public-detail-action-secondary-ink);
}

.public-detail-action-panel__action-icon {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 7px;
  background: color-mix(in srgb, var(--public-detail-action-primary-bg) 82%, white 18%);
  color: color-mix(in srgb, var(--public-detail-action-primary-ink) 88%, white 12%);
  flex: 0 0 auto;
}

.public-detail-action-panel__action--primary .public-detail-action-panel__action-icon {
  background: color-mix(in srgb, white 22%, transparent);
  color: inherit;
}

.public-detail-action-panel__action--secondary .public-detail-action-panel__action-icon {
  background: color-mix(in srgb, var(--public-detail-action-primary-bg) 54%, white 46%);
}

.public-detail-action-panel__action-label {
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.02em;
}
</style>
