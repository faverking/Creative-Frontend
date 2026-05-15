<template>
  <section class="content-page books-page">
    <section class="stats-grid">
      <article class="stat-card">
        <span>{{ TEXT.stats.authors }}</span>
        <strong>{{ form.author.length }}</strong>
        <small>{{ TEXT.stats.authorsHint }}</small>
      </article>

      <article class="stat-card">
        <span>{{ TEXT.stats.chapters }}</span>
        <strong>{{ form.chapters.length }}</strong>
        <small>{{ TEXT.stats.chaptersHint }}</small>
      </article>

      <article class="stat-card">
        <span>{{ TEXT.stats.mode }}</span>
        <strong>{{ isEditMode ? TEXT.stats.editMode : TEXT.stats.createMode }}</strong>
        <small>{{ isEditMode ? TEXT.stats.editHint : TEXT.stats.createHint }}</small>
      </article>
    </section>

    <el-alert
      v-if="submitResult"
      class="page-alert"
      type="success"
      :closable="false"
      show-icon
      :title="isEditMode ? TEXT.alert.updated : TEXT.alert.created"
    >
      <div class="alert-content">
        <span>{{ TEXT.alert.id }}{{ submitResult.id }}</span>
        <span>{{ TEXT.alert.name }}{{ submitResult.name }}</span>
      </div>
    </el-alert>

    <el-card v-loading="detailLoading" class="panel-card" shadow="never">
      <el-form label-position="top" class="content-form">
        <el-form-item :label="TEXT.form.nameLabel">
          <el-input
            v-model="form.name"
            maxlength="120"
            show-word-limit
            :placeholder="TEXT.form.namePlaceholder"
          />
        </el-form-item>

        <div class="form-grid form-grid-meta">
          <el-form-item :label="TEXT.form.authorLabel">
            <el-select
              v-model="form.author"
              multiple
              filterable
              allow-create
              default-first-option
              :placeholder="TEXT.form.authorPlaceholder"
            />
          </el-form-item>

          <el-form-item :label="TEXT.form.styleLabel">
            <el-select
              v-model="styleNames"
              multiple
              filterable
              allow-create
              default-first-option
              :placeholder="TEXT.form.stylePlaceholder"
            >
              <el-option
                v-for="option in BOOK_STYLE_OPTIONS"
                :key="option.id"
                :label="option.name"
                :value="option.name"
              />
            </el-select>
          </el-form-item>
        </div>

        <div class="form-grid form-grid-meta">
          <el-form-item :label="TEXT.form.partLabel">
            <el-select v-model="form.part" :placeholder="TEXT.form.partPlaceholder">
              <el-option
                v-for="option in BOOK_PART_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="TEXT.form.statusLabel">
            <el-select v-model="form.status" :placeholder="TEXT.form.statusPlaceholder">
              <el-option
                v-for="option in BOOK_STATUS_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </div>

        <div class="form-grid form-grid-meta">
          <el-form-item :label="TEXT.form.areaLabel">
            <el-select v-model="form.area" :placeholder="TEXT.form.areaPlaceholder">
              <el-option
                v-for="option in BOOK_AREA_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="TEXT.form.releaseTimeLabel">
            <el-date-picker
              v-model="form.releaseTime"
              type="datetime"
              value-format="x"
              :placeholder="TEXT.form.releaseTimePlaceholder"
            />
          </el-form-item>
        </div>

        <el-form-item :label="TEXT.form.descLabel">
          <el-input
            v-model="form.desc"
            type="textarea"
            :rows="4"
            maxlength="1000"
            show-word-limit
            :placeholder="TEXT.form.descPlaceholder"
          />
        </el-form-item>

        <el-form-item :label="TEXT.form.coverLabel">
          <el-upload
            v-model:file-list="coverFileList"
            action="#"
            :auto-upload="false"
            :limit="1"
            accept="image/jpeg,image/png,image/webp,image/gif"
            :before-upload="beforeCoverUpload"
            :on-change="handleCoverChange"
            :on-remove="handleCoverRemove"
            :on-exceed="handleCoverExceed"
          >
            <el-button size="large" round>{{ TEXT.actions.chooseCover }}</el-button>
          </el-upload>

          <div class="field-helper">
            <span>{{ TEXT.form.coverHint }}</span>
          </div>
        </el-form-item>

        <div v-if="coverPreviewUrl" class="cover-preview-card">
          <img :src="coverPreviewUrl" :alt="TEXT.form.coverPreviewAlt" />
          <div class="cover-preview-copy">
            <strong>{{ TEXT.form.coverPreviewTitle }}</strong>
            <small>{{ coverPreviewName }}</small>
          </div>
        </div>

        <book-chapter-editor v-model:chapters="form.chapters" v-model:source="form.source" />

        <div class="form-actions">
          <el-button round @click="handleReset">{{ TEXT.actions.reset }}</el-button>
          <el-button type="primary" round :loading="submitLoading" @click="handleSubmit">
            {{ isEditMode ? TEXT.actions.save : TEXT.actions.create }}
          </el-button>
        </div>
      </el-form>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { ElMessage, type UploadProps, type UploadRawFile, type UploadUserFile } from 'element-plus'
