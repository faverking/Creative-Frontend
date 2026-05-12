<template>
  <section class="content-page manage-page">
    <el-card class="panel-card" shadow="never">
      <el-form label-position="top" class="filter-form" @submit.prevent>
        <div class="filter-topbar">
          <el-radio-group v-model="activeType" size="large">
            <el-radio-button
              v-for="item in businessTabs"
              :key="item.value"
              :label="item.value"
              :value="item.value"
            >
              <span class="radio-label">
                <business-type-icon :name="item.icon" />
                {{ item.label }}
              </span>
            </el-radio-button>
          </el-radio-group>

          <p class="toolbar-tip">{{ activeDefinition.deleteHint }}</p>
        </div>

        <div class="filter-grid">
          <el-form-item :label="TEXT.form.titleLabel">
            <el-input
              v-model="filters.title"
              clearable
              maxlength="120"
              :placeholder="TEXT.form.titlePlaceholder"
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item :label="TEXT.form.dateLabel">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              :start-placeholder="TEXT.form.dateStart"
              :end-placeholder="TEXT.form.dateEnd"
              :range-separator="TEXT.form.dateSeparator"
              unlink-panels
              clearable
            />
          </el-form-item>

          <el-form-item>
            <el-button size="large" round @click="handleReset">{{ TEXT.actions.reset }}</el-button>
            <el-button size="large" round type="primary" @click="handleSearch">
              {{ TEXT.actions.search }}
            </el-button>
          </el-form-item>
        </div>
      </el-form>
    </el-card>

    <el-card class="panel-card" shadow="never">
      <template #header>
        <div class="section-header">
          <div>
            <strong>{{ activeDefinition.listTitle }}</strong>
          </div>
          <span class="section-counter">{{ pageSummary }}</span>
        </div>
      </template>

      <div v-loading="loading" class="record-list-shell">
        <el-empty v-if="records.length === 0" :description="TEXT.section.empty" />

        <div v-else class="record-list">
          <article v-for="record in records" :key="record.id" class="record-card">
            <div class="record-main">
              <div class="record-title-row">
                <div class="record-title-meta">
                  <span class="record-type-pill">
                    <business-type-icon :name="activeDefinition.icon" />
                    {{ activeDefinition.recordLabel }}
                  </span>
                  <el-tag v-if="record.featured" size="small" type="warning" effect="plain" round>
                    {{ `首页推荐 #${record.featured.rank}` }}
                  </el-tag>
                </div>
                <small class="record-time">
                  {{ record.timeLabel }}{{ formatDateTime(record.timeValue) }}
                </small>
              </div>

              <h3>{{ record.title }}</h3>
              <p class="record-summary">{{ record.summary }}</p>

              <div v-if="record.previewImages.length" class="record-gallery">
                <img
                  v-for="(image, index) in record.previewImages"
                  :key="record.id + '-' + index"
                  :src="image"
                  :alt="record.title"
                />
              </div>

              <ul class="record-meta-list">
                <li v-for="item in record.meta" :key="item">{{ item }}</li>
              </ul>
            </div>

            <div class="record-actions">
              <el-button
                type="primary"
                plain
                round
                :disabled="record.softDeleted"
                @click="handleEdit(record)"
              >
                {{ TEXT.actions.edit }}
              </el-button>
              <el-button
                v-if="canManageFeatured"
                :type="record.featured ? 'info' : 'warning'"
                plain
                round
                :disabled="record.softDeleted"
                :loading="isFeaturedSubmitting(record.id)"
                @click="handleToggleFeatured(record)"
              >
                {{ record.featured ? TEXT.actions.cancelRecommend : TEXT.actions.recommend }}
              </el-button>
              <el-button
                type="danger"
                plain
                round
                :disabled="!activeDefinition.deletable"
                @click="handleDelete(record)"
              >
                {{ getDeleteActionLabel(record) }}
              </el-button>
            </div>
          </article>
        </div>
      </div>

      <div class="pagination-bar">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="pagination.total"
          :page-size="pagination.limit"
          :current-page="pagination.page"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@frontend/store'

