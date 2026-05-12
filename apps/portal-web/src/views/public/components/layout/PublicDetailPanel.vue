<template>
  <component
    :is="as"
    :class="['public-detail-panel', `public-detail-panel--${variant}`]"
    :style="panelStyle"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type PublicDetailPanelTag = 'article' | 'section' | 'div' | 'aside' | 'header'
type PublicDetailPanelPadding = 'none' | 'sm' | 'md' | 'lg'
type PublicDetailPanelVariant = 'default' | 'main'

const PANEL_PADDING_MAP: Record<PublicDetailPanelPadding, string> = {
  none: '0',
  sm: '14px',
  md: '16px',
  lg: '24px'
}

const props = withDefaults(
  defineProps<{
    as?: PublicDetailPanelTag
    padding?: PublicDetailPanelPadding
    variant?: PublicDetailPanelVariant
  }>(),
  {
    as: 'section',
    padding: 'sm',
    variant: 'default'
  }
)

const panelStyle = computed(() => ({
  '--public-detail-panel-padding': PANEL_PADDING_MAP[props.padding]
}))
</script>

<style scoped>
.public-detail-panel {
  position: relative;
  display: grid;
  padding: var(--public-detail-panel-padding-override, var(--public-detail-panel-padding));
  border: 1px solid var(--home-detail-panel-border);
  border-radius: var(--home-detail-panel-radius);
  background: var(--home-detail-panel-bg);
  box-shadow: var(--home-detail-panel-shadow);
  backdrop-filter: blur(calc(var(--home-panel-blur) * 0.64));
  -webkit-backdrop-filter: blur(calc(var(--home-panel-blur) * 0.64));
  isolation: isolate;
}

.public-detail-panel::before,
.public-detail-panel::after {
  content: '';
  position: absolute;
  border-radius: inherit;
  pointer-events: none;
}

.public-detail-panel::before {
  inset: 0;
  z-index: 0;
  background: var(--home-detail-panel-top-gloss);
}

.public-detail-panel::after {
  inset: 1px;
  z-index: 0;
  box-shadow: inset 0 1px 0 var(--home-detail-panel-inner-border);
}

.public-detail-panel > * {
  position: relative;
  z-index: 1;
}

.public-detail-panel--main {
  border-bottom-color: transparent;
  box-shadow: none;
}

.public-detail-panel--main::before {
  inset: 0;
  background:
    var(--home-detail-panel-top-gloss),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0) calc(100% - var(--home-detail-main-panel-fade-height)),
      color-mix(in srgb, var(--home-detail-main-panel-bottom-fade-color) 44%, transparent)
        calc(100% - 28px),
      var(--home-detail-main-panel-bottom-fade-color) 100%
    );
}

.public-detail-panel--main::after {
  box-shadow: inset 0 1px 0
    color-mix(in srgb, var(--home-detail-panel-inner-border) 92%, transparent);
}
</style>
