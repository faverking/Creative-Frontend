import { computed, ref } from 'vue'

import type {
  PortalRequestBoundaryErrorCode,
  PortalRequestBoundaryMode
} from '@/components/PortalRequestBoundary.vue'
import { resolveWorkspaceRequestErrorCode } from '@/utils/workspace'

export function useWorkspaceRequestState() {
  const hasLoaded = ref(false)
  const isRefreshing = ref(false)
  const phase = ref<'loading' | 'error' | 'ready'>('loading')
  const errorCode = ref<PortalRequestBoundaryErrorCode>(500)

  let latestRequestToken = 0

  const boundaryMode = computed<PortalRequestBoundaryMode>(() => {
    if (phase.value === 'loading') {
      return 'loading'
    }

    if (phase.value === 'error') {
      return 'error'
    }

    return 'ready'
  })

  function beginRequest(): number {
    const requestToken = ++latestRequestToken

    if (hasLoaded.value) {
      isRefreshing.value = true
      return requestToken
    }

    errorCode.value = 500
    phase.value = 'loading'
    return requestToken
  }

  function isLatestRequest(requestToken: number): boolean {
    return requestToken === latestRequestToken
  }

  function resolveSuccess(requestToken: number): boolean {
    if (!isLatestRequest(requestToken)) {
      return false
    }

    hasLoaded.value = true
    isRefreshing.value = false
    errorCode.value = 500
    phase.value = 'ready'
    return true
  }

  function resolveFailure(
    requestToken: number,
    error: unknown
  ): {
    applied: boolean
    shouldResetData: boolean
  } {
    if (!isLatestRequest(requestToken)) {
      return {
        applied: false,
        shouldResetData: false
      }
    }

    const shouldResetData = !hasLoaded.value

    if (shouldResetData) {
      errorCode.value = resolveWorkspaceRequestErrorCode(error)
      phase.value = 'error'
    }

    isRefreshing.value = false

    return {
      applied: true,
      shouldResetData
    }
  }

  return {
    beginRequest,
    boundaryMode,
    errorCode,
    hasLoaded,
    isLatestRequest,
    isRefreshing,
    resolveFailure,
    resolveSuccess
  }
}