import BusinessTypeIcon from '@/components/BusinessTypeIcon.vue'
import {
  contentApi,
  type ArticleStatus,
  type FeaturedContentItem,
  type FeaturedContentTargetType,
  type ListMyArticlesQuery,
  type ListMyBooksQuery,
  type ListMyImagePackagesQuery,
  type ListMyTopicsQuery,
  type ResolvedMediaAsset
} from '@/api/content'
import {
  formatArticleStatusLabel,
  formatArticleThemeLabel,
  formatBusinessLabelByTargetType,
  formatDateTime,
  formatImageThemeLabel,
  formatTopicSectionLabel,
  formatTopicSeriesLabel
} from '@/utils/format'

interface ManageFilters {
  title: string
  dateRange: string[]
}

interface PaginationState {
  page: number
  limit: number
  total: number
}

interface ArticleRecordMeta {
  themeId: number
  status: ArticleStatus
  viewCount: number
  replyCount: number
}

type ContentManageType = 'articles' | 'books' | 'topics' | 'images'
type BusinessIconName = 'articles' | 'books' | 'topics' | 'images'

interface ManageRecord {
  id: string
  title: string
  summary: string
  previewImages: string[]
  meta: string[]
  timeLabel: string
  timeValue: string
  featured?: FeaturedContentItem | null
  softDeleted?: boolean
  articleMeta?: ArticleRecordMeta
}

interface BusinessTabItem {
  value: ContentManageType
  label: string
  icon: BusinessIconName
}

interface BusinessDefinition {
  label: string
  listTitle: string
  recordLabel: string
  summary: string
  icon: BusinessIconName
  routePath: string
  targetType: FeaturedContentTargetType
  deletable: boolean
  deleteHint: string
  loadList: (query: ListQuery) => Promise<ManageRecordResponse>
  deleteRecord?: (record: ManageRecord) => Promise<DeleteRecordResult>
}

interface ListQuery {
  page: number
  limit: number
  title?: string
  startDate?: string
  endDate?: string
}

interface ManageRecordResponse {
  items: ManageRecord[]
  page: number
  limit: number
  total: number
}

interface DeleteRecordResult {
  outcome: 'soft_deleted' | 'removed'
}

const HOME_FEATURED_SCENE = 'home_featured'
const FEATURED_QUERY_LIMIT = 50
const FEATURED_CACHE_TTL = 30 * 1000
const FEATURED_ALLOWED_ROLES = new Set(['admin', 'super_admin'])
const ARTICLE_SOFT_DELETE_HINT =
  '支持首页推荐和取消推荐；情报首次删除为软删除，再次删除将彻底清理内容与关联媒体资源。'
const ARTICLE_HARD_DELETE_LABEL = '彻底删除'
const ARTICLE_SOFT_DELETE_SUCCESS = '情报已软删除，可再次删除彻底清理。'
const ARTICLE_HARD_DELETE_SUCCESS = '情报已彻底删除。'
const ARTICLE_SOFT_DELETE_CONFIRM_SUFFIX = '”吗？首次删除会保留一条已删除记录，便于继续彻底删除。'
const ARTICLE_HARD_DELETE_CONFIRM_PREFIX = '确认彻底删除“'
const ARTICLE_HARD_DELETE_CONFIRM_SUFFIX = '”吗？该操作会同步清理情报及关联媒体，且不可恢复。'
const ARTICLE_HARD_DELETE_CONFIRM_TITLE = '确认彻底删除'

