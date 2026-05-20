import { describe, expect, it } from 'vitest'

import { resolvePortalViewportTier } from './viewport-tier'

describe('resolvePortalViewportTier', () => {
  it('resolves mobile tier at and below 1100px', () => {
    expect(resolvePortalViewportTier(390)).toBe('mobile')
    expect(resolvePortalViewportTier(1100)).toBe('mobile')
  })

  it('resolves desktop tiers above the mobile boundary', () => {
    expect(resolvePortalViewportTier(1101)).toBe('compact')
    expect(resolvePortalViewportTier(1599)).toBe('compact')
    expect(resolvePortalViewportTier(1600)).toBe('standard')
    expect(resolvePortalViewportTier(2239)).toBe('standard')
    expect(resolvePortalViewportTier(2240)).toBe('wide')
  })
})