import { useRoute } from 'vue-router'

import {
  contentApi,
  type BookChapterItem,
  type BookDetail,
  type BookStyleItem,
  type CreateBookResult
} from '@/api/content'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import BookChapterEditor from '@/components/books/BookChapterEditor.vue'
import {
  cloneEditableBookChapters,
  createBookChapterSourceConfig,
  normalizeBookChapterSourceConfig,
  type BookChapterSourceConfig,
  type EditableBookChapter
} from '@/components/books/book-chapter-editor'
import {
  BOOK_AREA_OPTIONS,
  BOOK_PART_OPTIONS,
  BOOK_STATUS_OPTIONS,
  BOOK_STYLE_OPTIONS,
  IMAGE_MAX_FILE_SIZE
} from '@/constants'

interface BookFormState {
  name: string
  author: string[]
  part: 1 | 2 | 3
  status: 1 | 2
  area: 1 | 2 | 3
  desc: string
  releaseTime: string
  source: BookChapterSourceConfig
  chapters: EditableBookChapter[]
}

const TEXT = {
  stats: {
    authors: '作者数量',
    authorsHint: '适合整理联合署名、策展人或内容来源。',
    chapters: '章节数量',
    chaptersHint: '新增和编辑时都会直接批量提交章节列表。',
    mode: '当前状态',
    editMode: '编辑既有书库',
    createMode: '创建新书库',
    editHint: '正在维护已存在的书库与章节。',
    createHint: '可直接录入一条新的社区书库内容。'
  },
  alert: {
    updated: '书库更新成功',
    created: '书库创建成功',
    id: '书库 ID：',
    name: '书名：'
  },
  form: {
    nameLabel: '书库名称',
    namePlaceholder: '请输入书库名称，适合展示在社区推荐位或专题页',
    authorLabel: '作者 / 维护者',
    authorPlaceholder: '输入作者后回车，可录入多个名称',
    styleLabel: '内容风格',
    stylePlaceholder: '选择或输入风格标签',
    partLabel: '内容类型',
    partPlaceholder: '请选择内容类型',
    statusLabel: '连载状态',
    statusPlaceholder: '请选择连载状态',
    areaLabel: '地区归类',
    areaPlaceholder: '请选择地区归类',
    releaseTimeLabel: '上线时间（可选）',
    releaseTimePlaceholder: '可记录书库上线时间',
    descLabel: '书库简介',
    descPlaceholder: '请输入书库简介，适合展示在内容管理页和推荐卡片里',
    coverLabel: '封面图片',
    coverHint: '如果不重新选择图片，编辑态会继续沿用当前封面。',
    coverPreviewAlt: '书库封面预览',
    coverPreviewTitle: '封面预览'
  },
  actions: {
    chooseCover: '选择封面图片',
    reset: '重置内容',
    save: '保存书库修改',
    create: '创建书库'
  },
  message: {
    requestError: '请求失败，请稍后重试。',
    nameRequired: '请先填写书库名称。',
    descRequired: '书库简介至少需要 2 个字符。',
    coverRequired: '请至少为书库选择一张封面图片。',
    chapterInvalid: '章节 ID 和顺序都必须大于 0。',
    coverTypeInvalid: '封面仅支持 jpg、png、webp、gif 格式。',
    coverSizeInvalid: '封面图片大小不能超过 10MB。',
    coverLimit: '一次只能选择一张封面图片。',
    coverUploadFailed: '封面上传失败，请稍后重试。',
    updated: '书库内容已更新。',
    created: '书库已创建。'
  }
} as const

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const route = useRoute()

const form = reactive<BookFormState>({
  name: '',
  author: [],
  part: 1,
  status: 1,
  area: 1,
  desc: '',
  releaseTime: '',
  source: createBookChapterSourceConfig(),
  chapters: []
})

const styleNames = ref<string[]>([])
const coverFileList = ref<UploadUserFile[]>([])
const currentCoverMediaId = ref('')
const currentCoverUrl = ref('')
const localCoverUrl = ref('')
const initialChapterSource = ref<BookChapterSourceConfig>(createBookChapterSourceConfig())
const detailLoading = ref(false)
const submitLoading = ref(false)
const submitResult = ref<CreateBookResult | BookDetail | null>(null)
const loadedBookTitle = ref('')

