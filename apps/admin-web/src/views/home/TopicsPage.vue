<template>
  <section class="content-page topics-page">
    <section class="stats-grid">
      <article class="stat-card">
        <span>正文长度</span>
        <strong>{{ plainTextLength }}</strong>
        <small>按富文本提取后的纯文本内容统计。</small>
      </article>

      <article class="stat-card">
        <span>内嵌图片</span>
        <strong>{{ embeddedImageCount }}</strong>
        <small>发布或更新时会统一上传富文本中的图片并回写地址。</small>
      </article>

      <article class="stat-card">
        <span>视频嵌入</span>
        <strong>{{ embeddedVideoCount }}</strong>
        <small>支持通过富文本工具栏嵌入视频链接，正文会保留嵌入展示。</small>
      </article>
    </section>

    <el-alert
      v-if="publishSummary"
      class="page-alert"
      type="success"
      :closable="false"
      show-icon
      :title="isEditMode ? '游戏更新成功' : '游戏发布成功'"
    >
      <div class="alert-content">
        <span>游戏 ID：{{ publishSummary.result.id }}</span>
        <span>发布时间：{{ formatDateTime(publishSummary.result.postTime) }}</span>
        <span>图片数量：{{ publishSummary.imageCount }}</span>
        <span v-if="publishSummary.archiveUpload">
          ZIP 入库：{{ publishSummary.archiveUpload.uploadedCount }} 项
        </span>
      </div>
    </el-alert>

    <el-card v-loading="detailLoading" class="panel-card" shadow="never">
      <el-form label-position="top" class="content-form">
        <el-form-item label="游戏标题">
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
              placeholder="请输入游戏标题，建议突出活动主题或资源亮点"
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

        <div class="form-grid form-grid-meta">
          <el-form-item label="游戏题材">
            <el-select v-model="form.topicId" placeholder="请选择游戏题材">
              <el-option
                v-for="option in topicSeriesOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="内容类型">
            <el-select v-model="form.typeId" placeholder="请选择内容类型">
              <el-option
                v-for="option in topicSectionOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </div>

        <div class="form-grid form-grid-meta">
          <el-form-item label="游戏标签">
            <el-select
              v-model="form.featureFlags"
              multiple
              clearable
              collapse-tags
              collapse-tags-tooltip
              :multiple-limit="7"
              placeholder="请选择游戏标签，可多选"
            >
              <el-option
                v-for="option in topicFeatureFlagOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>

            <div class="field-helper">
              <span>按后端字典选择游戏标签，创建时至少选择 1 个，最多 7 个。</span>
              <div class="field-helper__actions">
                <el-button
                  link
                  type="primary"
                  :loading="featureFlagSuggestion.loading.value"
                  @click="void featureFlagSuggestion.runSuggestion()"
                >
                  AI 建议标签
                </el-button>
              </div>
            </div>

            <admin-inline-ai-suggestion
              v-if="featureFlagSuggestion.showSuggestion.value"
              label="标签"
              :status="featureFlagSuggestion.status.value"
              :preview-text="featureFlagSuggestion.previewText.value"
              :error-message="featureFlagSuggestion.error.value"
              @accept="featureFlagSuggestion.acceptSuggestion"
              @dismiss="featureFlagSuggestion.dismissSuggestion"
            />
          </el-form-item>
        </div>

        <el-form-item label="游戏摘要">
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
              :rows="3"
              maxlength="1000"
              show-word-limit
              placeholder="请输入游戏摘要，用来说明活动主题、资源价值或页面导览重点"
            />

            <div class="field-helper">
              <span>摘要会用于游戏列表卡片和详情页导览。</span>
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
              label="摘要"
              :status="summaryAutocomplete.status.value"
              :preview-text="summaryAutocomplete.previewText.value"
              :error-message="summaryAutocomplete.error.value"
              @accept="summaryAutocomplete.acceptSuggestion"
              @dismiss="summaryAutocomplete.dismissSuggestion"
            />
          </div>
        </el-form-item>

        <el-form-item label="游戏内容">
          <div class="editor-autocomplete-shell" @keydown.capture="handleEditorKeydown">
            <rich-text-editor
              ref="editorRef"
              v-model="form.content"
              min-height="460px"
              placeholder="请输入游戏正文内容，可直接粘贴图片，也可通过工具栏嵌入视频链接"
              @selection-change="handleEditorSelectionChange"
            />

            <admin-editor-ai-action-bubble
              v-if="editorAutocomplete.showActionBubble.value"
              :label="editorAutocomplete.actionLabel.value"
              :loading="editorAutocomplete.loading.value"
              :anchor-style="editorAutocomplete.anchorStyle.value"
              @run="void handleEditorRun()"
            />

            <admin-editor-ai-suggestion-popover
              v-if="editorAutocomplete.hasSuggestion.value"
              :title="editorSuggestionTitle"
              :status="editorAutocomplete.status.value"
              :preview-text="editorAutocomplete.previewText.value"
              :error-message="editorAutocomplete.error.value"
              :placement="editorAutocomplete.popoverPlacement.value"
              :anchor-style="editorAutocomplete.anchorStyle.value"
              @accept="handleEditorAccept"
              @dismiss="editorAutocomplete.dismissSuggestion"
            />
          </div>

          <div class="field-helper">
            <span>发布时会统一处理富文本图片占位和资源上传，视频继续以内嵌正文形式保留。</span>
          </div>
        </el-form-item>

        <div class="form-grid form-grid-download">
          <el-form-item label="下载地址（可选）">
            <el-input
              v-model="form.downloadUrl"
              placeholder="如果 ZIP 资源会自动回填下载直链，这里可以留空；也可以手动填写固定下载地址"
            />
          </el-form-item>

          <el-form-item label="本地 ZIP 资源（可选）">
            <el-upload
              v-model:file-list="archiveFileList"
              action="#"
              :auto-upload="false"
              :limit="1"
              :before-upload="beforeArchiveUpload"
              :on-change="handleArchiveChange"
              :on-remove="handleArchiveRemove"
              :on-exceed="handleArchiveExceed"
              :accept="archiveAccept"
            >
              <el-button round>选择 ZIP 文件</el-button>
            </el-upload>

            <div class="upload-summary">
              ZIP 会在真正发布或更新时走后端 `mode=direct` 上传，并优先把直链回填到下载地址。
            </div>
          </el-form-item>
        </div>

        <div v-if="selectedArchive" class="archive-card">
          <span>已选择本地资源包</span>
          <strong>{{ selectedArchive.name }}</strong>
          <small>文件大小：{{ selectedArchive.sizeText }}</small>
          <small>最后修改：{{ selectedArchive.updatedAt }}</small>
        </div>

        <div class="form-actions">
          <el-button type="primary" round :loading="publishLoading" @click="handlePublish">
            {{ isEditMode ? '保存游戏修改' : '发布游戏' }}
          </el-button>
        </div>
      </el-form>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, type UploadProps, type UploadRawFile, type UploadUserFile } from 'element-plus'
