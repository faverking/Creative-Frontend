import type { RequestConfig } from '@frontend/request'

import { getHttpClient } from './index'

interface PaginationQuery {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  items: T[]
  page: number
  limit: number
  total: number
}

export interface MediaUploadItem {
  id: string
  type: 'image' | 'audio' | 'zip'
  originalName: string
  fileName: string
  mimeType: string
  size: number
  sha256: string
  cacheKey?: string
  detailPath: string
  previewPath?: string
  downloadPath: string
  attachmentPath?: string
  createdAt?: string
}

export interface ResolvedMediaAsset {
  id: string
  type?: 'image' | 'audio' | 'zip'
  originalName?: string
  fileName?: string
  mimeType?: string
  size?: number
  cacheKey?: string
  detailPath?: string
  previewPath?: string
  downloadPath?: string
  attachmentPath?: string
}

export interface UploadImagesResult {
  items: MediaUploadItem[]
  total: number
}

export type ZipUploadMode = 'extract' | 'direct'

export interface UploadZipExtractResult {
  items: MediaUploadItem[]
  total: number
  skipped: Array<{
    entryName: string
    reason: string
  }>
}

export type UploadZipDirectResult = MediaUploadItem
export type UploadZipResult = UploadZipExtractResult | UploadZipDirectResult

export type ArticleStatus = 'draft' | 'published' | 'offline' | 'deleted'

export interface CreateArticlePayload {
  title: string
  desc: string
  content: string
  themeId: number
  images?: string[]
  status?: ArticleStatus
}

export interface ArticleListItem {
  id: string
  title: string
  desc: string
  summary: string
  imageAssets: ResolvedMediaAsset[]
  coverMedia?: ResolvedMediaAsset
  themeId: number
  userId: string
  status: ArticleStatus
  reviewStatus: 'pending' | 'approved' | 'rejected'
  visibility: 'public' | 'private'
  viewCount: number
  favorCount: number
  replyCount: number
  postTime: string
  updateTime: string
}

export interface ArticleDetail extends ArticleListItem {
  content: string
  imageMediaIds: string[]
}

export type CreateArticleResult = ArticleDetail

export interface ListMyArticlesQuery extends PaginationQuery {
  title?: string
  startDate?: string
  endDate?: string
  status?: ArticleStatus
}

export interface DraftPayload {
  themeId: number
  title: string
  content: string
}

export interface DraftMutationResult {
  id: string
  themeId: number
  title: string
  version: number
  createTime: string
  updateTime: string
  content?: string
}

export interface DraftDetail extends DraftMutationResult {
  content: string
}

export interface CreateImagePackagePayload {
  title: string
  desc: string
  images: string[]
  themeId?: number
  cover?: string
  source?: string
}

export interface ImagePackageListItem {
  id: string
  title: string
  desc: string
  summary: string
  imageAssets: ResolvedMediaAsset[]
  total: number
  themeId: number
  viewCount: number
  favorCount: number
  replyCount: number
  cover?: string
  coverMedia?: ResolvedMediaAsset
  qualityLabel?: string
  resolution?: string
  reviewStatus: 'pending' | 'approved' | 'rejected'
  visibility: 'public' | 'private'
  meta?: string
  uploadTime: string
  userId: string
}

export interface ImagePackageDetail extends ImagePackageListItem {
  imageMediaIds: string[]
  coverMediaId?: string
  source?: string
}

export type CreateImagePackageResult = ImagePackageDetail

export interface ListMyImagePackagesQuery extends PaginationQuery {
  title?: string
  themeId?: number
  startDate?: string
  endDate?: string
}

export interface CreateTopicPayload {
  topicId: number
  typeId: number
  title: string
  images?: string[]
  content: string
  desc: string
  downloadUrl: string
  featureFlags: number[]
}