const editingId = computed(() =>
  route.query.mode === 'edit' && typeof route.query.id === 'string' ? route.query.id : ''
)
const isEditMode = computed(() => editingId.value.length > 0)
const bookDocumentTitle = computed(() => {
  if (!isEditMode.value) {
    return '创建书库'
  }

  return loadedBookTitle.value ? `编辑：${loadedBookTitle.value}` : '编辑书库'
})
const coverPreviewUrl = computed(() => localCoverUrl.value || currentCoverUrl.value)
const coverPreviewName = computed(() => coverFileList.value[0]?.name || TEXT.form.coverPreviewTitle)

useDocumentTitle(bookDocumentTitle)

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim().length > 0
    ? error.message
    : TEXT.message.requestError
}

function hasBookChapterSource(source: BookChapterSourceConfig): boolean {
  return Object.values(normalizeBookChapterSourceConfig(source)).some((value) => value.length > 0)
}

function shouldSyncChapterSource(source: BookChapterSourceConfig): boolean {
  return hasBookChapterSource(source) || hasBookChapterSource(initialChapterSource.value)
}

function revokeLocalCoverUrl(): void {
  if (!localCoverUrl.value) {
    return
  }

  URL.revokeObjectURL(localCoverUrl.value)
  localCoverUrl.value = ''
}

function resetForm(): void {
  loadedBookTitle.value = ''
  form.name = ''
  form.author = []
  form.part = 1
  form.status = 1
  form.area = 1
  form.desc = ''
  form.releaseTime = ''
  form.source = createBookChapterSourceConfig()
  form.chapters = []
  initialChapterSource.value = createBookChapterSourceConfig()
  styleNames.value = []
  currentCoverMediaId.value = ''
  currentCoverUrl.value = ''
  coverFileList.value = []
  revokeLocalCoverUrl()
}

function handleReset(): void {
  if (isEditMode.value && editingId.value) {
    void loadBookDetail(editingId.value)
    return
  }

  resetForm()
}

async function loadBookDetail(id: string): Promise<void> {
  loadedBookTitle.value = ''
  detailLoading.value = true

  try {
    const detail = await contentApi.getMyBookDetail(id)
    const loadedSource = {
      origin: detail.origin ?? '',
      comicId: detail.comicId ?? '',
      novelId: detail.novelId ?? '',
      otherId: detail.otherId ?? ''
    }

    form.name = detail.name
    form.author = detail.author ?? []
    form.part = detail.part
    form.status = detail.status
    form.area = detail.area
    form.desc = detail.desc
    form.releaseTime = typeof detail.releaseTime === 'number' ? String(detail.releaseTime) : ''
    form.source = loadedSource
    form.chapters = cloneEditableBookChapters(detail.chapterList ?? [])
    initialChapterSource.value = normalizeBookChapterSourceConfig(loadedSource)
    styleNames.value = (detail.style ?? []).map((item) => item.name)
    currentCoverMediaId.value = detail.coverMediaId
    currentCoverUrl.value = detail.cover
    coverFileList.value = []
    loadedBookTitle.value = detail.name.trim()
    revokeLocalCoverUrl()
  } catch {
    // 由请求层统一提示。
  } finally {
    detailLoading.value = false
  }
}

function buildStylePayload(): BookStyleItem[] {
  return styleNames.value
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name, index) => {
      const preset = BOOK_STYLE_OPTIONS.find((item) => item.name === name)
      return preset ?? { id: 900 + index, name }
    })
}

function buildChapterPayload(): BookChapterItem[] {
  return form.chapters
    .map((chapter) => ({
      id: Number(chapter.id),
      order: Number(chapter.order),
      size: Number(chapter.size),
      title: chapter.title.trim(),
      rule: chapter.rule?.trim() || undefined
    }))
    .filter((chapter) => chapter.title)
    .sort((current, next) => current.order - next.order || current.id - next.id)
}

function validateForm(): boolean {
  if (!form.name.trim()) {
    ElMessage.warning(TEXT.message.nameRequired)
    return false
  }

  if (form.desc.trim().length < 2) {
    ElMessage.warning(TEXT.message.descRequired)
    return false
  }

  if (!currentCoverMediaId.value && coverFileList.value.length === 0) {
    ElMessage.warning(TEXT.message.coverRequired)
    return false
  }

  for (const chapter of buildChapterPayload()) {
    if (chapter.id < 1 || chapter.order < 1) {
      ElMessage.warning(TEXT.message.chapterInvalid)
      return false
    }
  }

  return true
}

const beforeCoverUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) => {
  if (!allowedMimeTypes.has(rawFile.type)) {
    ElMessage.error(TEXT.message.coverTypeInvalid)
    return false
  }

  if (rawFile.size > IMAGE_MAX_FILE_SIZE) {
    ElMessage.error(TEXT.message.coverSizeInvalid)
    return false
  }

  return true
}

const handleCoverChange: UploadProps['onChange'] = (file, nextFileList) => {
  coverFileList.value = nextFileList.slice(-1)
  revokeLocalCoverUrl()

  const rawFile = file.raw as File | undefined
  if (rawFile instanceof File) {
    localCoverUrl.value = URL.createObjectURL(rawFile)
  }
}

const handleCoverRemove: UploadProps['onRemove'] = (_file, nextFileList) => {
  coverFileList.value = nextFileList.slice(-1)
  revokeLocalCoverUrl()
}

const handleCoverExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning(TEXT.message.coverLimit)
}

async function resolveCoverMediaId(): Promise<string> {
  const rawFile = coverFileList.value[0]?.raw
  if (!(rawFile instanceof File)) {
    return currentCoverMediaId.value
  }

  const uploadResult = await contentApi.uploadImages([rawFile])
  const uploadedCover = uploadResult.items[0]
  if (!uploadedCover) {
    throw new Error(TEXT.message.coverUploadFailed)
  }

  currentCoverMediaId.value = uploadedCover.id
  currentCoverUrl.value = uploadedCover.downloadPath
  return uploadedCover.id
}

async function handleSubmit(): Promise<void> {
  if (!validateForm()) {
    return
  }

  submitLoading.value = true

  try {
    const coverMediaId = await resolveCoverMediaId()
    const chapterList = buildChapterPayload()
    const payload = {
      name: form.name.trim(),
      author: form.author.map((item) => item.trim()).filter(Boolean),
      part: form.part,
      status: form.status,
      area: form.area,
      style: buildStylePayload(),
      cover: coverMediaId,
      desc: form.desc.trim(),
      releaseTime: form.releaseTime ? Number(form.releaseTime) : undefined,
      chapterList
    }
    const chapterSource = normalizeBookChapterSourceConfig(form.source)

    const baseResult =
      isEditMode.value && editingId.value
        ? await contentApi.updateBook(editingId.value, payload)
        : await contentApi.createBook(payload)

    if (shouldSyncChapterSource(chapterSource)) {
      await contentApi.upsertBookChapters(baseResult.id, {
        chapterList,
        origin: chapterSource.origin || undefined,
        comicId: chapterSource.comicId || undefined,
        novelId: chapterSource.novelId || undefined,
        otherId: chapterSource.otherId || undefined
      })
    }

    submitResult.value = baseResult
    loadedBookTitle.value = baseResult.name.trim()
    ElMessage.success(isEditMode.value ? TEXT.message.updated : TEXT.message.created)

    if (isEditMode.value && editingId.value) {
      await loadBookDetail(editingId.value)
    } else {
      resetForm()
    }
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    submitLoading.value = false
  }
}

watch(
  editingId,
  (nextId) => {
    submitResult.value = null

    if (nextId) {
      void loadBookDetail(nextId)
      return
    }

    resetForm()
  },
  {
    immediate: true
  }
)

onBeforeUnmount(() => {
  revokeLocalCoverUrl()
})
</script>

<style scoped>
.content-page {
  display: grid;
  gap: 18px;
}

.panel-card,
.stat-card,
.cover-preview-card {
  border: 1px solid var(--community-border);
  border-radius: 30px;
  background: var(--community-surface);
  box-shadow: var(--community-shadow);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.stat-card {
  display: grid;
  gap: 8px;
  padding: 22px;
}

.stat-card span,
.stat-card small,
.field-helper,
.cover-preview-copy small {
  color: var(--el-text-color-secondary);
}

.stat-card strong {
  font-size: 22px;
  line-height: 1.25;
}

.alert-content {
  display: flex;
  gap: 18px;
  align-items: center;
  flex-wrap: wrap;
}

.panel-card {
  padding: 6px;
}

.content-form {
  display: grid;
  gap: 8px;
}

.form-grid {
  display: grid;
  gap: 18px;
}

.form-grid-meta {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field-helper {
  width: 100%;
  font-size: 14px;
  line-height: 1.7;
}

.cover-preview-card {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 16px;
  padding: 16px;
  background: var(--community-surface-soft);
}

.cover-preview-card img {
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 20px;
  object-fit: cover;
}

.cover-preview-copy {
  display: grid;
  align-content: center;
  gap: 8px;
}

.cover-preview-copy strong {
  font-size: 16px;
  line-height: 1.5;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 8px;
}
</style>
