import { getAppHttpClient } from '@frontend/app-runtime'

import {
  publicRequestConfig,
  safeGetPublic,
  type ApiRequestErrorCode,
  type ApiRequestResult
} from '@/api/public-request'
import { resolveAssetUrl } from '@/utils/assets'

const PUBLIC_DETAIL_ARTICLE_RELATED_LIMIT = 3
const PUBLIC_DETAIL_TOPIC_RELATED_LIMIT = 3
const PUBLIC_DETAIL_BOOK_RELATED_LIMIT = 4
const PUBLIC_DETAIL_GALLERY_RELATED_LIMIT = 3

export interface PublicMediaAsset {
  id?: string
  previewPath?: string
  downloadPath?: string
  attachmentPath?: string
}

export interface PublicZipMediaDownloadRequest {
  mode?: 'package' | 'direct'
  mediaId?: string
  mediaIds?: string[]
  fileName?: string
}

export type PublicFavoriteTargetType = 'article' | 'book' | 'topic' | 'image'

export interface PublicFavoriteToggleResponse {
  favored: boolean
  target_type: PublicFavoriteTargetType
  target_id: string
  favorite_id?: string
}

export interface PublicAuthorSummaryResponse {
  id: string
  name: string
  avatarUrl?: string
}

export interface PublicUserProfileResponse {
  id: string
  name: string
  avatarUrl?: string
  bio?: string
  roles?: string[]
}

export interface PublicArticleDetailResponse {
  id: string
  title?: string
  summary?: string
  desc?: string
  themeId?: number
  author?: PublicAuthorSummaryResponse
  coverMedia?: PublicMediaAsset | null
  imageAssets?: PublicMediaAsset[]
  viewCount?: number
  favorCount?: number
  replyCount?: number
  postTime?: string
  updateTime?: string
  content?: string
}

export interface PublicTopicDetailResponse {
  id: string
  title?: string
  summary?: string
  desc?: string
  topicId?: number
  typeId?: number
  featureFlags?: number[]
  featureFlagLabels?: string[]
  author?: PublicAuthorSummaryResponse
  viewCount?: number
  favorCount?: number
  replyCount?: number
  postTime?: string
  updateTime?: string
  content?: string
  downloadUrl?: string
  coverMedia?: PublicMediaAsset | null
  imageAssets?: PublicMediaAsset[]
}

export interface PublicGalleryDetailResponse {
  id: string
  title?: string
  summary?: string
  desc?: string
  total?: number
  themeId?: number
  source?: string
  author?: PublicAuthorSummaryResponse
  viewCount?: number
  favorCount?: number
  replyCount?: number
  uploadTime?: string
  resolution?: string
  qualityLabel?: string
  imageAssets?: PublicMediaAsset[]
  cover?: string
  coverMedia?: PublicMediaAsset | null
  meta?: string
}

export interface PublicBookChapterItemResponse {
  id: number
  order: number
  size: number
  title?: string
  rule?: string
}

export interface PublicBookDetailResponse {
  id: string
  title?: string
  name?: string
  summary?: string
  desc?: string
  author?: string[]
  authorNames?: string[]
  part?: number
  status?: number
  area?: number
  total?: number
  tags?: string[]
  style?: Array<{ id: number; name: string }>
  viewCount?: number
  favorCount?: number
  replyCount?: number
  releaseTime?: number
  createTime?: number
  updateTime?: number
  cover?: string
  coverMedia?: PublicMediaAsset | null
  userId?: string
  chapterList?: PublicBookChapterItemResponse[]
  origin?: string
  comicId?: string
  novelId?: string
  otherId?: string
}

export interface PublicRelatedContentItemResponse {
  id: string
  type?: string
  title?: string
  summary?: string
  cover?: PublicMediaAsset | null
  tags?: string[]
  publishTime?: string
}

export interface PublicRelatedContentResponse {
  items?: PublicRelatedContentItemResponse[]
}

export interface PublicArticleDetailPageData {
  detail: PublicArticleDetailResponse
  authorProfile: PublicUserProfileResponse | null
  related: PublicRelatedContentItemResponse[]
}

export interface PublicTopicDetailPageData {
  detail: PublicTopicDetailResponse
  authorProfile: PublicUserProfileResponse | null
  related: PublicRelatedContentItemResponse[]
}

export interface PublicGalleryDetailPageData {
  detail: PublicGalleryDetailResponse
  related: PublicRelatedContentItemResponse[]
}

export interface PublicBookDetailPageData {
  detail: PublicBookDetailResponse
  related: PublicRelatedContentItemResponse[]
}