export interface TopicListItem {
  id: string
  topicId: number
  typeId: number
  title: string
  imageAssets: ResolvedMediaAsset[]
  coverMedia?: ResolvedMediaAsset
  desc: string
  summary: string
  downloadUrl: string
  userId: string
  featureFlags: number[]
  featureFlagLabels: string[]
  reviewStatus: 'pending' | 'approved' | 'rejected'
  visibility: 'public' | 'private'
  viewCount: number
  replyCount: number
  favorCount: number
  postTime: string
  updateTime: string
}

export interface TopicDetail extends TopicListItem {
  content: string
  imageMediaIds: string[]
}

export type CreateTopicResult = TopicDetail

export interface ListMyTopicsQuery extends PaginationQuery {
  title?: string
  topicId?: number
  typeId?: number
  featureFlags?: number[]
  startDate?: string
  endDate?: string
}

export interface BookStyleItem {
  id: number
  name: string
}

export interface BookChapterItem {
  id: number
  order: number
  size: number
  title: string
  rule?: string
}

export interface CreateBookPayload {
  author?: string[]
  part?: 1 | 2 | 3
  style?: BookStyleItem[]
  status?: 1 | 2
  area?: 1 | 2 | 3
  name: string
  cover: string
  desc: string
  releaseTime?: number
  chapterList?: BookChapterItem[]
}

export interface BookListItem {
  id: string
  title: string
  author: string[]
  authorNames: string[]
  part: 1 | 2 | 3
  status: 1 | 2
  area: 1 | 2 | 3
  total: number
  name: string
  cover: string
  coverMedia?: ResolvedMediaAsset
  coverMediaId: string
  desc: string
  summary: string
  tags: string[]
  viewCount: number
  favorCount: number
  replyCount: number
  releaseTime?: number
  createTime: string
  updateTime: string
  userId: string
}

export interface BookDetail extends BookListItem {
  style: BookStyleItem[]
  chapterList: BookChapterItem[]
  origin?: string
  comicId?: string
  novelId?: string
  otherId?: string
}

export interface CreateBookResult {
  id: string
  name: string
  cover: string
  part: 1 | 2 | 3
  status: 1 | 2
  area: 1 | 2 | 3
  createTime: string
}

export interface ListMyBooksQuery extends PaginationQuery {
  title?: string
  startDate?: string
  endDate?: string
}

export interface UpsertBookChaptersPayload {
  chapterList: BookChapterItem[]
  origin?: string
  comicId?: string
  novelId?: string
  otherId?: string
}

export interface UpsertBookChaptersResult {
  bookId: string
  total: number
  chapterList: BookChapterItem[]
  origin?: string
  comicId?: string
  novelId?: string
  otherId?: string
}

export type FeaturedContentTargetType = 'article' | 'book' | 'topic' | 'image'

export interface FeaturedContentItem {
  id: string
  scene: string
  targetType: FeaturedContentTargetType
  targetId: string
  rank: number
  enabled: boolean
  activeNow: boolean
  startAt?: string
  endAt?: string
  note?: string
  operatorId: string
  createTime: string
  updateTime: string
}

export interface CoverView {
  previewPath: string
  downloadPath: string
}

export interface AdminContentPermissions {
  canRecommend: boolean
  canSetPrivate: boolean
  canPhysicalDelete: boolean
}

export interface AdminContentOwner {
  id: string
  name: string
  avatarUrl: string
}

export type AdminContentReviewStatus = 'pending' | 'approved' | 'rejected'
export type AdminContentSort = 'latest' | 'hot'

export interface AdminContentItem {
  id: string
  type: FeaturedContentTargetType
  businessLabel: string
  title: string
  summary: string
  cover: CoverView | null
  owner?: AdminContentOwner
  tags: string[]
  viewCount: number
  favorCount: number
  replyCount: number
  reviewStatus: AdminContentReviewStatus
  visibility: 'public' | 'private'
  featured: boolean
  featuredConfig?: FeaturedContentItem
  createTime: string
  updateTime: string
  themeId?: number
  status?: ArticleStatus | number
  deleted?: boolean
  deletedAt?: string
  part?: number
  area?: number
  total?: number
  authorNames?: string[]
  topicId?: number
  typeId?: number
  featureFlags?: number[]
  featureFlagLabels?: string[]
  source?: string
  meta?: string
  qualityLabel?: string
  resolution?: string
}

