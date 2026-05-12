import { defineComponent, h } from 'vue'

export const AiMarkdownRenderer = defineComponent({
  name: 'AiMarkdownRenderer',
  props: {
    content: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    return () => h('pre', props.content)
  }
})
