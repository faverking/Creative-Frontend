<template>
  <section class="auth-page auth-page-login">
    <div class="auth-layout">
      <div class="auth-showcase">
        <span class="showcase-tag">中文内容社区</span>
        <h2>把好内容，发给真正会停留的人。</h2>
        <p class="showcase-desc">
          在一个后台里完成情报投稿、图包发布、游戏运营与创作协作，让社区内容更新更轻、更快、更稳定。
        </p>

        <div class="showcase-grid">
          <article v-for="item in featureCards" :key="item.title" class="showcase-card">
            <strong>{{ item.title }}</strong>
            <p>{{ item.desc }}</p>
          </article>
        </div>
      </div>

      <el-card class="auth-card" shadow="never">
        <div class="auth-card-header">
          <span class="form-chip">账号登录</span>
          <h3>欢迎回来</h3>
          <p>使用账号或邮箱登录，继续管理你的中文内容社区。</p>
        </div>

        <el-form
          label-position="top"
          class="auth-form"
          @keydown.enter.prevent.stop="submitLogin"
          @keyup.enter.prevent.stop="consumeEnter"
          @submit.prevent.stop="submitLogin"
        >
          <el-form-item label="账号或邮箱">
            <el-input
              v-model="form.account"
              autocomplete="username"
              placeholder="请输入账号或邮箱"
            />
          </el-form-item>

          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              autocomplete="current-password"
              placeholder="请输入密码"
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

        <el-button :loading="loading" class="auth-action" type="primary" @click="submitLogin">
          登录创作中心
        </el-button>

        <div class="auth-footer">
          <span>还没有账号？</span>
          <router-link class="auth-link" :to="registerLink">立即注册</router-link>
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

import { ensurePermissionHydrated, markPermissionDirty } from '@/auth/runtime'

const router = useRouter()
const route = useRoute()
const loginSdk = useLoginSdk()

const featureCards = [
  {
    title: '内容一站发布',
    desc: '情报、图包、游戏和书库在同一套流程里完成编辑、审核与上线。'
  },
  {
    title: '草稿自动续写',
    desc: '本地记住草稿引用，重新进入后台也能快速恢复编辑状态。'
  },
  {
    title: '面向社区运营',
    desc: '更适合中文内容社区的栏目管理、视觉表达和运营节奏。'
  }
]

const loading = ref(false)
const errorMessage = ref('')
const form = reactive({
  account: '',
  password: ''
})

const redirectTarget = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/home'
})

const registerLink = computed(() => ({
  name: 'register' as const,
  query: redirectTarget.value !== '/home' ? { redirect: redirectTarget.value } : undefined
}))

function consumeEnter(): void {}

const submitLogin = async () => {
  const account = form.account.trim()
  const password = form.password

  if (!account || !password) {
    errorMessage.value = '请输入账号和密码后再继续。'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await loginSdk.loginWithPassword({ account, password })

    // 登录、注册和 OAuth 回流都会走同一套权限水合流程。
    markPermissionDirty()
    await ensurePermissionHydrated()

    ElMessage.success('登录成功，欢迎回到创作中心。')
    await router.replace(redirectTarget.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败，请稍后重试。'
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
  grid-template-columns: minmax(0, 1.22fr) minmax(420px, 510px);
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
  min-height: clamp(520px, 68vh, 720px);
  background:
    linear-gradient(
      180deg,
      rgba(245, 252, 255, 0.94) 0%,
      rgba(183, 228, 255, 0.7) 42%,
      rgba(125, 176, 226, 0.62) 72%,
      rgba(79, 112, 164, 0.72) 100%
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
      transparent 0 15%,
      rgba(49, 83, 132, 0.2) 15% 16.6%,
      transparent 16.6% 46%,
      rgba(49, 83, 132, 0.2) 46% 47.6%,
      transparent 47.6% 77%,
      rgba(49, 83, 132, 0.2) 77% 78.6%,
      transparent 78.6% 100%
    ),
    linear-gradient(
      180deg,
      transparent 0 17%,
      rgba(49, 83, 132, 0.16) 17% 18.6%,
      transparent 18.6% 64%,
      rgba(49, 83, 132, 0.16) 64% 65.6%,
      transparent 65.6% 100%
    );
  opacity: 0.82;
}

.auth-showcase::after {
  left: -10px;
  bottom: -12px;
  width: 220px;
  height: 168px;
  border-radius: 46% 54% 0 0;
  background: radial-gradient(
    circle at 34% 30%,
    rgba(29, 56, 96, 0.98),
    rgba(11, 24, 47, 1) 68%,
    transparent 69%
  );
  box-shadow:
    84px -8px 0 -26px rgba(22, 42, 72, 0.96),
    164px -10px 0 -36px rgba(22, 42, 72, 0.92);
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
  color: #2689e0;
  background: rgba(95, 203, 255, 0.14);
}

.auth-showcase h2 {
  position: relative;
  z-index: 1;
  margin: 18px 0 14px;
  max-width: 580px;
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

.showcase-grid {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 16px;
  margin-top: 36px;
}

.showcase-card {
  width: min(460px, 100%);
  padding: 18px 18px 16px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.38), rgba(234, 245, 255, 0.14)),
    rgba(255, 255, 255, 0.16);
  box-shadow: var(--community-inner-glow);
}

.showcase-card strong {
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
}

.showcase-card p {
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

.auth-card-header p {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
}

.auth-form {
  margin-top: 20px;
}

.auth-error {
  margin-bottom: 16px;
}

.auth-action {
  width: 100%;
  height: 48px;
  border-radius: 999px;
  background: linear-gradient(135deg, #5dd0ff, #3f78c7);
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
  color: #2f73b4;
  font-weight: 600;
  text-decoration: none;
}
</style>
