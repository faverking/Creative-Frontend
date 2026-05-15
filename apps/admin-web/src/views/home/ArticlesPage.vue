<template>
  <section class="content-page articles-page">
    <section class="stats-grid">
      <article class="stat-card">
        <span>正文字符数</span>
        <strong>{{ contentLength }}</strong>
        <small>按富文本提取后的纯文本内容实时统计。</small>
      </article>

      <article class="stat-card">
        <span>{{ isEditMode ? '编辑模式' : '草稿状态' }}</span>
        <strong>{{ statusCardTitle }}</strong>
        <small>{{ statusCardSummary }}</small>
      </article>

      <article class="stat-card">
        <span>发布摘要</span>
        <strong>{{ effectiveSummary ? `${effectiveSummary.length} 字` : '待生成' }}</strong>
        <small>{{ effectiveSummary || '如未手动填写，将根据正文自动生成摘要。' }}</small>
      </article>
    </section>

    <el-alert
      v-if="!isEditMode && draftId"
      class="page-alert"
      type="info"
      :closable="false"
      show-icon
      title="检测到本地草稿引用"
    >
      <div class="alert-content">
        <span>草稿 ID：{{ draftId }}</span>
        <span v-if="draftUpdatedAt">最近保存：{{ formatDateTime(draftUpdatedAt) }}</span>
        <div class="alert-actions">
          <el-button link type="primary" @click="reloadDraft">重新载入草稿</el-button>
          <el-button link @click="handleClearDraftReference">清除本地引用</el-button>
        </div>
      </div>
    </el-alert>

    <el-alert
      v-if="publishResult"
      class="page-alert"
      :title="isEditMode ? '情报更新成功' : '情报发布成功'"
      type="success"
      :closable="false"
      show-icon
    >
      <div class="alert-content">
        <span>情报 ID：{{ publishResult.id }}</span>
        <span>发布时间：{{ formatDateTime(publishResult.postTime) }}</span>
      </div>
    </el-alert>

    <el-card v-loading="detailLoading" class="panel-card" shadow="never">
      <el-form label-position="top" class="content-form">
        <el-form-item label="情报标题">
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
              placeholder="请输入情报标题，建议突出核心信息"
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
          <el-form-item label="情报分类">
            <el-select v-model="form.themeId" placeholder="请选择情报分类">
              <el-option
                v-for="option in articleThemeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <div class="stat-inline">
            <span>当前摘要预览</span>
            <strong>{{ effectiveSummary || '尚未生成摘要' }}</strong>
          </div>
        </div>

        <el-form-item label="情报摘要">
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
              maxlength="500"
              show-word-limit
              placeholder="可选填写。留空时会根据正文自动生成摘要。"
            />

            <admin-inline-ai-suggestion
              v-if="summaryAutocomplete.showSuggestion.value"
              label="摘要"
              :status="summaryAutocomplete.status.value"
              :preview-text="summaryAutocomplete.previewText.value"
              :error-message="summaryAutocomplete.error.value"
              @accept="summaryAutocomplete.acceptSuggestion"
              @dismiss="summaryAutocomplete.dismissSuggestion"
            />

            <div class="field-helper">
              <span>适合用在列表卡片、推荐位和活动页简介。</span>
              <div class="field-helper__actions">
                <el-button link type="primary" :disabled="!autoSummary" @click="applyAutoSummary">
                  使用自动摘要
                </el-button>
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
          </div>
        </el-form-item>

        <el-form-item label="情报正文">
          <!-- 正文 AI 改写/续写跟编辑器绑定在一起，避免用户来回切换到独立面板；
               这样更接近编码时的自动补全和就地操作，也不会碰草稿、发布等既有提交流程。 -->
          <div class="editor-autocomplete-shell" @keydown.capture="handleEditorKeydown">
            <rich-text-editor
              ref="editorRef"
              v-model="form.content"
              min-height="420px"
              placeholder="请输入情报正文内容"
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
        </el-form-item>

        <div class="form-actions">
          <el-button v-if="!isEditMode" :loading="draftLoading" round @click="handleSaveDraft">
            保存草稿
          </el-button>
          <el-button type="primary" :loading="publishLoading" round @click="handlePublish">
            {{ isEditMode ? '保存情报修改' : '发布情报' }}
          </el-button>
        </div>
      </el-form>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'