const TEXT = {
  form: {
    titleLabel: '标题查询',
    titlePlaceholder: '输入标题关键词后筛选当前业务内容',
    dateLabel: '时间范围',
    dateStart: '开始日期',
    dateEnd: '结束日期',
    dateSeparator: '至'
  },
  section: {
    empty: '当前筛选条件下没有找到内容记录，试试更换业务类型或放宽查询条件。',
    totalSuffix: '条内容记录。',
    pagePrefix: '第 ',
    pageMiddle: ' 页 / 共 ',
    pageSuffix: ' 页'
  },
  actions: {
    reset: '重置',
    search: '查询',
    edit: '编辑',
    recommend: '推荐',
    cancelRecommend: '取消推荐',
    delete: '删除',
    confirm: '确认',
    confirmDelete: '确认删除',
    cancel: '取消'
  },
  message: {
    listError: '内容列表加载失败，请稍后重试。',
    recommended: '已加入首页推荐。',
    recommendCanceled: '已取消首页推荐。',
    recommendConfirmPrefix: '确认将“',
    recommendConfirmSuffix: '”加入首页推荐吗？',
    cancelRecommendConfirmPrefix: '确认取消“',
    cancelRecommendConfirmSuffix: '”的首页推荐吗？',
    deleted: '内容已删除。',
    deleteError: '删除失败，请稍后重试。',
    deleteConfirmPrefix: '确认删除“',
    deleteConfirmSuffix: '”吗？删除后将无法在当前列表继续查看。'
  }
} as const

const businessTabs: BusinessTabItem[] = [
  { value: 'articles', label: formatBusinessLabelByTargetType('article'), icon: 'articles' },
  { value: 'books', label: formatBusinessLabelByTargetType('book'), icon: 'books' },
  { value: 'topics', label: formatBusinessLabelByTargetType('topic'), icon: 'topics' },
  { value: 'images', label: formatBusinessLabelByTargetType('image'), icon: 'images' }
]

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const activeType = ref<ContentManageType>('articles')
const loading = ref(false)
const records = ref<ManageRecord[]>([])
const featuredSubmittingIds = ref<Record<string, boolean>>({})
const featuredRecordCache = new Map<
  FeaturedContentTargetType,
  {
    fetchedAt: number
    itemsById: Map<string, FeaturedContentItem>
  }
>()
const featuredRecordRequests = new Map<
  FeaturedContentTargetType,
  Promise<Map<string, FeaturedContentItem>>
>()
const featuredRecordVersions = new Map<FeaturedContentTargetType, number>()
let recordsRequestToken = 0

const filters = reactive<ManageFilters>({
  title: '',
  dateRange: []
})

const pagination = reactive<PaginationState>({
  page: 1,
  limit: 10,
  total: 0
})

function normalizeRole(role: string): string {
  return role.trim().toLowerCase().replace(/-/g, '_')
}

const canManageFeatured = computed(() =>
  (userStore.profile?.roles ?? []).some((role) => FEATURED_ALLOWED_ROLES.has(normalizeRole(role)))
)

function normalizeManageType(value: unknown): ContentManageType {
  return value === 'books' || value === 'topics' || value === 'images' ? value : 'articles'
}

function formatMetaItem(label: string, value: string | number, fallback = '-'): string {
  const text = typeof value === 'string' ? value.trim() : String(value)
  return `${label}：${text || fallback}`
}

function createArticleMeta(
  themeId: number,
  status: ArticleStatus,
  viewCount: number,
  replyCount: number
): string[] {
  return [
    formatMetaItem('主题', formatArticleThemeLabel(themeId)),
    formatMetaItem('状态', formatArticleStatusLabel(status)),
    '浏览 ' + viewCount + ' / 评论 ' + replyCount
  ]
}

function getRecordSummary(summary?: string, fallback?: string): string {
  const nextSummary = summary?.trim()
  if (nextSummary) {
    return nextSummary
  }

  return fallback?.trim() ?? ''
}

function pickPreviewPath(asset?: ResolvedMediaAsset): string {
  return asset?.previewPath || asset?.downloadPath || ''
}

function pickPreviewImages(assets: ResolvedMediaAsset[] | undefined, limit = 3): string[] {
  return (assets ?? [])
    .map((asset) => pickPreviewPath(asset))
    .filter((path) => path.length > 0)
    .slice(0, limit)
}

function createListQuery(): ListQuery {
  return {
    page: pagination.page,
    limit: pagination.limit,
    title: filters.title.trim() || undefined,
    startDate: filters.dateRange?.[0],
    endDate: filters.dateRange?.[1]
  }
}

