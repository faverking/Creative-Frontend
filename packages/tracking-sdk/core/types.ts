export type TrackingEventCategory = 'behavior' | 'error' | 'custom'

export interface TrackingContext {
  userId?: string
  tenantId?: string
  appId?: string
  pageId?: string
  routeName?: string
  deviceInfo?: string
  traceId?: string
}

export interface TrackingEvent {
  id: string
  category: TrackingEventCategory
  event: string
  payload?: Record<string, unknown>
  context?: TrackingContext
  timestamp: number
}

export interface TrackingAdapter {
  report(events: TrackingEvent[]): Promise<void>
}

export interface TrackingStorage {
  initialize(): Promise<void>
  add(event: TrackingEvent): Promise<void>
  list(limit?: number): Promise<TrackingEvent[]>
  remove(ids: string[]): Promise<void>
}

export interface TrackOptions {
  category?: TrackingEventCategory
}

export interface TrackerOptions {
  storage?: TrackingStorage
  flushBatchSize?: number
  idleFlushTimeoutMs?: number
}
