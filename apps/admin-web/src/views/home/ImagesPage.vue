<template>
  <section class="content-page images-page">
    <section class="stats-grid">
      <article class="stat-card">
        <span>{{ TEXT.stats.total }}</span>
        <strong>{{ currentImageCount }}</strong>
        <small>{{ isEditMode ? TEXT.stats.totalHintEdit : TEXT.stats.totalHintCreate }}</small>
      </article>

      <article class="stat-card">
        <span>{{ TEXT.stats.uploaded }}</span>
        <strong>{{ uploadedItems.length }}</strong>
        <small>{{
          uploadedItems.length ? TEXT.stats.uploadedHintActive : TEXT.stats.uploadedHintIdle
        }}</small>
      </article>

      <article class="stat-card">
        <span>{{ TEXT.stats.descLength }}</span>
        <strong>{{ form.desc.trim().length }}</strong>
        <small>{{ TEXT.stats.descHint }}</small>
      </article>
    </section>

    <el-alert
      v-if="publishResult"
      class="page-alert"
      type="success"
      :closable="false"
      show-icon
      :title="isEditMode ? TEXT.alert.updated : TEXT.alert.created"
    >
      <div class="alert-content">
        <span>{{ TEXT.alert.id }}{{ publishResult.id }}</span>
        <span>{{ TEXT.alert.time }}{{ formatDateTime(publishResult.uploadTime) }}</span>
        <span>{{ TEXT.alert.total }}{{ publishResult.total }}</span>
      </div>
    </el-alert>

    <el-card v-loading="detailLoading" class="panel-card" shadow="never">
      <el-form label-position="top" class="content-form">
        <el-form-item :label="TEXT.form.titleLabel">
          <div
            class="field-autocomplete-shell"
            @focusin="handleTitleFocusIn"
            @focusout="handleFieldFocusOut('title', $event)"
            @keydown.capture="handleTitleKeydown"
            @compositionstart="titleAutocomplete.handleCompositionStart"
            @compositionend="titleAutocomplete.handleCompositionEnd"
          >
            <el-input
              v-model="form.title"
              maxlength="120"
              show-word-limit
              :placeholder="TEXT.form.titlePlaceholder"
            >
              <template #suffix>
                <button
                  type="button"
                  class="field-ai-trigger"
                  :disabled="titleAutocomplete.loading.value"
                  @mousedown.prevent
                  @click="void titleAutocomplete.rerunSuggestion()"
                >
                  {{ titleAutocomplete.manualButtonLabel.value }}
                </button>
              </template>
            </el-input>

            <admin-inline-ai-suggestion
              v-if="titleAutocomplete.showSuggestion.value"
              label="标题"
              :status="titleAutocomplete.status.value"
              :preview-text="titleAutocomplete.previewText.value"
              :error-message="titleAutocomplete.error.value"
              @accept="titleAutocomplete.acceptSuggestion"
              @dismiss="titleAutocomplete.dismissSuggestion"
            />
          </div>
        </el-form-item>

        <div class="form-grid">
          <el-form-item :label="TEXT.form.themeLabel">
            <el-select v-model="form.themeId" :placeholder="TEXT.form.themePlaceholder">
              <el-option
                v-for="option in imageThemeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="TEXT.form.sourceLabel">
            <el-select v-model="form.source" clearable :placeholder="TEXT.form.sourcePlaceholder">
              <el-option
                v-for="option in imageSourceOptions"
                :key="option"
                :label="option"
                :value="option"
              />
            </el-select>

            <div class="field-helper">
              <span>图片类型建议只会从已有类型中选择。</span>
              <div class="field-helper__actions">
                <el-button
                  link
                  type="primary"
                  :loading="sourceAutocomplete.loading.value"
                  @click="void sourceAutocomplete.rerunSuggestion()"
                >
                  {{ sourceAutocomplete.manualButtonLabel.value }}
                </el-button>
              </div>
            </div>

            <admin-inline-ai-suggestion
              v-if="sourceAutocomplete.showSuggestion.value"
              label="图片类型"
              :status="sourceAutocomplete.status.value"
              :preview-text="sourceAutocomplete.previewText.value"
              :error-message="sourceAutocomplete.error.value"
              @accept="sourceAutocomplete.acceptSuggestion"
              @dismiss="sourceAutocomplete.dismissSuggestion"
            />
          </el-form-item>
        </div>

        <el-form-item :label="TEXT.form.descLabel">
          <div
            class="field-autocomplete-shell"
            @focusin="handleSummaryFocusIn"
            @focusout="handleFieldFocusOut('summary', $event)"
            @keydown.capture="handleSummaryKeydown"
            @compositionstart="summaryAutocomplete.handleCompositionStart"
            @compositionend="summaryAutocomplete.handleCompositionEnd"
          >
            <el-input
              v-model="form.desc"
              type="textarea"
              :rows="4"
              maxlength="1000"
              show-word-limit
              :placeholder="TEXT.form.descPlaceholder"
            />

            <div class="field-helper">
              <span>描述建议只依据图包元信息和文件名线索生成。</span>
              <div class="field-helper__actions">
                <el-button
                  link
                  type="primary"
                  :loading="summaryAutocomplete.loading.value"
                  @click="void summaryAutocomplete.rerunSuggestion()"
                >
                  {{ summaryAutocomplete.manualButtonLabel.value }}
                </el-button>
              </div>
            </div>

            <admin-inline-ai-suggestion
              v-if="summaryAutocomplete.showSuggestion.value"
              label="描述"
              :status="summaryAutocomplete.status.value"
              :preview-text="summaryAutocomplete.previewText.value"
              :error-message="summaryAutocomplete.error.value"
              @accept="summaryAutocomplete.acceptSuggestion"
              @dismiss="summaryAutocomplete.dismissSuggestion"
            />
          </div>
        </el-form-item>

        <el-form-item :label="TEXT.form.uploadLabel">
          <el-upload
            v-model:file-list="fileList"
            action="#"
            accept="image/jpeg,image/png,image/webp,image/gif"
            :auto-upload="false"
            :limit="imageBatchLimit"
            :before-upload="beforeUpload"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :on-exceed="handleExceed"
            drag
            multiple
          >
            <div class="upload-dragger">
              <strong>{{ TEXT.form.uploadTitle }}</strong>
              <p>{{ TEXT.form.uploadHint(imageBatchLimit) }}</p>
            </div>
          </el-upload>
        </el-form-item>

        <div class="form-actions">
          <el-button type="primary" round :loading="publishLoading" @click="handlePublish">
            {{ isEditMode ? TEXT.actions.save : TEXT.actions.publish }}
          </el-button>
        </div>
      </el-form>
    </el-card>

    <el-card v-if="existingMediaItems.length" class="panel-card" shadow="never">
      <template #header>
        <div class="section-header">
          <strong>{{ TEXT.section.currentTitle }}</strong>
          <span>{{ TEXT.section.currentHint }}</span>
        </div>
      </template>

      <div class="preview-grid">
        <figure v-for="item in existingMediaItems" :key="item.id" class="preview-card">
          <img
            :src="resolveExistingMediaPreviewPath(item)"
            :alt="resolveExistingMediaLabel(item)"
          />
          <figcaption>{{ resolveExistingMediaLabel(item) }}</figcaption>
          <div class="preview-actions">
            <el-tag
              v-if="coverId === item.id"
              class="is-cover"
              size="small"
              type="primary"
              effect="dark"
              round
            >
              {{ TEXT.section.coverTag }}
            </el-tag>
            <el-button link type="primary" @click="handleSetCover(item.id)">
              {{ TEXT.actions.setCover }}
            </el-button>
            <el-button link type="danger" @click="handleRemoveExistingImage(item.id)">
              {{ TEXT.actions.remove }}
            </el-button>
          </div>
        </figure>
      </div>
    </el-card>

    <el-card v-if="previewFiles.length" class="panel-card" shadow="never">
      <template #header>
        <div class="section-header">
          <strong>{{ TEXT.section.previewTitle }}</strong>
          <span>{{ TEXT.section.previewHint }}</span>
        </div>
      </template>

      <div class="preview-grid">
        <figure v-for="item in previewFiles" :key="item.uid" class="preview-card">
          <img :src="item.url" :alt="item.name" />
          <figcaption>{{ item.name }}</figcaption>
        </figure>
      </div>
    </el-card>

    <el-card v-if="uploadedItems.length" class="panel-card" shadow="never">
      <template #header>
        <div class="section-header">
          <strong>{{ TEXT.section.uploadedTitle }}</strong>
          <span>{{ TEXT.section.uploadedHint }}</span>
        </div>
      </template>

      <div class="preview-grid">
        <figure v-for="item in uploadedItems" :key="item.id" class="preview-card">
          <img :src="item.downloadPath" :alt="item.fileName" />
          <figcaption>{{ item.fileName }}</figcaption>
          <small>{{ TEXT.section.mediaId }}{{ item.id }}</small>
        </figure>
      </div>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { ElMessage, type UploadProps, type UploadRawFile, type UploadUserFile } from 'element-plus'
