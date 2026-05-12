<template>
  <section class="auth-dialog-layer" aria-modal="true" role="dialog">
    <button
      class="auth-dialog-layer__scrim"
      type="button"
      aria-label="关闭弹窗"
      @click="closeDialog"
    />

    <div class="auth-dialog">
      <button class="auth-dialog__close" type="button" aria-label="关闭" @click="closeDialog">
        ×
      </button>

      <aside class="auth-dialog__aside">
        <div class="auth-dialog__aside-header">
          <span class="auth-dialog__aside-title">扫码登录</span>
          <p>使用移动端扫码即可登录。</p>
        </div>

        <div class="auth-dialog__qr-shell">
          <qr-placeholder-illustration class="auth-dialog__qr-illustration" />
        </div>

        <p class="auth-dialog__aside-note">使用移动端扫码即可继续登录。</p>
      </aside>

      <div class="auth-dialog__divider" />

      <div class="auth-dialog__panel">
        <div class="auth-dialog__panel-head">
          <div class="auth-dialog__tabs">
            <router-link
              class="auth-dialog__tab"
              :class="{ 'is-active': activeTab === 'login' }"
              :to="loginLink"
            >
              密码登录
            </router-link>
            <router-link
              class="auth-dialog__tab"
              :class="{ 'is-active': activeTab === 'register' }"
              :to="registerLink"
            >
              注册账号
            </router-link>
          </div>

          <p class="auth-dialog__panel-tip">
            {{ activeTab === 'login' ? '登录后可继续浏览与互动。' : '注册后即可登录。' }}
          </p>
        </div>

        <slot />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { buildAuthDialogTabLocation, resolveAuthDialogCloseLocation } from '@/utils/auth-dialog'

defineProps<{
  activeTab: 'login' | 'register'
}>()

const router = useRouter()
const route = useRoute()
const loginLink = computed(() => buildAuthDialogTabLocation(route, 'login'))
const registerLink = computed(() => buildAuthDialogTabLocation(route, 'register'))

const closeDialog = async () => {
  await router.replace(resolveAuthDialogCloseLocation(route))
}
</script>

<style scoped>
.auth-dialog-layer {
  position: fixed;
  inset: 0;
  z-index: 9;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-dialog-layer__scrim {
  position: absolute;
  inset: 0;
  border: none;
  background: var(--portal-overlay);
  backdrop-filter: blur(16px);
  cursor: pointer;
}

.auth-dialog {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(214px, 0.54fr) 1px minmax(384px, 1fr);
  width: min(820px, calc(100vw - 28px));
  min-height: 452px;
  border: 1px solid var(--portal-border-strong);
  border-radius: 28px;
  background: var(--portal-dialog-bg);
  box-shadow: var(--portal-dialog-shadow);
  backdrop-filter: blur(18px);
  overflow: hidden;
}

.auth-dialog::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 0%, rgba(105, 212, 255, 0.14), transparent 26%),
    radial-gradient(circle at 86% 12%, rgba(141, 146, 255, 0.12), transparent 24%),
    linear-gradient(180deg, var(--portal-surface-top-soft), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.auth-dialog__close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  width: 32px;
  height: 32px;
  border: 1px solid var(--portal-border);
  border-radius: 50%;
  background: var(--portal-dialog-close-bg);
  box-shadow: var(--portal-dialog-close-shadow);
  color: var(--portal-dialog-close-color);
  font-size: 22px;
  line-height: 1;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  cursor: pointer;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease,
    color 180ms ease;
}

.auth-dialog__close:hover {
  transform: translateY(-1px);
  border-color: var(--portal-border-strong);
  background: var(--portal-dialog-close-bg-hover);
  box-shadow: var(--portal-dialog-close-shadow);
  color: var(--portal-dialog-close-color-hover);
}

.auth-dialog__aside,
.auth-dialog__panel {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: start;
  gap: 14px;
  padding: 20px;
}

.auth-dialog__aside {
  align-content: center;
  background: var(--portal-dialog-aside-bg);
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.04);
}

.auth-dialog__panel {
  background: var(--portal-dialog-panel-bg);
}

.auth-dialog__aside-header,
.auth-dialog__panel-head {
  display: grid;
  gap: 8px;
}

.auth-dialog__aside-title {
  color: var(--portal-ink-strong);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: center;
}

.auth-dialog__aside-header p,
.auth-dialog__panel-tip,
:deep(.auth-dialog__agreement) {
  color: var(--portal-muted);
  font-size: 12px;
  line-height: 1.7;
}

