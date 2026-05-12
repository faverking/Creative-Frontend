import { computed, ref } from 'vue'

import type { AiClient } from '../api/client'
import {
  streamAdminComposeTask,
  type AdminComposeRequest,
  type AdminComposeResponse
} from '../api/admin-compose'

export type AiTaskRunnerStatus = 'idle' | 'streaming' | 'completed' | 'error'

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function useAiTaskRunner(client: AiClient) {
  const status = ref<AiTaskRunnerStatus>('idle')
  const streamPreviewText = ref('')
  const result = ref<AdminComposeResponse | null>(null)
  const error = ref('')
  let abortController: AbortController | null = null

  const loading = computed(() => status.value === 'streaming')

  function reset(): void {
    abortController = null
    status.value = 'idle'
    streamPreviewText.value = ''
    result.value = null
    error.value = ''
  }

  function abort(): void {
    abortController?.abort()
  }

  async function run(request: AdminComposeRequest): Promise<void> {
    abort()
    reset()

    status.value = 'streaming'
    const controller = new AbortController()
    abortController = controller

    try {
      await streamAdminComposeTask(client, request, {
        signal: controller.signal,
        onDelta: ({ text }) => {
          // 后端 delta 只保证“可读预览”，不保证已经符合最终结构化 schema，
          // 所以前端只把它当中间态文案展示，避免半成品结果误写回表单。
          streamPreviewText.value = `${streamPreviewText.value}${text}`
        },
        onCompleted: (response) => {
          // 只有 completed 才代表后端已经完成结构化校验，
          // 此时再落正式结果，才能保证页面看到的是可应用的数据。
          result.value = response
          status.value = 'completed'
        },
        onError: ({ message }) => {
          error.value = message || 'AI 生成失败，请稍后再试。'
          status.value = 'error'
        }
      })
    } catch (reason) {
      if (isAbortError(reason)) {
        reset()
        return
      }

      error.value = reason instanceof Error ? reason.message : 'AI 生成失败，请稍后再试。'
      status.value = 'error'
    } finally {
      if (abortController === controller) {
        abortController = null
      }
    }
  }

  return {
    status,
    loading,
    streamPreviewText,
    result,
    error,
    run,
    abort,
    reset
  }
}