import { useRoute } from 'vue-router'

import AdminEditorAiActionBubble from '@/components/ai/AdminEditorAiActionBubble.vue'
import AdminEditorAiSuggestionPopover from '@/components/ai/AdminEditorAiSuggestionPopover.vue'
import AdminInlineAiSuggestion from '@/components/ai/AdminInlineAiSuggestion.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { contentApi, type TopicDetail, type UploadZipDirectResult } from '@/api/content'
import { useContentAiSurfaces } from '@/composables/useContentAiSurfaces'
import { useTopicEditorAutocomplete } from '@/composables/useTopicEditorAutocomplete'
import { useTopicFeatureFlagSuggestion } from '@/composables/useTopicFeatureFlagSuggestion'
import { useTopicFieldAutocomplete } from '@/composables/useTopicFieldAutocomplete'
import {
  TOPIC_ARCHIVE_ACCEPT,
  TOPIC_ARCHIVE_MAX_FILE_SIZE,
  TOPIC_FEATURE_FLAG_OPTIONS,
  TOPIC_SECTION_OPTIONS,
  TOPIC_SERIES_OPTIONS
} from '@/constants'
import { resolveAssetUrl } from '@/utils/assets'
import { formatDateTime } from '@/utils/format'
import type {
  RichTextEditorExpose,
  RichTextEditorSelectionSnapshot
} from '@/types/rich-text-editor'
import {
  countRichTextNodes,
  extractRichTextPlainText,
  normalizeRichTextEmbeddedMedia
} from '@/utils/rich-text'

