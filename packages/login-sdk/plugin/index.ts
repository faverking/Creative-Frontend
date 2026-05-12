import { inject, type Plugin } from 'vue'

import type { LoginSdk } from '../core/auth'

import { loginSdkKey } from './inject-key'

// plugin 层故意保持很薄：
// 只负责 provide / inject，不在这里混入登录流程逻辑，
// 这样 core 可以继续保持与 Vue 解耦。
export interface LoginPluginOptions {
  sdk: LoginSdk
}

export function createLoginPlugin(options: LoginPluginOptions): Plugin {
  return {
    install(app) {
      app.provide(loginSdkKey, options.sdk)
    }
  }
}

export function useLoginSdk(): LoginSdk {
  // 未安装时直接抛错，帮助应用在开发期尽早暴露装配问题。
  const sdk = inject(loginSdkKey)
  if (!sdk) {
    throw new Error('Login SDK is not installed.')
  }
  return sdk
}
