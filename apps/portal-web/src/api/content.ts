import { HOME_FEATURED_LIMIT } from '@/constants/home'
import { type HOME_CONTENT_TYPE } from '@/constants/portal-business'
import { safeGetPublic, type ApiRequestResult } from '@/api/public-request'
import { resolveAssetUrl } from '@/utils/assets'

export interface HomeMediaAsset {
  previewPath: string
  downloadPath: string
}

export interface HomeAuthorSummary {
  id: string
  name: string
  avatarUrl?: string
}

export interface HomeInteractionStats {
  viewCount: number
  favorCount: number
  replyCount: number
}

export interface HomeFeaturedResponse {
  id: string
  type: HOME_CONTENT_TYPE
  title: string
  summary: string
  cover: HomeMediaAsset | null
  badge: string
  recommendLabel: string
  kicker: string
  tags: string[]
  author?: HomeAuthorSummary
  stats: HomeInteractionStats
  publishTime: string
}

export interface HomeArticleCardResponse {
  id: string
  title: string
  summary: string
  cover: HomeMediaAsset | null
  viewCount: number
  replyCount: number
  publishTime: string
}

export interface HomeArticleFeaturedResponse extends HomeArticleCardResponse {
  badge: string
  tags: string[]
}

export interface HomeArticleSectionResponse {
  featured: HomeArticleFeaturedResponse | null
  items: HomeArticleCardResponse[]
}

export interface HomeColumnItemResponse {
  id: string
  title: string
  summary: string
  cover: HomeMediaAsset | null
  author?: HomeAuthorSummary
  topicId?: number
  featureFlags?: number[]
  featureFlagLabels?: string[]
  viewCount: number
  replyCount: number
}

export interface HomeColumnSectionResponse {
  items: HomeColumnItemResponse[]
}

export interface HomeBookshelfItemResponse {
  id: string
  title: string
  summary: string
  cover: HomeMediaAsset | null
  tags: string[]
  authorNames: string[]
  viewCount: number
  replyCount: number
}

export interface HomeBookshelfSectionResponse {
  items: HomeBookshelfItemResponse[]
}

export interface HomeGalleryImageResponse {
  previewPath?: string
  downloadPath?: string
}

export interface HomeGalleryItemResponse {
  id: string
  title: string
  meta: string
  badge: string
  qualityLabel: string
  resolution: string
  images: HomeGalleryImageResponse[]
  total: number
  viewCount: number
  replyCount: number
}

export interface HomeGallerySectionResponse {
  items: HomeGalleryItemResponse[]
}

export interface HomeResponse {
  articleSection: HomeArticleSectionResponse
  columnSection: HomeColumnSectionResponse
  bookshelfSection: HomeBookshelfSectionResponse
  gallerySection: HomeGallerySectionResponse
  generatedAt: string
}

export interface SearchFeaturedTotalsResponse {
  articles: number
  books: number
  images: number
  topics: number
}

export interface SearchFeaturedResponse {
  items: HomeFeaturedResponse[]
  totals: SearchFeaturedTotalsResponse
}

export function resolveHomeMediaUrl(
  asset?: HomeMediaAsset | HomeGalleryImageResponse | null
): string {
  if (!asset) {
    return ''
  }

  const path = asset.previewPath || asset.downloadPath || ''
  return path ? resolveAssetUrl(path) : ''
}

export const portalContentApi = {
  async getHomePage(): Promise<ApiRequestResult<HomeResponse>> {
    return safeGetPublic<HomeResponse>('/home')
  },

  async getFeaturedItems(): Promise<ApiRequestResult<SearchFeaturedResponse>> {
    return safeGetPublic<SearchFeaturedResponse>('/search/featured', {
      limit: HOME_FEATURED_LIMIT,
      includeAuthor: true
    })
  }
}
