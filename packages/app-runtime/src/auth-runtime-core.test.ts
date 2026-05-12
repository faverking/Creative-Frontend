import { describe, expect, it, vi } from 'vitest'

import { createAuthRuntimeCore } from './auth-runtime-core'

describe('createAuthRuntimeCore', () => {
  it('deduplicates concurrent refresh requests', async () => {
    const refreshAccessToken = vi.fn(async () => 'token')
    const core = createAuthRuntimeCore({
      refreshAccessToken,
      hydrate: async () => {}
    })

    const [first, second] = await Promise.all([
      core.ensureFreshAccessToken(),
      core.ensureFreshAccessToken()
    ])

    expect(first).toBe(true)
    expect(second).toBe(true)
    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
  })

  it('hydrates once until marked dirty', async () => {
    const hydrate = vi.fn(async () => {})
    const onDirty = vi.fn()
    const core = createAuthRuntimeCore({
      refreshAccessToken: async () => 'token',
      hydrate,
      onDirty
    })

    await core.ensureHydrated()
    await core.ensureHydrated()
    core.markDirty()
    await core.ensureHydrated()

    expect(hydrate).toHaveBeenCalledTimes(2)
    expect(onDirty).toHaveBeenCalledTimes(1)
  })

  it('swallows hydrate failure and runs fallback cleanup', async () => {
    const onHydrateFailure = vi.fn()
    const core = createAuthRuntimeCore({
      refreshAccessToken: async () => 'token',
      hydrate: async () => {
        throw new Error('boom')
      },
      onHydrateFailure
    })

    await expect(core.ensureHydrated()).resolves.toBeUndefined()
    expect(onHydrateFailure).toHaveBeenCalledTimes(1)
  })
})
