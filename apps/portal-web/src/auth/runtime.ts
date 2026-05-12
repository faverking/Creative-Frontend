import {
  clearAuthSessionState,
  ensureAuthSessionFreshAccessToken,
  ensureAuthSessionHydrated,
  getAuthSessionRuntime,
  markAuthSessionDirty,
  setupAuthSessionRuntime
} from '@frontend/app-runtime'
import type { LoginSdk } from '@frontend/login-sdk'
import type { PermissionEngine } from '@frontend/permission-sdk'
import { useUserStore } from '@frontend/store'

import { clearPermissionState, syncPermissionState } from '@/permission/sync'

interface AuthRuntime {
  loginSdk: LoginSdk
  permissionEngine: PermissionEngine
  userStore: ReturnType<typeof useUserStore>
}

export function setupAuthRuntime(value: AuthRuntime): void {
  setupAuthSessionRuntime({
    ...value,
    syncPermissionState,
    clearPermissionState
  })
}

export function getAuthRuntime(): AuthRuntime | null {
  return getAuthSessionRuntime() as AuthRuntime | null
}

export async function ensureFreshAccessToken(): Promise<boolean> {
  return ensureAuthSessionFreshAccessToken()
}

export async function ensurePermissionHydrated(): Promise<void> {
  await ensureAuthSessionHydrated()
}

export function markPermissionDirty(): void {
  markAuthSessionDirty()
}

export function clearAuthState(): void {
  clearAuthSessionState()
}
