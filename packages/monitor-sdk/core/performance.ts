import type { Reporter } from './report'
import type { MonitorContext, MonitorEvent } from './types'

export function createPerformanceMonitorEvent(
  metric: Record<string, unknown>,
  context?: MonitorContext
): MonitorEvent {
  return {
    type: 'performance',
    payload: metric,
    context,
    timestamp: Date.now()
  }
}

export function reportPerformance(
  reporter: Reporter,
  metric: Record<string, unknown>,
  context?: MonitorContext
): Promise<void> {
  return reporter.report(createPerformanceMonitorEvent(metric, context))
}
