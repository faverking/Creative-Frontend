import { defineComponent, h } from 'vue'

export const AiPromptInput = defineComponent({
  name: 'AiPromptInput',
  setup() {
    return () => h('input', { placeholder: 'Ask AI...' })
  }
})
