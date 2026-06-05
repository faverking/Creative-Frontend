<template>
  <div class="portal-toolbar-shell">
    <header class="portal-toolbar">
      <div class="portal-toolbar__brand-panel">
        <router-link class="portal-toolbar__brand" to="/" aria-label="Portal Home">
          <span
            class="portal-toolbar__brand-art"
            :class="{ 'is-dark': isDarkTheme }"
            aria-hidden="true"
          >
            <portal-svg-icon
              v-if="isDarkTheme"
              name="brand-logo-dark"
              class="portal-toolbar__brand-logo"
              size="100%"
            />
            <portal-svg-icon
              v-else
              name="brand-logo-light"
              class="portal-toolbar__brand-logo"
              size="100%"
            />
          </span>
        </router-link>
      </div>

      <div class="portal-toolbar__nav-panel">
        <nav class="portal-toolbar__nav" aria-label="Portal toolbar">
          <div class="portal-toolbar__main-nav" aria-label="Portal primary navigation">
            <router-link
              v-for="item in primaryNavLinks"
              :key="item.key"
              :to="item.to"
              class="portal-toolbar__primary-link"
              :class="{ 'is-active': activePrimaryNavKey === item.key }"
            >
              <span class="portal-toolbar__primary-text">{{ item.label }}</span>
            </router-link>
          </div>

          <div class="portal-toolbar__utility-nav">
            <div class="portal-toolbar__utility-group">
              <span class="portal-toolbar__slot">
                <el-popover
                  :disabled="!isAuthenticated"
                  trigger="hover"
                  placement="bottom"
                  :offset="10"
                  :show-arrow="false"
                  popper-class="portal-toolbar__account-popper"
                >
                  <template #reference>
                    <router-link
                      :to="accountLink.to"
                      :aria-label="accountLink.title"
                      class="portal-toolbar__item"
                      :class="[
                        `portal-toolbar__item--${accountLink.key}`,
                        `portal-toolbar__item--tone-${accountLink.tone}`,
                        { 'portal-toolbar__item--account-authenticated': isAuthenticated }
                      ]"
                      :title="isAuthenticated ? undefined : accountLink.title"
                    >
                      <portal-svg-icon
                        :name="accountLink.iconName"
                        class="portal-toolbar__icon"
                        :class="{ 'portal-toolbar__icon--account': isAuthenticated }"
                      />
                      <span v-if="accountLink.label" class="portal-toolbar__label">
                        {{ accountLink.label }}
                      </span>
                    </router-link>
                  </template>

                  <div v-if="isAuthenticated" class="portal-toolbar__account-panel">
                    <p class="portal-toolbar__account-name">{{ accountDisplayName }}</p>

                    <button
                      type="button"
                      class="portal-toolbar__account-action"
                      @click="handleLogout"
                    >
                      注销登录
                    </button>
                  </div>
                </el-popover>
              </span>
            </div>

            <div class="portal-toolbar__utility-group">
              <span v-for="item in utilityLinks" :key="item.key" class="portal-toolbar__slot">
                <router-link
                  :to="item.to"
                  :aria-label="item.title"
                  class="portal-toolbar__item"
                  :class="[
                    `portal-toolbar__item--${item.key}`,
                    `portal-toolbar__item--tone-${item.tone}`,
                    { 'has-indicator': item.showIndicator }
                  ]"
                  :title="item.title"
                >
                  <portal-svg-icon :name="item.iconName" class="portal-toolbar__icon" />
                  <span v-if="item.label" class="portal-toolbar__label">{{ item.label }}</span>
                  <span
                    v-if="item.showIndicator"
                    class="portal-toolbar__indicator"
                    aria-hidden="true"
                  />
                </router-link>
              </span>
            </div>

            <div class="portal-toolbar__utility-group portal-toolbar__utility-group--cta">
              <span class="portal-toolbar__slot">
                <a
                  :href="createLink.href"
                  :aria-label="createLink.title"
                  class="portal-toolbar__item"
                  :class="[
                    `portal-toolbar__item--${createLink.key}`,
                    `portal-toolbar__item--tone-${createLink.tone}`
                  ]"
                  :title="createLink.title"
                >
                  <portal-svg-icon :name="createLink.iconName" class="portal-toolbar__icon" />
                  <span v-if="createLink.label" class="portal-toolbar__label">
                    {{ createLink.label }}
                  </span>
                </a>
              </span>
            </div>

            <div class="portal-toolbar__utility-group portal-toolbar__utility-group--controls">
              <span class="portal-toolbar__slot portal-toolbar__slot--theme">
                <div class="portal-toolbar__item portal-toolbar__item--theme" title="Theme switch">
                  <theme-switcher />
                </div>
              </span>
            </div>
          </div>
        </nav>
      </div>
    </header>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type RouteLocationRaw, useRoute, useRouter } from 'vue-router'