import { useRoute } from 'vue-router'

import AdminInlineAiSuggestion from '@/components/ai/AdminInlineAiSuggestion.vue'
import {
  contentApi,
  type ImagePackageDetail,
  type MediaUploadItem,
  type ResolvedMediaAsset
} from '@/api/content'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import {
  IMAGE_BATCH_LIMIT,
  IMAGE_MAX_FILE_SIZE,
  IMAGE_THEME_OPTIONS,
  IMAGE_SOURCE_OPTIONS
} from '@/constants'
import { useImageFieldAutocomplete } from '@/composables/useImageFieldAutocomplete'
import { formatDateTime } from '@/utils/format'

interface ImageFormState {
  title: string
  themeId: number
  desc: string
  source: string
}

interface PreviewFile {
  uid: string
  name: string
  url: string
}

const TEXT = {
  stats: {
    total: '当前图片总数',
    totalHintEdit: '包含已保留图片和本次新增图片。',
    totalHintCreate: '发布时会先上传图片媒体，再完成图包录入。',
    uploaded: '最近上传结果',
    uploadedHintActive: '新上传的 mediaId 已加入本次提交。',
    uploadedHintIdle: '发布后会展示最近一次媒体上传结果。',
    descLength: '内容描述长度',
    descHint: '建议补充场景、活动信息或图包亮点。'
  },
  alert: {
    updated: '图包更新成功',
    created: '图包发布成功',
    id: '图包 ID：',
    time: '发布时间：',
    total: '图片数量：'
  },
  form: {
    titleLabel: '图包标题',
    titlePlaceholder: '请输入图包标题',
    themeLabel: '图包板块',
    themePlaceholder: '请选择图包板块',
    sourceLabel: '图片类型（可选）',
    sourcePlaceholder: '请选择图片类型',
    descLabel: '内容描述',
    descPlaceholder: '请输入图包描述，用普通文本概括内容亮点或活动信息',
    uploadLabel: '批量上传图片',
    uploadTitle: '拖拽图片到这里，或点击选择文件',
    uploadHint: (limit: number) =>
      `支持 jpg、png、webp、gif，单次最多 ${limit} 张，单张不超过 10MB。`
  },
  section: {
    currentTitle: '当前图包图片',
    currentHint: '编辑态可保留、删除已有图片，也可将某张图设为封面。',
    coverTag: '当前封面',
    previewTitle: '本地预览',
    previewHint: '发布前确认新增图片的顺序与内容。',
    uploadedTitle: '最近一次上传结果',
    uploadedHint: '后端返回的 mediaId 会直接用于图包保存。',
    mediaId: 'mediaId：'
  },
  actions: {
    publish: '发布图包',
    save: '保存图包修改',
    setCover: '设为封面',
    remove: '移除'
  },
  message: {
    requestError: '请求失败，请稍后重试。',
    titleRequired: '请先填写图包标题。',
    descRequired: '内容描述至少需要 2 个字符。',
    imagesRequired: '请至少保留或上传一张图片。',
    typeInvalid: '仅支持 jpg、png、webp、gif 格式。',
    sizeInvalid: '单张图片大小不能超过 10MB。',
    limit: '单次最多只能选择 ',
    updated: '图包内容已更新。',
    created: '图包已成功发布。'
  }
} as const

