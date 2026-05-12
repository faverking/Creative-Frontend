import { watch, type ComputedRef } from 'vue'

import { useOptionalAuthRefresh } from '@/composables/useOptionalAuthRefresh'

export function usePublicDetailReloadTriggers(
  detailId: ComputedRef<string>,
  reload: () => void | Promise<void>
): void {
  watch(
    detailId,
    () => {
      void reload()
    },
    {
      immediate: true
    }
  )

  useOptionalAuthRefresh(reload)
}
