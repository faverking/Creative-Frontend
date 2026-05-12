import { defineComponent, h } from 'vue'

export const BaseCard = defineComponent({
  name: 'FrontendBaseCard',
  setup(_, { slots }) {
    return () =>
      h(
        'section',
        {
          class: 'frontend-base-card'
        },
        slots.default?.()
      )
  }
})
