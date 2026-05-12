import type { TrackingAdapter, TrackingEvent } from '../core/types'

export class InternalTrackingAdapter implements TrackingAdapter {
  async report(events: TrackingEvent[]): Promise<void> {
    console.debug('[tracking][internal]', events)
  }
}
