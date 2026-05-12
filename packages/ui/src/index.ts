import type { App, Plugin } from 'vue'

import { BaseCard } from './components/BaseCard'

export { BaseCard }

const FrontendUiPlugin: Plugin = {
  install(app: App) {
    app.component('FrontendBaseCard', BaseCard)
  }
}

export default FrontendUiPlugin