const route = useRoute()
const imageThemeOptions = IMAGE_THEME_OPTIONS
const imageSourceOptions = IMAGE_SOURCE_OPTIONS
const imageBatchLimit = IMAGE_BATCH_LIMIT
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const form = reactive<ImageFormState>({
  title: '',
  themeId: imageThemeOptions[0]?.value ?? 1,
  desc: '',
  source: ''
})

const fileList = ref<UploadUserFile[]>([])
const detailLoading = ref(false)
const publishLoading = ref(false)
const publishResult = ref<ImagePackageDetail | null>(null)
const uploadedItems = ref<MediaUploadItem[]>([])
const existingMediaItems = ref<ResolvedMediaAsset[]>([])
const existingImageIds = ref<string[]>([])
const coverId = ref('')
const loadedImagePackageTitle = ref('')
const objectUrlMap = new Map<string, string>()

const editingId = computed(() =>
  route.query.mode === 'edit' && typeof route.query.id === 'string' ? route.query.id : ''
)
const isEditMode = computed(() => editingId.value.length > 0)
const imageDocumentTitle = computed(() => {
  if (!isEditMode.value) {
    return '发布图包'
  }

  return loadedImagePackageTitle.value ? `编辑：${loadedImagePackageTitle.value}` : '编辑图包'
})
const currentImageCount = computed(() => existingImageIds.value.length + fileList.value.length)
const previewFiles = computed<PreviewFile[]>(() =>
  fileList.value
    .filter((file): file is UploadUserFile & { url: string } => typeof file.url === 'string')
    .map((file) => ({
      uid: String(file.uid),
      name: file.name,
      url: file.url
    }))
)
const imageAiInput = {
  get imageCount() {
    return currentImageCount.value
  },
  get fileNameHints() {
    return [
      ...existingMediaItems.value.map((item) => resolveExistingMediaLabel(item)),
      ...fileList.value.map((file) => file.name)
    ].filter(Boolean)
  },
  get coverSelected() {
    return Boolean(coverId.value)
  }
}
const titleAutocomplete = useImageFieldAutocomplete({
  field: 'title',
  form,
  input: imageAiInput
})
const summaryAutocomplete = useImageFieldAutocomplete({
  field: 'summary',
  form,
  input: imageAiInput
})
const sourceAutocomplete = useImageFieldAutocomplete({
  field: 'source',
  form,
  input: imageAiInput
})