function mergeFeaturedRecords(
  items: ManageRecord[],
  featuredItemsById: Map<string, FeaturedContentItem>
): ManageRecord[] {
  return items.map((item) => ({
    ...item,
    featured: featuredItemsById.get(item.id) ?? null
  }))
}

function cloneFeaturedRecordMap(
  featuredItemsById: Map<string, FeaturedContentItem>
): Map<string, FeaturedContentItem> {
  return new Map(featuredItemsById)
}

function getCachedFeaturedRecordMap(
  targetType: FeaturedContentTargetType
): Map<string, FeaturedContentItem> {
  return cloneFeaturedRecordMap(featuredRecordCache.get(targetType)?.itemsById ?? new Map())
}

async function loadFeaturedRecordMap(
  targetType: FeaturedContentTargetType
): Promise<Map<string, FeaturedContentItem>> {
  const featuredItemsById = new Map<string, FeaturedContentItem>()
  let page = 1
  let total = 0

  do {
    const result = await contentApi.listFeaturedContents({
      page,
      limit: FEATURED_QUERY_LIMIT,
      scene: HOME_FEATURED_SCENE,
      targetType,
      activeOnly: true
    })

    result.items
      .filter((item) => item.activeNow)
      .forEach((item) => {
        featuredItemsById.set(item.targetId, item)
      })

    total = result.total
    if (result.items.length === 0) {
      break
    }

    page += 1
  } while (featuredItemsById.size < total)

  return featuredItemsById
}

async function getFeaturedRecordMap(
  targetType: FeaturedContentTargetType
): Promise<Map<string, FeaturedContentItem>> {
  const cached = featuredRecordCache.get(targetType)
  if (cached && Date.now() - cached.fetchedAt < FEATURED_CACHE_TTL) {
    return cloneFeaturedRecordMap(cached.itemsById)
  }

  const pendingRequest = featuredRecordRequests.get(targetType)
  if (pendingRequest) {
    return cloneFeaturedRecordMap(await pendingRequest)
  }

  const cacheVersion = featuredRecordVersions.get(targetType) ?? 0
  const request = loadFeaturedRecordMap(targetType)
    .then((itemsById) => {
      if ((featuredRecordVersions.get(targetType) ?? 0) !== cacheVersion) {
        featuredRecordRequests.delete(targetType)
        return getCachedFeaturedRecordMap(targetType)
      }

      featuredRecordCache.set(targetType, {
        fetchedAt: Date.now(),
        itemsById
      })
      featuredRecordRequests.delete(targetType)
      return itemsById
    })
    .catch((error) => {
      featuredRecordRequests.delete(targetType)
      throw error
    })

  featuredRecordRequests.set(targetType, request)
  return cloneFeaturedRecordMap(await request)
}

function updateFeaturedRecordCache(
  targetType: FeaturedContentTargetType,
  targetId: string,
  featuredItem: FeaturedContentItem | null
): void {
  featuredRecordVersions.set(targetType, (featuredRecordVersions.get(targetType) ?? 0) + 1)
  const nextItemsById = getCachedFeaturedRecordMap(targetType)

  if (featuredItem?.activeNow) {
    nextItemsById.set(targetId, featuredItem)
  } else {
    nextItemsById.delete(targetId)
  }

  featuredRecordCache.set(targetType, {
    fetchedAt: Date.now(),
    itemsById: nextItemsById
  })
}

function setFeaturedSubmitting(recordId: string, value: boolean): void {
  const nextState = { ...featuredSubmittingIds.value }

  if (value) {
    nextState[recordId] = true
  } else {
    delete nextState[recordId]
  }

  featuredSubmittingIds.value = nextState
}

function isFeaturedSubmitting(recordId: string): boolean {
  return featuredSubmittingIds.value[recordId] === true
}

