<template>
  <section
    class="public-detail-related-section"
    :class="`public-detail-related-section--${accent}`"
    :style="sectionStyle"
  >
    <public-detail-section-heading icon-name="detail-related" :title="title" :tone="accent" />
    <portal-request-boundary
      class="public-detail-related-section__boundary"
      :mode="boundaryMode"
      :error-code="boundaryErrorCode"
      :primary-label="boundaryPrimaryLabel"
      @primary="$emit('primary')"
    >
      <div class="public-detail-related-section__grid">
        <slot />
      </div>
    </portal-request-boundary>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PublicDetailSectionHeading from '../layout/PublicDetailSectionHeading.vue'
import PortalRequestBoundary from '@/components/PortalRequestBoundary.vue'
import type {
  PortalRequestBoundaryErrorCode,
  PortalRequestBoundaryMode
} from '@/components/PortalRequestBoundary.vue'
import type { PublicDetailAccent } from '@/constants/public-detail'

const props = withDefaults(
  defineProps<{
    accent?: PublicDetailAccent
    boundaryErrorCode?: PortalRequestBoundaryErrorCode
    boundaryMode?: PortalRequestBoundaryMode
    boundaryPrimaryLabel?: string
    contentGap?: number
    title?: string
  }>(),
  {
    accent: 'article',
    boundaryErrorCode: 500,
    boundaryMode: 'ready',
    boundaryPrimaryLabel: '重试',
    contentGap: 14,
    title: '相关推荐'
  }
)

defineEmits<{
  primary: []
}>()

const sectionStyle = computed(() => ({
  '--public-detail-related-section-gap': `${props.contentGap}px`
}))
</script>

<style scoped>
.public-detail-related-section {
  display: grid;
  gap: var(--public-detail-related-section-gap);
}

.public-detail-related-section__boundary {
  --portal-request-boundary-accent: var(
    --public-detail-related-boundary-accent,
    var(--home-business-article-accent)
  );
}

.public-detail-related-section__boundary :deep(.portal-request-boundary__state) {
  --portal-request-state-art-width: 110px;
  gap: 12px 18px;
}

.public-detail-related-section__boundary :deep(.portal-request-boundary__art) {
  filter: drop-shadow(0 10px 18px rgba(18, 41, 74, 0.1));
}

.public-detail-related-section__boundary :deep(.portal-request-boundary__message) {
  max-width: none;
  font-size: 13px;
  line-height: 1.58;
}

.public-detail-related-section__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
}

.public-detail-related-section--article {
  --public-detail-related-boundary-accent: var(--home-business-article-accent);
}

.public-detail-related-section--book {
  --public-detail-related-boundary-accent: var(--home-business-bookshelf-accent);
}

.public-detail-related-section--gallery {
  --public-detail-related-boundary-accent: var(--home-business-gallery-accent);
}

.public-detail-related-section--topic {
  --public-detail-related-boundary-accent: var(--home-business-topic-accent);
}
</style>
