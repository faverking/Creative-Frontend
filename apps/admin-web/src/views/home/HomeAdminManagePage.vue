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

          <p class="toolbar-tip">{{ toolbarTip }}</p>
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
                    {{ record.businessLabel }}
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
              <p v-if="record.summary" class="record-summary">{{ record.summary }}</p>

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
                v-if="adminPermissions.canRecommend"
                :type="record.featured ? 'info' : 'warning'"
                plain
                round
                :loading="isActionSubmitting('recommend', record.id)"
                @click="handleToggleFeatured(record)"
              >
                {{ record.featured ? TEXT.actions.cancelRecommend : TEXT.actions.recommend }}
              </el-button>
              <el-button
                v-if="adminPermissions.canSetPrivate && record.visibility === 'public'"
                type="info"
                plain
                round
                :loading="isActionSubmitting('private', record.id)"
                @click="handleSetPrivate(record)"
              >
                {{ TEXT.actions.setPrivate }}
              </el-button>
              <el-button
                v-if="adminPermissions.canPhysicalDelete"
                type="danger"
                plain
                round
                :loading="isActionSubmitting('delete', record.id)"
                @click="handleDelete(record)"
              >
                {{ TEXT.actions.delete }}
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

import BusinessTypeIcon from '@/components/BusinessTypeIcon.vue'
import {
  contentApi,
  type AdminContentItem,
  type AdminContentPermissions,
  type ArticleStatus,
  type FeaturedContentItem,
  type FeaturedContentTargetType,
  type ListAdminContentsQuery
} from '@/api/content'
import {
  formatArticleStatusLabel,
  formatBusinessLabelByTargetType,
  formatDateTime,
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

type ContentManageType = 'articles' | 'books' | 'topics' | 'images'
type BusinessIconName = 'articles' | 'books' | 'topics' | 'images'
type ManageAction = 'recommend' | 'private' | 'delete'

interface ManageRecord {
  id: string
  businessLabel: string
  title: string
  summary: string
  previewImages: string[]
  meta: string[]
  timeLabel: string
  timeValue: string
  visibility: 'public' | 'private'
  featured: FeaturedContentItem | null
}

interface BusinessTabItem {
  value: ContentManageType
  label: string
  icon: BusinessIconName
}

interface BusinessDefinition {
  listTitle: string
  summary: string
  icon: BusinessIconName
  targetType: FeaturedContentTargetType
  buildListQuery: (query: ListQuery) => ListAdminContentsQuery
  mapRecord: (item: AdminContentItem) => ManageRecord
}

interface ListQuery {
  page: number
  limit: number
  title?: string
  startDate?: string
  endDate?: string
}

const HOME_FEATURED_SCENE = 'home_featured'
const DEFAULT_ADMIN_PERMISSIONS: AdminContentPermissions = {
  canRecommend: false,
  canSetPrivate: false,
  canPhysicalDelete: false
}

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
    empty: '当前筛选条件下没有找到内容记录，请尝试调整查询条件。',
    pagePrefix: '第 ',
    pageMiddle: ' 页 / 共 ',
    pageSuffix: ' 页'
  },
  actions: {
    reset: '重置',
    search: '查询',
    recommend: '推荐',
    cancelRecommend: '取消推荐',
    setPrivate: '设为私有',
    delete: '物理删除',
    confirm: '确认',
    cancel: '取消'
  },
  message: {
    recommended: '已加入首页推荐。',
    recommendCanceled: '已取消首页推荐。',
    setPrivateSuccess: '内容已设为私有。',
    deleteSuccess: '内容已物理删除。',
    recommendConfirmPrefix: '确认将“',
    recommendConfirmSuffix: '”加入首页推荐吗？',
    cancelRecommendConfirmPrefix: '确认取消“',
    cancelRecommendConfirmSuffix: '”的首页推荐吗？',
    setPrivateConfirmPrefix: '确认将“',
    setPrivateConfirmSuffix: '”设为私有吗？设为私有后将自动取消推荐。',
    deleteConfirmPrefix: '确认物理删除“',
    deleteConfirmSuffix: '”吗？该操作会清理关联推荐配置，且不可恢复。'
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
const activeType = ref<ContentManageType>('articles')
const loading = ref(false)
const records = ref<ManageRecord[]>([])
const adminPermissions = ref<AdminContentPermissions>({ ...DEFAULT_ADMIN_PERMISSIONS })
const actionSubmittingState = ref<Record<string, boolean>>({})
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

function normalizeManageType(value: unknown): ContentManageType {
  return value === 'books' || value === 'topics' || value === 'images' ? value : 'articles'
}

function formatMetaItem(
  label: string,
  value: string | number | null | undefined,
  fallback = '-'
): string {
  const text = typeof value === 'string' ? value.trim() : value == null ? '' : String(value)
  return `${label}：${text || fallback}`
}

function formatStatsMeta(item: Pick<AdminContentItem, 'viewCount' | 'replyCount'>): string {
  return `浏览 ${item.viewCount} / 回复 ${item.replyCount}`
}

function formatOwnerMeta(item: Pick<AdminContentItem, 'owner'>): string {
  return formatMetaItem('发布者', item.owner?.name, '未知用户')
}

function formatTagMeta(item: Pick<AdminContentItem, 'tags'>): string {
  return formatMetaItem('分类', item.tags.join(' / '))
}

function createCoverPreviewImages(item: Pick<AdminContentItem, 'cover'>): string[] {
  const image = item.cover?.previewPath || item.cover?.downloadPath || ''
  return image ? [image] : []
}

function getRecordSummary(summary?: string): string {
  return summary?.trim() ?? ''
}

function compactMeta(items: Array<string | null | undefined>): string[] {
  return items.filter((item): item is string => Boolean(item && item.trim().length > 0))
}

function createArticleRecord(item: AdminContentItem): ManageRecord {
  const status =
    typeof item.status === 'string' ? formatArticleStatusLabel(item.status as ArticleStatus) : '-'

  return {
    id: item.id,
    businessLabel: item.businessLabel,
    title: item.title,
    summary: getRecordSummary(item.summary),
    previewImages: createCoverPreviewImages(item),
    meta: compactMeta([
      formatOwnerMeta(item),
      formatTagMeta(item),
      formatMetaItem('状态', status),
      formatStatsMeta(item)
    ]),
    timeLabel: '发布时间：',
    timeValue: item.createTime,
    visibility: item.visibility,
    featured: item.featuredConfig ?? null
  }
}

function createBookRecord(item: AdminContentItem): ManageRecord {
  return {
    id: item.id,
    businessLabel: item.businessLabel,
    title: item.title,
    summary: getRecordSummary(item.summary),
    previewImages: createCoverPreviewImages(item),
    meta: compactMeta([
      formatOwnerMeta(item),
      formatMetaItem('作者', item.authorNames?.join(' / '), '未填写'),
      formatMetaItem('分区', item.tags.join(' / ')),
      formatMetaItem('章节数', item.total),
      formatStatsMeta(item)
    ]),
    timeLabel: '更新时间：',
    timeValue: item.updateTime || item.createTime,
    visibility: item.visibility,
    featured: item.featuredConfig ?? null
  }
}

function createTopicRecord(item: AdminContentItem): ManageRecord {
  const topicMeta = `${formatTopicSeriesLabel(item.topicId)} / ${formatTopicSectionLabel(item.typeId)}`

  return {
    id: item.id,
    businessLabel: item.businessLabel,
    title: item.title,
    summary: getRecordSummary(item.summary),
    previewImages: createCoverPreviewImages(item),
    meta: compactMeta([
      formatOwnerMeta(item),
      formatMetaItem('题材 / 类型', topicMeta),
      formatMetaItem('游戏标签', item.featureFlagLabels?.join(' / '), '未设置'),
      formatStatsMeta(item)
    ]),
    timeLabel: '发布时间：',
    timeValue: item.createTime,
    visibility: item.visibility,
    featured: item.featuredConfig ?? null
  }
}

function createImageRecord(item: AdminContentItem): ManageRecord {
  return {
    id: item.id,
    businessLabel: item.businessLabel,
    title: item.title,
    summary: getRecordSummary(item.summary),
    previewImages: createCoverPreviewImages(item),
    meta: compactMeta([
      formatOwnerMeta(item),
      formatTagMeta(item),
      item.meta ? formatMetaItem('图包信息', item.meta) : formatMetaItem('图片数', item.total),
      item.qualityLabel ? formatMetaItem('画质', item.qualityLabel) : null,
      formatStatsMeta(item)
    ]),
    timeLabel: '上传时间：',
    timeValue: item.createTime,
    visibility: item.visibility,
    featured: item.featuredConfig ?? null
  }
}

const businessDefinitions: Record<ContentManageType, BusinessDefinition> = {
  articles: {
    listTitle: `${formatBusinessLabelByTargetType('article')}管理列表`,
    summary: '仅展示全站已公开且未删除的情报内容。',
    icon: 'articles',
    targetType: 'article',
    buildListQuery(query) {
      return {
        scene: HOME_FEATURED_SCENE,
        type: 'article',
        page: query.page,
        limit: query.limit,
        title: query.title,
        startDate: query.startDate,
        endDate: query.endDate,
        visibility: 'public',
        deleted: false,
        status: 'published',
        sort: 'latest'
      }
    },
    mapRecord: createArticleRecord
  },
  books: {
    listTitle: `${formatBusinessLabelByTargetType('book')}管理列表`,
    summary: '仅展示全站已公开的书库内容。',
    icon: 'books',
    targetType: 'book',
    buildListQuery(query) {
      return {
        scene: HOME_FEATURED_SCENE,
        type: 'book',
        page: query.page,
        limit: query.limit,
        title: query.title,
        startDate: query.startDate,
        endDate: query.endDate,
        visibility: 'public',
        sort: 'latest'
      }
    },
    mapRecord: createBookRecord
  },
  topics: {
    listTitle: `${formatBusinessLabelByTargetType('topic')}管理列表`,
    summary: '仅展示全站已公开的游戏内容。',
    icon: 'topics',
    targetType: 'topic',
    buildListQuery(query) {
      return {
        scene: HOME_FEATURED_SCENE,
        type: 'topic',
        page: query.page,
        limit: query.limit,
        title: query.title,
        startDate: query.startDate,
        endDate: query.endDate,
        visibility: 'public',
        sort: 'latest'
      }
    },
    mapRecord: createTopicRecord
  },
  images: {
    listTitle: `${formatBusinessLabelByTargetType('image')}管理列表`,
    summary: '仅展示全站已公开的图包内容。',
    icon: 'images',
    targetType: 'image',
    buildListQuery(query) {
      return {
        scene: HOME_FEATURED_SCENE,
        type: 'image',
        page: query.page,
        limit: query.limit,
        title: query.title,
        startDate: query.startDate,
        endDate: query.endDate,
        visibility: 'public',
        sort: 'latest'
      }
    },
    mapRecord: createImageRecord
  }
}

const activeDefinition = computed(() => businessDefinitions[activeType.value])

const toolbarTip = computed(() => {
  const capabilityText = adminPermissions.value.canPhysicalDelete
    ? '当前账号可推荐、取消推荐、设为私有和物理删除。'
    : adminPermissions.value.canSetPrivate || adminPermissions.value.canRecommend
      ? '当前账号可推荐、取消推荐和设为私有。'
      : '当前账号当前仅可查看列表。'

  return `${activeDefinition.value.summary}${capabilityText} 管理页不再提供编辑入口。`
})

const pageSummary = computed(() => {
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit))
  return `${TEXT.section.pagePrefix}${pagination.page}${TEXT.section.pageMiddle}${totalPages}${TEXT.section.pageSuffix}`
})

