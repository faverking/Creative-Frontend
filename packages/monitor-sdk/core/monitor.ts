import { createBrowserMonitorRuntime, type BrowserPerformanceCaptureOptions } from './browser'
import { installGlobalErrorCapture, reportError, type GlobalErrorCaptureOptions } from './error'
import { reportLog, type MonitorLogPayload } from './log'
import { reportPerformance } from './performance'
import { Reporter } from './report'
import type { MonitorAdapter, MonitorContext } from './types'

export class Monitor {
  private readonly reporter: Reporter
  private context: MonitorContext = {}

  constructor(adapter: MonitorAdapter) {
    this.reporter = new Reporter(adapter)
  }

  setContext(context: MonitorContext): void {
    this.context = {
      ...this.context,
      ...context
    }
  }

  reportPerformance(metric: Record<string, unknown>): Promise<void> {
    return reportPerformance(this.reporter, metric, this.getContextSnapshot())
  }

  reportError(error: unknown): Promise<void> {
    return reportError(this.reporter, error, this.getContextSnapshot())
  }

  // 诊断日志属于监控域，便于直接对接 Sentry / Slardar 之类的监控后端。
  reportLog(log: MonitorLogPayload): Promise<void> {
    return reportLog(this.reporter, log, this.getContextSnapshot())
  }

  // 浏览器全局异常监听统一从这里暴露，应用层不需要直接操作 reporter。
  installGlobalErrorCapture(options?: GlobalErrorCaptureOptions): () => void {
    return installGlobalErrorCapture(this.reporter, {
      ...options,
      getContext: () => this.getContextSnapshot()
    })
  }

  // 浏览器性能监听和异常监听保持同一安装方式，应用层只关心启用和清理。
  installBrowserPerformanceCapture(options: BrowserPerformanceCaptureOptions = {}): () => void {
    const runtime = createBrowserMonitorRuntime({
      monitor: this,
      ...options,
      getContext: () => this.getContextSnapshot()
    })

    runtime.start()
    return () => runtime.stop()
  }

  private getContextSnapshot(): MonitorContext {
    return Object.assign({}, this.context)
  }
}
