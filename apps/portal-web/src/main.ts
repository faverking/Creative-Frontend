import { createApp } from 'vue'
import { createPinia } from 'pinia'

import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles/index.css'

import ElementPlus from 'element-plus'
import { AiChatPanel } from '@frontend/ai-sdk'
import { setupObservabilityRuntime } from '@frontend/app-runtime'
import { loadEnvConfig } from '@frontend/config'
import {
  createHttpClientRequester,
  createLoginPlugin,
  createOauthLoginSdk
} from '@frontend/login-sdk'
import { createMonitorPlugin } from '@frontend/monitor-sdk'
import { createPermissionPlugin, createRbacPermissionEngine } from '@frontend/permission-sdk'
import { scheduleThemeFontsLoad, useThemeStore, useUserStore } from '@frontend/store'
import { createTrackingPlugin } from '@frontend/tracking-sdk'
import FrontendUi from '@frontend/ui'

import App from './App.vue'
import { setupPortalViewportModeSync } from './utils/viewport-mode'
import { getHttpClient, setupHttpClient } from './api'
import { setupAuthRuntime } from './auth/runtime'
import { PORTAL_PUBLIC_PERMISSIONS } from './permission'
import PortalComponentsPlugin from './components'
import router from './router'

async function bootstrap(): Promise<void> {
  setupPortalViewportModeSync()

  const app = createApp(App)
  const pinia = createPinia()

  const env = loadEnvConfig(import.meta.env)
  const userStore = useUserStore(pinia)
  const themeStore = useThemeStore(pinia)

  themeStore.initMode()

  const observability = await setupObservabilityRuntime({
    router,
    userStore,
    appId: env.trackingAppId
  })

  const loginSdk = createOauthLoginSdk({
    baseUrl: env.apiBaseUrl,
    apiPrefix: env.apiPrefix,
    provider: env.oauthProvider,
    requester: createHttpClientRequester(() => getHttpClient())
  })

  const permissionEngine = createRbacPermissionEngine(PORTAL_PUBLIC_PERMISSIONS)

  setupAuthRuntime({ loginSdk, permissionEngine, userStore })
  setupHttpClient(env, loginSdk, {
    onTraceResolved: observability.setTraceId
  })

  try {
    await loginSdk.handleOAuthCallbackFromLocation(env.oauthProvider)
  } catch (error) {
    console.error('OAuth callback handling failed:', error)
  }

  app.use(router)
  app.use(pinia)
  app.use(ElementPlus)
  app.use(FrontendUi)
  app.use(PortalComponentsPlugin)
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
