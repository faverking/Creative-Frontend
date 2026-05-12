<template>
  <div class="editor-ai-bubble" :style="anchorStyle">
    <el-button
      class="editor-ai-bubble__button"
      type="primary"
      round
      :loading="loading"
      @mousedown.prevent
      @click="$emit('run')"
    >
      {{ label }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  loading: boolean
  anchorStyle: {
    left: string
    top: string
  }
}>()

defineEmits<{
  run: []
}>()
</script>

<style scoped>
.editor-ai-bubble {
  position: absolute;
  z-index: 6;
  transform: translateX(-50%);
}

.editor-ai-bubble__button {
  box-shadow: 0 12px 28px rgba(18, 32, 56, 0.16);
}
</style>
