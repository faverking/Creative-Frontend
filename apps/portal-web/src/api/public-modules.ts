import { safeGetPublic, type ApiRequestResult } from '@/api/public-request'
import { resolvePublicDetailMediaUrl, type PublicMediaAsset } from '@/api/public-detail'
import type { PortalModuleSort } from '@/constants/public-modules'

export interface PublicContentModuleAuthorSummary {
  id: string
  name: string
  avatarUrl?: string
}

export interface PublicArticleModuleItemResponse {
  id: string
  title?: string
  summary?: string
  desc?: string
  themeId?: number
  viewCount?: number
  favorCount?: number
  replyCount?: number
  postTime?: string
  updateTime?: string
  author?: PublicContentModuleAuthorSummary
  coverMedia?: PublicMediaAsset | null
  imageAssets?: PublicMediaAsset[]
}

export interface PublicArticleModuleListResponse {
  items: PublicArticleModuleItemResponse[]
  page: number
  limit: number
  total: number
}

export interface PublicArticleModuleQuery {
  page?: number
  limit?: number
  themeId?: number
  keyword?: string
  sort?: PortalModuleSort
  includeAuthor?: boolean
}

export interface PublicTopicModuleItemResponse {
  id: string
  topicId?: number
  typeId?: number
  title?: string
  summary?: string
  desc?: string
  featureFlags?: number[]
  featureFlagLabels?: string[]
  downloadUrl?: string
  viewCount?: number
  favorCount?: number
  replyCount?: number
  postTime?: string
  updateTime?: string
  author?: PublicContentModuleAuthorSummary
  coverMedia?: PublicMediaAsset | null
  imageAssets?: PublicMediaAsset[]
}

export interface PublicTopicModuleListResponse {
  items: PublicTopicModuleItemResponse[]
  page: number
  limit: number
  total: number
}

export interface PublicTopicModuleQuery {
  page?: number
  limit?: number
  topicId?: number
  typeId?: number
  featureFlags?: number[]
  keyword?: string
  sort?: PortalModuleSort
  includeAuthor?: boolean
}

export interface PublicBookModuleItemResponse {
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
  cover?: string
  coverMedia?: PublicMediaAsset | null
  viewCount?: number
  favorCount?: number
  replyCount?: number
  releaseTime?: number
  createTime?: number
  updateTime?: number
  userId?: string
}

export interface PublicBookModuleListResponse {
  items: PublicBookModuleItemResponse[]
  page: number
  limit: number
  total: number
}

export interface PublicBookModuleQuery {
  page?: number
  limit?: number
  part?: number
  keyword?: string
  sort?: PortalModuleSort
  mediaVariant?: 'preview' | 'download'
}

export interface GalleryModuleItemResponse {
  id: string
  title?: string
  summary?: string
  desc?: string
  total?: number
  themeId?: number
  viewCount?: number
  favorCount?: number
  replyCount?: number
  cover?: string
  coverMedia?: PublicMediaAsset | null
  imageAssets?: PublicMediaAsset[]
  qualityLabel?: string
  resolution?: string
  meta?: string
  uploadTime?: string
}

export interface GalleryModuleListResponse {
  items: GalleryModuleItemResponse[]
  page: number
  limit: number
  total: number
}

export interface GalleryModuleQuery {
  page?: number
  limit?: number
  themeId?: number
  keyword?: string
  sort?: PortalModuleSort
  mediaVariant?: 'preview' | 'download'
}

export function resolvePublicContentModuleCoverUrl(
  item:
    | PublicArticleModuleItemResponse
    | PublicTopicModuleItemResponse
    | { coverMedia?: PublicMediaAsset | null }
): string {
  return resolvePublicDetailMediaUrl(item.coverMedia)
}

export function resolveGalleryModuleCoverUrl(item: GalleryModuleItemResponse): string {
  const coverUrl = resolvePublicDetailMediaUrl(item.coverMedia)

  if (coverUrl) {
    return coverUrl
  }

  return item.cover?.trim() || ''
}

export function resolveGalleryModulePreviewUrls(item: GalleryModuleItemResponse): string[] {
  const previewUrls = (item.imageAssets ?? [])
    .map((asset) => resolvePublicDetailMediaUrl(asset))
    .filter((url) => url.length > 0)

  if (previewUrls.length > 0) {
    return previewUrls
  }

  const coverUrl = resolveGalleryModuleCoverUrl(item)
  return coverUrl ? [coverUrl] : []
}

export function resolveBookModuleCoverUrl(item: PublicBookModuleItemResponse): string {
  const coverUrl = resolvePublicDetailMediaUrl(item.coverMedia)

  if (coverUrl) {
    return coverUrl
  }

  return item.cover?.trim() || ''
}

export const portalPublicModulesApi = {
  async getArticleList(
    query: PublicArticleModuleQuery
  ): Promise<ApiRequestResult<PublicArticleModuleListResponse>> {
    return safeGetPublic<PublicArticleModuleListResponse>('/articles', {
      page: query.page,
      limit: query.limit,
      themeId: query.themeId,
      keyword: query.keyword,
      sort: query.sort,
      includeAuthor: query.includeAuthor
    })
  },

  async getTopicList(
    query: PublicTopicModuleQuery
  ): Promise<ApiRequestResult<PublicTopicModuleListResponse>> {
    return safeGetPublic<PublicTopicModuleListResponse>(
      '/topics',
      {
        page: query.page,
        limit: query.limit,
        topicId: query.topicId,
        typeId: query.typeId,
        keyword: query.keyword,
        sort: query.sort,
        includeAuthor: query.includeAuthor
      },
      true
    )
  },

  async getBookList(
    query: PublicBookModuleQuery
  ): Promise<ApiRequestResult<PublicBookModuleListResponse>> {
    return safeGetPublic<PublicBookModuleListResponse>('/books', {
      page: query.page,
      limit: query.limit,
      part: query.part,
      keyword: query.keyword,
      sort: query.sort,
      mediaVariant: query.mediaVariant ?? 'preview'
    })
  },

  async getGalleryList(
    query: GalleryModuleQuery
  ): Promise<ApiRequestResult<GalleryModuleListResponse>> {
    return safeGetPublic<GalleryModuleListResponse>('/images', {
      page: query.page,
      limit: query.limit,
      themeId: query.themeId,
      keyword: query.keyword,
      sort: query.sort,
      mediaVariant: query.mediaVariant ?? 'preview'
    })
  }
}
