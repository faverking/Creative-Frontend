import { computed, ref } from 'vue'

import type {
  PortalRequestBoundaryErrorCode,
  PortalRequestBoundaryMode
} from '@/components/PortalRequestBoundary.vue'

export function usePublicDetailRequestState() {
  const isLoading = ref(true)
  const hasError = ref(false)
  const errorCode = ref<PortalRequestBoundaryErrorCode>(500)
  const boundaryMode = computed<PortalRequestBoundaryMode>(() => {
    if (isLoading.value) {
      return 'loading'
    }

    if (hasError.value) {
      return 'error'
    }

    return 'ready'
  })

  let latestLoadToken = 0

  function beginLoad(): number {
    isLoading.value = true
    hasError.value = false
    errorCode.value = 500
    return ++latestLoadToken
  }

  function isLatestLoad(loadToken: number): boolean {
    return loadToken === latestLoadToken
  }

  function finishLoad(nextHasError: boolean): void {
    hasError.value = nextHasError
    isLoading.value = false
  }

  function setLiveMode(): void {
    errorCode.value = 500
    finishLoad(false)
  }

  function setErrorMode(nextErrorCode: PortalRequestBoundaryErrorCode = 500): void {
    errorCode.value = nextErrorCode
    finishLoad(true)
  }

  return {
    boundaryMode,
    beginLoad,
    errorCode,
    isLatestLoad,
    setErrorMode,
    setLiveMode
  }
}