import { useThemeStore, useUserStore } from '@frontend/store'

import type { PortalIconName } from './icons/portalIconRegistry'
import { clearAuthState, getAuthRuntime } from '@/auth/runtime'
import {
  PORTAL_PRIMARY_NAV_ITEMS,
  PORTAL_UTILITY_NAV_ITEMS,
  resolvePortalPrimaryNavKey,
  type PortalPrimaryNavKey
} from '@/constants/portal-navigation'
import { runtimeConfig } from '@/constants/runtime'
import {
  PORTAL_WORKSPACE_ROOT_PATH,
  PORTAL_WORKSPACE_ROUTE_NAMES,
  type PortalWorkspaceSection
} from '@/constants/workspace'
import { buildWorkspacePath } from '@/utils/workspace'

type ToolbarIconName = Extract<
  PortalIconName,
  'login' | 'message' | 'favorite' | 'history' | 'studio' | 'user-avatar'
>

interface ToolbarItem {
  key: 'account' | PortalWorkspaceSection | 'studio'
  label: string
  title: string
  to: RouteLocationRaw
  iconName: ToolbarIconName
  tone: 'default' | 'accent' | 'cta'
  showIndicator?: boolean
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

const userName = computed(() => userStore.profile?.name?.trim() ?? '')
const userEmail = computed(() => userStore.profile?.email?.trim() ?? '')
const accountDisplayName = computed(() => userName.value || userEmail.value || '当前账号')
const isAuthenticated = computed(() => Boolean(userStore.profile?.id))
const isDarkTheme = computed(() => themeStore.mode === 'dark')

function createLoginTarget(redirectPath: string): RouteLocationRaw {
  return {
    name: 'login' as const,
    query: {
      redirect: redirectPath
    }
  }
}

function resolveWorkspaceTarget(section?: PortalWorkspaceSection): RouteLocationRaw {
  const targetSection = section ?? 'messages'

  if (isAuthenticated.value) {
    return {
      name: PORTAL_WORKSPACE_ROUTE_NAMES[targetSection]
    }
  }

  return createLoginTarget(buildWorkspacePath(targetSection))
}

function resolveWorkspaceRootTarget(): RouteLocationRaw {
  if (isAuthenticated.value) {
    return {
      name: PORTAL_WORKSPACE_ROUTE_NAMES.root
    }
  }

  return createLoginTarget(PORTAL_WORKSPACE_ROOT_PATH)
}

function resolvePrimaryTarget(item: (typeof PORTAL_PRIMARY_NAV_ITEMS)[number]): RouteLocationRaw {
  if ('routeName' in item) {
    return {
      name: item.routeName
    }
  }

  return item.path
}

const workspaceRootTarget = computed<RouteLocationRaw>(() => resolveWorkspaceRootTarget())
const primaryNavLinks = PORTAL_PRIMARY_NAV_ITEMS.map((item) => ({
  ...item,
  to: resolvePrimaryTarget(item)
}))

const activePrimaryNavKey = computed<PortalPrimaryNavKey | null>(() =>
  resolvePortalPrimaryNavKey(typeof route.name === 'string' ? route.name : null, route.path)
)

const utilityLinks = computed<ToolbarItem[]>(() =>
  PORTAL_UTILITY_NAV_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    title: item.label,
    to: resolveWorkspaceTarget(item.key),
    iconName: item.iconName,
    tone: 'default',
    showIndicator: item.showIndicator && isAuthenticated.value
  }))
)

