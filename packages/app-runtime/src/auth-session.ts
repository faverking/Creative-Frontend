import type { LoginUser, LoginSdk } from '@frontend/login-sdk'
import type { PermissionEngine } from '@frontend/permission-sdk'
import type { GlobalUserProfile } from '@frontend/store'

import { createAuthRuntimeCore } from './auth-runtime-core'

// auth-session 是 app-runtime 里最贴近应用层的一层：
// 它不重新实现登录或权限，而是把 login-sdk、permission-engine 和 userStore
// 编排成“应用真正需要的会话运行时”。

interface UserStoreLike {
  setUser(profile: GlobalUserProfile | null): void
  markHydrated(): void
  clearUser(): void
  markStale(): void
}

export interface AuthSessionRuntimeOptions {
  loginSdk: LoginSdk
  permissionEngine: PermissionEngine
  userStore: UserStoreLike
  // 权限同步由应用注入，目的是允许不同应用保留自己的权限装配方式，
  // 但共享同一套会话编排能力。
  syncPermissionState: (
    loginSdk: LoginSdk,
    permissionEngine: PermissionEngine,
    onUserResolved?: (user: LoginUser | null) => void
  ) => Promise<void>
  clearPermissionState: (permissionEngine: PermissionEngine) => void
  mapUserToProfile?: (user: LoginUser | null) => GlobalUserProfile | null
}

function defaultMapUserToProfile(user: LoginUser | null): GlobalUserProfile | null {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    permissions: user.permissions,
    status: user.status
  }
}

let runtime: AuthSessionRuntimeOptions | null = null

// 用户信息最终统一落到全局 store，页面只消费 profile，
// 不需要直接依赖 login-sdk 返回的原始用户结构。
function applyResolvedUser(user: LoginUser | null): void {
  const current = runtime
  if (!current) {
    return
  }

  const mapper = current.mapUserToProfile ?? defaultMapUserToProfile
  current.userStore.setUser(mapper(user))
  current.userStore.markHydrated()
}

const authRuntimeCore = createAuthRuntimeCore({
  refreshAccessToken: async () => runtime?.loginSdk.refreshToken(),
  hydrate: async () => {
    const current = runtime
    if (!current) {
      return
    }

    await current.syncPermissionState(current.loginSdk, current.permissionEngine, applyResolvedUser)
  },
  onRefreshFailure: () => {
    clearAuthSessionState()
  },
  onHydrateFailure: () => {
    const current = runtime
    if (!current) {
      return
    }

    current.clearPermissionState(current.permissionEngine)
    current.userStore.clearUser()
  },
  onDirty: () => {
    runtime?.userStore.markStale()
  }
})

// setup 的职责是“挂接当前应用的实现”，而不是立即做网络请求。
// 真正的刷新和水合交给 ensure* 系列函数按需触发。
export function setupAuthSessionRuntime(options: AuthSessionRuntimeOptions): void {
  runtime = options
  authRuntimeCore.reset()
  authRuntimeCore.markDirty()
}

export function getAuthSessionRuntime(): AuthSessionRuntimeOptions | null {
  return runtime
}

export async function ensureAuthSessionFreshAccessToken(): Promise<boolean> {
  if (!runtime) {
    return false
  }

  return authRuntimeCore.ensureFreshAccessToken()
}

export async function ensureAuthSessionHydrated(): Promise<void> {
  if (!runtime) {
    return
  }

  await authRuntimeCore.ensureHydrated()
}

export function markAuthSessionDirty(): void {
  authRuntimeCore.markDirty()
}

// 清理会话时同时清 token、清用户、清权限，目的是避免 UI 与权限状态残留。
export function clearAuthSessionState(): void {
  const current = runtime
  if (!current) {
    return
  }

  current.loginSdk.clearToken()
  current.userStore.clearUser()
  current.clearPermissionState(current.permissionEngine)
  authRuntimeCore.markDirty()
}
