<template>
  <div class="public-detail-loading-state__comments">
    <div class="public-detail-loading-state__comments-header">
      <span class="public-detail-loading-state__line public-detail-loading-state__line--meta">
        <span
          class="public-detail-loading-state__block public-detail-loading-state__block--comment-title"
        />
      </span>
      <span
        class="public-detail-loading-state__pill public-detail-loading-state__pill--comment-summary"
      />
    </div>

    <div class="public-detail-loading-state__comment-composer">
      <span
        class="public-detail-loading-state__block public-detail-loading-state__block--comment-composer"
      />

      <div class="public-detail-loading-state__comment-composer-footer">
        <span class="public-detail-loading-state__line public-detail-loading-state__line--body">
          <span
            class="public-detail-loading-state__block public-detail-loading-state__block--comment-footnote"
          />
        </span>
        <span
          class="public-detail-loading-state__pill public-detail-loading-state__pill--comment-action"
        />
      </div>
    </div>

    <article
      v-for="(card, index) in commentCardSkeletons"
      :key="`${commentKeyPrefix}-card-${index}`"
      class="public-detail-loading-state__comment-card"
    >
      <div class="public-detail-loading-state__comment-card-head">
        <span
          class="public-detail-loading-state__block public-detail-loading-state__block--comment-avatar"
        />

        <div class="public-detail-loading-state__comment-copy">
          <div class="public-detail-loading-state__comment-meta">
            <span
              class="public-detail-loading-state__block public-detail-loading-state__block--comment-author"
            />
            <span
              class="public-detail-loading-state__block public-detail-loading-state__block--comment-time"
            />
          </div>

          <span
            v-for="width in card.bodyWidths"
            :key="`${commentKeyPrefix}-body-${index}-${width}`"
            class="public-detail-loading-state__line public-detail-loading-state__line--body"
          >
            <span
              class="public-detail-loading-state__block public-detail-loading-state__block--comment-line"
              :style="{ width }"
            />
          </span>
        </div>
      </div>

      <div class="public-detail-loading-state__comment-card-footer">
        <span class="public-detail-loading-state__line public-detail-loading-state__line--meta">
          <span
            class="public-detail-loading-state__block public-detail-loading-state__block--comment-count"
          />
        </span>
        <span class="public-detail-loading-state__line public-detail-loading-state__line--meta">
          <span
            class="public-detail-loading-state__block public-detail-loading-state__block--comment-action"
          />
        </span>
      </div>

      <div class="public-detail-loading-state__comment-replies">
        <article
          v-for="(reply, replyIndex) in card.replyRows"
          :key="`${commentKeyPrefix}-reply-${index}-${replyIndex}`"
          class="public-detail-loading-state__comment-reply-row"
        >
          <div class="public-detail-loading-state__comment-reply-copy">
            <div class="public-detail-loading-state__comment-reply-meta">
              <span
                class="public-detail-loading-state__line public-detail-loading-state__line--meta"
              >
                <span
                  class="public-detail-loading-state__block public-detail-loading-state__block--comment-reply-author"
                />
              </span>
              <span
                class="public-detail-loading-state__line public-detail-loading-state__line--meta"
              >
                <span
                  class="public-detail-loading-state__block public-detail-loading-state__block--comment-reply-time"
                />
              </span>
            </div>
            <span
              v-for="width in reply.bodyWidths"
              :key="`${commentKeyPrefix}-reply-line-${index}-${replyIndex}-${width}`"
              class="public-detail-loading-state__line public-detail-loading-state__line--body"
            >
              <span
                class="public-detail-loading-state__block public-detail-loading-state__block--comment-reply"
                :style="{ width }"
              />
            </span>
          </div>

          <span class="public-detail-loading-state__line public-detail-loading-state__line--meta">
            <span
              class="public-detail-loading-state__block public-detail-loading-state__block--comment-reply-action"
            />
          </span>
        </article>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { PublicDetailLoadingVariant } from './public-detail-loading'

const props = defineProps<{
  variant: PublicDetailLoadingVariant
}>()

const commentCardSkeletons = [
  {
    bodyWidths: ['100%', '92%'],
    replyRows: [{ bodyWidths: ['86%'] }]
  },
  {
    bodyWidths: ['96%', '76%'],
    replyRows: [{ bodyWidths: ['82%'] }, { bodyWidths: ['88%', '68%'] }]
  }
] as const

const commentKeyPrefix = computed(() => `${props.variant}-comment`)
</script>
