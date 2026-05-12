import { getAppHttpClient } from '@frontend/app-runtime'

import type { PublicMediaAsset } from './public-detail'

export type WorkspaceTargetType = 'article' | 'topic' | 'book' | 'image'
export type WorkspaceNotificationKind = 'comment' | 'reply'
export type WorkspaceProfileRole = 'user' | 'editor' | 'admin' | 'super_admin'
export type WorkspaceProfileStatus = 'active' | 'blocked' | 'deleted'

export interface WorkspaceUserIdentity {
  id: string
  name: string
  avatarUrl?: string
}

export interface WorkspaceContentMeta {
  [key: string]: unknown
}

export interface WorkspaceProfileResponse {
  id: string
  name: string
  email: string
  avatarUrl: string
  bio: string
  roles: WorkspaceProfileRole[]
  status: WorkspaceProfileStatus
  createdAt: string
  lastLoginAt?: string
  updatedAt: string
}

export type WorkspaceProfileEditable = Partial<
  Pick<WorkspaceProfileResponse, 'name' | 'avatarUrl' | 'bio'>
>

export interface WorkspaceFavoriteItemResponse {
  id: string
  targetType: WorkspaceTargetType
  targetId: string
  savedAt: string
  title: string
  summary: string
  coverMedia?: PublicMediaAsset
  meta: WorkspaceContentMeta
  author?: WorkspaceUserIdentity
  tags: string[]
}

export interface WorkspaceHistoryItemResponse {
  id: string
  targetType: WorkspaceTargetType
  targetId: string
  visitedAt: string
  sourceLabel?: string
  title: string
  summary: string
  coverMedia?: PublicMediaAsset
  meta: WorkspaceContentMeta
  author?: WorkspaceUserIdentity
  tags: string[]
}

export interface WorkspaceNotificationTargetResponse {
  type: WorkspaceTargetType
  id: string
  title: string
  meta: WorkspaceContentMeta
}

export interface WorkspaceNotificationActionResponse {
  type: 'mark-read' | 'view-target'
  notificationId?: string
  targetType?: WorkspaceTargetType
  targetId?: string
}

export interface WorkspaceNotificationItemResponse {
  id: string
  unread: boolean
  kind: WorkspaceNotificationKind
  createdAt: string
  actor: WorkspaceUserIdentity
  excerpt: string
  context?: string
  commentId?: string
  replyId?: string
  target: WorkspaceNotificationTargetResponse
  primaryAction: WorkspaceNotificationActionResponse
  secondaryAction?: WorkspaceNotificationActionResponse
}

export interface WorkspaceNotificationsResponse {
  items: WorkspaceNotificationItemResponse[]
  page: number
  limit: number
  total: number
  unreadTotal: number
}

export interface WorkspaceFavoritesResponse {
  items: WorkspaceFavoriteItemResponse[]
  page: number
  limit: number
  total: number
}

export interface WorkspaceHistoryResponse {
  items: WorkspaceHistoryItemResponse[]
  page: number
  limit: number
  total: number
}

export interface WorkspacePaginatedQuery {
  page?: number
  limit?: number
}

export interface WorkspaceNotificationsQuery extends WorkspacePaginatedQuery {
  kind?: WorkspaceNotificationKind
  unread?: boolean
}

export interface WorkspaceFavoritesQuery extends WorkspacePaginatedQuery {
  targetType?: WorkspaceTargetType
}

export interface WorkspaceHistoryQuery extends WorkspacePaginatedQuery {
  targetType?: WorkspaceTargetType
}

export interface WorkspaceNotificationReadResponse {
  id: string
  unread: boolean
  readAt?: string
}

export interface WorkspaceNotificationReadAllResponse {
  success: true
  updatedCount: number
}

export interface WorkspaceHistoryClearResponse {
  success: true
  deletedCount: number
}

export interface WorkspaceFavoriteTogglePayload {
  targetType: WorkspaceTargetType
  targetId: string
}

export interface WorkspaceFavoriteToggleResponse {
  favored: boolean
  favoriteId?: string
  targetType: WorkspaceTargetType
  targetId: string
}

export const portalWorkspaceApi = {
  getMyProfile(): Promise<WorkspaceProfileResponse> {
    return getAppHttpClient().get<WorkspaceProfileResponse>('/users/me')
  },

  updateMyProfile(payload: WorkspaceProfileEditable): Promise<WorkspaceProfileResponse> {
    return getAppHttpClient().patch<WorkspaceProfileResponse, WorkspaceProfileEditable>(
      '/users/me',
      payload
    )
  },

  getMyNotifications(query: WorkspaceNotificationsQuery): Promise<WorkspaceNotificationsResponse> {
    return getAppHttpClient().get<WorkspaceNotificationsResponse>('/notifications/me', {
      params: query
    })
  },

  markNotificationRead(notificationId: string): Promise<WorkspaceNotificationReadResponse> {
    return getAppHttpClient().patch<WorkspaceNotificationReadResponse>(
      `/notifications/${notificationId}/read`
    )
  },

  markAllNotificationsRead(): Promise<WorkspaceNotificationReadAllResponse> {
    return getAppHttpClient().post<WorkspaceNotificationReadAllResponse>('/notifications/read-all')
  },

  getMyFavorites(query: WorkspaceFavoritesQuery): Promise<WorkspaceFavoritesResponse> {
    return getAppHttpClient().get<WorkspaceFavoritesResponse>('/favorites/me', {
      params: query
    })
  },

  toggleFavorite(
    payload: WorkspaceFavoriteTogglePayload
  ): Promise<WorkspaceFavoriteToggleResponse> {
    return getAppHttpClient().post<WorkspaceFavoriteToggleResponse, WorkspaceFavoriteTogglePayload>(
      '/favorites/toggle',
      payload
    )
  },

  getMyHistory(query: WorkspaceHistoryQuery): Promise<WorkspaceHistoryResponse> {
    return getAppHttpClient().get<WorkspaceHistoryResponse>('/history/me', {
      params: query
    })
  },

  clearMyHistory(): Promise<WorkspaceHistoryClearResponse> {
    return getAppHttpClient().delete<WorkspaceHistoryClearResponse>('/history/me')
  }
}
