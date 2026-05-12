import { ref } from 'vue'
import { defineStore } from 'pinia'

// 全局用户信息快照，来源于登录态对应的后端用户信息。
export interface GlobalUserProfile {
  id: string
  name: string
  email?: string
  roles?: string[]
  permissions?: string[]
  status?: string
}

export const useUserStore = defineStore('global-user', () => {
  const profile = ref<GlobalUserProfile | null>(null)
  // hydrated=true 表示当前登录态下已完成一次用户信息同步。
  const hydrated = ref(false)

  const setUser = (next: GlobalUserProfile | null) => {
    profile.value = next
  }

  const markHydrated = () => {
    hydrated.value = true
  }

  const markStale = () => {
    hydrated.value = false
  }

  const clearUser = () => {
    profile.value = null
    hydrated.value = false
  }

  return {
    profile,
    hydrated,
    setUser,
    markHydrated,
    markStale,
    clearUser
  }
})
