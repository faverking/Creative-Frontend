import { describe, expect, it } from 'vitest'

import { useStaleWhileRevalidateCache } from './useStaleWhileRevalidateCache'

describe('useStaleWhileRevalidateCache', () => {
  it('returns fresh snapshots inside the fresh ttl', () => {
    let now = 1000
    const cache = useStaleWhileRevalidateCache<string>({
      freshTtlMs: 100,
      key: 'test:fresh-snapshot',
      now: () => now,
      staleWhileRevalidateTtlMs: 500
    })

    cache.write('first')
    now += 80

    expect(cache.readSnapshot()).toEqual({
      data: 'first',
      state: 'fresh'
    })
  })

  it('returns stale snapshots inside the stale-while-revalidate window', () => {
    let now = 2000
    const cache = useStaleWhileRevalidateCache<string>({
      freshTtlMs: 100,
      key: 'test:stale-snapshot',
      now: () => now,
      staleWhileRevalidateTtlMs: 500
    })

    cache.write('first')
    now += 180

    expect(cache.readSnapshot()).toEqual({
      data: 'first',
      state: 'stale'
    })
  })

  it('expires snapshots after the stale-while-revalidate window', () => {
    let now = 3000
    const cache = useStaleWhileRevalidateCache<string>({
      freshTtlMs: 100,
      key: 'test:expired-snapshot',
      now: () => now,
      staleWhileRevalidateTtlMs: 500
    })

    cache.write('first')
    now += 700

    expect(cache.readSnapshot()).toBeNull()
  })

  it('can invalidate a cached snapshot', () => {
    const cache = useStaleWhileRevalidateCache<string>({
      freshTtlMs: 100,
      key: 'test:invalidate-snapshot',
      staleWhileRevalidateTtlMs: 500
    })

    cache.write('first')
    cache.invalidate()

    expect(cache.readSnapshot()).toBeNull()
  })
})
