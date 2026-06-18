<template>
  <auth-dialog-shell active-tab="login">
    <form
      class="auth-dialog__form"
      @keydown.enter.prevent.stop="submitLogin"
      @keyup.enter.prevent.stop="consumeEnter"
      @submit.prevent.stop="submitLogin"
    >
      <div class="auth-dialog__field-item">
        <div class="auth-dialog__field">
          <span class="auth-dialog__field-label">账号</span>
          <span class="auth-dialog__field-divider" />
          <el-input
            v-model="form.account"
            aria-label="账号或邮箱"
            autocomplete="username"
            placeholder="请输入账号或邮箱"
          />
        </div>
      </div>

      <div class="auth-dialog__field-item">
        <div class="auth-dialog__field">
          <span class="auth-dialog__field-label">密码</span>
          <span class="auth-dialog__field-divider" />
          <el-input
            v-model="form.password"
            aria-label="密码"
            autocomplete="current-password"
            placeholder="请输入密码"
            show-password
            type="password"
          />
        </div>
      </div>

      <el-alert
        v-if="errorMessage"
        :closable="false"
        :title="errorMessage"
        class="auth-dialog__alert"
        type="error"
      />

      <div class="auth-dialog__action-row">
        <router-link class="auth-dialog__secondary-link" :to="registerLink">注册</router-link>
        <el-button
          :loading="loading"
          class="auth-dialog__primary-button"
          native-type="submit"
          type="primary"
        >
          登录
        </el-button>
      </div>
    </form>

    <p class="auth-dialog__agreement">登录后可使用收藏、评论、下载等功能。</p>
  </auth-dialog-shell>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useLoginSdk } from '@frontend/login-sdk'

import { ensurePermissionHydrated, markPermissionDirty } from '@/auth/runtime'
import { buildAuthDialogTabLocation, resolveAuthRedirectPath } from '@/utils/auth-dialog'
import { portalMessage } from '@/utils/portal-message'

const router = useRouter()
const route = useRoute()
const loginSdk = useLoginSdk()

const loading = ref(false)
const errorMessage = ref('')
const form = reactive({
  account: '',
  password: ''
})

const redirectTarget = computed(() => resolveAuthRedirectPath(route))

const registerLink = computed(() => buildAuthDialogTabLocation(route, 'register'))

function consumeEnter(): void {}

const submitLogin = async () => {
  const account = form.account.trim()
  const password = form.password

  if (!account || !password) {
    errorMessage.value = '请输入账号和密码后继续。'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await loginSdk.loginWithPassword({ account, password })
    markPermissionDirty()
    await ensurePermissionHydrated()

    portalMessage.success('登录成功。')
    await router.replace(redirectTarget.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}
</script>
