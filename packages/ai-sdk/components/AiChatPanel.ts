import { defineComponent, h, ref } from 'vue'

export const AiChatPanel = defineComponent({
  name: 'AiChatPanel',
  setup() {
    const text = ref('AI Chat Panel Placeholder')
    return () => h('section', { class: 'ai-chat-panel' }, text.value)
  }
})