type ArticleListResponse = Awaited<ReturnType<typeof contentApi.listMyArticles>>
type BookListResponse = Awaited<ReturnType<typeof contentApi.listMyBooks>>
type TopicListResponse = Awaited<ReturnType<typeof contentApi.listMyTopics>>
type ImageListResponse = Awaited<ReturnType<typeof contentApi.listMyImagePackages>>

function mapArticleRecords(result: ArticleListResponse): ManageRecordResponse {
  return {
    ...result,
    items: result.items.map((item) => ({
      id: item.id,
      title: item.title,
      summary: getRecordSummary(item.summary, item.desc),
      previewImages: pickPreviewImages(item.imageAssets),
      meta: createArticleMeta(item.themeId, item.status, item.viewCount, item.replyCount),
      timeLabel: '发布时间：',
      timeValue: item.postTime,
      softDeleted: item.status === 'deleted',
      articleMeta: {
        themeId: item.themeId,
        status: item.status,
        viewCount: item.viewCount,
        replyCount: item.replyCount
      }
    }))
  }
}

function mapBookRecords(result: BookListResponse): ManageRecordResponse {
  return {
    ...result,
    items: result.items.map((item) => ({
      id: item.id,
      title: item.name,
      summary: getRecordSummary(item.summary, item.desc),
      previewImages: [pickPreviewPath(item.coverMedia) || item.cover].filter(
        (path) => path.length > 0
      ),
      meta: [
        formatMetaItem('作者', item.authorNames.join(' / '), '未填写'),
        formatMetaItem('分类', item.tags.join(' / '), '未设置'),
        formatMetaItem('章节数', item.total),
        '收藏 ' + item.favorCount + ' / 浏览 ' + item.viewCount
      ],
      timeLabel: '更新时间：',
      timeValue: item.updateTime || item.createTime
    }))
  }
}

function mapTopicRecords(result: TopicListResponse): ManageRecordResponse {
  return {
    ...result,
    items: result.items.map((item) => ({
      id: item.id,
      title: item.title,
      summary: getRecordSummary(item.summary, item.desc),
      previewImages: pickPreviewImages(item.imageAssets),
      meta: [
        `题材 ${formatTopicSeriesLabel(item.topicId)} / 类型 ${formatTopicSectionLabel(item.typeId)}`,
        formatMetaItem('游戏标签', item.featureFlagLabels.join(' / '), '未设置'),
        '收藏 ' + item.favorCount + ' / 评论 ' + item.replyCount
      ],
      timeLabel: '发布时间：',
      timeValue: item.postTime
    }))
  }
}

function mapImageRecords(result: ImageListResponse): ManageRecordResponse {
  return {
    ...result,
    items: result.items.map((item) => ({
      id: item.id,
      title: item.title,
      summary: getRecordSummary(item.summary, item.desc),
      previewImages: pickPreviewImages(item.imageAssets),
      meta: [
        formatMetaItem('主题', formatImageThemeLabel(item.themeId)),
        item.meta ? formatMetaItem('图包信息', item.meta) : formatMetaItem('图片数', item.total),
        '收藏 ' + item.favorCount + ' / 浏览 ' + item.viewCount
      ],
      timeLabel: '上传时间：',
      timeValue: item.uploadTime
    }))
  }
}

function isSoftDeletedArticleRecord(record: ManageRecord): boolean {
  return activeDefinition.value.targetType === 'article' && record.softDeleted === true
}

function getDeleteActionLabel(record: ManageRecord): string {
  return isSoftDeletedArticleRecord(record) ? ARTICLE_HARD_DELETE_LABEL : TEXT.actions.delete
}

function getDeleteConfirmOptions(record: ManageRecord): {
  title: string
  confirmButtonText: string
  message: string
} {
  if (isSoftDeletedArticleRecord(record)) {
    return {
      title: ARTICLE_HARD_DELETE_CONFIRM_TITLE,
      confirmButtonText: ARTICLE_HARD_DELETE_LABEL,
      message:
        ARTICLE_HARD_DELETE_CONFIRM_PREFIX + record.title + ARTICLE_HARD_DELETE_CONFIRM_SUFFIX
    }
  }

  return {
    title: TEXT.actions.confirmDelete,
    confirmButtonText: TEXT.actions.confirmDelete,
    message: TEXT.message.deleteConfirmPrefix + record.title + ARTICLE_SOFT_DELETE_CONFIRM_SUFFIX
  }
}

