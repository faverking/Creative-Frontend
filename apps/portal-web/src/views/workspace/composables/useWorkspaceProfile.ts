import { reactive, readonly } from 'vue'

import { portalWorkspaceApi } from '@/api'
import type {
  WorkspaceProfile,
  WorkspaceProfileEditable,
  WorkspaceProfileRole
} from '@/constants/workspace'

interface WorkspaceProfileState extends WorkspaceProfile {
  isLoaded: boolean
  isLoading: boolean
  isUpdating: boolean
  loadError: unknown | null
  updateError: unknown | null
}

const workspaceProfileState = reactive<WorkspaceProfileState>({
  id: '',
  email: '',
  name: '',
  status: 'active',
  roles: [] as WorkspaceProfileRole[],
  avatarUrl: '',
  bio: '',
  lastLoginAt: '',
  createdAt: '',
  updatedAt: '',
  isLoading: false,
  isLoaded: false,
  isUpdating: false,
  loadError: null,
  updateError: null
})

function applyProfile(nextProfile: WorkspaceProfile): void {
  Object.assign(workspaceProfileState, nextProfile)
}

export function useWorkspaceProfile() {
  async function loadProfile(force = false): Promise<void> {
    if (
      workspaceProfileState.isLoading ||
      workspaceProfileState.isUpdating ||
      (workspaceProfileState.isLoaded && !force)
    ) {
      return
    }

    workspaceProfileState.isLoading = true
    workspaceProfileState.loadError = null

    try {
      const profile = await portalWorkspaceApi.getMyProfile()
      applyProfile(profile)
      workspaceProfileState.isLoaded = true
    } catch (error) {
      workspaceProfileState.loadError = error
      throw error
    } finally {
      workspaceProfileState.isLoading = false
    }
  }

  async function updateProfile(nextProfile: WorkspaceProfileEditable): Promise<void> {
    if (workspaceProfileState.isLoading || workspaceProfileState.isUpdating) {
      return
    }

    workspaceProfileState.isUpdating = true
    workspaceProfileState.updateError = null

    try {
      const profile = await portalWorkspaceApi.updateMyProfile(nextProfile)
      applyProfile(profile)
      workspaceProfileState.isLoaded = true
    } catch (error) {
      workspaceProfileState.updateError = error
      throw error
    } finally {
      workspaceProfileState.isUpdating = false
    }
  }

  return {
    profile: readonly(workspaceProfileState) as WorkspaceProfileState,
    loadProfile,
    updateProfile
  }
}