.auth-dialog__qr-shell {
  --portal-qr-shell-bg:
    linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(238, 244, 255, 0.88)),
    radial-gradient(circle at 18% 14%, rgba(121, 225, 255, 0.26), transparent 36%),
    radial-gradient(circle at 78% 16%, rgba(170, 162, 255, 0.2), transparent 30%),
    radial-gradient(circle at 66% 76%, rgba(255, 189, 226, 0.14), transparent 26%);
  --portal-qr-shell-border: rgba(143, 170, 214, 0.28);
  --portal-qr-shell-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78), 0 18px 34px rgba(79, 109, 170, 0.14);
  --portal-qr-frame-start: #ffffff;
  --portal-qr-frame-end: #e0e8ff;
  --portal-qr-device-fill: #fbfcff;
  --portal-qr-device-stroke: #d6dff8;
  --portal-qr-device-detail: #d5def5;
  --portal-qr-screen-start: #fbfdff;
  --portal-qr-screen-end: #b7cbff;
  --portal-qr-screen-band: #ffffff;
  --portal-qr-code-bg: #ffffff;
  --portal-qr-code-module: #193c7b;
  --portal-qr-code-accent: #7ce7ff;
  --portal-qr-wave: #dce5ff;
  --portal-qr-badge-start: #81ecff;
  --portal-qr-badge-mid: #a392ff;
  --portal-qr-badge-end: #ffb6dc;
  --portal-qr-badge-mark: #ffffff;
  --portal-qr-cloud: #dbe5ff;
  --portal-qr-bubble-fill: #fffaff;
  --portal-qr-bubble-stroke: #d2d9ff;
  --portal-qr-shadow: rgba(89, 108, 170, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 208px;
  padding: 10px;
  border: 1px solid var(--portal-qr-shell-border);
  border-radius: 20px;
  background: var(--portal-qr-shell-bg);
  box-shadow: var(--portal-qr-shell-shadow);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.auth-dialog__qr-illustration {
  width: min(100%, 204px);
}

.auth-dialog__aside-note {
  padding: 8px 10px;
  border: 1px solid var(--portal-border);
  border-radius: 16px;
  background: var(--portal-dialog-note-bg);
  box-shadow: var(--portal-dialog-note-shadow);
  font-size: 12px;
  color: var(--portal-dialog-note-color);
}

.auth-dialog__divider {
  width: 1px;
  background: linear-gradient(
    180deg,
    rgba(105, 212, 255, 0),
    rgba(105, 212, 255, 0.4) 24%,
    rgba(141, 146, 255, 0.1) 100%
  );
}

.auth-dialog__tabs {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--portal-border);
}

.auth-dialog__tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  color: var(--portal-muted);
  font-size: 13px;
  font-weight: 700;
}

.auth-dialog__tab + .auth-dialog__tab::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 50%;
  width: 1px;
  height: 16px;
  background: rgba(121, 162, 205, 0.46);
  transform: translateY(-50%);
}

.auth-dialog__tab.is-active {
  color: var(--portal-primary-strong);
}

.auth-dialog__tab.is-active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -11px;
  height: 3px;
  border-radius: 999px;
  background: var(--portal-button-primary-bg);
}

:deep(.auth-dialog__form) {
  display: grid;
  gap: 12px;
}

:deep(.auth-dialog__field-item) {
  margin: 0;
}

:deep(.auth-dialog__field) {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 46px;
  padding: 0 12px 0 14px;
  border: 1px solid var(--portal-border);
  border-radius: 16px;
  background: var(--portal-dialog-field-bg);
  box-shadow:
    inset 0 0 0 1px rgba(105, 212, 255, 0.05),
    inset 0 1px 0 var(--portal-surface-top-soft);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
}

:deep(.auth-dialog__field:focus-within) {
  border-color: rgba(105, 212, 255, 0.36);
  box-shadow:
    inset 0 0 0 1px rgba(105, 212, 255, 0.12),
    0 0 0 4px var(--portal-focus-ring);
}

:deep(.auth-dialog__field-label) {
  flex: 0 0 38px;
  color: var(--portal-primary-strong);
  font-size: 13px;
  font-weight: 700;
}

:deep(.auth-dialog__field-divider) {
  width: 1px;
  height: 16px;
  margin-right: 10px;
  background: rgba(121, 162, 205, 0.48);
}

:deep(.auth-dialog__field .el-input) {
  flex: 1 1 auto;
  min-width: 0;
}

:deep(.auth-dialog__field .el-input__wrapper) {
  min-height: 44px;
  padding: 0;
  background: transparent !important;
  box-shadow: none !important;
}

:deep(.auth-dialog__field .el-input__inner) {
  color: var(--portal-ink-strong);
  font-size: 13px;
}

:deep(.auth-dialog__field .el-input__suffix) {
  margin-left: 8px;
}

:deep(.auth-dialog__alert) {
  --portal-auth-alert-border: rgba(141, 146, 255, 0.2);
  --portal-auth-alert-bg: linear-gradient(
    180deg,
    rgba(244, 248, 255, 0.9),
    rgba(233, 239, 249, 0.82)
  );
  --portal-auth-alert-title: var(--portal-ink-strong);
  --portal-auth-alert-description: var(--portal-ink-strong);
  --portal-auth-alert-icon: #d46b8c;
  --portal-auth-alert-shadow: none;
  margin-top: -2px;
  border: 1px solid var(--portal-auth-alert-border);
  border-radius: 16px;
  background: var(--portal-auth-alert-bg);
  box-shadow: var(--portal-auth-alert-shadow);
}

:deep(.auth-dialog__action-row) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.12fr);
  gap: 8px;
}

:deep(.auth-dialog__secondary-link) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  border: 1px solid var(--portal-border-strong);
  border-radius: 14px;
  background: var(--portal-button-secondary-bg);
  box-shadow: inset 0 1px 0 var(--portal-surface-top-soft);
  color: var(--portal-primary-strong);
  font-weight: 700;
}

:deep(.auth-dialog__primary-button) {
  width: 100%;
  min-height: 42px;
}

:deep(.auth-dialog__primary-button.el-button) {
  border: none;
  border-radius: 14px;
  background: var(--portal-button-primary-bg);
  box-shadow: var(--portal-button-primary-shadow);
  color: var(--portal-button-primary-ink);
}

:deep(.auth-dialog__agreement) {
  text-align: left;
}

:deep(.auth-dialog .el-alert__title),
:deep(.auth-dialog .el-alert__description) {
  color: var(--portal-auth-alert-title);
}

:deep(.auth-dialog__alert .el-alert__description) {
  color: var(--portal-auth-alert-description);
}

:deep(.auth-dialog__alert .el-alert__icon) {
  color: var(--portal-auth-alert-icon);
}
</style>