const createLink = computed(() => ({
  key: 'studio',
  label: '创作',
  title: '创作中心',
  href: runtimeConfig.adminWebBaseUrl,
  iconName: 'studio',
  tone: 'cta'
}))

const accountLink = computed<ToolbarItem>(() => ({
  key: 'account',
  label: isAuthenticated.value ? '' : '登录',
  title: isAuthenticated.value ? accountDisplayName.value : '登录',
  to: workspaceRootTarget.value,
  iconName: isAuthenticated.value ? 'user-avatar' : 'login',
  tone: 'accent'
}))

async function handleLogout(): Promise<void> {
  const runtime = getAuthRuntime()

  try {
    await runtime?.loginSdk.logout()
  } finally {
    clearAuthState()
  }

  if (route.matched.some((record) => record.meta.requiresAuth)) {
    await router.replace('/')
  }
}
</script>

<style scoped>
.portal-toolbar-shell {
  --toolbar-ease: cubic-bezier(0.22, 1, 0.36, 1);
  position: sticky;
  top: 0;
  z-index: 6;
  width: 100%;
}

.portal-toolbar {
  position: relative;
  display: flex;
  align-items: flex-start;
  width: 100%;
  min-height: 78px;
}

.portal-toolbar__brand-panel,
.portal-toolbar__nav-panel {
  position: relative;
  transition:
    border-color 260ms var(--toolbar-ease),
    box-shadow 260ms var(--toolbar-ease),
    background 260ms var(--toolbar-ease);
}

.portal-toolbar__nav-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--toolbar-nav-glow);
  pointer-events: none;
}

.portal-toolbar__nav-panel::after {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 0;
  height: 1px;
  background: var(--toolbar-edge-line);
  opacity: 0.82;
  pointer-events: none;
}

.portal-toolbar__brand-panel {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  overflow: visible;
  padding-left: 16px;
  width: 186px;
  height: 78px;
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.portal-toolbar__brand-panel::before,
.portal-toolbar__brand-panel::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  clip-path: path('M0 0H186V18C186 28 184 37 179 46C174 55 165 62 151 69C138 75 123 78 107 78H0Z');
}

.portal-toolbar__brand-panel::before {
  z-index: 0;
  border: 1px solid var(--toolbar-panel-border);
  background: var(--toolbar-panel-brand-bg);
  box-shadow: var(--toolbar-panel-shadow);
  backdrop-filter: blur(18px) saturate(1.08);
  -webkit-backdrop-filter: blur(18px) saturate(1.08);
}

.portal-toolbar__brand-panel::after {
  z-index: 1;
  background: var(--toolbar-brand-glow);
}

.portal-toolbar__brand {
  position: relative;
  z-index: 2;
  display: block;
  width: 158px;
  height: 72px;
  text-decoration: none;
}

.portal-toolbar__brand-art {
  position: absolute;
  top: 50%;
  left: 0;
  width: 256px;
  aspect-ratio: 1280 / 420;
  transform: translate(-20px, -50%);
  opacity: 0.98;
  transform-origin: left center;
  user-select: none;
  pointer-events: none;
  transition:
    transform 260ms var(--toolbar-ease),
    opacity 260ms var(--toolbar-ease);
}

.portal-toolbar__brand-logo {
  position: absolute;
  inset: 0;
  left: 0;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 10px 18px rgba(18, 41, 74, 0.12));
}

.portal-toolbar__brand-art.is-dark .portal-toolbar__brand-logo {
  filter: drop-shadow(0 10px 20px rgba(5, 12, 24, 0.36));
}

