import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const appReady = ref(false)

  const markReady = () => {
    appReady.value = true
  }

  return {
    appReady,
    markReady
  }
})