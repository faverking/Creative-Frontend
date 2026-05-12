import { defineComponent, h } from 'vue'

export const AiStreamMessage = defineComponent({
  name: 'AiStreamMessage',
  props: {
    message: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    return () => h('p', props.message)
  }
})