.portal-toolbar__nav-panel {
  z-index: 1;
  width: 100%;
  min-width: 0;
  height: 64px;
  border: 1px solid var(--toolbar-panel-border);
  background: var(--toolbar-panel-nav-bg);
  box-shadow: var(--toolbar-panel-shadow);
  backdrop-filter: blur(18px) saturate(1.08);
  -webkit-backdrop-filter: blur(18px) saturate(1.08);
  border-radius: 0 0 22px 22px;
  overflow: hidden;
}

.portal-toolbar__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  gap: 16px;
  padding: 0 16px 0 202px;
  box-sizing: border-box;
}

.portal-toolbar__main-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
}

.portal-toolbar__primary-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 11px;
  border-radius: 12px;
  color: color-mix(in srgb, var(--toolbar-text) 92%, transparent);
  text-decoration: none;
  transition:
    color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    opacity 180ms ease;
}

.portal-toolbar__primary-link::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 4px;
  z-index: 0;
  height: 2px;
  border-radius: 999px;
  background: var(--toolbar-item-line);
  opacity: 0;
  transform: scaleX(0.56);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.portal-toolbar__primary-link.is-active,
.portal-toolbar__primary-link:hover {
  color: var(--toolbar-text-strong);
  background: color-mix(in srgb, var(--toolbar-item-hover-bg) 44%, transparent);
}

.portal-toolbar__primary-link:hover::after,
.portal-toolbar__primary-link.is-active::after {
  opacity: 1;
  transform: scaleX(1);
}

.portal-toolbar__primary-link.is-active {
  color: var(--toolbar-text-strong);
  background: color-mix(in srgb, var(--toolbar-item-hover-bg) 88%, transparent);
  box-shadow: var(--toolbar-primary-link-active-shadow);
}

.portal-toolbar__primary-text {
  position: relative;
  z-index: 1;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 650;
  line-height: 1;
  letter-spacing: 0.03em;
}

.portal-toolbar__utility-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.portal-toolbar__utility-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.portal-toolbar__utility-group--cta {
  padding-left: 4px;
}

.portal-toolbar__utility-group--controls {
  gap: 8px;
  padding-left: 6px;
}

.portal-toolbar__utility-group + .portal-toolbar__utility-group {
  position: relative;
}

.portal-toolbar__utility-group + .portal-toolbar__utility-group::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 50%;
  width: 1px;
  height: 18px;
  background: var(--toolbar-line);
  transform: translateY(-50%);
  opacity: 0.92;
  z-index: 0;
}

.portal-toolbar__slot {
  position: relative;
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

.portal-toolbar__slot--theme {
  margin-left: 2px;
}

.portal-toolbar__item {
  display: flex;
  position: relative;
  align-self: center;
  isolation: isolate;
  z-index: 1;
  width: 54px;
  height: 44px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px 5px;
  overflow: hidden;
  border: 1px solid var(--toolbar-item-border);
  border-radius: 17px;
  box-sizing: border-box;
  color: var(--toolbar-text);
  text-decoration: none;
  background: transparent;
  box-shadow: none;
  transition:
    transform 180ms ease,
    color 180ms ease,
    background 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.portal-toolbar__item::before {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 4px;
  z-index: -1;
  height: 2px;
  border-radius: 999px;
  background: var(--toolbar-item-line);
  opacity: 0;
  transform: scaleX(0.56);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.portal-toolbar__item::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -2;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0));
  opacity: 0;
  transition: opacity 180ms ease;
  pointer-events: none;
}

.portal-toolbar__item:hover {
  transform: translateY(-1px);
  color: var(--toolbar-text-strong);
  background: var(--toolbar-item-hover-bg);
  border-color: var(--toolbar-item-hover-border);
  box-shadow: var(--toolbar-item-hover-shadow);
}

.portal-toolbar__item:hover::before,
.portal-toolbar__item--tone-accent::before,
.portal-toolbar__item--tone-cta::before {
  opacity: 1;
  transform: scaleX(1);
}

