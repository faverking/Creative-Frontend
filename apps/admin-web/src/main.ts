import { createApp } from 'vue'
import { createPinia } from 'pinia'

import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles/index.css'
import './styles/dark-overrides.css'

import ElementPlus from 'element-plus'
import { AiChatPanel } from '@frontend/ai-sdk'
import { loadEnvConfig } from '@frontend/config'
import {
  createHttpClientRequester,
  createLoginPlugin,
  createOauthLoginSdk
} from '@frontend/login-sdk'
import { createMonitorPlugin } from '@frontend/monitor-sdk'
import { createPermissionPlugin, createRbacPermissionEngine } from '@frontend/permission-sdk'
import { createTrackingPlugin } from '@frontend/tracking-sdk'
import { setupObservabilityRuntime } from '@frontend/app-runtime'
import { scheduleThemeFontsLoad, useThemeStore, useUserStore } from '@frontend/store'
import FrontendUi from '@frontend/ui'

import App from './App.vue'
import { getHttpClient, setupHttpClient } from './api'
import { setupAuthRuntime } from './auth/runtime'
import router from './router'

async function bootstrap(): Promise<void> {
  const app = createApp(App)
  const pinia = createPinia()

  const env = loadEnvConfig(import.meta.env)
  const userStore = useUserStore(pinia)
  const themeStore = useThemeStore(pinia)

  themeStore.initMode()

  // 观测能力在应用层统一装配，main.ts 只保留启动顺序。
  const observability = await setupObservabilityRuntime({
    router,
    userStore,
    appId: env.trackingAppId
  })

  // OAuth 登录链路交给 login-sdk 统一处理，应用层只传环境与 requester。
  const loginSdk = createOauthLoginSdk({
    baseUrl: env.apiBaseUrl,
    apiPrefix: env.apiPrefix,
    provider: env.oauthProvider,
    // 认证请求直接复用共享 HTTP 客户端。
    requester: createHttpClientRequester(() => getHttpClient())
  })

  // 权限引擎先创建空壳，登录后再按用户权限动态注入。
  const permissionEngine = createRbacPermissionEngine([])

  setupAuthRuntime({ loginSdk, permissionEngine, userStore })
  setupHttpClient(env, loginSdk, {
    onTraceResolved: observability.setTraceId
  })

  // 页面从 OAuth 回调返回时，优先在启动阶段完成 code 换 token。
  try {
    await loginSdk.handleOAuthCallbackFromLocation(env.oauthProvider)
  } catch (error) {
    console.error('OAuth callback handling failed:', error)
  }

  app.use(router)
  app.use(pinia)
  app.use(ElementPlus)
  app.use(FrontendUi)
  app.use(createLoginPlugin({ sdk: loginSdk }))
  app.use(createPermissionPlugin({ engine: permissionEngine }))
  app.use(createTrackingPlugin({ tracker: observability.tracker }))
  app.use(createMonitorPlugin({ monitor: observability.monitor }))
  app.component('AiChatPanel', AiChatPanel)

  await router.isReady()
  observability.syncContext()
  app.mount('#app')
  scheduleThemeFontsLoad()
}

void bootstrap()
