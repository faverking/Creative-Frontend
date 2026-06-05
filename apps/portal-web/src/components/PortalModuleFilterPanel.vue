<template>
  <section class="portal-module-filter-panel" :style="panelToneStyle">
    <portal-svg-icon
      v-if="showOrnament"
      class="portal-module-filter-panel__star"
      :name="ornamentIconName"
    />

    <div class="portal-module-filter-panel__categories" :aria-label="categoriesLabel">
      <button
        type="button"
        class="portal-module-filter-panel__category portal-module-filter-panel__category--all"
        :class="{ 'is-active': activeCategory == null }"
        :aria-pressed="activeCategory == null"
        :disabled="loading"
        :title="allCategoryDescription"
        @click="emit('category-change', undefined)"
      >
        <span class="portal-module-filter-panel__category-swatch" aria-hidden="true" />
        <strong>{{ allCategoryLabel }}</strong>
      </button>

      <button
        v-for="category in categories"
        :key="`${category.value}`"
        type="button"
        class="portal-module-filter-panel__category"
        :class="[
          resolveToneClass(category.tone),
          { 'is-active': activeCategory === category.value }
        ]"
        :aria-pressed="activeCategory === category.value"
        :disabled="loading"
        :title="category.description"
        @click="emit('category-change', category.value)"
      >
        <span class="portal-module-filter-panel__category-swatch" aria-hidden="true" />
        <strong>{{ category.label }}</strong>
      </button>
    </div>

    <div class="portal-module-filter-panel__toolbar">
      <form
        class="portal-module-filter-panel__search-row"
        role="search"
        @submit.prevent="emit('submit')"
      >
        <label class="portal-module-filter-panel__field">
          <span class="portal-module-filter-panel__sr-only">{{ keywordLabel }}</span>
          <input
            :value="modelValue"
            type="search"
            :aria-label="keywordLabel"
            :placeholder="keywordPlaceholder"
            :disabled="loading"
            @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          />
        </label>

        <div class="portal-module-filter-panel__actions">
          <button
            type="submit"
            class="portal-module-filter-panel__button portal-module-filter-panel__button--primary"
            :disabled="loading"
          >
            {{ submitLabel }}
          </button>
          <button
            type="button"
            class="portal-module-filter-panel__button"
            :class="{ 'is-muted': !hasActiveFilters }"
            :disabled="loading"
            @click="emit('clear')"
          >
            {{ clearLabel }}
          </button>
        </div>
      </form>

      <div class="portal-module-filter-panel__sorts" :aria-label="sortLabel">
        <button
          v-for="option in sortOptions"
          :key="option.value"
          type="button"
          class="portal-module-filter-panel__sort"
          :class="{ 'is-active': sort === option.value }"
          :aria-pressed="sort === option.value"
          :disabled="loading"
          :title="option.description"
          @click="emit('sort-change', option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type {
  PortalModuleCategoryOption,
  PortalModuleFilterTone,
  PortalModuleSort,
  PortalModuleSortOption
} from '@/constants/public-modules'

const emit = defineEmits<{
  'category-change': [value: number | string | undefined]
  clear: []
  submit: []
  'sort-change': [value: PortalModuleSort]
  'update:modelValue': [value: string]
}>()

const props = withDefaults(
  defineProps<{
    activeCategory?: number | string
    allCategoryDescription?: string
    allCategoryLabel?: string
    categories: Array<PortalModuleCategoryOption>
    categoriesLabel?: string
    clearLabel?: string
    hasActiveFilters: boolean
    keywordLabel?: string
    keywordPlaceholder?: string
    loading?: boolean
    modelValue: string
    ornamentIconName?: string
    showOrnament?: boolean
    sort: PortalModuleSort
    sortLabel?: string
    sortOptions: PortalModuleSortOption[]
    submitLabel?: string
  }>(),
  {
    activeCategory: undefined,
    allCategoryDescription: '',
    allCategoryLabel: '全部主题',
    categoriesLabel: '模块主题分类',
    clearLabel: '重置',
    keywordLabel: '按标题或摘要搜索',
    keywordPlaceholder: '搜索标题、摘要或内容描述',
    loading: false,
    ornamentIconName: 'module-filter-star',
    showOrnament: true,
    sortLabel: '内容排序',
    submitLabel: '查询'
  }
)

