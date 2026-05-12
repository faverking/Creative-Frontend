import { setThemeMode, type ThemeMode } from '@frontend/theme'
import { useStorage } from '@vueuse/core'
import { watch } from 'vue'

export function useThemeToggle() {
  const mode = useStorage<ThemeMode>('monoapp-theme-mode', 'light')

  watch(
    mode,
    (value) => {
      setThemeMode(value)
    },
    { immediate: true }
  )

  const toggle = () => {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
  }

  return {
    mode,
    toggle
  }
}
