import { ref } from 'vue'

import { chat } from '../api/chat'
import type { AiClient } from '../api/client'

export function useAiChat(client: AiClient) {
  const loading = ref(false)
  const messages = ref<string[]>([])

  const send = async (prompt: string) => {
    loading.value = true
    try {
      const answer = await chat(client, prompt)
      messages.value.push(`Q: ${prompt}`)
      messages.value.push(`A: ${answer}`)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    messages,
    send
  }
}
