<template>
  <el-config-provider :locale="zhCn">
    <div class="app-shell">
      <header class="app-header">
        <div class="app-brand">
          <span class="brand-pill">创作中心</span>
          <div>
            <h1>{{ displayTitle }}</h1>
            <p>面向中文内容社区的情报、图包、游戏与书库运营后台</p>
          </div>
        </div>

        <div class="app-header-actions">
          <theme-switcher :compact="showLogoutAction" />
          <button
            v-if="showLogoutAction"
            class="app-header-icon-button"
            type="button"
            aria-label="退出登录"
            title="退出登录"
            @click="logout"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M10.75 3.75a.75.75 0 0 1 0 1.5H6.5A1.25 1.25 0 0 0 5.25 6.5v11A1.25 1.25 0 0 0 6.5 18.75h4.25a.75.75 0 0 1 0 1.5H6.5a2.75 2.75 0 0 1-2.75-2.75v-11A2.75 2.75 0 0 1 6.5 3.75h4.25Zm5.72 4.22a.75.75 0 0 1 1.06 0l3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 0 1-1.06-1.06l2.22-2.22H9.75a.75.75 0 0 1 0-1.5h8.94l-2.22-2.22a.75.75 0 0 1 0-1.06Z"
              />
            </svg>
          </button>
        </div>
      </header>

      <main class="app-content">
        <router-view />
      </main>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useLoginSdk } from '@frontend/login-sdk'

import zhCn from 'element-plus/es/locale/lang/zh-cn'
import ThemeSwitcher from './components/ThemeSwitcher.vue'

import { clearAuthState } from './auth/runtime'
import { runtimeConfig } from './constants'

const route = useRoute()
const router = useRouter()
const loginSdk = useLoginSdk()

const displayTitle = computed(() => runtimeConfig.appTitle)
const showLogoutAction = computed(() => route.path.startsWith('/home'))

const logout = async () => {
  try {
    await loginSdk.logout()
  } finally {
    // 无论接口是否成功返回，都要及时清理本地会话，避免停留在失效状态。
    clearAuthState()
    await router.replace('/login')
  }
}
</script>
