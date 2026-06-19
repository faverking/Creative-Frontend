<template>
  <picture
    v-if="normalizedSrc"
    class="portal-image"
    :class="[
      attrs.class,
      fill && 'portal-image--fill',
      `portal-image--fit-${fit}`,
      isBroken && hiddenOnError && 'portal-image--hidden'
    ]"
    :style="[attrs.style, { objectPosition: position }]"
  >
    <source
      v-for="source in normalizedSources"
      :key="`${source.srcset}-${source.media || ''}-${source.type || ''}`"
      :media="source.media"
      :sizes="source.sizes"
      :srcset="source.srcset"
      :type="source.type"
    />

    <img
      v-bind="imgAttrs"
      :src="normalizedSrc"
      :alt="alt"
      :loading="loading"
      :decoding="decoding"
      :fetchpriority="fetchPriority"
      class="portal-image__img"
      @load="handleLoad"
      @error="handleError"
    />
  </picture>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs, watch } from 'vue'

defineOptions({
  inheritAttrs: false
})

type PortalImageSource = {
  media?: string
  sizes?: string
  srcset: string
  type?: string
}

const props = withDefaults(
  defineProps<{
    src?: string | null
    sources?: PortalImageSource[]
    alt?: string
    fill?: boolean
    fit?: 'cover' | 'contain' | 'fill' | 'none'
    position?: string
    loading?: 'eager' | 'lazy'
    decoding?: 'async' | 'auto' | 'sync'
    fetchPriority?: 'high' | 'auto' | 'low'
    hiddenOnError?: boolean
  }>(),
  {
    src: '',
    sources: () => [],
    alt: '',
    fill: true,
    fit: 'cover',
    position: 'center',
    loading: 'lazy',
    decoding: 'async',
    fetchPriority: 'auto',
    hiddenOnError: true
  }
)

const emit = defineEmits<{
  load: [event: Event]
  error: [event: Event]
}>()

const attrs = useAttrs()
const isBroken = ref(false)
const normalizedSrc = computed(() => props.src?.trim() || '')
const imgAttrs = computed(() => {
  const rest = { ...attrs }

  delete rest.class
  delete rest.style

  return rest
})
const normalizedSources = computed<PortalImageSource[]>(() =>
  props.sources
    .map((source) => ({
      media: source.media?.trim() || undefined,
      sizes: source.sizes?.trim() || undefined,
      srcset: source.srcset.trim(),
      type: source.type?.trim() || undefined
    }))
    .filter((source) => source.srcset.length > 0)
)

watch(
  normalizedSrc,
  () => {
    isBroken.value = false
  },
  { immediate: true }
)

function handleLoad(event: Event) {
  isBroken.value = false
  emit('load', event)
}

function handleError(event: Event) {
  isBroken.value = true
  emit('error', event)
}
</script>

<style scoped>
.portal-image {
  display: block;
  max-width: 100%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

.portal-image__img {
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
  object-fit: inherit;
  object-position: inherit;
}

.portal-image--fill {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
}

.portal-image--fit-cover {
  object-fit: cover;
}

.portal-image--fit-contain {
  object-fit: contain;
}

.portal-image--fit-fill {
  object-fit: fill;
}

.portal-image--fit-none {
  object-fit: none;
}

.portal-image--hidden {
  display: none;
}
</style>