useDocumentTitle(imageDocumentTitle)

function handleFieldFocusOut(surface: 'title' | 'summary', event: FocusEvent): void {
  const currentTarget = event.currentTarget as HTMLElement | null
  const nextTarget = event.relatedTarget as Node | null
  if (currentTarget && nextTarget && currentTarget.contains(nextTarget)) {
    return
  }

  if (surface === 'title') {
    titleAutocomplete.deactivate()
    return
  }

  summaryAutocomplete.deactivate()
}

function handleTitleFocusIn(): void {
  titleAutocomplete.activate()
  summaryAutocomplete.deactivate()
}

function handleSummaryFocusIn(): void {
  summaryAutocomplete.activate()
  titleAutocomplete.deactivate()
}

function handleTitleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Tab' && titleAutocomplete.canAccept.value) {
    event.preventDefault()
    titleAutocomplete.acceptSuggestion()
    return
  }

  if (event.key === 'Escape' && titleAutocomplete.showSuggestion.value) {
    event.preventDefault()
    titleAutocomplete.dismissSuggestion()
  }
}

function handleSummaryKeydown(event: KeyboardEvent): void {
  if (event.key === 'Tab' && summaryAutocomplete.canAccept.value) {
    event.preventDefault()
    summaryAutocomplete.acceptSuggestion()
    return
  }

  if (event.key === 'Escape' && summaryAutocomplete.showSuggestion.value) {
    event.preventDefault()
    summaryAutocomplete.dismissSuggestion()
  }
}

