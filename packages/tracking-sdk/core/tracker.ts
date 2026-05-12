import { createDefaultTrackingContext } from './context'
import { createDefaultTrackingStorage } from './storage'
import type {
  TrackOptions,
  TrackingAdapter,
  TrackingContext,
  TrackingEvent,
  TrackerOptions,
  TrackingStorage
} from './types'

type IdleCapableWindow = Window & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
  cancelIdleCallback?: (handle: number) => void
}

type ScheduledFlushHandle =
  | {
      mode: 'idle'
      id: number
    }
  | {
      mode: 'timeout'
      id: number
    }

function createTrackingEventId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export class Tracker {
  private readonly storage: TrackingStorage
  private readonly flushBatchSize: number
  private readonly idleFlushTimeoutMs: number
  private readonly queueWriteErrors = new Set<string>()
  private readonly flushErrors = new Set<string>()
  private context: TrackingContext = createDefaultTrackingContext()
  private pendingWrites: Promise<void> = Promise.resolve()
  private flushPromise: Promise<void> | null = null
  private scheduledFlushHandle: ScheduledFlushHandle | null = null
  private pageLifecycleCleanup: (() => void) | null = null

  constructor(
    private readonly adapter: TrackingAdapter,
    options: TrackerOptions = {}
  ) {
    this.storage = options.storage ?? createDefaultTrackingStorage()
    this.flushBatchSize = options.flushBatchSize ?? 20
    this.idleFlushTimeoutMs = options.idleFlushTimeoutMs ?? 3000
  }

  async initialize(): Promise<void> {
    await this.storage.initialize()
  }

  setContext(context: TrackingContext): void {
    this.context = {
      ...this.context,
      ...context
    }
  }

  track(event: string, payload?: Record<string, unknown>, options: TrackOptions = {}): void {
    const trackingEvent: TrackingEvent = {
      id: createTrackingEventId(),
      category: options.category ?? 'custom',
      event,
      payload,
      context: Object.assign({}, this.context),
      timestamp: Date.now()
    }

    // 写入顺序串行化，避免高频埋点并发写 IndexedDB 时互相覆盖。
    this.pendingWrites = this.pendingWrites
      .then(async () => {
        await this.storage.add(trackingEvent)
        this.scheduleIdleFlush()
      })
      .catch((error) => {
        this.logOnce(
          this.queueWriteErrors,
          'tracking-write',
          '[tracking] failed to persist event before idle flush',
          error
        )
      })
  }

  async flush(): Promise<void> {
    await this.pendingWrites

    if (this.flushPromise) {
      return this.flushPromise
    }

    this.cancelScheduledFlush()
    this.flushPromise = this.flushStoredEvents().finally(async () => {
      this.flushPromise = null

      // 上报失败时事件仍留在存储中，这里补一次重新调度，避免队列沉底。
      const remainingEvents = await this.storage.list(1)
      if (remainingEvents.length > 0) {
        this.scheduleIdleFlush()
      }
    })
    return this.flushPromise
  }

  // 页面隐藏或离开前补一次 flush，避免本地队列里的行为事件来不及上报。
  installPageLifecycleFlush(): () => void {
    if (typeof window === 'undefined') {
      return () => {}
    }

    if (this.pageLifecycleCleanup) {
      return this.pageLifecycleCleanup
    }

    const flushTracker = () => {
      void this.flush()
    }

    window.addEventListener('pagehide', flushTracker)
    document.addEventListener('visibilitychange', flushTracker)

    this.pageLifecycleCleanup = () => {
      window.removeEventListener('pagehide', flushTracker)
      document.removeEventListener('visibilitychange', flushTracker)
      this.pageLifecycleCleanup = null
    }

    return this.pageLifecycleCleanup
  }

  private async flushStoredEvents(): Promise<void> {
    const events = await this.storage.list(this.flushBatchSize)
    if (events.length === 0) {
      return
    }

    try {
      await this.adapter.report(events)
      await this.storage.remove(events.map((event) => event.id))
    } catch (error) {
      this.logOnce(
        this.flushErrors,
        'tracking-flush',
        '[tracking] idle flush deferred because reporting failed',
        error
      )
    }
  }

  private scheduleIdleFlush(): void {
    if (typeof window === 'undefined' || this.flushPromise || this.scheduledFlushHandle) {
      return
    }

    const idleWindow = window as IdleCapableWindow

    // 上报不阻塞主线程，优先等到浏览器空闲期再批量发送。
    if (typeof idleWindow.requestIdleCallback === 'function') {
      const id = idleWindow.requestIdleCallback(
        () => {
          this.scheduledFlushHandle = null
          void this.flush()
        },
        {
          timeout: this.idleFlushTimeoutMs
        }
      )

      this.scheduledFlushHandle = {
        mode: 'idle',
        id
      }
      return
    }

    const id = window.setTimeout(() => {
      this.scheduledFlushHandle = null
      void this.flush()
    }, this.idleFlushTimeoutMs)

    this.scheduledFlushHandle = {
      mode: 'timeout',
      id
    }
  }

  private cancelScheduledFlush(): void {
    if (!this.scheduledFlushHandle || typeof window === 'undefined') {
      return
    }

    if (
      this.scheduledFlushHandle.mode === 'idle' &&
      typeof (window as IdleCapableWindow).cancelIdleCallback === 'function'
    ) {
      ;(window as IdleCapableWindow).cancelIdleCallback?.(this.scheduledFlushHandle.id)
    } else {
      window.clearTimeout(this.scheduledFlushHandle.id)
    }

    this.scheduledFlushHandle = null
  }

  private logOnce(bucket: Set<string>, key: string, message: string, error: unknown): void {
    if (bucket.has(key)) {
      return
    }

    bucket.add(key)
    console.error(message, error)
  }
}
