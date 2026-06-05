<template>
  <div class="public-detail-loading-state__book-showcase">
    <div class="public-detail-loading-state__book-showcase-media">
      <div class="public-detail-loading-state__book-cover-stage">
        <span
          class="public-detail-loading-state__book-cover-stack public-detail-loading-state__book-cover-stack--back"
        />
        <span
          class="public-detail-loading-state__book-cover-stack public-detail-loading-state__book-cover-stack--mid"
        />
        <span class="public-detail-loading-state__book-cover" />
      </div>
    </div>

    <div class="public-detail-loading-state__book-showcase-body">
      <div class="public-detail-loading-state__book-showcase-copy">
        <div class="public-detail-loading-state__lines public-detail-loading-state__lines--title">
          <span
            v-for="width in titleLineWidths"
            :key="`title-${width}`"
            class="public-detail-loading-state__line public-detail-loading-state__line--title"
          >
            <span
              class="public-detail-loading-state__block public-detail-loading-state__block--title"
              :style="{ width }"
            />
          </span>
        </div>

        <span class="public-detail-loading-state__line public-detail-loading-state__line--summary">
          <span
            class="public-detail-loading-state__block public-detail-loading-state__block--summary"
            :style="{ width: bookAuthorWidth }"
          />
        </span>
      </div>

      <div class="public-detail-loading-state__book-showcase-meta">
        <div class="public-detail-loading-state__book-detail-list">
          <div
            v-for="row in bookMetaRows"
            :key="row.key"
            class="public-detail-loading-state__book-detail-row"
          >
            <span
              class="public-detail-loading-state__block public-detail-loading-state__block--book-field-label"
              :style="{ width: row.labelWidth }"
            />
            <div class="public-detail-loading-state__book-tag-track">
              <span
                v-for="(width, index) in row.widths"
                :key="`${row.key}-${index}`"
                class="public-detail-loading-state__pill"
                :class="row.pillClass"
                :style="{ width }"
              />
            </div>
          </div>
        </div>

        <div class="public-detail-loading-state__book-detail-row">
          <span
            class="public-detail-loading-state__block public-detail-loading-state__block--book-field-label"
            :style="{ width: bookStatusLabelWidth }"
          />
          <span class="public-detail-loading-state__line public-detail-loading-state__line--body">
            <span
              class="public-detail-loading-state__block public-detail-loading-state__block--book-status-line"
              :style="{ width: bookStatusLineWidth }"
            />
          </span>
        </div>
      </div>

      <section class="public-detail-loading-state__book-intro">
        <div
          class="public-detail-loading-state__book-detail-row public-detail-loading-state__book-detail-row--intro"
        >
          <span
            class="public-detail-loading-state__block public-detail-loading-state__block--book-field-label-intro"
            :style="{ width: bookIntroLabelWidth }"
          />
          <div class="public-detail-loading-state__book-intro-copy">
            <span
              v-for="width in bookIntroLineWidths"
              :key="`book-intro-preview-${width}`"
              class="public-detail-loading-state__line public-detail-loading-state__line--body"
            >
              <span
                class="public-detail-loading-state__block public-detail-loading-state__block--body"
                :style="{ width }"
              />
            </span>

            <span
              class="public-detail-loading-state__pill public-detail-loading-state__pill--book-intro-toggle"
            />
          </div>
        </div>
      </section>

      <div class="public-detail-loading-state__book-showcase-footer">
        <div class="public-detail-loading-state__book-actions">
          <span
            v-for="(width, index) in bookActionWidths"
            :key="`book-action-${index}`"
            class="public-detail-loading-state__pill public-detail-loading-state__pill--hero-action"
            :style="{ width }"
          />
        </div>

        <div class="public-detail-loading-state__book-stat-row">
          <span
            v-for="(width, index) in bookStatWidths"
            :key="`book-stat-${index}`"
            class="public-detail-loading-state__line public-detail-loading-state__line--meta"
          >
            <span
              class="public-detail-loading-state__block public-detail-loading-state__block--meta-line"
              :style="{ width }"
            />
          </span>
        </div>
      </div>
    </div>
  </div>

  <section class="public-detail-loading-state__book-chapters">
    <div class="public-detail-loading-state__book-chapter-headline">
      <span
        class="public-detail-loading-state__line public-detail-loading-state__line--related-heading"
      >
        <span
          class="public-detail-loading-state__block public-detail-loading-state__block--related-title"
        />
      </span>

      <div class="public-detail-loading-state__book-chapter-groups">
        <span
          v-for="width in bookChapterGroupWidths"
          :key="`book-group-${width}`"
          class="public-detail-loading-state__pill public-detail-loading-state__pill--book-group"
          :style="{ width }"
        />
      </div>
    </div>

    <div class="public-detail-loading-state__book-chapter-list">
      <article
        v-for="(width, index) in bookChapterSkeletons"
        :key="`book-chapter-${index}`"
        class="public-detail-loading-state__book-chapter-row"
      >
        <span class="public-detail-loading-state__line public-detail-loading-state__line--body">
          <span
            class="public-detail-loading-state__block public-detail-loading-state__block--book-chapter-title"
            :style="{ width }"
          />
        </span>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
const titleLineWidths = ['52%', '78%'] as const
const bookMetaLabelWidth = '2.6rem'
const bookStatusLabelWidth = '2.6rem'
const bookIntroLabelWidth = '2.8rem'
const bookAuthorWidth = '40%'
const bookStatusLineWidth = '23.6rem'
const bookStatWidths = ['7.4rem', '6.8rem', '7rem'] as const
const bookPartTagWidths = ['6.4rem'] as const
const bookAreaTagWidths = ['6.8rem'] as const
const bookStyleTagWidths = ['6.2rem', '5.8rem'] as const
const bookActionWidths = ['11.6rem', '10rem'] as const
const bookChapterGroupWidths = ['9.2rem', '10.2rem', '9.6rem'] as const
const bookIntroLineWidths = ['100%', '95%', '78%'] as const
const bookChapterSkeletons = [
  '88%',
  '94%',
  '82%',
  '90%',
  '86%',
  '92%',
  '84%',
  '96%',
  '80%',
  '89%'
] as const

const bookMetaRows = [
  {
    key: 'part',
    pillClass: 'public-detail-loading-state__pill--book-primary-tag',
    labelWidth: bookMetaLabelWidth,
    widths: bookPartTagWidths
  },
  {
    key: 'area',
    pillClass: 'public-detail-loading-state__pill--book-primary-tag',
    labelWidth: bookMetaLabelWidth,
    widths: bookAreaTagWidths
  },
  {
    key: 'tags',
    pillClass: 'public-detail-loading-state__pill--book-style-tag',
    labelWidth: bookMetaLabelWidth,
    widths: bookStyleTagWidths
  }
] as const
</script>
