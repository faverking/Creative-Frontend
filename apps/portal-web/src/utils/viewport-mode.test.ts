import { describe, expect, it, vi } from 'vitest'

import { applyPortalViewportModeAttribute, resolvePortalViewportMode } from './viewport-mode'

describe('resolvePortalViewportMode', () => {
  it('resolves mobile mode at and below 1100px', () => {
    expect(resolvePortalViewportMode(390)).toBe('mobile')
    expect(resolvePortalViewportMode(1100)).toBe('mobile')
  })

  it('resolves desktop mode above the mobile boundary', () => {
    expect(resolvePortalViewportMode(1101)).toBe('desktop')
    expect(resolvePortalViewportMode(1920)).toBe('desktop')
    expect(resolvePortalViewportMode(2560)).toBe('desktop')
  })
})

describe('applyPortalViewportModeAttribute', () => {
  it('writes only the mobile marker and clears desktop mode', () => {
    const root = {
      setAttribute: vi.fn(),
      removeAttribute: vi.fn()
    }

    applyPortalViewportModeAttribute(root, 'mobile')
    expect(root.setAttribute).toHaveBeenCalledWith('data-portal-viewport', 'mobile')

    applyPortalViewportModeAttribute(root, 'desktop')
    expect(root.removeAttribute).toHaveBeenCalledWith('data-portal-viewport')
  })
})