import AdminEditorAiActionBubble from '@/components/ai/AdminEditorAiActionBubble.vue'
import AdminEditorAiSuggestionPopover from '@/components/ai/AdminEditorAiSuggestionPopover.vue'
import AdminInlineAiSuggestion from '@/components/ai/AdminInlineAiSuggestion.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { contentApi, type ArticleDetail } from '@/api/content'
import { useDocumentTitle } from '@/composables/useDocumentTitle'
import { useArticleEditorAutocomplete } from '@/composables/useArticleEditorAutocomplete'
import { useArticleFieldAutocomplete } from '@/composables/useArticleFieldAutocomplete'
import { useContentAiSurfaces } from '@/composables/useContentAiSurfaces'
import { ARTICLE_DRAFT_STORAGE_KEY, ARTICLE_THEME_OPTIONS } from '@/constants'
import type {
  RichTextEditorExpose,
  RichTextEditorSelectionSnapshot
} from '@/types/rich-text-editor'
import { resolvePersistedAssetPath } from '@/utils/assets'
import { formatDateTime } from '@/utils/format'
import {
  countRichTextNodes,
  collectPreparedRichTextImageMediaIds,
  createRichTextExcerpt,
  extractRichTextPlainText,
  normalizeRichTextEmbeddedMedia
} from '@/utils/rich-text'

interface ArticleFormState {
  title: string
  themeId: number
  desc: string
  content: string
}

const route = useRoute()
const articleThemeOptions = ARTICLE_THEME_OPTIONS

const form = reactive<ArticleFormState>({
  title: '',
  themeId: articleThemeOptions[0]?.value ?? 1,
  desc: '',
  content: ''
})
const editorRef = ref<RichTextEditorExpose | null>(null)
const titleAutocomplete = useArticleFieldAutocomplete({
  field: 'title',
  form
})
const summaryAutocomplete = useArticleFieldAutocomplete({
  field: 'summary',
  form
})
const editorAutocomplete = useArticleEditorAutocomplete(form)
const aiSurfaces = useContentAiSurfaces({
  title: titleAutocomplete,
  summary: summaryAutocomplete,
  editor: editorAutocomplete,
  acceptEditorSuggestion: () => {
    editorAutocomplete.acceptSuggestion(editorRef.value)
  }
})
const {
  handleTitleFocusIn,
  handleSummaryFocusIn,
  handleFieldFocusOut,
  handleTitleKeydown,
  handleSummaryKeydown,
  handleEditorKeydown
} = aiSurfaces

const draftId = ref('')
const draftUpdatedAt = ref('')
const draftLoading = ref(false)
const detailLoading = ref(false)
const publishLoading = ref(false)
const publishResult = ref<ArticleDetail | null>(null)
const loadedArticleTitle = ref('')

const editingId = computed(() =>
  route.query.mode === 'edit' && typeof route.query.id === 'string' ? route.query.id : ''
)
const isEditMode = computed(() => editingId.value.length > 0)
const articleDocumentTitle = computed(() => {
  if (!isEditMode.value) {
    return '发布情报'
  }

  return loadedArticleTitle.value ? `编辑：${loadedArticleTitle.value}` : '编辑情报'
})
const contentLength = computed(() => extractRichTextPlainText(form.content).length)
const embeddedImageCount = computed(() => countRichTextNodes(form.content, 'img[src]'))
const autoSummary = computed(() => createRichTextExcerpt(form.content, 160))
const effectiveSummary = computed(() => form.desc.trim() || autoSummary.value)
const statusCardTitle = computed(() => {
  if (isEditMode.value) {
    return '正在维护已发布情报'
  }

  return draftId.value ? '已绑定本地草稿' : '未绑定草稿'
})
const statusCardSummary = computed(() => {
  if (isEditMode.value) {
    return '当前通过管理页进入编辑态，提交后会直接更新原情报。'
  }

  return draftUpdatedAt.value
    ? `最近保存：${formatDateTime(draftUpdatedAt.value)}`
    : '首次保存后会自动记录草稿引用。'
})
const editorSuggestionTitle = computed(() =>
  editorAutocomplete.task.value === 'rewrite-selection' ? '选区改写建议' : '正文续写建议'
)
useDocumentTitle(articleDocumentTitle)