const TONE_ACCENTS: Record<PortalModuleFilterTone, string> = {
  neutral: 'var(--portal-module-filter-tone-neutral-accent)',
  amber: 'var(--portal-module-filter-tone-amber-accent)',
  pink: 'var(--portal-module-filter-tone-pink-accent)',
  blue: 'var(--portal-module-filter-tone-blue-accent)',
  mint: 'var(--portal-module-filter-tone-mint-accent)',
  violet: 'var(--portal-module-filter-tone-violet-accent)'
}

const activeTone = computed<PortalModuleFilterTone>(() => {
  const matchedCategory = props.categories.find(
    (category) => category.value === props.activeCategory
  )
  return matchedCategory?.tone ?? 'neutral'
})

const panelToneStyle = computed<Record<string, string>>(() => ({
  '--portal-module-filter-current-accent': TONE_ACCENTS[activeTone.value]
}))

function resolveToneClass(tone: PortalModuleFilterTone | undefined): string {
  switch (tone) {
    case 'amber':
      return 'portal-module-filter-panel__category--amber'
    case 'pink':
      return 'portal-module-filter-panel__category--pink'
    case 'blue':
      return 'portal-module-filter-panel__category--blue'
    case 'mint':
      return 'portal-module-filter-panel__category--mint'
    case 'violet':
      return 'portal-module-filter-panel__category--violet'
    default:
      return 'portal-module-filter-panel__category--neutral'
  }
}
</script>

<style scoped>
.portal-module-filter-panel {
  --portal-module-filter-current-accent: var(--portal-module-filter-tone-neutral-accent);
  --portal-module-filter-gap-local: 12px;
  --portal-module-filter-padding-local: 10px 12px;
  --portal-module-filter-radius-local: 20px;
  --portal-module-filter-category-width-local: 136px;
  --portal-module-filter-category-min-height-local: 44px;
  --portal-module-filter-category-gap-local: 4px;
  --portal-module-filter-category-padding-local: 7px 12px;
  --portal-module-filter-category-radius-local: 18px;
  --portal-module-filter-toolbar-gap-local: 12px;
  --portal-module-filter-search-row-padding-local: 6px;
  --portal-module-filter-search-row-radius-local: 14px;
  --portal-module-filter-sort-gap-local: 12px;
  --portal-module-filter-sort-min-height-local: 28px;
  --portal-module-filter-sort-padding-local: 0 6px 6px 2px;
  --portal-module-filter-sort-indicator-width-local: 14px;
  --portal-module-filter-star-size-local: 44px;
  --portal-module-filter-star-top-local: -28px;
  --portal-module-filter-star-right-local: 50px;
  position: sticky;
  top: 82px;
  z-index: 4;
  isolation: isolate;
  display: grid;
  gap: var(--portal-module-filter-gap-local);
  padding: var(--portal-module-filter-padding-local);
  background:
    linear-gradient(
      118deg,
      color-mix(in srgb, var(--portal-module-filter-current-accent) 8%, transparent) 0%,
      transparent 68%
    ),
    var(--portal-module-filter-bg);
  border: 1px solid
    color-mix(
      in srgb,
      var(--portal-module-filter-current-accent) 12%,
      var(--portal-module-filter-border) 88%
    );
  border-radius: var(--portal-module-filter-radius-local);
  box-shadow:
    0 3px 6px
      color-mix(in srgb, var(--portal-module-filter-current-accent) 1.6%, rgba(18, 41, 74, 0.024)),
    var(--portal-module-filter-shadow);
  backdrop-filter: blur(calc(var(--home-panel-blur) * 0.64)) saturate(1);
  -webkit-backdrop-filter: blur(calc(var(--home-panel-blur) * 0.64)) saturate(1);
  overflow: visible;
}

.portal-module-filter-panel__categories,
.portal-module-filter-panel__toolbar {
  position: relative;
  z-index: 1;
}