function markArticleRecordAsSoftDeleted(record: ManageRecord): void {
  record.softDeleted = true
  record.featured = null

  if (!record.articleMeta) {
    return
  }

  record.articleMeta = {
    ...record.articleMeta,
    status: 'deleted'
  }
  record.meta = createArticleMeta(
    record.articleMeta.themeId,
    record.articleMeta.status,
    record.articleMeta.viewCount,
    record.articleMeta.replyCount
  )
}

const businessDefinitions: Record<ContentManageType, BusinessDefinition> = {
  articles: {
    label: '情报内容',
    listTitle: '情报列表',
    recordLabel: formatBusinessLabelByTargetType('article'),
    summary: '适合按标题、发布时间与状态检查历史情报。',
    icon: 'articles',
    routePath: '/home/articles',
    targetType: 'article',
    deletable: true,
    deleteHint: ARTICLE_SOFT_DELETE_HINT,
    async loadList(query) {
      const requestQuery: ListMyArticlesQuery = {
        page: query.page,
        limit: query.limit,
        title: query.title,
        startDate: query.startDate,
        endDate: query.endDate
      }
      return mapArticleRecords(await contentApi.listMyArticles(requestQuery))
    },
    async deleteRecord(record) {
      const result = await contentApi.deleteArticle(
        record.id,
        record.softDeleted
          ? {
              physicalDelete: true,
              cascadeMedia: true
            }
          : undefined
      )

      return {
        outcome: result.deleteMode === 'soft' ? 'soft_deleted' : 'removed'
      }
    }
  },
  books: {
    label: '书库内容',
    listTitle: '书库列表',
    recordLabel: formatBusinessLabelByTargetType('book'),
    summary: '适合按书名和录入时间管理既有书库。',
    icon: 'books',
    routePath: '/home/books',
    targetType: 'book',
    deletable: true,
    deleteHint: '支持首页推荐和取消推荐；书库删除将默认同步清理关联媒体资源。',
    async loadList(query) {
      const requestQuery: ListMyBooksQuery = {
        page: query.page,
        limit: query.limit,
        title: query.title,
        startDate: query.startDate,
        endDate: query.endDate
      }
      return mapBookRecords(await contentApi.listMyBooks(requestQuery))
    },
    async deleteRecord(record) {
      await contentApi.deleteBook(record.id)
      return { outcome: 'removed' }
    }
  },
  topics: {
    label: '游戏内容',
    listTitle: '游戏列表',
    recordLabel: formatBusinessLabelByTargetType('topic'),
    summary: '适合筛选活动主会场、资源页与历史游戏。',
    icon: 'topics',
    routePath: '/home/topics',
    targetType: 'topic',
    deletable: true,
    deleteHint: '支持首页推荐和取消推荐；游戏删除将默认同步清理富文本相关媒体资源。',
    async loadList(query) {
      const requestQuery: ListMyTopicsQuery = {
        page: query.page,
        limit: query.limit,
        title: query.title,
        startDate: query.startDate,
        endDate: query.endDate
      }
      return mapTopicRecords(await contentApi.listMyTopics(requestQuery))
    },
    async deleteRecord(record) {
      await contentApi.deleteTopic(record.id)
      return { outcome: 'removed' }
    }
  },
  images: {
    label: '图包内容',
    listTitle: '图包列表',
    recordLabel: formatBusinessLabelByTargetType('image'),
    summary: '适合检查图包标题、图片数量与上传时间。',
    icon: 'images',
    routePath: '/home/images',
    targetType: 'image',
    deletable: true,
    deleteHint: '支持首页推荐和取消推荐；图包删除将默认同步清理上传图片资源。',
    async loadList(query) {
      const requestQuery: ListMyImagePackagesQuery = {
        page: query.page,
        limit: query.limit,
        title: query.title,
        startDate: query.startDate,
        endDate: query.endDate
      }
      return mapImageRecords(await contentApi.listMyImagePackages(requestQuery))
    },
    async deleteRecord(record) {
      await contentApi.deleteImagePackage(record.id)
      return { outcome: 'removed' }
    }
  }
}

