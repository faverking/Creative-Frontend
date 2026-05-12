import { inject, type Plugin } from 'vue'

import type { Monitor } from '../core/monitor'

import { monitorKey } from './use-monitor'

// monitor 插件只负责注入 monitor 实例，
// 这样监控实现可以独立演进，不把 Vue 生命周期耦合进 core。
export interface MonitorPluginOptions {
  monitor: Monitor
}

export function createMonitorPlugin(options: MonitorPluginOptions): Plugin {
  return {
    install(app) {
      app.provide(monitorKey, options.monitor)
    }
  }
}

export function useMonitor(): Monitor {
  // 未装配 monitor 时立刻报错，避免错误被悄悄吞掉。
  const monitor = inject(monitorKey)
  if (!monitor) {
    throw new Error('Monitor is not installed.')
  }
  return monitor
}