export interface AdminContentOperator {
  id: string
  roles: string[]
}

export interface ListAdminContentsQuery extends PaginationQuery {
  scene?: string
  type: FeaturedContentTargetType
  keyword?: string
  title?: string
  userId?: string
  startDate?: string
  endDate?: string
  reviewStatus?: AdminContentReviewStatus
  visibility?: 'public' | 'private'
  featured?: boolean
  deleted?: boolean
  status?: ArticleStatus
  themeId?: number
  topicId?: number
  typeId?: number
  featureFlags?: number[]
  part?: number
  area?: number
  bookStatus?: 1 | 2
  sort?: AdminContentSort
}

export interface ListAdminContentsResult extends PaginatedResult<AdminContentItem> {
  scene: string
  type: FeaturedContentTargetType
  permissions: AdminContentPermissions
  operator: AdminContentOperator
}

export interface SetAdminContentPrivateResult {
  success: boolean
  changed: boolean
  canceledFeaturedCount: number
  item: AdminContentItem
}

export interface AdminContentSummaryItem {
  total: number
  public: number
  private: number
  pending: number
  rejected: number
  featured: number
  deleted?: number
}

export interface AdminContentSummaryCounts {
  article: AdminContentSummaryItem
  book: AdminContentSummaryItem
  topic: AdminContentSummaryItem
  image: AdminContentSummaryItem
}

export interface AdminContentSummaryQuery {
  scene?: string
}

export interface AdminContentSummaryResult {
  scene: string
  permissions: AdminContentPermissions
  counts: AdminContentSummaryCounts
  operator: AdminContentOperator
}

export interface DeleteAdminContentOptions {
  cascadeMedia?: boolean
}

export interface DeleteAdminContentResult {
  success: boolean
  deletedComments?: number
  deletedFavorites?: number
  deletedFeaturedConfigs?: number
  mediaCleanup?: {
    deletedIds: string[]
    skipped: Array<{
      id: string
      reason: string
    }>
  }
}

export interface ListFeaturedContentsQuery extends PaginationQuery {
  scene?: string
  targetType?: FeaturedContentTargetType
  enabled?: boolean
  activeOnly?: boolean
}

export interface UpsertFeaturedContentPayload {
  scene?: string
  targetType: FeaturedContentTargetType
  targetId: string
  rank?: number
  enabled?: boolean
  startAt?: string
  endAt?: string
  note?: string
}

export interface CancelFeaturedContentPayload {
  scene?: string
  targetType: FeaturedContentTargetType
  targetId: string
}

export interface CancelFeaturedContentResult {
  success: boolean
  canceled: boolean
  scene?: string
  targetType?: FeaturedContentTargetType
  targetId?: string
  item?: FeaturedContentItem
}

interface MutationResult {
  success?: boolean
  message?: string
}

export interface DeleteArticleOptions {
  physicalDelete?: boolean
  cascadeMedia?: boolean
}

export interface ArticleDeleteResult {
  success: boolean
  deleteMode: 'soft' | 'physical'
  deletedComments?: number
  deletedFavorites?: number
  mediaCleanup?: {
    deletedIds: string[]
    skipped: Array<{
      id: string
      reason: string
    }>
  }
}

function createClientId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createIdempotencyKey(prefix: string): string {
  return `${prefix}-${createClientId()}`
}

function withIdempotency(prefix: string, config: RequestConfig = {}): RequestConfig {
  return {
    ...config,
    headers: {
      ...(config.headers ?? {}),
      'Idempotency-Key': createIdempotencyKey(prefix)
    }
  }
}

