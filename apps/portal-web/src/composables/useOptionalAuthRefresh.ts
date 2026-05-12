import { computed, watch } from 'vue'

import { useUserStore } from '@frontend/store'

export function useOptionalAuthRefresh(refresh: () => void | Promise<void>): void {
  const userStore = useUserStore()
  const authIdentity = computed(() => userStore.profile?.id?.trim() || '')

  watch(authIdentity, (nextIdentity, previousIdentity) => {
    if (nextIdentity === previousIdentity) {
      return
    }

    void refresh()
  })
}
