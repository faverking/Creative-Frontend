import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  getThemeMode,
  initTheme,
  scheduleThemeFontsLoad,
  setThemeMode,
  toggleTheme,
  type ThemeMode
} from '@frontend/theme'

// 全局主题状态：统一驱动 html.dark 与本地持久化。
export const useThemeStore = defineStore('global-theme', () => {
  const mode = ref<ThemeMode>(getThemeMode())

  const initMode = () => {
    mode.value = initTheme()
  }

  const setMode = (nextMode: ThemeMode) => {
    mode.value = setThemeMode(nextMode)
  }

  const toggle = () => {
    mode.value = toggleTheme()
    return mode.value
  }

  return {
    mode,
    initMode,
    setMode,
    toggle
  }
})

export { scheduleThemeFontsLoad }
