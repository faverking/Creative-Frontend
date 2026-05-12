import type AuthDialogShell from './components/AuthDialogShell.vue'
import type PortalEmptyState from './components/PortalEmptyState.vue'
import type PortalImage from './components/PortalImage.vue'
import type PortalModuleFilterPanel from './components/PortalModuleFilterPanel.vue'
import type PortalModulePagination from './components/PortalModulePagination.vue'
import type PortalRequestBoundary from './components/PortalRequestBoundary.vue'
import type PortalSectionHeading from './components/PortalSectionHeading.vue'
import type PortalTopBar from './components/PortalTopBar.vue'
import type QrPlaceholderIllustration from './components/QrPlaceholderIllustration.vue'
import type ThemeSwitcher from './components/ThemeSwitcher.vue'
import type PortalSvgIcon from './components/icons/PortalSvgIcon.vue'

declare module 'vue' {
  export interface GlobalComponents {
    AuthDialogShell: typeof AuthDialogShell
    PortalEmptyState: typeof PortalEmptyState
    PortalImage: typeof PortalImage
    PortalModuleFilterPanel: typeof PortalModuleFilterPanel
    PortalModulePagination: typeof PortalModulePagination
    PortalRequestBoundary: typeof PortalRequestBoundary
    PortalSectionHeading: typeof PortalSectionHeading
    PortalTopBar: typeof PortalTopBar
    PortalSvgIcon: typeof PortalSvgIcon
    QrPlaceholderIllustration: typeof QrPlaceholderIllustration
    ThemeSwitcher: typeof ThemeSwitcher
  }
}

export {}
