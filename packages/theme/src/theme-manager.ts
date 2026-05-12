// 主题管理器负责两件事：
// 1. 统一 light / dark 模式的读取、初始化、切换与持久化。
// 2. 把主题字体的加载从首屏关键路径里挪开，避免和首屏脚本/样式抢带宽。
export type ThemeMode = 'light' | 'dark'

// 持久化主题模式，保证刷新后仍沿用用户上一次选择。
const STORAGE_KEY = 'monoapp-theme-mode'
// 字体文件只加载一次，避免重复 import。
let themeFontsLoadPromise: Promise<void> | null = null
// 只注册一轮字体调度，避免多次绑定事件。
let themeFontsLoadScheduled = false

type IdleCapableWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

function hasDom(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

// 优先用 requestIdleCallback，把低优先级任务塞到浏览器空闲期；
// 如果环境不支持，再退回 setTimeout 做近似调度。
function scheduleDeferredTask(task: () => void, timeout: number): () => void {
  const idleWindow = window as IdleCapableWindow

  if (typeof idleWindow.requestIdleCallback === 'function') {
    const idleHandle = idleWindow.requestIdleCallback(task, { timeout })

    return () => {
      idleWindow.cancelIdleCallback?.(idleHandle)
    }
  }

  const timeoutHandle = globalThis.setTimeout(task, Math.min(timeout, 1200))

  return () => {
    globalThis.clearTimeout(timeoutHandle)
  }
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

export function loadThemeFonts(): Promise<void> {
  // 字体样式单独拆包，只有真正需要时才异步加载。
  // 这样能避免超大的字体文件阻塞首屏资源竞争。
  if (!hasDom()) {
    return Promise.resolve()
  }

  if (!themeFontsLoadPromise) {
    themeFontsLoadPromise = import('./fonts.css').then(() => undefined)
  }

  return themeFontsLoadPromise
}

export function scheduleThemeFontsLoad(): void {
  // 这里的意图不是“尽快加载字体”，而是“尽量不影响首屏再加载字体”：
  // - 页面已经完成加载：等空闲期再拉字体。
  // - 用户开始交互：适当提前，减少交互时字体切换感。
  // - 已经加载/已调度过：直接跳过，避免重复工作。
  if (!hasDom() || themeFontsLoadPromise || themeFontsLoadScheduled) {
    return
  }

  themeFontsLoadScheduled = true

  let cancelScheduledTask: (() => void) | null = null

  const cleanup = () => {
    // 字体一旦开始加载，就撤掉之前所有监听和调度，避免残留副作用。
    cancelScheduledTask?.()
    cancelScheduledTask = null
    window.removeEventListener('load', onWindowLoad)
    window.removeEventListener('pointerdown', onFirstInteraction)
    window.removeEventListener('touchstart', onFirstInteraction)
    window.removeEventListener('keydown', onFirstInteraction)
  }

  const load = () => {
    cleanup()
    void loadThemeFonts()
  }

  const scheduleIdleLoad = (timeout: number) => {
    cancelScheduledTask?.()
    cancelScheduledTask = scheduleDeferredTask(load, timeout)
  }

  function onWindowLoad() {
    // 页面 load 后，说明首屏关键资源基本就位，这时再把字体放入空闲队列。
    scheduleIdleLoad(1800)
  }

  function onFirstInteraction() {
    // 用户已经开始操作，说明页面进入“可用优先”阶段，字体可以更积极一点加载。
    scheduleIdleLoad(600)
  }

  if (document.readyState === 'complete') {
    scheduleIdleLoad(1800)
    return
  }

  window.addEventListener('load', onWindowLoad, { once: true })
  window.addEventListener('pointerdown', onFirstInteraction, { once: true, passive: true })
  window.addEventListener('touchstart', onFirstInteraction, { once: true, passive: true })
  window.addEventListener('keydown', onFirstInteraction, { once: true })
}
