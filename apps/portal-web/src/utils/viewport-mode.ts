export type PortalViewportMode = 'mobile' | 'desktop'

const PORTAL_VIEWPORT_ATTRIBUTE = 'data-portal-viewport'
const PORTAL_VIEWPORT_MOBILE_MAX = 1100

let isPortalViewportModeSyncBound = false
let activePortalViewportMode: PortalViewportMode | null = null

export function resolvePortalViewportMode(width: number): PortalViewportMode {
  return width <= PORTAL_VIEWPORT_MOBILE_MAX ? 'mobile' : 'desktop'
}

export function applyPortalViewportModeAttribute(
  root: Pick<HTMLElement, 'setAttribute' | 'removeAttribute'>,
  mode: PortalViewportMode
): void {
  if (mode === 'mobile') {
    root.setAttribute(PORTAL_VIEWPORT_ATTRIBUTE, mode)
    return
  }

  root.removeAttribute(PORTAL_VIEWPORT_ATTRIBUTE)
}

export function setupPortalViewportModeSync(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  const applyViewportMode = () => {
    const nextMode = resolvePortalViewportMode(window.innerWidth)

    if (activePortalViewportMode === nextMode) {
      return
    }

    activePortalViewportMode = nextMode
    applyPortalViewportModeAttribute(document.documentElement, nextMode)
  }

  applyViewportMode()

  if (isPortalViewportModeSyncBound) {
    return
  }

  isPortalViewportModeSyncBound = true
  window.addEventListener('resize', applyViewportMode, { passive: true })
}
