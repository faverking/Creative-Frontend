// 主题管理器负责两件事：
// 1. 统一 light / dark 模式的读取、初始化、切换与持久化。
// 2. 把主题字体的加载从首屏关键路径里挪开，避免和首屏脚本/样式抢带宽。
export type ThemeMode = 'light' | 'dark'

// 持久化主题模式，保证刷新后仍沿用用户上一次选择。
const STORAGE_KEY = 'monoapp-theme-mode'

function hasDom(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

export function getThemeMode(): ThemeMode {
  if (!hasDom()) {
    return 'dark'
  }

  const cached = window.localStorage.getItem(STORAGE_KEY)
  return cached === 'light' ? 'light' : 'dark'
}

export function setThemeMode(mode: ThemeMode): ThemeMode {
  if (!hasDom()) {
    return mode
  }

  const isDark = mode === 'dark'
  document.documentElement.classList.toggle('dark', isDark)
  window.localStorage.setItem(STORAGE_KEY, mode)
  return mode
}

export function toggleTheme(): ThemeMode {
  return setThemeMode(getThemeMode() === 'dark' ? 'light' : 'dark')
}

export function initTheme(defaultMode: ThemeMode = 'dark'): ThemeMode {
  const mode = hasDom() ? getThemeMode() : defaultMode
  return setThemeMode(mode)
}