.portal-toolbar__item:hover::after,
.portal-toolbar__item--tone-accent::after,
.portal-toolbar__item--tone-cta::after {
  opacity: 1;
}

.portal-toolbar__item--tone-accent {
  color: var(--toolbar-text-strong);
  background: var(--toolbar-item-accent-bg);
  border-color: var(--toolbar-item-accent-border);
  box-shadow: var(--toolbar-item-accent-shadow);
}

.portal-toolbar__item--tone-cta {
  color: var(--toolbar-highlight);
  background: var(--toolbar-item-cta-bg);
  border-color: var(--toolbar-item-cta-border);
  box-shadow: var(--toolbar-item-cta-shadow);
}

.portal-toolbar__item--tone-cta .portal-toolbar__label {
  font-weight: 700;
}

.portal-toolbar__item--account-authenticated {
  width: 44px;
  height: 44px;
  gap: 0;
  padding: 0;
  border-radius: 17px;
}

.portal-toolbar__item--theme {
  width: auto;
  gap: 0;
  padding-inline: 4px 0;
  border: none;
}

.portal-toolbar__item--theme::before,
.portal-toolbar__item--theme::after {
  display: none;
}

.portal-toolbar__item--theme:hover {
  transform: translateY(0);
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}

.portal-toolbar__icon {
  flex: 0 0 auto;
}

.portal-toolbar__icon {
  --portal-icon-size: 18px;
}

.portal-toolbar__icon--account {
  --portal-icon-size: 32px;
}

.portal-toolbar__indicator {
  position: absolute;
  top: 9px;
  right: 10px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--toolbar-indicator-bg);
  box-shadow:
    0 0 0 3px var(--toolbar-indicator-ring),
    0 0 12px var(--toolbar-indicator-glow);
  pointer-events: none;
}

.portal-toolbar__label {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.01em;
  opacity: 0.9;
  transform: translateY(0.5px);
}

.portal-toolbar__item:hover .portal-toolbar__label,
.portal-toolbar__item--tone-accent .portal-toolbar__label,
.portal-toolbar__item--tone-cta .portal-toolbar__label {
  opacity: 1;
}
</style>

<style>
.portal-toolbar__account-panel {
  display: grid;
  gap: 10px;
}

.portal-toolbar__account-name {
  margin: 0;
  padding: 2px 2px 8px;
  color: var(--portal-ink-strong);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-bottom: 1px solid color-mix(in srgb, var(--portal-module-filter-border) 92%, transparent);
}

.portal-toolbar__account-action {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--portal-module-filter-button-border);
  border-radius: 14px;
  background: var(--portal-module-filter-button-bg);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--portal-surface-top-soft) 100%, transparent),
    0 10px 18px color-mix(in srgb, var(--portal-primary-strong) 10%, transparent);
  color: var(--portal-module-filter-button-ink);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease;
}

.portal-toolbar__account-action:hover {
  transform: translateY(-1px);
  border-color: color-mix(
    in srgb,
    var(--portal-primary-strong) 30%,
    var(--portal-module-filter-button-border)
  );
  background: color-mix(
    in srgb,
    var(--portal-module-filter-button-bg) 80%,
    var(--portal-surface-top-soft)
  );
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--portal-surface-top) 100%, transparent),
    0 14px 22px color-mix(in srgb, var(--portal-primary-strong) 16%, transparent);
}

.portal-toolbar__account-popper.el-popover {
  min-width: 188px;
  padding: 12px;
  border: 1px solid var(--portal-module-filter-border);
  border-radius: 20px;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--portal-surface-top-soft) 100%, transparent),
      transparent 26%
    ),
    var(--portal-module-filter-bg);
  box-shadow:
    var(--portal-module-filter-shadow),
    0 18px 30px color-mix(in srgb, var(--portal-primary-strong) 12%, transparent);
  backdrop-filter: blur(18px) saturate(1.08);
  -webkit-backdrop-filter: blur(18px) saturate(1.08);
}
</style>
