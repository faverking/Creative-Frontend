import type { MonitorAdapter, MonitorEvent } from './types'

export class Reporter {
  constructor(private readonly adapter: MonitorAdapter) {}

  report(event: MonitorEvent): Promise<void> {
    return this.adapter.report(event)
  }
}
