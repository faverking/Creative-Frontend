import { scheduleDeferredFontLoad } from './font-scheduler'
import { loadThemeFontSubset } from './font-subset-loader'

let themeFontsLoadPromise: Promise<void> | null = null
let themeFontsLoadScheduled = false
let progressiveThemeFontsLoadScheduled = false
let progressiveThemeFontsLoadStarted = false

function hasDom(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

export function loadThemeFonts(): Promise<void> {
  if (!hasDom()) {
    return Promise.resolve()
  }

  if (!themeFontsLoadPromise) {
    themeFontsLoadPromise = import('./fonts.css').then(() => undefined)
  }

  return themeFontsLoadPromise
}

export function scheduleThemeFontsLoad(): void {
  scheduleDeferredFontLoad({
    hasStarted: () => Boolean(themeFontsLoadPromise),
    isScheduled: () => themeFontsLoadScheduled,
    load: loadThemeFonts,
    markScheduled: () => {
      themeFontsLoadScheduled = true
    }
  })
}

export function scheduleProgressiveThemeFontsLoad(): void {
  scheduleDeferredFontLoad({
    hasStarted: () => progressiveThemeFontsLoadStarted || Boolean(themeFontsLoadPromise),
    isScheduled: () => progressiveThemeFontsLoadScheduled,
    load: async () => {
      progressiveThemeFontsLoadStarted = true
      await loadThemeFontSubset().catch(() => undefined)
      scheduleThemeFontsLoad()
    },
    markScheduled: () => {
      progressiveThemeFontsLoadScheduled = true
    }
  })
}
