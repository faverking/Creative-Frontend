// tracking-sdk 负责行为埋点。
// 它的设计意图是把“事件、上下文、存储、上报适配”拆开，
// 让应用可以先稳定采集，再按渠道替换上报方式。

// core：上下文、队列、存储、tracker 主体。
export { createDefaultTrackingContext } from './core/context'
export {
  createDefaultTrackingStorage,
  IndexedDbTrackingStorage,
  InMemoryTrackingStorage
} from './core/storage'
export { EventQueue } from './core/event-queue'
export { Tracker } from './core/tracker'
export type {
  TrackOptions,
  TrackingAdapter,
  TrackingContext,
  TrackingEvent,
  TrackingEventCategory,
  TrackerOptions,
  TrackingStorage
} from './core/types'

// plugin：把 tracker 注入 Vue 组件树。
export { createTrackingPlugin, useTracker } from './plugin/index'

// adapter：面向不同埋点通道的适配层。
export { InternalTrackingAdapter } from './adapter/internal-adapter'
export { ThirdPartyTrackingAdapter } from './adapter/third-party-adapter'
