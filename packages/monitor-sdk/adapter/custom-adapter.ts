import type { MonitorAdapter, MonitorEvent } from '../core/types'

export class CustomMonitorAdapter implements MonitorAdapter {
  async report(event: MonitorEvent): Promise<void> {
    console.debug('[monitor][custom]', event)
  }
}
