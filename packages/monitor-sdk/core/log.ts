import type { Reporter } from './report'
import type { MonitorContext, MonitorEvent } from './types'

export type MonitorLogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface MonitorLogPayload {
  message: string
  level?: MonitorLogLevel
  context?: Record<string, unknown>
}

export function createLogMonitorEvent(
  log: MonitorLogPayload,
  monitorContext?: MonitorContext
): MonitorEvent {
  return {
    type: 'log',
    payload: {
      message: log.message,
      level: log.level ?? 'info',
      ...(log.context ? { context: log.context } : {})
    },
    context: monitorContext,
    timestamp: Date.now()
  }
}

export function reportLog(
  reporter: Reporter,
  log: MonitorLogPayload,
  context?: MonitorContext
): Promise<void> {
  return reporter.report(createLogMonitorEvent(log, context))
}
