import type { MonitorAdapter, MonitorEvent } from '../core/types'

export class SentryAdapter implements MonitorAdapter {
  async report(event: MonitorEvent): Promise<void> {
    console.debug('[monitor][sentry]', event)
  }
}
