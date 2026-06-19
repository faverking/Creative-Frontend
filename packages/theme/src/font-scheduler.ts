export type DeferredFontLoadOptions = {
  hasStarted: () => boolean
  isScheduled: () => boolean
  load: () => Promise<void>
  markScheduled: () => void
}

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

export function scheduleDeferredFontLoad(options: DeferredFontLoadOptions): void {
  if (!hasDom() || options.hasStarted() || options.isScheduled()) {
    return
  }

  options.markScheduled()

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
    void options.load()
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
