<template>
  <section class="auth-page auth-page-register">
    <div class="auth-layout">
      <div class="auth-showcase">
        <span class="showcase-tag">新作者入驻</span>
        <h2>创建你的社区创作者账号。</h2>
        <p class="showcase-desc">
          注册成功后会自动登录，你可以马上开始写情报、发图包、做游戏内容，把社区内容运营节奏掌握在自己手里。
        </p>

        <div class="showcase-points">
          <div v-for="item in registerHighlights" :key="item.title" class="showcase-point">
            <strong>{{ item.title }}</strong>
            <p>{{ item.desc }}</p>
          </div>
        </div>
      </div>

      <el-card class="auth-card" shadow="never">
        <div class="auth-card-header">
          <span class="form-chip">注册账号</span>
          <h3>加入创作中心</h3>
          <p>面向中文内容社区的后台账号，注册后即可开始投稿与内容运营。</p>
        </div>

        <el-form
          label-position="top"
          class="auth-form"
          @keydown.enter.prevent.stop="submitRegister"
          @keyup.enter.prevent.stop="consumeEnter"
          @submit.prevent.stop="submitRegister"
        >
          <el-form-item label="邮箱">
            <el-input v-model="form.email" autocomplete="email" placeholder="请输入常用邮箱" />
          </el-form-item>

          <el-form-item label="昵称">
            <el-input v-model="form.name" maxlength="40" placeholder="请输入 2-40 个字符的昵称" />
          </el-form-item>

          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              autocomplete="new-password"
              placeholder="请输入 8-72 位密码"
              show-password
              type="password"
            />
          </el-form-item>

          <el-form-item label="确认密码">
            <el-input
              v-model="form.confirmPassword"
              autocomplete="new-password"
              placeholder="请再次输入密码"
              show-password
              type="password"
            />
          </el-form-item>
        </el-form>

        <el-alert
          v-if="errorMessage"
          :closable="false"
          :title="errorMessage"
          class="auth-error"
          type="error"
        />

        <p class="auth-hint">注册成功后将自动登录并进入创作中心首页。</p>

        <el-button :loading="loading" class="auth-action" type="primary" @click="submitRegister">
          立即注册
        </el-button>

        <div class="auth-footer">
          <span>已经有账号？</span>
          <router-link class="auth-link" :to="loginLink">返回登录</router-link>
        </div>
      </el-card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'

import { useLoginSdk } from '@frontend/login-sdk'

import { authApi } from '@/api'
import { ensurePermissionHydrated, markPermissionDirty } from '@/auth/runtime'

const router = useRouter()
const route = useRoute()
const loginSdk = useLoginSdk()

const registerHighlights = [
  {
    title: '情报创作',
    desc: '支持富文本编辑、情报分类、摘要补全与草稿续写。'
  },
  {
    title: '图包发布',
    desc: '批量上传社区图片，自动拿到媒体 ID 后完成图包发布。'
  },
  {
    title: '运营协同',
    desc: '更适合中文社区的内容节奏、业务组织与视觉表达。'
  }
]

const loading = ref(false)
const errorMessage = ref('')
const form = reactive({
  email: '',
  name: '',
  password: '',
  confirmPassword: ''
})

const redirectTarget = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/home'
})

const loginLink = computed(() => ({
  name: 'login' as const,
  query: redirectTarget.value !== '/home' ? { redirect: redirectTarget.value } : undefined
}))

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

    // 注册成功后直接复用登录态和权限水合，减少额外的二次登录步骤。
    loginSdk.setTokens(result.tokens)
    markPermissionDirty()
    await ensurePermissionHydrated()

    ElMessage.success('注册成功，欢迎加入创作中心。')
    await router.replace(redirectTarget.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '注册失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 180px);
  display: flex;
  align-items: stretch;
}

.auth-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(420px, 510px);
  gap: 28px;
  width: 100%;
}

.auth-showcase,
.auth-card {
  border: 1px solid var(--community-border);
  border-radius: 32px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.05)),
    var(--community-surface);
  backdrop-filter: blur(22px);
  box-shadow: var(--community-shadow), var(--community-inner-glow);
}

.auth-showcase {
  position: relative;
  overflow: hidden;
  padding: 40px;
  min-height: clamp(540px, 69vh, 740px);
  background:
    linear-gradient(
      180deg,
      rgba(247, 252, 255, 0.94) 0%,
      rgba(190, 230, 255, 0.72) 40%,
      rgba(128, 179, 230, 0.64) 70%,
      rgba(83, 116, 170, 0.74) 100%
    ),
    var(--community-surface);
}

.auth-showcase::before,
.auth-showcase::after {
  content: '';
  position: absolute;
}

.auth-showcase::before {
  inset: 0;
  background:
    linear-gradient(
      90deg,
      transparent 0 14%,
      rgba(49, 83, 132, 0.18) 14% 15.8%,
      transparent 15.8% 45%,
      rgba(49, 83, 132, 0.18) 45% 46.8%,
      transparent 46.8% 76%,
      rgba(49, 83, 132, 0.18) 76% 77.8%,
      transparent 77.8% 100%
    ),
    linear-gradient(
      180deg,
      transparent 0 17%,
      rgba(49, 83, 132, 0.16) 17% 18.6%,
      transparent 18.6% 63%,
      rgba(49, 83, 132, 0.16) 63% 64.8%,
      transparent 64.8% 100%
    );
  opacity: 0.82;
}

.auth-showcase::after {
  right: -10px;
  bottom: -14px;
  width: 238px;
  height: 172px;
  border-radius: 54% 46% 0 0;
  background: radial-gradient(
    circle at 64% 30%,
    rgba(29, 56, 96, 0.98),
    rgba(11, 24, 47, 1) 68%,
    transparent 69%
  );
  box-shadow:
    -84px -6px 0 -28px rgba(22, 42, 72, 0.94),
    -156px -6px 0 -42px rgba(22, 42, 72, 0.88);
}

.showcase-tag,
.form-chip {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  color: #2f73b4;
  background: rgba(95, 203, 255, 0.14);
}

.auth-showcase h2 {
  position: relative;
  z-index: 1;
  margin: 18px 0 14px;
  max-width: 520px;
  font-size: clamp(22px, 2.4vw, 24px);
  line-height: 1.14;
  letter-spacing: -0.03em;
}

.showcase-desc {
  position: relative;
  z-index: 1;
  max-width: 560px;
  margin: 0;
  font-size: 14px;
  line-height: 1.85;
  color: rgba(18, 49, 82, 0.78);
}

.showcase-points {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 16px;
  margin-top: 36px;
}

.showcase-point {
  width: min(460px, 100%);
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.38), rgba(234, 245, 255, 0.14)),
    rgba(255, 255, 255, 0.16);
  box-shadow: var(--community-inner-glow);
}

.showcase-point strong {
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
}

.showcase-point p {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
}

.auth-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.32), rgba(239, 247, 255, 0.12)),
    var(--community-surface-strong);
}

.auth-card-header {
  margin-bottom: 8px;
}

.auth-card-header h3 {
  margin: 16px 0 10px;
  font-size: 24px;
}

.auth-card-header p,
.auth-hint {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
}

.auth-form {
  margin-top: 20px;
}

.auth-error,
.auth-hint {
  margin-bottom: 16px;
}

.auth-action {
  width: 100%;
  height: 48px;
  border-radius: 999px;
  background: linear-gradient(135deg, #60d2ff, #3f78c7);
  border: none;
}

.auth-footer {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 18px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.auth-link {
  color: #3e7bc1;
  font-weight: 600;
  text-decoration: none;
}
</style>