.portal-module-filter-panel__star {
  --portal-icon-outline-color: var(--portal-module-filter-star-outline);
  --portal-icon-inner-line-color: var(--portal-module-filter-star-inner-line);
  --portal-icon-secondary-color: var(--portal-module-filter-star-fill-mid);
  --portal-icon-highlight-color: var(--portal-module-filter-star-fill-core);
  --portal-icon-glint-color: var(--portal-module-filter-star-fill-highlight);
  --portal-icon-size: var(--portal-module-filter-star-size-local);
  position: absolute;
  top: var(--portal-module-filter-star-top-local);
  right: var(--portal-module-filter-star-right-local);
  z-index: 2;
  color: var(--portal-module-filter-star-ink);
  pointer-events: none;
  user-select: none;
  opacity: 0.5;
  filter: drop-shadow(var(--portal-module-filter-star-shadow));
  transform: rotate(12deg);
}

.portal-module-filter-panel__categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.portal-module-filter-panel__category {
  --topic-bg: var(--portal-module-filter-category-neutral-bg);
  --topic-border: var(--portal-module-filter-category-neutral-border);
  --topic-accent: var(--portal-module-filter-category-neutral-accent);
  appearance: none;
  -webkit-appearance: none;
  position: relative;
  display: grid;
  align-content: center;
  justify-items: start;
  gap: var(--portal-module-filter-category-gap-local);
  width: var(--portal-module-filter-category-width-local);
  min-height: var(--portal-module-filter-category-min-height-local);
  padding: var(--portal-module-filter-category-padding-local);
  border: 1px solid var(--topic-border);
  border-radius: var(--portal-module-filter-category-radius-local);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 100%),
    var(--topic-bg);
  color: var(--home-ink);
  overflow: visible;
  box-shadow: var(--portal-module-filter-category-shadow);
  cursor: pointer;
  transition:
    color 180ms ease,
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.portal-module-filter-panel__category strong {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: 0.02em;
  text-align: left;
}

.portal-module-filter-panel__category-swatch {
  width: 22px;
  height: 3px;
  border-radius: 999px;
  background: var(--topic-accent);
  opacity: 0.9;
}

.portal-module-filter-panel__category--all,
.portal-module-filter-panel__category--neutral {
  --topic-bg: var(--portal-module-filter-category-neutral-bg);
  --topic-border: var(--portal-module-filter-category-neutral-border);
  --topic-accent: var(--portal-module-filter-category-neutral-accent);
}

.portal-module-filter-panel__category--amber {
  --topic-bg: var(--portal-module-filter-category-amber-bg);
  --topic-border: var(--portal-module-filter-category-amber-border);
  --topic-accent: var(--portal-module-filter-category-amber-accent);
}

.portal-module-filter-panel__category--pink {
  --topic-bg: var(--portal-module-filter-category-pink-bg);
  --topic-border: var(--portal-module-filter-category-pink-border);
  --topic-accent: var(--portal-module-filter-category-pink-accent);
}

.portal-module-filter-panel__category--blue {
  --topic-bg: var(--portal-module-filter-category-blue-bg);
  --topic-border: var(--portal-module-filter-category-blue-border);
  --topic-accent: var(--portal-module-filter-category-blue-accent);
}

.portal-module-filter-panel__category--mint {
  --topic-bg: var(--portal-module-filter-category-mint-bg);
  --topic-border: var(--portal-module-filter-category-mint-border);
  --topic-accent: var(--portal-module-filter-category-mint-accent);
}

.portal-module-filter-panel__category--violet {
  --topic-bg: var(--portal-module-filter-category-violet-bg);
  --topic-border: var(--portal-module-filter-category-violet-border);
  --topic-accent: var(--portal-module-filter-category-violet-accent);
}

.portal-module-filter-panel__category:hover {
  color: color-mix(in srgb, var(--home-ink) 94%, transparent);
  border-color: color-mix(in srgb, var(--topic-accent) 56%, var(--topic-border) 44%);
  box-shadow: var(--portal-module-filter-category-hover-shadow);
  transform: translateY(-1px);
}

.portal-module-filter-panel__category.is-active {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.02) 100%),
    var(--topic-bg);
  border-color: color-mix(in srgb, var(--topic-accent) 70%, var(--topic-border) 30%);
  box-shadow: var(--portal-module-filter-category-active-shadow);
}

.portal-module-filter-panel__toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--portal-module-filter-toolbar-gap-local);
  align-items: center;
}

