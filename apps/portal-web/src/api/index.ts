import { ElMessage } from 'element-plus'

import {
  createAuthApi,
  getAppHttpClient,
  resolveAppRoutePathFromLocation,
  resolveBrowserPathForAppRoute,
  resolveBusinessErrorMessage,
  resolveHttpErrorMessage,
  setupAppHttpClient,
  type SetupAppHttpClientOptions
} from '@frontend/app-runtime'
import type { AppEnvConfig } from '@frontend/config'
import type { LoginSdk } from '@frontend/login-sdk'
import type { HttpClient } from '@frontend/request'

import { clearAuthState } from '@/auth/runtime'

export type SetupHttpClientOptions = SetupAppHttpClientOptions
export {
  portalContentApi,
  resolveHomeMediaUrl,
  type HomeArticleCardResponse,
  type HomeArticleFeaturedResponse,
  type HomeArticleSectionResponse,
  type HomeAuthorSummary,
  type HomeBookshelfItemResponse,
  type HomeBookshelfSectionResponse,
  type HomeColumnItemResponse,
  type HomeColumnSectionResponse,
  type HomeFeaturedResponse,
  type HomeGalleryItemResponse,
  type HomeGallerySectionResponse,
  type HomeMediaAsset,
  type HomeResponse,
  type SearchFeaturedResponse,
  type SearchFeaturedTotalsResponse
} from './content'
export {
  portalPublicCommentsApi,
  type PublicCommentAuthorResponse,
  type PublicCommentMentionResponse,
  type PublicCommentRepliesResponse,
  type PublicCommentReplyItemResponse,
  type PublicCommentTargetType,
  type PublicCommentThreadItemResponse,
  type PublicCommentThreadListResponse,
  type PublicCreateCommentPayload,
  type PublicReplyCommentPayload,
  type PublicReplyCommentResponse
} from './public-comments'
export {
  portalPublicDetailApi,
  resolvePublicDetailMediaUrl,
  type PublicArticleDetailPageData,
  type PublicArticleDetailResponse,
  type PublicBookChapterItemResponse,
  type PublicBookDetailPageData,
  type PublicBookDetailResponse,
  type PublicGalleryDetailPageData,
  type PublicGalleryDetailResponse,
  type PublicFavoriteTargetType,
  type PublicFavoriteToggleResponse,
  type PublicMediaAsset,
  type PublicRelatedContentItemResponse,
  type PublicTopicDetailPageData,
  type PublicTopicDetailResponse,
  type PublicZipMediaDownloadRequest,
  type PublicUserProfileResponse
} from './public-detail'
export {
  portalPublicModulesApi,
  resolveBookModuleCoverUrl,
  resolveGalleryModuleCoverUrl,
  resolveGalleryModulePreviewUrls,
  type GalleryModuleItemResponse,
  type GalleryModuleListResponse,
  type GalleryModuleQuery,
  type PublicArticleModuleItemResponse,
  type PublicArticleModuleListResponse,
  type PublicArticleModuleQuery,
  type PublicBookModuleItemResponse,
  type PublicBookModuleListResponse,
  type PublicBookModuleQuery,
  type PublicTopicModuleItemResponse,
  type PublicTopicModuleListResponse,
  type PublicTopicModuleQuery
} from './public-modules'
export {
  portalWorkspaceApi,
  type WorkspaceContentMeta,
  type WorkspaceFavoriteItemResponse,
  type WorkspaceFavoritesQuery,
  type WorkspaceFavoritesResponse,
  type WorkspaceFavoriteToggleResponse,
  type WorkspaceHistoryItemResponse,
  type WorkspaceHistoryQuery,
  type WorkspaceHistoryResponse,
  type WorkspaceNotificationItemResponse,
  type WorkspaceNotificationKind,
  type WorkspaceNotificationsQuery,
  type WorkspaceNotificationsResponse,
  type WorkspaceProfileResponse,
  type WorkspaceTargetType,
  type WorkspaceUserIdentity
} from './workspace'

function redirectToLogin(): void {
  if (typeof window === 'undefined') {
    return
  }

  const redirect = resolveAppRoutePathFromLocation(window.location, import.meta.env.BASE_URL)
  const target = resolveBrowserPathForAppRoute(
    `/login?redirect=${encodeURIComponent(redirect)}`,
    import.meta.env.BASE_URL
  )
  window.location.assign(target)
}

export function setupHttpClient(
  env: AppEnvConfig,
  loginSdk: LoginSdk,
  options: SetupHttpClientOptions = {}
): HttpClient {
  return setupAppHttpClient(env, loginSdk, {
    ...options,
    onUnauthorized: () => {
      clearAuthState()
      options.onUnauthorized?.()
      redirectToLogin()
    },
    onForbidden: () => {
      options.onForbidden?.()
      ElMessage.error('当前账号暂时没有访问门户工作台的权限。')
    },
    onServerError: (status, message) => {
      options.onServerError?.(status, message)
      ElMessage.error(resolveHttpErrorMessage(status, message))
    },
    onBusinessError: (payload) => {
      options.onBusinessError?.(payload)
      ElMessage.error(resolveBusinessErrorMessage(payload))
    }
  })
}

export const getHttpClient = getAppHttpClient
export const authApi = createAuthApi(() => getAppHttpClient())