function createListQuery(): ListQuery {
  return {
    page: pagination.page,
    limit: pagination.limit,
    title: filters.title.trim() || undefined,
    startDate: filters.dateRange?.[0],
    endDate: filters.dateRange?.[1]
  }
}

function createActionKey(action: ManageAction, recordId: string): string {
  return `${action}:${recordId}`
}

function setActionSubmitting(action: ManageAction, recordId: string, value: boolean): void {
  const key = createActionKey(action, recordId)
  const nextState = { ...actionSubmittingState.value }

  if (value) {
    nextState[key] = true
  } else {
    delete nextState[key]
  }

  actionSubmittingState.value = nextState
}

function isActionSubmitting(action: ManageAction, recordId: string): boolean {
  return actionSubmittingState.value[createActionKey(action, recordId)] === true
}

async function fetchRecords(): Promise<void> {
  const definition = activeDefinition.value
  const requestToken = ++recordsRequestToken
  adminPermissions.value = { ...DEFAULT_ADMIN_PERMISSIONS }
  loading.value = true

  try {
    const result = await contentApi.listAdminContents(definition.buildListQuery(createListQuery()))

    if (requestToken !== recordsRequestToken) {
      return
    }

    adminPermissions.value = result.permissions
    pagination.page = result.page
    pagination.limit = result.limit
    pagination.total = result.total
    records.value = result.items.map(definition.mapRecord)
  } catch (error) {
    if (requestToken !== recordsRequestToken) {
      return
    }

    console.error('Failed to load admin content list:', error)
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

async function refetchAfterRemoval(): Promise<void> {
  if (records.value.length === 1 && pagination.page > 1) {
    pagination.page -= 1
  }

  await fetchRecords()
}

async function handleToggleFeatured(record: ManageRecord): Promise<void> {
  const definition = activeDefinition.value
  if (
    !adminPermissions.value.canRecommend ||
    isActionSubmitting('recommend', record.id) ||
    record.visibility !== 'public'
  ) {
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

  setActionSubmitting('recommend', record.id, true)

  try {
    if (record.featured) {
      await contentApi.cancelFeaturedContent({
        scene: HOME_FEATURED_SCENE,
        targetType: definition.targetType,
        targetId: record.id
      })
      record.featured = null
      ElMessage.success(TEXT.message.recommendCanceled)
    } else {
      const featuredItem = await contentApi.upsertFeaturedContent({
        scene: HOME_FEATURED_SCENE,
        targetType: definition.targetType,
        targetId: record.id
      })
      record.featured = featuredItem.activeNow ? featuredItem : null
      ElMessage.success(TEXT.message.recommended)
    }
  } catch (error) {
    console.error('Failed to update featured state:', error)
  } finally {
    setActionSubmitting('recommend', record.id, false)
  }
}

async function handleSetPrivate(record: ManageRecord): Promise<void> {
  const definition = activeDefinition.value
  if (
    !adminPermissions.value.canSetPrivate ||
    isActionSubmitting('private', record.id) ||
    record.visibility !== 'public'
  ) {
    return
  }

  try {
    await ElMessageBox.confirm(
      TEXT.message.setPrivateConfirmPrefix + record.title + TEXT.message.setPrivateConfirmSuffix,
      TEXT.actions.setPrivate,
      {
        type: 'warning',
        confirmButtonText: TEXT.actions.confirm,
        cancelButtonText: TEXT.actions.cancel
      }
    )
  } catch {
    return
  }

  setActionSubmitting('private', record.id, true)

  try {
    await contentApi.setAdminContentPrivate(definition.targetType, record.id)
    ElMessage.success(TEXT.message.setPrivateSuccess)
    await refetchAfterRemoval()
  } catch (error) {
    console.error('Failed to set content private:', error)
  } finally {
    setActionSubmitting('private', record.id, false)
  }
}

async function handleDelete(record: ManageRecord): Promise<void> {
  const definition = activeDefinition.value
  if (!adminPermissions.value.canPhysicalDelete || isActionSubmitting('delete', record.id)) {
    return
  }

  try {
    await ElMessageBox.confirm(
      TEXT.message.deleteConfirmPrefix + record.title + TEXT.message.deleteConfirmSuffix,
      TEXT.actions.delete,
      {
        type: 'warning',
        confirmButtonText: TEXT.actions.confirm,
        cancelButtonText: TEXT.actions.cancel
      }
    )
  } catch {
    return
  }

  setActionSubmitting('delete', record.id, true)

  try {
    await contentApi.deleteAdminContent(definition.targetType, record.id, {
      cascadeMedia: true
    })
    ElMessage.success(TEXT.message.deleteSuccess)
    await refetchAfterRemoval()
  } catch (error) {
    console.error('Failed to delete admin content:', error)
  } finally {
    setActionSubmitting('delete', record.id, false)
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
