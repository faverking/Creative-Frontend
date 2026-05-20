export type PortalViewportTier = 'mobile' | 'compact' | 'standard' | 'wide'

const PORTAL_VIEWPORT_TIER_ATTRIBUTE = 'data-viewport-tier'
const PORTAL_VIEWPORT_MOBILE_MAX = 1100
const PORTAL_VIEWPORT_COMPACT_MAX = 1599
const PORTAL_VIEWPORT_STANDARD_MAX = 2239

let isPortalViewportTierSyncBound = false
let activePortalViewportTier: PortalViewportTier | null = null

export function resolvePortalViewportTier(width: number): PortalViewportTier {
  if (width <= PORTAL_VIEWPORT_MOBILE_MAX) {
    return 'mobile'
  }

  if (width <= PORTAL_VIEWPORT_COMPACT_MAX) {
    return 'compact'
  }

  if (width <= PORTAL_VIEWPORT_STANDARD_MAX) {
    return 'standard'
  }

  return 'wide'
}

export function setupPortalViewportTierSync(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  const applyViewportTier = () => {
    const nextTier = resolvePortalViewportTier(window.innerWidth)

    if (activePortalViewportTier === nextTier) {
      return
    }

    activePortalViewportTier = nextTier
    document.documentElement.setAttribute(PORTAL_VIEWPORT_TIER_ATTRIBUTE, nextTier)
  }

  applyViewportTier()

  if (isPortalViewportTierSyncBound) {
    return
  }

  isPortalViewportTierSyncBound = true
  window.addEventListener('resize', applyViewportTier, { passive: true })
}
