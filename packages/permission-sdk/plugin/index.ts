import { inject, type Plugin } from 'vue'

import { createPermissionDirective } from '../core/directive'
import type { PermissionEngine } from '../core/permission-engine'

import { permissionEngineKey } from './use-permission'

// 插件层把“注入引擎”和“注册权限指令”合并在一起，
// 目的是让应用只需要装一次插件就能同时获得脚本层和模板层能力。
export interface PermissionPluginOptions {
  engine: PermissionEngine
}

export function createPermissionPlugin(options: PermissionPluginOptions): Plugin {
  return {
    install(app) {
      app.provide(permissionEngineKey, options.engine)
      app.directive('permission', createPermissionDirective(options.engine))
    }
  }
}

export function usePermissionEngine(): PermissionEngine {
  // 未安装时直接报错，比静默返回 undefined 更容易在开发期发现装配遗漏。
  const engine = inject(permissionEngineKey)
  if (!engine) {
    throw new Error('Permission engine is not installed.')
  }
  return engine
}
