// monitor-sdk 负责错误、日志、性能这三类监控事件。
// 它和 tracking-sdk 的边界是：
// - tracking 更偏“用户行为”
// - monitor 更偏“系统状态与异常”

// core：监控实体、事件模型和浏览器采集能力。
export { Monitor } from './core/monitor'
export { createErrorMonitorEvent, installGlobalErrorCapture, reportError } from './core/error'
export { createLogMonitorEvent, reportLog } from './core/log'
export { createPerformanceMonitorEvent, reportPerformance } from './core/performance'
export { Reporter } from './core/report'
export type { BrowserPerformanceCaptureOptions } from './core/browser'
export type { GlobalErrorCaptureOptions } from './core/error'
export type { MonitorLogLevel, MonitorLogPayload } from './core/log'
export type { MonitorAdapter, MonitorContext, MonitorEvent, MonitorEventType } from './core/types'

// plugin：把 monitor 注入 Vue 应用，方便页面或 composable 直接调用。
export { createMonitorPlugin, useMonitor } from './plugin/index'

// adapter：对接不同监控平台或自定义上报实现。
export { CustomMonitorAdapter } from './adapter/custom-adapter'
export { SentryAdapter } from './adapter/sentry-adapter'
export { SlardarAdapter } from './adapter/slardar-adapter'
