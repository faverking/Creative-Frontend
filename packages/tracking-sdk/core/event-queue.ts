import type { TrackingEvent } from './types'

export class EventQueue {
  private readonly queue: TrackingEvent[] = []

  push(event: TrackingEvent): void {
    this.queue.push(event)
  }

  drain(): TrackingEvent[] {
    const copied = [...this.queue]
    this.queue.length = 0
    return copied
  }
}