const activeDefinition = computed(() => businessDefinitions[activeType.value])
const pageSummary = computed(() => {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit))
  return `${TEXT.section.pagePrefix}${pagination.page}${TEXT.section.pageMiddle}${totalPages}${TEXT.section.pageSuffix}`
})

async function fetchRecords(): Promise<void> {
  const definition = activeDefinition.value
  const requestToken = ++recordsRequestToken
  const listQuery = createListQuery()
  loading.value = true

  try {
    const featuredStatePromise = canManageFeatured.value
      ? getFeaturedRecordMap(definition.targetType).catch((error) => {
          console.error('Failed to load featured states:', error)
          return getCachedFeaturedRecordMap(definition.targetType)
        })
      : Promise.resolve(new Map<string, FeaturedContentItem>())

    const [result, featuredItemsById] = await Promise.all([
      definition.loadList(listQuery),
      featuredStatePromise
    ])

    if (requestToken !== recordsRequestToken) {
      return
    }

    pagination.page = result.page
    pagination.limit = result.limit
    pagination.total = result.total
    records.value = mergeFeaturedRecords(result.items, featuredItemsById)
  } catch (error) {
    if (requestToken !== recordsRequestToken) {
      return
    }

    ElMessage.error(error instanceof Error ? error.message : TEXT.message.listError)
  } finally {
    if (requestToken === recordsRequestToken) {
      loading.value = false
    }
  }
}

function handleSearch(): void {
  pagination.page = 1
  void fetchRecords()
}

function handleReset(): void {
  filters.title = ''
  filters.dateRange = []
  pagination.page = 1
  void fetchRecords()
}

function handlePageChange(page: number): void {
  pagination.page = page
  void fetchRecords()
}

function handleEdit(record: ManageRecord): void {
  if (record.softDeleted) {
    return
  }

  void router.push({
    path: activeDefinition.value.routePath,
    query: {
      mode: 'edit',
      id: record.id
    }
  })
}

async function handleToggleFeatured(record: ManageRecord): Promise<void> {
  const definition = activeDefinition.value
  if (!canManageFeatured.value || isFeaturedSubmitting(record.id) || record.softDeleted) {
    return
  }

  const confirmMessage = record.featured
    ? TEXT.message.cancelRecommendConfirmPrefix +
      record.title +
      TEXT.message.cancelRecommendConfirmSuffix
    : TEXT.message.recommendConfirmPrefix + record.title + TEXT.message.recommendConfirmSuffix
  const confirmTitle = record.featured ? TEXT.actions.cancelRecommend : TEXT.actions.recommend

  try {
    await ElMessageBox.confirm(confirmMessage, confirmTitle, {
      type: 'warning',
      confirmButtonText: TEXT.actions.confirm,
      cancelButtonText: TEXT.actions.cancel
    })
  } catch {
    return
  }

  setFeaturedSubmitting(record.id, true)

  try {
    if (record.featured) {
      await contentApi.cancelFeaturedContent({
        scene: HOME_FEATURED_SCENE,
        targetType: definition.targetType,
        targetId: record.id
      })
      record.featured = null
      updateFeaturedRecordCache(definition.targetType, record.id, null)
      ElMessage.success(TEXT.message.recommendCanceled)
    } else {
      const featuredItem = await contentApi.upsertFeaturedContent({
        scene: HOME_FEATURED_SCENE,
        targetType: definition.targetType,
        targetId: record.id
      })
      record.featured = featuredItem.activeNow ? featuredItem : null
      updateFeaturedRecordCache(definition.targetType, record.id, featuredItem)
      ElMessage.success(TEXT.message.recommended)
    }
  } catch (error) {
    console.error('Failed to update featured state:', error)
  } finally {
    setFeaturedSubmitting(record.id, false)
  }
}

