import type { TrackingAdapter, TrackingEvent } from '../core/types'

export class ThirdPartyTrackingAdapter implements TrackingAdapter {
  constructor(private readonly endpoint: string) {}

  async report(events: TrackingEvent[]): Promise<void> {
    console.debug('[tracking][third-party]', this.endpoint, events)
  }
}