function resetImageAiState(): void {
  titleAutocomplete.reset()
  summaryAutocomplete.reset()
  sourceAutocomplete.reset()
}

function revokeObjectUrl(uid: string): void {
  const url = objectUrlMap.get(uid)
  if (!url) {
    return
  }

  URL.revokeObjectURL(url)
  objectUrlMap.delete(uid)
}

function syncPreviewUrl(file: UploadUserFile): void {
  const uid = String(file.uid)
  const rawFile = file.raw as File | undefined
  if (!rawFile) {
    return
  }

  const existing = objectUrlMap.get(uid)
  if (existing) {
    file.url = existing
    return
  }

  const url = URL.createObjectURL(rawFile)
  objectUrlMap.set(uid, url)
  file.url = url
}

function resetFileState(): void {
  objectUrlMap.forEach((value) => {
    URL.revokeObjectURL(value)
  })
  objectUrlMap.clear()
  fileList.value = []
}

function resetForm(): void {
  loadedImagePackageTitle.value = ''
  form.title = ''
  form.themeId = imageThemeOptions[0]?.value ?? 1
  form.desc = ''
  form.source = ''
  existingMediaItems.value = []
  existingImageIds.value = []
  coverId.value = ''
  uploadedItems.value = []
  resetFileState()
  resetImageAiState()
}

function validateForm(): boolean {
  if (!form.title.trim()) {
    ElMessage.warning(TEXT.message.titleRequired)
    return false
  }

  if (form.desc.trim().length < 2) {
    ElMessage.warning(TEXT.message.descRequired)
    return false
  }

  if (existingImageIds.value.length === 0 && fileList.value.length === 0) {
    ElMessage.warning(TEXT.message.imagesRequired)
    return false
  }

  return true
}

async function loadImagePackageDetail(id: string): Promise<void> {
  loadedImagePackageTitle.value = ''
  detailLoading.value = true

  try {
    const detail = await contentApi.getMyImagePackageDetail(id)
    form.title = detail.title
    form.themeId = detail.themeId
    form.desc = detail.desc
    form.source = detail.source ?? ''
    loadedImagePackageTitle.value = detail.title.trim()
    existingImageIds.value = detail.imageMediaIds
    coverId.value = detail.coverMediaId || detail.imageMediaIds[0] || ''
    publishResult.value = null
    uploadedItems.value = []
    resetFileState()

    existingMediaItems.value = detail.imageAssets
    resetImageAiState()
  } catch {
    // 由请求层统一提示。
  } finally {
    detailLoading.value = false
  }
}

const beforeUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) => {
  if (!allowedMimeTypes.has(rawFile.type)) {
    ElMessage.error(TEXT.message.typeInvalid)
    return false
  }

  if (rawFile.size > IMAGE_MAX_FILE_SIZE) {
    ElMessage.error(TEXT.message.sizeInvalid)
    return false
  }

  return true
}

const handleFileChange: UploadProps['onChange'] = (_file, nextFileList) => {
  fileList.value = nextFileList
  fileList.value.forEach((file) => {
    syncPreviewUrl(file)
  })
}