interface PublicDetailLoadMeta {
  authorProfileError: boolean
  authorProfileErrorCode: ApiRequestErrorCode | null
  detailError: boolean
  detailErrorCode: ApiRequestErrorCode | null
  relatedError: boolean
  relatedErrorCode: ApiRequestErrorCode | null
}

export interface PublicArticleDetailPageResult {
  data: PublicArticleDetailPageData | null
  meta: PublicDetailLoadMeta
}

export interface PublicTopicDetailPageResult {
  data: PublicTopicDetailPageData | null
  meta: PublicDetailLoadMeta
}

export interface PublicGalleryDetailPageResult {
  data: PublicGalleryDetailPageData | null
  meta: Omit<PublicDetailLoadMeta, 'authorProfileError' | 'authorProfileErrorCode'>
}

export interface PublicBookDetailPageResult {
  data: PublicBookDetailPageData | null
  meta: Omit<PublicDetailLoadMeta, 'authorProfileError' | 'authorProfileErrorCode'>
}

function normalizeText(value: string | undefined | null, fallback = ''): string {
  const normalized = value?.trim()
  return normalized || fallback
}

function safeArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : []
}

function normalizeMediaIds(value: Array<string | undefined | null> | undefined): string[] {
  return Array.from(
    new Set(
      safeArray(value)
        .map((item) => normalizeText(item))
        .filter(Boolean)
    )
  )
}

function isResolvedAssetUrl(path: string): boolean {
  return (
    /^https?:\/\//.test(path) ||
    path.startsWith('//') ||
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('/assets/') ||
    path.startsWith('/src/') ||
    path.startsWith('/@fs/')
  )
}

function resolvePublicDetailAssetUrl(path?: string | null): string {
  const normalizedPath = normalizeText(path)

  if (!normalizedPath) {
    return ''
  }

  if (isResolvedAssetUrl(normalizedPath)) {
    return normalizedPath
  }

  return resolveAssetUrl(normalizedPath)
}

export function resolvePublicDetailMediaUrl(asset?: PublicMediaAsset | null): string {
  if (!asset) {
    return ''
  }

  return resolvePublicDetailAssetUrl(asset.previewPath || asset.downloadPath)
}

export function resolvePublicDetailOriginalMediaUrl(asset?: PublicMediaAsset | null): string {
  if (!asset) {
    return ''
  }

  return resolvePublicDetailAssetUrl(asset.downloadPath || asset.previewPath)
}

async function fetchUserProfile(
  userId?: string
): Promise<ApiRequestResult<PublicUserProfileResponse>> {
  const normalizedId = normalizeText(userId)

  if (!normalizedId) {
    return {
      data: null,
      error: null,
      errorCode: null
    }
  }

  return safeGetPublic<PublicUserProfileResponse>(`/users/${normalizedId}/profile`)
}

