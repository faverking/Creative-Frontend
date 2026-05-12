import type { MonitorAdapter, MonitorEvent } from '../core/types'

export class SlardarAdapter implements MonitorAdapter {
  async report(event: MonitorEvent): Promise<void> {
    console.debug('[monitor][slardar]', event)
  }
}