interface TopicFormState {
  title: string
  topicId: number
  typeId: number
  featureFlags: number[]
  desc: string
  content: string
  downloadUrl: string
}

interface ArchiveUploadSummary {
  uploadedCount: number
  skippedCount: number
}

interface PublishSummary {
  imageCount: number
  archiveUpload: ArchiveUploadSummary | null
  result: TopicDetail
}

const route = useRoute()
const archiveAccept = TOPIC_ARCHIVE_ACCEPT
const topicSeriesOptions = TOPIC_SERIES_OPTIONS
const topicSectionOptions = TOPIC_SECTION_OPTIONS
const topicFeatureFlagOptions = TOPIC_FEATURE_FLAG_OPTIONS
const defaultTopicId = topicSeriesOptions[0]?.value ?? 1
const defaultTypeId = topicSectionOptions[0]?.value ?? 1

function normalizeTopicFeatureFlags(values: number[]): number[] {
  return Array.from(new Set(values.filter((value) => Number.isInteger(value)))).slice(0, 7)
}

const form = reactive<TopicFormState>({
  title: '',
  topicId: defaultTopicId,
  typeId: defaultTypeId,
  featureFlags: [],
  desc: '',
  content: '',
  downloadUrl: ''
})

const archiveFileList = ref<UploadUserFile[]>([])
const detailLoading = ref(false)
const publishLoading = ref(false)
const publishSummary = ref<PublishSummary | null>(null)
const editorRef = ref<RichTextEditorExpose | null>(null)

const editingId = computed(() =>
  route.query.mode === 'edit' && typeof route.query.id === 'string' ? route.query.id : ''
)
const isEditMode = computed(() => editingId.value.length > 0)
const plainTextLength = computed(() => extractRichTextPlainText(form.content).length)
const embeddedImageCount = computed(() => countRichTextNodes(form.content, 'img[src]'))
const embeddedVideoCount = computed(() =>
  countRichTextNodes(form.content, 'iframe.ql-video[src], video[src]')
)
const topicAiMeta = {
  get embeddedImageCount() {
    return embeddedImageCount.value
  },
  get embeddedVideoCount() {
    return embeddedVideoCount.value
  },
  get hasArchive() {
    return archiveFileList.value.length > 0
  }
}
const titleAutocomplete = useTopicFieldAutocomplete({
  field: 'title',
  form,
  meta: topicAiMeta
})
const summaryAutocomplete = useTopicFieldAutocomplete({
  field: 'summary',
  form,
  meta: topicAiMeta
})
const editorAutocomplete = useTopicEditorAutocomplete(form, topicAiMeta)
const featureFlagSuggestion = useTopicFeatureFlagSuggestion(form, topicAiMeta)
const editorSuggestionTitle = computed(() =>
  editorAutocomplete.task.value === 'rewrite-selection' ? '选区优化建议' : '正文续写建议'
)
const aiSurfaces = useContentAiSurfaces({
  title: titleAutocomplete,
  summary: summaryAutocomplete,
  editor: editorAutocomplete,
  acceptEditorSuggestion: handleEditorAccept
})
const selectedArchive = computed(() => {
  const file = archiveFileList.value[0]
  if (!file) {
    return null
  }

  const rawFile = file.raw as File | undefined
  const size = rawFile?.size ?? file.size ?? 0
  const lastModified = rawFile?.lastModified

  return {
    name: file.name,
    sizeText: formatFileSize(size),
    updatedAt: lastModified ? formatDateTime(lastModified) : '未记录'
  }
})

const {
  handleTitleFocusIn,
  handleSummaryFocusIn,
  handleFieldFocusOut,
  handleTitleKeydown,
  handleSummaryKeydown,
  activateEditorSurface,
  handleEditorKeydown
} = aiSurfaces

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '请求失败，请稍后重试。'
}