function readStoredDraftId(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(ARTICLE_DRAFT_STORAGE_KEY) ?? ''
}

function writeStoredDraftId(nextDraftId: string): void {
  if (typeof window === 'undefined') {
    return
  }

  // 这里只在本地保存草稿引用，真正内容仍以后端草稿为准。
  window.localStorage.setItem(ARTICLE_DRAFT_STORAGE_KEY, nextDraftId)
}

function removeStoredDraftId(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(ARTICLE_DRAFT_STORAGE_KEY)
}

function hasMediaId(image: { mediaId?: string }): image is { mediaId: string } {
  return typeof image.mediaId === 'string' && image.mediaId.length > 0
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '请求失败，请稍后重试。'
}

function handleEditorSelectionChange(snapshot: RichTextEditorSelectionSnapshot | null): void {
  if (snapshot) {
    aiSurfaces.activateEditorSurface()
  }

  editorAutocomplete.updateSelectionSnapshot(snapshot)
}

async function handleEditorRun(): Promise<void> {
  aiSurfaces.activateEditorSurface()
  await editorAutocomplete.run(editorRef.value)
}

function handleEditorAccept(): void {
  editorAutocomplete.acceptSuggestion(editorRef.value)
}

function applyAutoSummary(): void {
  if (!autoSummary.value) {
    return
  }

  form.desc = autoSummary.value
}

function resetArticleAiState(): void {
  // 切换文章、重载草稿或发布后开始下一篇时，要把字段和编辑器的 AI 建议一起清空，
  // 否则上一条内容的自动补全结果会误留到新表单里。
  aiSurfaces.reset()
}

function clearDraftReference(showMessage = true): void {
  draftId.value = ''
  draftUpdatedAt.value = ''
  removeStoredDraftId()

  if (showMessage) {
    ElMessage.success('已清除本地草稿引用。')
  }
}

function handleClearDraftReference(): void {
  clearDraftReference()
}

function resetForm(): void {
  form.title = ''
  form.themeId = articleThemeOptions[0]?.value ?? 1
  form.desc = ''
  form.content = ''
}

function validateDraft(): boolean {
  const title = form.title.trim()
  const plainText = extractRichTextPlainText(form.content)

  if (!title) {
    ElMessage.warning('请先填写情报标题。')
    return false
  }

  if (!plainText) {
    ElMessage.warning('草稿正文不能为空。')
    return false
  }

  return true
}

function validatePublish(): boolean {
  const title = form.title.trim()
  const plainText = extractRichTextPlainText(form.content)
  const summary = effectiveSummary.value.trim()

  if (title.length < 2) {
    ElMessage.warning('情报标题至少需要 2 个字符。')
    return false
  }

  if (plainText.length < 10) {
    ElMessage.warning('情报正文至少需要 10 个字符。')
    return false
  }

  // 图片是情报内容的发布门槛，但仍只在发布前校验，避免影响草稿编辑节奏。
  if (embeddedImageCount.value === 0) {
    ElMessage.warning('请至少在情报正文中上传一张图片。')
    return false
  }

  if (summary.length < 2) {
    ElMessage.warning('当前内容过短，无法生成可用摘要。')
    return false
  }

  return true
}

async function loadDraft(nextDraftId: string, silent = false): Promise<void> {
  resetArticleAiState()
  const draft = await contentApi.getDraftDetail(nextDraftId)
  form.title = draft.title
  form.themeId = draft.themeId
  form.desc = ''
  form.content = draft.content
  draftId.value = draft.id
  draftUpdatedAt.value = draft.updateTime || draft.createTime
  writeStoredDraftId(draft.id)

  if (!silent) {
    ElMessage.success('草稿已载入编辑器。')
  }
}

async function loadArticleDetail(id: string): Promise<void> {
  resetArticleAiState()
  loadedArticleTitle.value = ''
  detailLoading.value = true

  try {
    const detail = await contentApi.getMyArticleDetail(id)
    form.title = detail.title
    form.themeId = detail.themeId
    form.desc = detail.desc
    form.content = detail.content
    loadedArticleTitle.value = detail.title.trim()
  } catch {
    // 由请求层统一提示。
  } finally {
    detailLoading.value = false
  }
}

