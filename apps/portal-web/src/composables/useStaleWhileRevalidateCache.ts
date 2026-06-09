export type StaleWhileRevalidateCacheState = 'fresh' | 'stale'

export interface StaleWhileRevalidateSnapshot<TData> {
  data: TData
  state: StaleWhileRevalidateCacheState
}

interface StaleWhileRevalidateCacheEntry<TData> {
  data: TData
  updatedAt: number
}

interface UseStaleWhileRevalidateCacheOptions {
  freshTtlMs: number
  key: string
  now?: () => number
  staleWhileRevalidateTtlMs: number
}

const staleWhileRevalidateStore = new Map<string, StaleWhileRevalidateCacheEntry<unknown>>()

export function useStaleWhileRevalidateCache<TData>(options: UseStaleWhileRevalidateCacheOptions) {
  const freshTtlMs = Math.max(0, options.freshTtlMs)
  const staleWhileRevalidateTtlMs = Math.max(0, options.staleWhileRevalidateTtlMs)

  function currentTime(): number {
    return options.now?.() ?? Date.now()
  }

  function readSnapshot(): StaleWhileRevalidateSnapshot<TData> | null {
    const entry = staleWhileRevalidateStore.get(options.key) as
      | StaleWhileRevalidateCacheEntry<TData>
      | undefined
    if (!entry) {
      return null
    }

    const age = Math.max(0, currentTime() - entry.updatedAt)
    if (age <= freshTtlMs) {
      return {
        data: entry.data,
        state: 'fresh'
      }
    }

    if (age <= freshTtlMs + staleWhileRevalidateTtlMs) {
      return {
        data: entry.data,
        state: 'stale'
      }
    }

    return null
  }

  function write(data: TData): void {
    staleWhileRevalidateStore.set(options.key, {
      data,
      updatedAt: currentTime()
    })
  }

  function invalidate(): void {
    staleWhileRevalidateStore.delete(options.key)
  }

  return {
    invalidate,
    readSnapshot,
    write
  }
}
