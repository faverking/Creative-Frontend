<template>
  <svg
    v-if="iconDefinition"
    :aria-hidden="decorative || undefined"
    :role="decorative ? undefined : 'img'"
    class="portal-svg-icon"
    :style="iconStyle"
    :viewBox="iconDefinition.viewBox"
  >
    <title v-if="title">{{ title }}</title>
    <g v-html="iconDefinition.body" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { portalIconAliases, portalIconDefinitions, type PortalIconName } from './portalIconRegistry'

const props = withDefaults(
  defineProps<{
    name: PortalIconName | string
    size?: number | string
    title?: string
    decorative?: boolean
  }>(),
  {
    size: undefined,
    title: undefined,
    decorative: true
  }
)

const resolvedName = computed(
  () => portalIconAliases[props.name as keyof typeof portalIconAliases] ?? props.name
)

const iconDefinition = computed(
  () => portalIconDefinitions[resolvedName.value as PortalIconName] ?? null
)

const iconStyle = computed(() => {
  if (props.size === undefined) {
    return undefined
  }

  return {
    '--portal-icon-size': typeof props.size === 'number' ? `${props.size}px` : props.size
  }
})
</script>

<style scoped>
.portal-svg-icon {
  display: block;
  width: var(--portal-icon-size, 1em);
  height: var(--portal-icon-size, 1em);
  flex: 0 0 auto;
}
</style>