export const portalPublicDetailApi = {
  async toggleFavorite(
    targetType: PublicFavoriteTargetType,
    targetId: string
  ): Promise<PublicFavoriteToggleResponse> {
    const normalizedTargetId = normalizeText(targetId)

    if (!normalizedTargetId) {
      throw new Error('Target id is required for favorite toggle.')
    }

    return getAppHttpClient().post<
      PublicFavoriteToggleResponse,
      {
        targetType: PublicFavoriteTargetType
        targetId: string
      }
    >('/favorites/toggle', {
      targetType,
      targetId: normalizedTargetId
    })
  },

  async downloadMediaZip(dto: PublicZipMediaDownloadRequest): Promise<Blob> {
    const mode = dto.mode ?? 'package'

    if (mode === 'direct') {
      const mediaId = normalizeText(dto.mediaId)

      if (!mediaId) {
        throw new Error('Media id is required for direct download.')
      }

      return getAppHttpClient().post<Blob, PublicZipMediaDownloadRequest>(
        '/media/zip/download',
        {
          mode,
          mediaId,
          fileName: normalizeText(dto.fileName)
        },
        {
          ...publicRequestConfig,
          responseType: 'blob'
        }
      )
    }

    const mediaIds = normalizeMediaIds(dto.mediaIds)

    if (mediaIds.length === 0) {
      throw new Error('Media ids are required for package download.')
    }

    return getAppHttpClient().post<Blob, PublicZipMediaDownloadRequest>(
      '/media/zip/download',
      {
        mode,
        mediaIds,
        fileName: normalizeText(dto.fileName)
      },
      {
        ...publicRequestConfig,
        responseType: 'blob'
      }
    )
  },

  async getArticleDetailPageData(id: string): Promise<PublicArticleDetailPageResult> {
    const detailResult = await safeGetPublic<PublicArticleDetailResponse>(
      `/articles/${id}`,
      undefined,
      true
    )

    if (!detailResult.data) {
      return {
        data: null,
        meta: {
          authorProfileError: false,
          authorProfileErrorCode: null,
          detailError: true,
          detailErrorCode: detailResult.errorCode,
          relatedError: false,
          relatedErrorCode: null
        }
      }
    }

    const [authorProfile, relatedResponse] = await Promise.all([
      fetchUserProfile(detailResult.data.author?.id),
      safeGetPublic<PublicRelatedContentResponse>(`/articles/${id}/related`, {
        limit: PUBLIC_DETAIL_ARTICLE_RELATED_LIMIT
      })
    ])

    return {
      data: {
        detail: detailResult.data,
        authorProfile: authorProfile.data,
        related: safeArray(relatedResponse.data?.items)
      },
      meta: {
        authorProfileError: Boolean(authorProfile.error),
        authorProfileErrorCode: authorProfile.errorCode,
        detailError: false,
        detailErrorCode: null,
        relatedError: Boolean(relatedResponse.error),
        relatedErrorCode: relatedResponse.errorCode
      }
    }
  },

  async getTopicDetailPageData(id: string): Promise<PublicTopicDetailPageResult> {
    const detailResult = await safeGetPublic<PublicTopicDetailResponse>(
      `/topics/${id}`,
      undefined,
      true
    )

    if (!detailResult.data) {
      return {
        data: null,
        meta: {
          authorProfileError: false,
          authorProfileErrorCode: null,
          detailError: true,
          detailErrorCode: detailResult.errorCode,
          relatedError: false,
          relatedErrorCode: null
        }
      }
    }

    const [authorProfile, relatedResponse] = await Promise.all([
      fetchUserProfile(detailResult.data.author?.id),
      safeGetPublic<PublicRelatedContentResponse>(`/topics/${id}/related`, {
        limit: PUBLIC_DETAIL_TOPIC_RELATED_LIMIT
      })
    ])

    return {
      data: {
        detail: detailResult.data,
        authorProfile: authorProfile.data,
        related: safeArray(relatedResponse.data?.items)
      },
      meta: {
        authorProfileError: Boolean(authorProfile.error),
        authorProfileErrorCode: authorProfile.errorCode,
        detailError: false,
        detailErrorCode: null,
        relatedError: Boolean(relatedResponse.error),
        relatedErrorCode: relatedResponse.errorCode
      }
    }
  },

  async getGalleryDetailPageData(id: string): Promise<PublicGalleryDetailPageResult> {
    const detailResult = await safeGetPublic<PublicGalleryDetailResponse>(
      `/images/${id}`,
      undefined,
      true
    )

    if (!detailResult.data) {
      return {
        data: null,
        meta: {
          detailError: true,
          detailErrorCode: detailResult.errorCode,
          relatedError: false,
          relatedErrorCode: null
        }
      }
    }

    const relatedResponse = await safeGetPublic<PublicRelatedContentResponse>(
      `/images/${id}/related`,
      {
        limit: PUBLIC_DETAIL_GALLERY_RELATED_LIMIT
      }
    )

    return {
      data: {
        detail: detailResult.data,
        related: safeArray(relatedResponse.data?.items)
      },
      meta: {
        detailError: false,
        detailErrorCode: null,
        relatedError: Boolean(relatedResponse.error),
        relatedErrorCode: relatedResponse.errorCode
      }
    }
  },

  async getBookDetail(id: string): Promise<ApiRequestResult<PublicBookDetailResponse>> {
    return safeGetPublic<PublicBookDetailResponse>(`/books/${id}`, undefined, true)
  },

  async getBookDetailPageData(id: string): Promise<PublicBookDetailPageResult> {
    const detailResult = await safeGetPublic<PublicBookDetailResponse>(
      `/books/${id}`,
      undefined,
      true
    )

    if (!detailResult.data) {
      return {
        data: null,
        meta: {
          detailError: true,
          detailErrorCode: detailResult.errorCode,
          relatedError: false,
          relatedErrorCode: null
        }
      }
    }

    const relatedResponse = await safeGetPublic<PublicRelatedContentResponse>(
      `/books/${id}/related`,
      {
        limit: PUBLIC_DETAIL_BOOK_RELATED_LIMIT
      }
    )

    return {
      data: {
        detail: detailResult.data,
        related: safeArray(relatedResponse.data?.items)
      },
      meta: {
        detailError: false,
        detailErrorCode: null,
        relatedError: Boolean(relatedResponse.error),
        relatedErrorCode: relatedResponse.errorCode
      }
    }
  }
}
