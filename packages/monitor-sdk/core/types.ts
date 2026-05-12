export type MonitorEventType = 'performance' | 'error' | 'log'

export interface MonitorContext {
  userId?: string
  tenantId?: string
  appId?: string
  pageId?: string
  routeName?: string
  deviceInfo?: string
  traceId?: string
}

export interface MonitorEvent {
  type: MonitorEventType
  payload: Record<string, unknown>
  context?: MonitorContext
  timestamp: number
}

export interface MonitorAdapter {
  report(event: MonitorEvent): Promise<void>
}
