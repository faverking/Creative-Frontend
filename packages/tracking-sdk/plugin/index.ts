import { inject, type Plugin } from 'vue'

import type { Tracker } from '../core/tracker'

import { trackerKey } from './use-tracker'

// tracking 的 Vue 插件层同样保持轻量：
// 页面里只通过 useTracker 使用 tracker，不直接依赖构造细节。
export interface TrackingPluginOptions {
  tracker: Tracker
}

export function createTrackingPlugin(options: TrackingPluginOptions): Plugin {
  return {
    install(app) {
      app.provide(trackerKey, options.tracker)
    }
  }
}

export function useTracker(): Tracker {
  // 运行时早失败，能帮助我们尽快发现应用没有正确装配 tracker。
  const tracker = inject(trackerKey)
  if (!tracker) {
    throw new Error('Tracker is not installed.')
  }
  return tracker
}