.portal-module-filter-panel__search-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: var(--portal-module-filter-search-row-padding-local);
  border: 1px solid var(--portal-module-filter-search-border);
  border-radius: var(--portal-module-filter-search-row-radius-local);
  background: var(--portal-module-filter-search-bg);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.portal-module-filter-panel__field {
  min-width: 0;
}

.portal-module-filter-panel__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.portal-module-filter-panel__field input {
  width: 100%;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--portal-module-filter-input-border);
  border-radius: 12px;
  background: var(--portal-module-filter-input-bg);
  color: var(--home-ink);
  font: inherit;
  font-size: 12px;
  box-sizing: border-box;
  outline: none;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
}

.portal-module-filter-panel__field input:focus {
  border-color: var(--home-feature-ribbon-border);
  box-shadow: 0 0 0 4px rgba(105, 212, 255, 0.12);
}

.portal-module-filter-panel__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.portal-module-filter-panel__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--portal-module-filter-button-border);
  border-radius: 999px;
  background: var(--portal-module-filter-button-bg);
  color: var(--portal-module-filter-button-ink);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.portal-module-filter-panel__button.is-muted {
  border-color: color-mix(in srgb, var(--portal-module-filter-button-border) 70%, transparent);
  color: color-mix(in srgb, var(--portal-module-filter-button-ink) 70%, transparent);
}

.portal-module-filter-panel__button:hover {
  border-color: var(--home-feature-ribbon-border);
  box-shadow: 0 2px 5px rgba(18, 41, 74, 0.02);
}

.portal-module-filter-panel__button--primary {
  border-color: var(--portal-module-filter-button-primary-border);
  background: var(--portal-module-filter-button-primary-bg);
}

.portal-module-filter-panel__sorts {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--portal-module-filter-sort-gap-local);
  min-height: var(--portal-module-filter-sort-min-height-local);
  padding: var(--portal-module-filter-sort-padding-local);
}

.portal-module-filter-panel__sorts::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--home-feature-ribbon-border) 0%, transparent) 0%,
    color-mix(in srgb, var(--home-feature-ribbon-border) 48%, transparent) 14%,
    color-mix(in srgb, var(--home-feature-ribbon-border) 34%, transparent) 86%,
    color-mix(in srgb, var(--home-feature-ribbon-border) 0%, transparent) 100%
  );
  pointer-events: none;
}

.portal-module-filter-panel__sort {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 1px 5px;
  border: none;
  background: transparent;
  color: var(--portal-module-filter-sort-ink);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  white-space: nowrap;
  cursor: pointer;
  transition: color 180ms ease;
}

.portal-module-filter-panel__sort + .portal-module-filter-panel__sort::before {
  content: '/';
  position: absolute;
  left: -11px;
  top: 50%;
  color: color-mix(in srgb, var(--home-muted) 38%, transparent);
  font-size: 12px;
  font-weight: 600;
  transform: translateY(-62%);
  pointer-events: none;
}

.portal-module-filter-panel__sort::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -1px;
  width: var(--portal-module-filter-sort-indicator-width-local);
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--portal-module-filter-current-accent) 70%, transparent) 0%,
    color-mix(in srgb, var(--home-feature-ribbon-ink) 92%, transparent) 100%
  );
  box-shadow: 0 2px 6px
    color-mix(in srgb, var(--portal-module-filter-current-accent) 10%, transparent);
  opacity: 0;
  transform: translateX(-50%) scaleX(0.72);
  transition: opacity 180ms ease;
}

.portal-module-filter-panel__sort:hover {
  color: color-mix(in srgb, var(--home-ink) 88%, transparent);
}

.portal-module-filter-panel__sort.is-active {
  color: var(--home-ink);
}

.portal-module-filter-panel__sort.is-active::after {
  opacity: 1;
  transform: translateX(-50%) scaleX(1);
}

.portal-module-filter-panel__category:focus-visible,
.portal-module-filter-panel__sort:focus-visible,
.portal-module-filter-panel__button:focus-visible,
.portal-module-filter-panel__field input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(105, 212, 255, 0.16);
}

.portal-module-filter-panel__category:disabled,
.portal-module-filter-panel__sort:disabled,
.portal-module-filter-panel__button:disabled,
.portal-module-filter-panel__field input:disabled {
  cursor: wait;
  opacity: 0.72;
}
</style>
