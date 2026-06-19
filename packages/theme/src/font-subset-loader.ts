import { scheduleDeferredFontLoad } from './font-scheduler'

let themeFontSubsetLoadPromise: Promise<void> | null = null
let themeFontSubsetLoadScheduled = false

function hasDom(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

export function loadThemeFontSubset(): Promise<void> {
  if (!hasDom()) {
    return Promise.resolve()
  }

  if (!themeFontSubsetLoadPromise) {
    themeFontSubsetLoadPromise = import('./font-subset.css').then(() => undefined)
  }

  return themeFontSubsetLoadPromise
}

export function scheduleThemeFontSubsetLoad(): void {
  scheduleDeferredFontLoad({
    hasStarted: () => Boolean(themeFontSubsetLoadPromise),
    isScheduled: () => themeFontSubsetLoadScheduled,
    load: loadThemeFontSubset,
    markScheduled: () => {
      themeFontSubsetLoadScheduled = true
    }
  })
}