const handleFileRemove: UploadProps['onRemove'] = (file, nextFileList) => {
  revokeObjectUrl(String(file.uid))
  fileList.value = nextFileList
}

const handleExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning(`${TEXT.message.limit}${imageBatchLimit}张图片。`)
}

function handleRemoveExistingImage(mediaId: string): void {
  existingImageIds.value = existingImageIds.value.filter((id) => id !== mediaId)
  existingMediaItems.value = existingMediaItems.value.filter((item) => item.id !== mediaId)

  if (coverId.value === mediaId) {
    coverId.value = existingImageIds.value[0] ?? ''
  }
}

function handleSetCover(mediaId: string): void {
  coverId.value = mediaId
}

function resolveExistingMediaPreviewPath(item: ResolvedMediaAsset): string {
  return item.downloadPath || item.previewPath || item.attachmentPath || ''
}

function resolveExistingMediaLabel(item: ResolvedMediaAsset): string {
  return item.fileName || item.originalName || item.id
}

async function handlePublish(): Promise<void> {
  if (!validateForm()) {
    return
  }

  const rawFiles = fileList.value
    .map((file) => file.raw as File | undefined)
    .filter((file): file is File => file instanceof File)

  publishLoading.value = true

  try {
    const nextUploadedItems =
      rawFiles.length > 0 ? (await contentApi.uploadImages(rawFiles)).items : []
    uploadedItems.value = nextUploadedItems

    const mediaIds = [...existingImageIds.value, ...nextUploadedItems.map((item) => item.id)]
    const nextCoverId = mediaIds.includes(coverId.value) ? coverId.value : mediaIds[0]
    const payload = {
      title: form.title.trim(),
      desc: form.desc.trim(),
      themeId: form.themeId,
      images: mediaIds,
      cover: nextCoverId,
      source: form.source.trim() || undefined
    }

    // 图包业务接口要求传 mediaId，因此这里先上传媒体，再提交图包内容。
    const result =
      isEditMode.value && editingId.value
        ? await contentApi.updateImagePackage(editingId.value, payload)
        : await contentApi.createImagePackage(payload)

    publishResult.value = result
    loadedImagePackageTitle.value = result.title.trim()
    ElMessage.success(isEditMode.value ? TEXT.message.updated : TEXT.message.created)

    if (isEditMode.value && editingId.value) {
      await loadImagePackageDetail(editingId.value)
      return
    }

    resetForm()
  } catch {
    // 由请求层统一提示。
  } finally {
    publishLoading.value = false
  }
}

watch(
  editingId,
  (nextId) => {
    publishResult.value = null

    if (nextId) {
      void loadImagePackageDetail(nextId)
      return
    }

    resetForm()
  },
  {
    immediate: true
  }
)

onBeforeUnmount(() => {
  resetFileState()
})
</script>

<style scoped>
.content-page {
  display: grid;
  gap: 18px;
}

.panel-card,
.stat-card {
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
.section-header span,
.field-helper,
.preview-card small {
  color: var(--el-text-color-secondary);
}

.stat-card strong {
  font-size: 22px;
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

.field-autocomplete-shell {
  display: grid;
  width: 100%;
  min-width: 0;
}

.field-ai-trigger {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.field-ai-trigger:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.upload-dragger {
  display: grid;
  gap: 8px;
  padding: 12px 0;
}

.upload-dragger strong {
  font-size: 16px;
}

.upload-dragger p,
.field-helper {
  margin: 0;
  font-size: 14px;
}

.field-helper {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
}

.field-helper__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: baseline;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}

.preview-card {
  position: relative;
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 14px;
  border: 1px solid var(--community-border);
  border-radius: 22px;
  background: var(--community-surface-soft);
}

.preview-card img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 16px;
}

.preview-card figcaption,
.preview-card small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-card .is-cover {
  position: absolute;
  top: 24px;
  left: 24px;
}

.preview-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
</style>
