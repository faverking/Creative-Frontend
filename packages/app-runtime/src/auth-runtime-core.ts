// auth-runtime-core 是一层最小状态机：
// 只关心“刷新 token 是否并发合并”和“权限/用户是否已经完成水合”，
// 不感知具体 SDK、store 或框架环境。
export interface AuthRuntimeCoreOptions {
  refreshAccessToken: () => Promise<string | undefined>
  hydrate: () => Promise<void>
  onRefreshFailure?: () => void
  onHydrateFailure?: () => void
  onDirty?: () => void
}

export interface AuthRuntimeCore {
  ensureFreshAccessToken(): Promise<boolean>
  ensureHydrated(): Promise<void>
  markDirty(): void
  reset(): void
}

export function createAuthRuntimeCore(options: AuthRuntimeCoreOptions): AuthRuntimeCore {
  // 并发中的刷新/水合会被复用，避免同一时刻发出重复请求。
  let refreshingPromise: Promise<boolean> | null = null
  let hydratePromise: Promise<void> | null = null
  let hydrated = false

  return {
    async ensureFreshAccessToken(): Promise<boolean> {
      // 多个调用方同时要求刷新时，只复用同一个 Promise。
      if (!refreshingPromise) {
        refreshingPromise = options
          .refreshAccessToken()
          .then((nextToken) => Boolean(nextToken))
          .catch(() => false)
          .finally(() => {
            refreshingPromise = null
          })
      }

      const refreshed = await refreshingPromise
      if (!refreshed) {
        options.onRefreshFailure?.()
      }

      return refreshed
    },

    async ensureHydrated(): Promise<void> {
      // 水合只在“脏”状态下执行一次，典型场景是应用启动或登录态恢复后。
      if (hydrated) {
        return
      }

      if (!hydratePromise) {
        hydratePromise = (async () => {
          try {
            await options.hydrate()
            hydrated = true
          } catch {
            hydrated = false
            options.onHydrateFailure?.()
          } finally {
            hydratePromise = null
          }
        })()
      }

      await hydratePromise
    },

    markDirty(): void {
      // 标记脏并不立即重拉数据，而是把“下次需要时重新水合”的决定权交给上层。
      hydrated = false
      options.onDirty?.()
    },

    reset(): void {
      refreshingPromise = null
      hydratePromise = null
      hydrated = false
    }
  }
}
