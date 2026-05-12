import type { TrackingContext } from './types'

export function createDefaultTrackingContext(): TrackingContext {
  return {
    appId: 'monoapp',
    routeName: 'unknown'
  }
}
