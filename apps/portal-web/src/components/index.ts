import type { App, Component, Plugin } from 'vue'

import AuthDialogShell from './AuthDialogShell.vue'
import PortalImage from './PortalImage.vue'
import PortalEmptyState from './PortalEmptyState.vue'
import PortalModuleFilterPanel from './PortalModuleFilterPanel.vue'
import PortalModulePagination from './PortalModulePagination.vue'
import PortalRequestBoundary from './PortalRequestBoundary.vue'
import PortalSectionHeading from './PortalSectionHeading.vue'
import PortalTopBar from './PortalTopBar.vue'
import QrPlaceholderIllustration from './QrPlaceholderIllustration.vue'
import ThemeSwitcher from './ThemeSwitcher.vue'
import PortalSvgIcon from './icons/PortalSvgIcon.vue'

const portalGlobalComponents = {
  AuthDialogShell,
  PortalEmptyState,
  PortalImage,
  PortalModuleFilterPanel,
  PortalModulePagination,
  PortalRequestBoundary,
  PortalSectionHeading,
  PortalTopBar,
  PortalSvgIcon,
  QrPlaceholderIllustration,
  ThemeSwitcher
} satisfies Record<string, Component>

const PortalComponentsPlugin: Plugin = {
  install(app: App) {
    for (const [name, component] of Object.entries(portalGlobalComponents)) {
      app.component(name, component)
    }
  }
}

export default PortalComponentsPlugin

export {
  AuthDialogShell,
  PortalEmptyState,
  PortalImage,
  PortalModuleFilterPanel,
  PortalModulePagination,
  PortalRequestBoundary,
  PortalSectionHeading,
  PortalTopBar,
  PortalSvgIcon,
  QrPlaceholderIllustration,
  ThemeSwitcher
}