function formatFileSize(size: number): string {
  if (size >= 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
  }

  if (size >= 1024) {
    return `${(size / 1024).toFixed(2)} KB`
  }

  return `${size} B`
}

function isValidDownloadUrl(value: string): boolean {
  return /^https?:\/\//.test(value) || value.startsWith('/')
}

function getSelectedArchiveFile(): File | null {
  const rawFile = archiveFileList.value[0]?.raw
  return rawFile instanceof File ? rawFile : null
}

function handleEditorSelectionChange(snapshot: RichTextEditorSelectionSnapshot | null): void {
  if (snapshot) {
    activateEditorSurface()
  }

  editorAutocomplete.updateSelectionSnapshot(snapshot)
}

async function handleEditorRun(): Promise<void> {
  activateEditorSurface()
  await editorAutocomplete.run(editorRef.value)
}

function handleEditorAccept(): void {
  editorAutocomplete.acceptSuggestion(editorRef.value)
}

function resetTopicAiState(): void {
  aiSurfaces.reset()
  featureFlagSuggestion.reset()
}

function resolveTopicDownloadUrl(
  manualDownloadUrl: string,
  archiveUploadResult: UploadZipDirectResult | null
): string {
  if (manualDownloadUrl.length > 0) {
    return manualDownloadUrl
  }

  if (!archiveUploadResult) {
    return ''
  }

  const zipMedia = archiveUploadResult
  // direct 模式会把 ZIP 本体作为媒体入库，这里优先回填附件下载直链。
  return resolveAssetUrl(zipMedia.attachmentPath || zipMedia.downloadPath)
}

function resetForm(): void {
  form.title = ''
  form.topicId = defaultTopicId
  form.typeId = defaultTypeId
  form.featureFlags = []
  form.desc = ''
  form.content = ''
  form.downloadUrl = ''
  archiveFileList.value = []
  resetTopicAiState()
}

function validateForm(): boolean {
  const title = form.title.trim()
  const desc = form.desc.trim()
  const plainText = extractRichTextPlainText(form.content)
  const downloadUrl = form.downloadUrl.trim()
  const featureFlags = normalizeTopicFeatureFlags(form.featureFlags)
  const hasArchive = archiveFileList.value.length > 0

  form.featureFlags = featureFlags

  if (title.length < 2) {
    ElMessage.warning('游戏标题至少需要 2 个字符。')
    return false
  }

  if (desc.length < 2) {
    ElMessage.warning('游戏摘要至少需要 2 个字符。')
    return false
  }

  if (plainText.length < 10) {
    ElMessage.warning('游戏内容至少需要 10 个字符。')
    return false
  }

  // 游戏创作的封面感依赖正文配图；这里仅限制发布，不干扰草稿和 ZIP 资源选择。
  if (embeddedImageCount.value === 0) {
    ElMessage.warning('请至少在游戏正文中上传一张图片。')
    return false
  }

  if (featureFlags.length === 0) {
    ElMessage.warning('请至少选择一个游戏标签。')
    return false
  }

  if (!hasArchive && !downloadUrl) {
    ElMessage.warning('请填写游戏下载地址，或选择一个 ZIP 资源包。')
    return false
  }

  if (downloadUrl && !isValidDownloadUrl(downloadUrl)) {
    ElMessage.warning('下载地址需为 http(s) 链接或站内相对路径。')
    return false
  }

  return true
}

async function loadTopicDetail(id: string): Promise<void> {
  detailLoading.value = true

  try {
    const detail = await contentApi.getMyTopicDetail(id)
    form.title = detail.title
    form.topicId = detail.topicId
    form.typeId = detail.typeId
    form.featureFlags = normalizeTopicFeatureFlags(detail.featureFlags)
    form.desc = detail.desc
    form.content = detail.content
    form.downloadUrl = detail.downloadUrl
    archiveFileList.value = []
    resetTopicAiState()
  } catch {
    // 由请求层统一提示。
  } finally {
    detailLoading.value = false
  }
}

