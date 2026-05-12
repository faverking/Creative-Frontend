import './tokens/light.css'
import './tokens/dark.css'
import './tokens/element-plus.css'

export {
  getThemeMode,
  initTheme,
  loadThemeFonts,
  scheduleThemeFontsLoad,
  setThemeMode,
  toggleTheme
} from './theme-manager'
export type { ThemeMode } from './theme-manager'
