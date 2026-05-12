<template>
  <div class="public-detail-comment-composer" :class="`public-detail-comment-composer--${tone}`">
    <label class="public-detail-comment-composer__field">
      <textarea
        class="public-detail-comment-composer__textarea"
        :disabled="textareaDisabled"
        :placeholder="resolvedPlaceholder"
        :value="modelValue"
        @input="handleInput"
      />
    </label>

    <div class="public-detail-comment-composer__footer">
      <p class="public-detail-comment-composer__hint">{{ resolvedHint }}</p>

      <button
        type="button"
        class="public-detail-comment-composer__submit"
        :class="{ 'is-disabled': primaryDisabled }"
        :disabled="primaryDisabled"
        @click="handlePrimaryAction"
      >
        {{ resolvedPrimaryLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { PublicDetailSectionTone } from '@/constants/public-detail'

const props = withDefaults(
  defineProps<{
    interactive?: boolean
    isAuthenticated: boolean
    modelValue: string
    placeholder?: string
    submitting?: boolean
    tone?: PublicDetailSectionTone
  }>(),
  {
    interactive: true,
    placeholder: '写下你的评论',
    submitting: false,
    tone: 'article'
  }
)

const emit = defineEmits<{
  submit: []
  'update:modelValue': [value: string]
}>()

const normalizedValue = computed(() => props.modelValue.trim())
const textareaDisabled = computed(() => !props.interactive || !props.isAuthenticated)
const resolvedPlaceholder = computed(() => {
  if (!props.interactive) {
    return '评论暂未开放'
  }

  if (!props.isAuthenticated) {
    return '登录后可评论'
  }

  return props.placeholder
})
const resolvedHint = computed(() => {
  if (!props.interactive) {
    return '评论暂未开放。'
  }

  if (!props.isAuthenticated) {
    return '登录后可评论。'
  }

  return '请理性评论，友善交流。'
})
const resolvedPrimaryLabel = computed(() => {
  if (!props.interactive) {
    return '暂不可评论'
  }

  if (!props.isAuthenticated) {
    return '登录后可评论'
  }

  return props.submitting ? '发布中...' : '发布评论'
})
const primaryDisabled = computed(() => {
  if (!props.interactive || !props.isAuthenticated) {
    return true
  }

  return props.submitting || normalizedValue.value.length === 0
})

function handleInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

function handlePrimaryAction(): void {
  if (primaryDisabled.value) {
    return
  }

  emit('submit')
}
</script>

<style scoped>
.public-detail-comment-composer {
  --public-detail-comment-tone-border: color-mix(
    in srgb,
    var(--home-business-article-accent) 18%,
    var(--home-detail-card-border)
  );
  --public-detail-comment-tone-surface: color-mix(
    in srgb,
    var(--home-business-article-tag-bg) 26%,
    var(--home-detail-card-bg)
  );
  --public-detail-comment-tone-ink: var(--home-business-article-tag-ink);
  display: grid;
  gap: 10px;
}

.public-detail-comment-composer--topic {
  --public-detail-comment-tone-border: color-mix(
    in srgb,
    var(--home-business-topic-accent) 18%,
    var(--home-detail-card-border)
  );
  --public-detail-comment-tone-surface: color-mix(
    in srgb,
    var(--home-business-topic-tag-bg) 26%,
    var(--home-detail-card-bg)
  );
  --public-detail-comment-tone-ink: var(--home-business-topic-tag-ink);
}

.public-detail-comment-composer--gallery {
  --public-detail-comment-tone-border: color-mix(
    in srgb,
    var(--home-business-gallery-accent) 18%,
    var(--home-detail-card-border)
  );
  --public-detail-comment-tone-surface: color-mix(
    in srgb,
    var(--home-business-gallery-tag-bg) 26%,
    var(--home-detail-card-bg)
  );
  --public-detail-comment-tone-ink: var(--home-business-gallery-tag-ink);
}

.public-detail-comment-composer--bookshelf {
  --public-detail-comment-tone-border: color-mix(
    in srgb,
    var(--home-business-bookshelf-accent) 18%,
    var(--home-detail-card-border)
  );
  --public-detail-comment-tone-surface: color-mix(
    in srgb,
    var(--home-business-bookshelf-tag-bg) 26%,
    var(--home-detail-card-bg)
  );
  --public-detail-comment-tone-ink: var(--home-business-bookshelf-tag-ink);
}

.public-detail-comment-composer__field {
  display: block;
}

.public-detail-comment-composer__textarea {
  display: block;
  width: 100%;
  min-height: 92px;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--public-detail-comment-tone-border) 72%, transparent);
  border-radius: 16px;
  background: color-mix(in srgb, white 78%, var(--public-detail-comment-tone-surface));
  box-sizing: border-box;
  color: var(--home-ink);
  font: inherit;
  font-size: 13px;
  line-height: 1.72;
  resize: vertical;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease,
    opacity 180ms ease;
}

.public-detail-comment-composer__textarea::placeholder {
  color: color-mix(in srgb, var(--home-muted) 92%, transparent);
}

.public-detail-comment-composer__textarea:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--public-detail-comment-tone-border) 92%, transparent);
}

.public-detail-comment-composer__textarea:focus-visible {
  outline: none;
  border-color: color-mix(in srgb, var(--public-detail-comment-tone-ink) 28%, transparent);
  box-shadow: 0 0 0 3px var(--portal-focus-ring);
}

.public-detail-comment-composer__textarea:disabled {
  cursor: not-allowed;
  opacity: 0.78;
}

.public-detail-comment-composer__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.public-detail-comment-composer__hint {
  margin: 0;
  color: color-mix(in srgb, var(--home-muted) 92%, transparent);
  font-size: 12px;
  line-height: 1.66;
}

.public-detail-comment-composer__submit {
  min-width: 124px;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid color-mix(in srgb, var(--public-detail-comment-tone-border) 76%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--public-detail-comment-tone-surface) 86%, white);
  color: color-mix(in srgb, var(--public-detail-comment-tone-ink) 88%, var(--home-ink));
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    opacity 180ms ease;
}

.public-detail-comment-composer__submit:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--public-detail-comment-tone-ink) 24%, transparent);
}

.public-detail-comment-composer__submit:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--portal-focus-ring);
}

.public-detail-comment-composer__submit.is-disabled,
.public-detail-comment-composer__submit:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}
</style>