async function initializeCreateMode(): Promise<void> {
  resetArticleAiState()
  resetForm()
  publishResult.value = null

  const storedDraftId = readStoredDraftId()
  if (!storedDraftId) {
    draftId.value = ''
    draftUpdatedAt.value = ''
    return
  }

  try {
    await loadDraft(storedDraftId, true)
  } catch {
    clearDraftReference(false)
    ElMessage.warning('草稿引用已失效，已为你自动清除。')
  }
}

async function reloadDraft(): Promise<void> {
  if (!draftId.value) {
    return
  }

  try {
    await loadDraft(draftId.value)
  } catch {
    clearDraftReference(false)
  }
}

async function handleSaveDraft(): Promise<void> {
  if (!validateDraft()) {
    return
  }

  draftLoading.value = true

  try {
    const payload = {
      themeId: form.themeId,
      title: form.title.trim(),
      content: form.content
    }

    // 优先复用当前草稿引用，避免二次保存时意外新建另一条草稿。
    const activeDraftId = draftId.value || readStoredDraftId()
    const result = activeDraftId
      ? await contentApi.updateDraft(activeDraftId, payload)
      : await contentApi.createDraft(payload)

    draftId.value = result.id
    draftUpdatedAt.value = result.updateTime || result.createTime
    writeStoredDraftId(result.id)
    ElMessage.success('草稿已保存。')
  } catch {
    // 由请求层统一提示。
  } finally {
    draftLoading.value = false
  }
}

async function handlePublish(): Promise<void> {
  if (!validatePublish()) {
    return
  }

  publishLoading.value = true

  try {
    // 富文本图片的上传、src 回写和媒体占位标记统一由富文本处理器完成。
    const preparedMedia = await normalizeRichTextEmbeddedMedia(form.content, {
      fileNamePrefix: 'article-embedded-image',
      resolveAssetUrl: resolvePersistedAssetPath,
      uploadImages: async (files) => (await contentApi.uploadImages(files)).items
    })

    const payload = {
      title: form.title.trim(),
      desc: effectiveSummary.value.trim(),
      content: preparedMedia.content,
      themeId: form.themeId,
      images: collectPreparedRichTextImageMediaIds(preparedMedia.images),
      status: 'published' as const
    }

    const result =
      isEditMode.value && editingId.value
        ? await contentApi.updateArticle(editingId.value, payload)
        : await contentApi.createArticle(payload)

    publishResult.value = result
    form.desc = payload.desc
    form.content = preparedMedia.content

    if (isEditMode.value) {
      loadedArticleTitle.value = payload.title
      ElMessage.success('情报内容已更新。')
      return
    }

    resetArticleAiState()
    resetForm()
    clearDraftReference(false)
    const uploadedImageCount = preparedMedia.images.filter(hasMediaId).length
    ElMessage.success(
      uploadedImageCount > 0
        ? `情报已成功发布，并同步处理 ${uploadedImageCount} 张正文图片。`
        : '情报已成功发布。'
    )
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
    publishResult.value = null

    if (nextId) {
      void loadArticleDetail(nextId)
      return
    }

    loadedArticleTitle.value = ''
    void initializeCreateMode()
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
.field-helper {
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

.alert-actions {
  display: flex;
  gap: 8px;
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
  grid-template-columns: minmax(240px, 320px) 1fr;
  gap: 18px;
  align-items: start;
}

.stat-inline {
  display: grid;
  gap: 10px;
  min-height: 76px;
  padding: 14px 16px;
  border: 1px solid var(--community-border);
  border-radius: 20px;
  background: var(--community-surface-soft);
}

.stat-inline span {
  color: var(--el-text-color-secondary);
}

.stat-inline strong {
  font-size: 14px;
  line-height: 1.7;
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

.field-helper {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-top: 8px;
  font-size: 14px;
}

.field-helper__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.editor-autocomplete-shell {
  position: relative;
  width: 100%;
}

/* 编辑完成后的主要操作统一收口在表单底部。 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 8px;
}
</style>