const beforeArchiveUpload: UploadProps['beforeUpload'] = (rawFile: UploadRawFile) => {
  const fileName = rawFile.name.toLowerCase()
  if (!fileName.endsWith('.zip')) {
    ElMessage.error('当前仅支持选择 ZIP 压缩包。')
    return false
  }

  if (rawFile.size > TOPIC_ARCHIVE_MAX_FILE_SIZE) {
    ElMessage.error('ZIP 资源包大小不能超过 100MB。')
    return false
  }

  return true
}

const handleArchiveChange: UploadProps['onChange'] = (_file, nextFileList) => {
  archiveFileList.value = nextFileList.slice(-1)
}

const handleArchiveRemove: UploadProps['onRemove'] = (_file, nextFileList) => {
  archiveFileList.value = nextFileList
}

const handleArchiveExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning('一次只能选择一个 ZIP 资源包。')
}

async function handlePublish(): Promise<void> {
  if (!validateForm()) {
    return
  }

  const archiveFile = getSelectedArchiveFile()
  if (archiveFileList.value.length > 0 && !archiveFile) {
    ElMessage.error('当前 ZIP 资源包读取失败，请重新选择文件后再发布。')
    return
  }

  publishLoading.value = true

  try {
    let archiveUploadResult: UploadZipDirectResult | null = null
    if (archiveFile) {
      // ZIP 资源只在真正提交时上传，避免编辑态反复写入临时媒体。
      archiveUploadResult = await contentApi.uploadZip(archiveFile, 'direct')
    }

    // 仅在真正提交时解析富文本中的媒体，避免编辑过程中重复上传图片。
    const preparedMedia = await normalizeRichTextEmbeddedMedia(form.content, {
      fileNamePrefix: 'topic-embedded-image',
      resolveAssetUrl,
      uploadImages: async (files) => (await contentApi.uploadImages(files)).items
    })

    const downloadUrl = resolveTopicDownloadUrl(form.downloadUrl.trim(), archiveUploadResult)
    if (!downloadUrl) {
      throw new Error('游戏下载地址不能为空，请填写地址或上传可自动回填的 ZIP 资源。')
    }

    const payload = {
      topicId: form.topicId,
      typeId: form.typeId,
      title: form.title.trim(),
      featureFlags: form.featureFlags,
      desc: form.desc.trim(),
      content: preparedMedia.content,
      images: preparedMedia.images.map((item) => item.mediaId),
      downloadUrl
    }

    const result =
      isEditMode.value && editingId.value
        ? await contentApi.updateTopic(editingId.value, payload)
        : await contentApi.createTopic(payload)

    publishSummary.value = {
      result,
      imageCount: preparedMedia.images.length,
      archiveUpload: archiveUploadResult
        ? {
            uploadedCount: 1,
            skippedCount: 0
          }
        : null
    }

    form.downloadUrl = downloadUrl
    form.content = preparedMedia.content
    resetTopicAiState()
    ElMessage.success(isEditMode.value ? '游戏内容已更新。' : '游戏已成功发布。')

    if (!isEditMode.value) {
      resetForm()
    }
  } catch (error) {
    ElMessage.error(getErrorMessage(error))
  } finally {
    publishLoading.value = false
  }
}

watch(
  () => form.content,
  () => {
    editorAutocomplete.handleExternalContentChange()
  }
)

watch(
  editingId,
  (nextId) => {
    publishSummary.value = null

    if (nextId) {
      void loadTopicDetail(nextId)
      return
    }

    resetForm()
  },
  {
    immediate: true
  }
)
</script>

<style scoped>
.content-page {
  display: grid;
  gap: 18px;
}

.panel-card,
.stat-card,
.archive-card {
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
.upload-summary,
.archive-card span,
.archive-card small {
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
  gap: 18px;
}

.form-grid-meta {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid-download {
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.95fr);
  align-items: start;
}

.field-helper {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.7;
}

.field-helper__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.upload-summary {
  margin-top: 10px;
  line-height: 1.7;
}

.archive-card {
  display: grid;
  gap: 6px;
  padding: 18px 20px;
  background: var(--community-surface-soft);
}

.archive-card strong {
  font-size: 16px;
  line-height: 1.5;
}

.editor-autocomplete-shell {
  position: relative;
  width: 100%;
}

/* 游戏主操作放在表单底部，和情报、图包的编辑节奏保持一致。 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 8px;
}
</style>
