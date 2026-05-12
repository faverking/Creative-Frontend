import type { Monitor } from './monitor'
import { createPerformanceMonitorEvent } from './performance'
import type { MonitorContext, MonitorEvent } from './types'

export type WebVitalRating = 'good' | 'needs-improvement' | 'poor'

export interface BrowserPerformanceCaptureOptions {
  captureWebVitals?: boolean
  onCaptured?: (event: MonitorEvent) => void | Promise<void>
}

interface BrowserMonitorRuntimeOptions extends BrowserPerformanceCaptureOptions {
  monitor: Monitor
  getContext?: () => MonitorContext | undefined
}

interface WebVitalMetricPayload {
  name: 'FCP' | 'LCP' | 'CLS'
  value: number
  rating: WebVitalRating
  navigationType?: string
}

type Cleanup = () => void

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean
  value: number
}

function roundMetricValue(name: WebVitalMetricPayload['name'], value: number): number {
  return name === 'CLS' ? Number(value.toFixed(3)) : Number(value.toFixed(2))
}

function resolveWebVitalRating(name: WebVitalMetricPayload['name'], value: number): WebVitalRating {
  if (name === 'CLS') {
    if (value <= 0.1) {
      return 'good'
    }
    if (value <= 0.25) {
      return 'needs-improvement'
    }
    return 'poor'
  }

  if (name === 'FCP') {
    if (value <= 1800) {
      return 'good'
    }
    if (value <= 3000) {
      return 'needs-improvement'
    }
    return 'poor'
  }

  if (value <= 2500) {
    return 'good'
  }
  if (value <= 4000) {
    return 'needs-improvement'
  }
  return 'poor'
}

function resolveNavigationType(): string | undefined {
  if (typeof performance === 'undefined') {
    return undefined
  }

  const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
  return entry?.type
}

function reportWebVitalMetric(
  monitor: Monitor,
  name: WebVitalMetricPayload['name'],
  value: number,
  options: BrowserMonitorRuntimeOptions
): void {
  const normalizedValue = roundMetricValue(name, value)
  const payload = {
    metric: 'web-vital',
    name,
    value: normalizedValue,
    rating: resolveWebVitalRating(name, normalizedValue),
    navigationType: resolveNavigationType()
  }
  const event = createPerformanceMonitorEvent(payload, options.getContext?.())

  void monitor.reportPerformance(payload)
  void options.onCaptured?.(event)
}

function installWebVitalObservers(
  monitor: Monitor,
  options: BrowserMonitorRuntimeOptions
): Cleanup {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
    return () => {}
  }

  const cleanups: Cleanup[] = []
  const supportedEntryTypes = PerformanceObserver.supportedEntryTypes ?? []

  let hasReportedFcp = false
  if (supportedEntryTypes.includes('paint')) {
    const paintObserver = new PerformanceObserver((entryList) => {
      if (hasReportedFcp) {
        return
      }

      const paintEntry = entryList
        .getEntriesByName('first-contentful-paint')
        .find((entry): entry is PerformanceEntry => Boolean(entry))

      if (!paintEntry) {
        return
      }

      hasReportedFcp = true
      reportWebVitalMetric(monitor, 'FCP', paintEntry.startTime, options)
      paintObserver.disconnect()
    })

    paintObserver.observe({
      type: 'paint',
      buffered: true
    })

    cleanups.push(() => paintObserver.disconnect())
  }

  let latestLcpEntry: LargestContentfulPaint | null = null
  let hasReportedLcp = false
  if (supportedEntryTypes.includes('largest-contentful-paint')) {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries() as LargestContentfulPaint[]
      latestLcpEntry = entries[entries.length - 1] ?? latestLcpEntry
    })

    lcpObserver.observe({
      type: 'largest-contentful-paint',
      buffered: true
    })

    const reportLcp = () => {
      if (hasReportedLcp || !latestLcpEntry) {
        return
      }

      hasReportedLcp = true
      reportWebVitalMetric(monitor, 'LCP', latestLcpEntry.startTime, options)
      lcpObserver.disconnect()
    }

    // LCP 需要在页面即将隐藏时取最后一个稳定值，不能在每次 observer 回调里立即上报。
    document.addEventListener('visibilitychange', reportLcp)
    window.addEventListener('pagehide', reportLcp)

    cleanups.push(() => {
      lcpObserver.disconnect()
      document.removeEventListener('visibilitychange', reportLcp)
      window.removeEventListener('pagehide', reportLcp)
    })
  }

  let clsValue = 0
  let hasReportedCls = false
  if (supportedEntryTypes.includes('layout-shift')) {
    const clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries() as LayoutShiftEntry[]
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
    })

    clsObserver.observe({
      type: 'layout-shift',
      buffered: true
    })

    const reportCls = () => {
      if (hasReportedCls) {
        return
      }

      hasReportedCls = true
      reportWebVitalMetric(monitor, 'CLS', clsValue, options)
      clsObserver.disconnect()
    }

    // CLS 是累计值，页面生命周期结束前统一结算更符合指标定义。
    document.addEventListener('visibilitychange', reportCls)
    window.addEventListener('pagehide', reportCls)

    cleanups.push(() => {
      clsObserver.disconnect()
      document.removeEventListener('visibilitychange', reportCls)
      window.removeEventListener('pagehide', reportCls)
    })
  }

  return () => {
    cleanups.forEach((cleanup) => cleanup())
  }
}

export function createBrowserMonitorRuntime(options: BrowserMonitorRuntimeOptions): {
  start: () => void
  stop: () => void
} {
  const cleanupHandlers: Cleanup[] = []
  let started = false

  return {
    start() {
      if (started || typeof window === 'undefined') {
        return
      }

      started = true

      if (options.captureWebVitals !== false) {
        cleanupHandlers.push(installWebVitalObservers(options.monitor, options))
      }
    },

    stop() {
      cleanupHandlers.splice(0).forEach((cleanup) => cleanup())
      started = false
    }
  }
}