async function handleDelete(record: ManageRecord): Promise<void> {
  const definition = activeDefinition.value

  if (!definition.deletable || !definition.deleteRecord) {
    ElMessage.warning(definition.deleteHint)
    return
  }

  const confirmOptions = getDeleteConfirmOptions(record)

  try {
    await ElMessageBox.confirm(confirmOptions.message, confirmOptions.title, {
      type: 'warning',
      confirmButtonText: confirmOptions.confirmButtonText,
      cancelButtonText: TEXT.actions.cancel
    })

    const result = await definition.deleteRecord(record)
    updateFeaturedRecordCache(definition.targetType, record.id, null)

    if (result.outcome === 'soft_deleted') {
      markArticleRecordAsSoftDeleted(record)
      ElMessage.success(ARTICLE_SOFT_DELETE_SUCCESS)
      return
    }

    ElMessage.success(
      isSoftDeletedArticleRecord(record) ? ARTICLE_HARD_DELETE_SUCCESS : TEXT.message.deleted
    )

    if (records.value.length === 1 && pagination.page > 1) {
      pagination.page -= 1
    }

    await fetchRecords()
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }

    ElMessage.error(error instanceof Error ? error.message : TEXT.message.deleteError)
  }
}

watch(
  () => route.query.type,
  (nextType) => {
    const normalizedType = normalizeManageType(nextType)
    if (activeType.value !== normalizedType) {
      activeType.value = normalizedType
      pagination.page = 1
      void fetchRecords()
      return
    }

    void fetchRecords()
  },
  {
    immediate: true
  }
)

watch(activeType, (nextType) => {
  if (normalizeManageType(route.query.type) === nextType) {
    return
  }

  pagination.page = 1
  void router.replace({
    query: {
      ...route.query,
      type: nextType
    }
  })
})

watch(canManageFeatured, (nextValue, previousValue) => {
  if (nextValue === previousValue) {
    return
  }

  void fetchRecords()
})
</script>

<style scoped>
.content-page {
  display: grid;
  gap: 18px;
}

.panel-card,
.record-card {
  border: 1px solid var(--community-border);
  border-radius: 30px;
  background: var(--community-surface);
  box-shadow: var(--community-shadow);
}

.toolbar-tip,
.section-header span,
.section-counter,
.record-summary,
.record-time,
.record-meta-list {
  color: var(--el-text-color-secondary);
}

.panel-card {
  padding: 6px;
}

.filter-form,
.record-list-shell {
  display: grid;
  gap: 18px;
}

.filter-topbar {
  display: grid;
  gap: 14px;
}

.radio-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.radio-label :deep(svg) {
  width: 14px;
  height: 14px;
}

.toolbar-tip {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
}

.filter-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 380px) minmax(200px, 240px);
  gap: 18px;
}

.filter-grid .el-form-item {
  margin-bottom: 0;
}

.filter-grid .el-form-item:last-child :deep(.el-form-item__content) {
  top: 34px;
  left: 12px;
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.section-header strong {
  display: block;
  font-size: 18px;
  line-height: 1.4;
}

.record-list {
  display: grid;
  gap: 16px;
}

.record-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  padding: 20px 22px;
}

.record-main {
  display: grid;
  gap: 12px;
}

.record-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.record-title-meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.record-type-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(92, 193, 255, 0.14);
  color: #2d77b6;
  font-size: 14px;
  font-weight: 700;
}

.record-type-pill :deep(svg) {
  width: 15px;
  height: 15px;
}

.record-main h3 {
  margin: 0;
  font-size: 20px;
  line-height: 1.35;
}

.record-summary {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
}

.record-meta-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
}

.record-gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(76px, 100px));
  gap: 10px;
  align-content: start;
}

.record-gallery img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 18px;
  object-fit: cover;
  background: var(--community-surface-soft);
}

.record-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding-top: 18px;
}
</style>
