<template>
  <section class="public-detail-author-section">
    <public-detail-section-heading
      icon-name="detail-info"
      :title="props.title"
      :tone="props.accent"
    />

    <div
      class="public-detail-author-section__content"
      :class="`public-detail-author-section__content--${props.accent}`"
    >
      <div class="public-detail-author-section__main">
        <div class="public-detail-author-section__avatar">
          <portal-image v-if="props.avatarUrl" :src="props.avatarUrl" />
          <portal-svg-icon
            v-else
            name="user-avatar"
            class="public-detail-author-section__avatar-icon"
            size="100%"
          />
        </div>

        <div class="public-detail-author-section__copy">
          <strong class="public-detail-author-section__name">{{ props.name }}</strong>
          <p class="public-detail-author-section__bio">{{ props.bio }}</p>
        </div>
      </div>

      <div v-if="normalizedTags.length > 0" class="public-detail-author-section__meta">
        <span
          v-for="(tag, index) in normalizedTags"
          :key="tag"
          class="public-detail-author-section__tag"
          :class="{ 'is-primary': index === 0 }"
        >
          {{ tag }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PublicDetailSectionHeading from '../layout/PublicDetailSectionHeading.vue'
import type { PublicDetailAccent } from '@/constants/public-detail'

type PublicDetailAuthorTag = string | { label: string }

const props = withDefaults(
  defineProps<{
    accent?: PublicDetailAccent
    avatarUrl?: string
    bio: string
    name: string
    tags: PublicDetailAuthorTag[]
    title?: string
  }>(),
  {
    accent: 'article',
    avatarUrl: '',
    title: '作者信息'
  }
)

const normalizedTags = computed(() =>
  props.tags.map((tag) => (typeof tag === 'string' ? tag : tag.label).trim()).filter(Boolean)
)
</script>

<style scoped>
.public-detail-author-section {
  display: grid;
  gap: 12px;
}

.public-detail-author-section__content {
  --public-detail-author-avatar-tone: var(--public-detail-author-avatar-tone-article);
  --public-detail-author-tag-bg: var(--portal-content-feature-tag-soft-bg);
  --public-detail-author-tag-border: var(--portal-content-feature-tag-soft-border);
  --public-detail-author-tag-ink: var(--portal-content-feature-tag-soft-ink);
  --public-detail-author-tag-primary-bg: var(--portal-content-article-tag-bg);
  --public-detail-author-tag-primary-border: var(--portal-content-article-tag-border);
  --public-detail-author-tag-primary-ink: var(--portal-content-article-tag-ink);
  display: grid;
  gap: 14px;
  width: 100%;
  padding: 2px 0 0;
}

.public-detail-author-section__content--topic {
  --public-detail-author-avatar-tone: var(--public-detail-author-avatar-tone-topic);
  --public-detail-author-tag-primary-bg: var(--portal-content-topic-tag-bg);
  --public-detail-author-tag-primary-border: var(--portal-content-topic-tag-border);
  --public-detail-author-tag-primary-ink: var(--portal-content-topic-tag-ink);
}

.public-detail-author-section__content--gallery {
  --public-detail-author-avatar-tone: var(--public-detail-author-avatar-tone-gallery);
  --public-detail-author-tag-primary-bg: var(--portal-content-gallery-tag-bg);
  --public-detail-author-tag-primary-border: var(--portal-content-gallery-tag-border);
  --public-detail-author-tag-primary-ink: var(--portal-content-gallery-tag-ink);
}

.public-detail-author-section__content--book {
  --public-detail-author-tag-primary-bg: var(--portal-content-bookshelf-tag-bg);
  --public-detail-author-tag-primary-border: var(--portal-content-bookshelf-tag-border);
  --public-detail-author-tag-primary-ink: var(--portal-content-bookshelf-tag-ink);
}

.public-detail-author-section__main {
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.public-detail-author-section__avatar {
  position: relative;
  display: grid;
  place-items: center;
  width: 78px;
  height: 78px;
  border: 4px solid var(--public-detail-author-avatar-ring);
  border-radius: 22px;
  background: var(--public-detail-author-avatar-tone);
  box-shadow: var(--public-detail-author-avatar-shadow);
  overflow: hidden;
}

.public-detail-author-section__avatar::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: var(--public-detail-author-avatar-overlay);
  pointer-events: none;
}

.public-detail-author-section__avatar-icon {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
}

.public-detail-author-section__copy {
  display: grid;
  gap: 8px;
  align-content: start;
  min-width: 0;
  padding-top: 2px;
}

.public-detail-author-section__name {
  margin: 0;
  color: var(--portal-content-ink);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0;
}

.public-detail-author-section__bio {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--public-detail-author-bio-ink);
  font-size: 13px;
  line-height: 1.72;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.public-detail-author-section__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.public-detail-author-section__tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  padding: 0 12px;
  border: 1px solid var(--public-detail-author-tag-border);
  border-radius: 999px;
  background: var(--public-detail-author-tag-bg);
  color: var(--public-detail-author-tag-ink);
  font-size: 12px;
  font-weight: 700;
  line-height: 26px;
  white-space: nowrap;
}

.public-detail-author-section__tag.is-primary {
  border-color: var(--public-detail-author-tag-primary-border);
  background: var(--public-detail-author-tag-primary-bg);
  color: var(--public-detail-author-tag-primary-ink);
}
</style>