export const contentApi = {
  async createArticle(payload: CreateArticlePayload): Promise<CreateArticleResult> {
    return getHttpClient().post<CreateArticleResult>(
      '/articles',
      payload,
      withIdempotency('article-create')
    )
  },

  async listMyArticles(query: ListMyArticlesQuery): Promise<PaginatedResult<ArticleListItem>> {
    return getHttpClient().get<PaginatedResult<ArticleListItem>>('/articles/me', {
      params: query
    })
  },

  async getMyArticleDetail(id: string): Promise<ArticleDetail> {
    return getHttpClient().get<ArticleDetail>(`/articles/me/${id}`)
  },

  async updateArticle(id: string, payload: Partial<CreateArticlePayload>): Promise<ArticleDetail> {
    return getHttpClient().patch<ArticleDetail>(
      `/articles/${id}`,
      payload,
      withIdempotency('article-update')
    )
  },

  async deleteArticle(
    id: string,
    options: DeleteArticleOptions = {}
  ): Promise<ArticleDeleteResult> {
    return getHttpClient().delete<ArticleDeleteResult>(
      `/articles/${id}`,
      withIdempotency('article-delete', {
        params: {
          physicalDelete: options.physicalDelete || undefined,
          cascadeMedia: options.cascadeMedia || undefined
        }
      })
    )
  },

  async createDraft(payload: DraftPayload): Promise<DraftMutationResult> {
    return getHttpClient().post<DraftMutationResult>(
      '/drafts',
      payload,
      withIdempotency('draft-create')
    )
  },

  async updateDraft(id: string, payload: Partial<DraftPayload>): Promise<DraftMutationResult> {
    return getHttpClient().patch<DraftMutationResult>(
      `/drafts/${id}`,
      payload,
      withIdempotency('draft-update')
    )
  },

  async getDraftDetail(id: string): Promise<DraftDetail> {
    return getHttpClient().get<DraftDetail>(`/drafts/${id}`)
  },

  async uploadImages(files: File[]): Promise<UploadImagesResult> {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    return getHttpClient().post<UploadImagesResult>(
      '/media/images/upload',
      formData,
      withIdempotency('media-images-upload')
    )
  },

  async uploadZip<TMode extends ZipUploadMode>(
    file: File,
    mode: TMode = 'extract' as TMode
  ): Promise<TMode extends 'direct' ? UploadZipDirectResult : UploadZipExtractResult> {
    const formData = new FormData()
    formData.append('file', file)

    return getHttpClient().post<
      TMode extends 'direct' ? UploadZipDirectResult : UploadZipExtractResult
    >(
      '/media/zip/upload',
      formData,
      withIdempotency('media-zip-upload', {
        params: {
          mode
        }
      })
    )
  },

  async createImagePackage(payload: CreateImagePackagePayload): Promise<CreateImagePackageResult> {
    return getHttpClient().post<CreateImagePackageResult>(
      '/images',
      payload,
      withIdempotency('image-package-create')
    )
  },

  async listMyImagePackages(
    query: ListMyImagePackagesQuery
  ): Promise<PaginatedResult<ImagePackageListItem>> {
    return getHttpClient().get<PaginatedResult<ImagePackageListItem>>('/images/me', {
      params: query
    })
  },

  async getMyImagePackageDetail(id: string): Promise<ImagePackageDetail> {
    return getHttpClient().get<ImagePackageDetail>(`/images/me/${id}`)
  },

  async updateImagePackage(
    id: string,
    payload: Partial<CreateImagePackagePayload>
  ): Promise<ImagePackageDetail> {
    return getHttpClient().patch<ImagePackageDetail>(
      `/images/${id}`,
      payload,
      withIdempotency('image-package-update')
    )
  },

  async deleteImagePackage(id: string): Promise<MutationResult> {
    return getHttpClient().delete<MutationResult>(`/images/${id}`, {
      params: {
        cascadeMedia: true
      }
    })
  },

  async createTopic(payload: CreateTopicPayload): Promise<CreateTopicResult> {
    return getHttpClient().post<CreateTopicResult>(
      '/topics',
      payload,
      withIdempotency('topic-create')
    )
  },

  async listMyTopics(query: ListMyTopicsQuery): Promise<PaginatedResult<TopicListItem>> {
    return getHttpClient().get<PaginatedResult<TopicListItem>>('/topics/me', {
      params: query
    })
  },

  async getMyTopicDetail(id: string): Promise<TopicDetail> {
    return getHttpClient().get<TopicDetail>(`/topics/me/${id}`)
  },

  async updateTopic(id: string, payload: Partial<CreateTopicPayload>): Promise<TopicDetail> {
    return getHttpClient().patch<TopicDetail>(
      `/topics/${id}`,
      payload,
      withIdempotency('topic-update')
    )
  },

  async deleteTopic(id: string): Promise<MutationResult> {
    return getHttpClient().delete<MutationResult>(`/topics/${id}`, {
      params: {
        cascadeMedia: true
      }
    })
  },

  async createBook(payload: CreateBookPayload): Promise<CreateBookResult> {
    return getHttpClient().post<CreateBookResult>('/books', payload, withIdempotency('book-create'))
  },

  async listMyBooks(query: ListMyBooksQuery): Promise<PaginatedResult<BookListItem>> {
    return getHttpClient().get<PaginatedResult<BookListItem>>('/books/me', {
      params: query
    })
  },

  async getMyBookDetail(id: string): Promise<BookDetail> {
    return getHttpClient().get<BookDetail>(`/books/me/${id}`)
  },

  async updateBook(id: string, payload: Partial<CreateBookPayload>): Promise<BookDetail> {
    return getHttpClient().patch<BookDetail>(
      `/books/${id}`,
      payload,
      withIdempotency('book-update')
    )
  },

  async deleteBook(id: string): Promise<MutationResult> {
    return getHttpClient().delete<MutationResult>(`/books/${id}`, {
      params: {
        cascadeMedia: true
      }
    })
  },

  async upsertBookChapters(
    id: string,
    payload: UpsertBookChaptersPayload
  ): Promise<UpsertBookChaptersResult> {
    return getHttpClient().put<UpsertBookChaptersResult>(
      `/books/${id}/chapters`,
      payload,
      withIdempotency('book-chapters-upsert')
    )
  },

  async upsertFeaturedContent(payload: UpsertFeaturedContentPayload): Promise<FeaturedContentItem> {
    return getHttpClient().post<FeaturedContentItem>(
      '/admin/featured-contents',
      payload,
      withIdempotency('featured-content-upsert')
    )
  },

  async cancelFeaturedContent(
    payload: CancelFeaturedContentPayload
  ): Promise<CancelFeaturedContentResult> {
    return getHttpClient().post<CancelFeaturedContentResult>(
      '/admin/featured-contents/cancel',
      payload,
      withIdempotency('featured-content-cancel')
    )
  },

  async listFeaturedContents(
    query: ListFeaturedContentsQuery
  ): Promise<PaginatedResult<FeaturedContentItem>> {
    return getHttpClient().get<PaginatedResult<FeaturedContentItem>>('/admin/featured-contents', {
      params: query
    })
  },

  async listAdminContents(query: ListAdminContentsQuery): Promise<ListAdminContentsResult> {
    return getHttpClient().get<ListAdminContentsResult>('/admin/content', {
      params: query
    })
  },

  async getAdminContentSummary(
    query: AdminContentSummaryQuery = {}
  ): Promise<AdminContentSummaryResult> {
    return getHttpClient().get<AdminContentSummaryResult>('/admin/content/summary', {
      params: query
    })
  },

  async setAdminContentPrivate(
    type: FeaturedContentTargetType,
    id: string
  ): Promise<SetAdminContentPrivateResult> {
    return getHttpClient().patch<SetAdminContentPrivateResult>(
      `/admin/content/${type}/${id}/private`,
      undefined,
      withIdempotency('admin-content-set-private')
    )
  },

  async deleteAdminContent(
    type: FeaturedContentTargetType,
    id: string,
    options: DeleteAdminContentOptions = {}
  ): Promise<DeleteAdminContentResult> {
    return getHttpClient().delete<DeleteAdminContentResult>(
      `/admin/content/${type}/${id}`,
      withIdempotency('admin-content-delete', {
        params: {
          cascadeMedia: options.cascadeMedia || undefined
        }
      })
    )
  }
}
