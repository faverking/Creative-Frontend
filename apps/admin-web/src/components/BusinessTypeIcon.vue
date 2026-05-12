<template>
  <svg class="business-type-icon" viewBox="0 0 24 24" aria-hidden="true">
    <template v-if="name === 'overview'">
      <rect x="3.5" y="4.5" width="7" height="6" rx="1.8" />
      <rect x="13.5" y="4.5" width="7" height="10" rx="1.8" />
      <rect x="3.5" y="13.5" width="7" height="6" rx="1.8" />
      <path d="M13.5 18.5h7" />
    </template>

    <template v-else-if="name === 'manage'">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h4" />
      <circle cx="17.2" cy="15.8" r="1.4" />
      <path d="M17.2 12.8v1.6" />
      <path d="M17.2 17.2v1.6" />
    </template>

    <template v-else-if="name === 'articles'">
      <rect x="4" y="3.5" width="16" height="17" rx="2.6" />
      <path d="M8 8.2h8" />
      <path d="M8 12h8" />
      <path d="M8 15.8h5.4" />
      <path d="M6.8 3.5v17" opacity="0.5" />
    </template>

    <template v-else-if="name === 'books'">
      <path d="M6.5 5.3a2.8 2.8 0 0 1 2.8-2.8h9.2v15.2H9.3a2.8 2.8 0 1 0 0 5.6h9.2" />
      <path d="M6.5 5.3v14.6" />
      <path d="M9.7 7.5h5.8" />
      <path d="M9.7 11h5.2" />
    </template>

    <template v-else-if="name === 'images'">
      <rect x="3.5" y="4" width="17" height="15.5" rx="2.4" />
      <circle cx="9" cy="9" r="1.5" />
      <path d="M6.5 16.5l4.2-4.4 3.1 3 2.7-2.2 3 3.6" />
    </template>

    <template v-else-if="name === 'topics'">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 8.2h8" />
      <path d="M8 12h8" />
      <path d="M8 15.8h4.8" />
      <path d="M16.2 14.8l1.4 1.4 2.6-2.8" />
    </template>

    <template v-else>
      <path d="M4.5 12h15" />
      <path d="M12 4.5v15" />
      <circle cx="12" cy="12" r="8" />
    </template>
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  name: 'overview' | 'manage' | 'articles' | 'books' | 'images' | 'topics'
}>()
</script>

<style scoped>
.business-type-icon {
  width: 1em;
  height: 1em;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
