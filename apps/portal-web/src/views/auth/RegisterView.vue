<template>
  <auth-dialog-shell active-tab="register">
    <form
      class="auth-dialog__form"
      @keydown.enter.prevent.stop="submitRegister"
      @keyup.enter.prevent.stop="consumeEnter"
      @submit.prevent.stop="submitRegister"
    >
      <div class="auth-dialog__field-item">
        <div class="auth-dialog__field">
          <span class="auth-dialog__field-label">邮箱</span>
          <span class="auth-dialog__field-divider" />
          <el-input
            v-model="form.email"
            aria-label="邮箱"
            autocomplete="email"
            placeholder="请输入常用邮箱"
          />
        </div>
      </div>

      <div class="auth-dialog__field-item">
        <div class="auth-dialog__field">
          <span class="auth-dialog__field-label">昵称</span>
          <span class="auth-dialog__field-divider" />
          <el-input
            v-model="form.name"
            aria-label="昵称"
            maxlength="40"
            placeholder="请输入 2-40 个字符的昵称"
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
            autocomplete="new-password"
            placeholder="请输入 8-72 位密码"
            show-password
            type="password"
          />
        </div>
      </div>

      <div class="auth-dialog__field-item">
        <div class="auth-dialog__field">
          <span class="auth-dialog__field-label">确认</span>
          <span class="auth-dialog__field-divider" />
          <el-input
            v-model="form.confirmPassword"
            aria-label="确认密码"
            autocomplete="new-password"
            placeholder="请再次输入密码"
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
        <router-link class="auth-dialog__secondary-link" :to="loginLink">返回登录</router-link>
        <el-button
          :loading="loading"
          class="auth-dialog__primary-button"
          native-type="submit"
          type="primary"
        >
          注册并登录
        </el-button>
      </div>
    </form>

    <p class="auth-dialog__agreement">注册即表示同意用户协议与隐私策略。</p>
  </auth-dialog-shell>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import { useLoginSdk } from '@frontend/login-sdk'

import { authApi } from '@/api'
import { ensurePermissionHydrated, markPermissionDirty } from '@/auth/runtime'
import { buildAuthDialogTabLocation, resolveAuthRedirectPath } from '@/utils/auth-dialog'

const router = useRouter()
const route = useRoute()
const loginSdk = useLoginSdk()

const loading = ref(false)
const errorMessage = ref('')
const form = reactive({
  email: '',
  name: '',
  password: '',
  confirmPassword: ''
})

const redirectTarget = computed(() => resolveAuthRedirectPath(route))

const loginLink = computed(() => buildAuthDialogTabLocation(route, 'login'))

function consumeEnter(): void {}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validateForm(): boolean {
  const email = form.email.trim()
  const name = form.name.trim()

  if (!isEmail(email)) {
    errorMessage.value = '请输入正确的邮箱地址。'
    return false
  }

  if (name.length < 2 || name.length > 40) {
    errorMessage.value = '昵称需要在 2 到 40 个字符之间。'
    return false
  }

  if (form.password.length < 8 || form.password.length > 72) {
    errorMessage.value = '密码长度需要在 8 到 72 位之间。'
    return false
  }

  if (form.password !== form.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致。'
    return false
  }

  return true
}

const submitRegister = async () => {
  errorMessage.value = ''
  if (!validateForm()) {
    return
  }

  loading.value = true

  try {
    const result = await authApi.register({
      email: form.email.trim(),
      name: form.name.trim(),
      password: form.password
    })

    loginSdk.setTokens(result.tokens)
    markPermissionDirty()
    await ensurePermissionHydrated()

    ElMessage.success('注册成功。')
    await router.replace(redirectTarget.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '注册失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}
</script>
