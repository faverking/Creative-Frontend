import { ref } from 'vue'

export function useAiStream() {
  const chunks = ref<string[]>([])

  const pushChunk = (chunk: string) => {
    chunks.value.push(chunk)
  }

  const clear = () => {
    chunks.value = []
  }

  return {
    chunks,
    pushChunk,
    clear
  }
}
