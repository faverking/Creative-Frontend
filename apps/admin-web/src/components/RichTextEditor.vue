<template>
  <div ref="hostRef" class="rich-text-editor" :style="{ '--editor-min-height': minHeight }">
    <div ref="editorRef" class="editor-root" />

    <el-dialog
      v-model="videoDialogVisible"
      class="rich-text-editor__video-dialog"
      width="640px"
      align-center
      append-to-body
      destroy-on-close
    >
      <template #header>
        <div class="rich-text-editor__video-dialog-header">
          <strong>插入视频</strong>
          <p>支持 Bilibili、YouTube 的视频页地址、分享链接，或平台提供的 iframe 代码。</p>
        </div>
      </template>

      <div class="rich-text-editor__video-dialog-body">
        <div class="rich-text-editor__video-dialog-tips">
          <span>自动转成平台官方 embed 地址</span>
          <span>粘贴 iframe 时优先读取其中的 src</span>
          <span>Bilibili 短链建议先展开为完整地址</span>
        </div>

        <el-input
          v-model="videoDraftSource"
          type="textarea"
          :rows="5"
          resize="none"
          placeholder="粘贴视频页链接、分享链接，或 iframe 代码"
        />

        <div
          class="rich-text-editor__video-dialog-preview"
          :class="{ 'is-ready': Boolean(resolvedVideoEmbed) }"
        >
          <template v-if="resolvedVideoEmbed">
            <strong>{{ resolvedVideoEmbed.platformLabel }} 内嵌地址</strong>
            <code>{{ resolvedVideoEmbed.embedUrl }}</code>
          </template>

          <template v-else>
            <strong>等待解析</strong>
            <p>支持 `youtube.com/watch`、`youtu.be`、`bilibili.com/video` 和对应 iframe。</p>
          </template>
        </div>
      </div>

      <template #footer>
        <div class="rich-text-editor__video-dialog-actions">
          <el-button round @click="closeVideoDialog">取消</el-button>
          <el-button
            type="primary"
            round
            :disabled="!resolvedVideoEmbed"
            @click="submitVideoDialog"
          >
            插入视频
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import Quill from 'quill'

import 'quill/dist/quill.snow.css'
import {
  containsRichTextHtml,
  convertPlainTextToRichTextHtml,
  sanitizeAiRichTextHtml,
  normalizeRichTextEmbeddedVideoInput
} from '@/utils/rich-text'
import type {
  RichTextEditorExpose,
  RichTextEditorSelectionSnapshot
} from '@/types/rich-text-editor'

const BlockEmbed = Quill.import('blots/block/embed') as new (...args: never[]) => object
interface RichTextImageBlotBase {
  domNode: HTMLElement
  format(name: string, value: unknown): void
}

const BaseImageBlot = Quill.import('formats/image') as (new (
  ...args: never[]
) => RichTextImageBlotBase) & {
  create(value: unknown): HTMLElement
  formats?(domNode: HTMLElement): Record<string, unknown>
  value?(domNode: HTMLElement): unknown
}
const icons = Quill.import('ui/icons') as Record<string, string | Record<string, string>>

interface RichTextImageValue {
  alt?: string
  mediaId?: string
  placeholder?: string
  title?: string
  url: string
}

function normalizeRichTextImageValue(value: unknown): RichTextImageValue {
  if (typeof value === 'string') {
    return {
      url: value
    }
  }

  if (value && typeof value === 'object') {
    const imageValue = value as Partial<RichTextImageValue>
    return {
      alt: imageValue.alt,
      mediaId: imageValue.mediaId,
      placeholder: imageValue.placeholder,
      title: imageValue.title,
      url: imageValue.url ?? ''
    }
  }

  return {
    url: ''
  }
}

class DividerBlot extends BlockEmbed {
  static blotName = 'divider'
  static tagName = 'hr'
}

class RichTextImageBlot extends BaseImageBlot {
  static blotName = 'image'
  static tagName = 'img'

  static create(value: unknown): HTMLElement {
    const imageValue = normalizeRichTextImageValue(value)
    const node = super.create(imageValue.url) as HTMLImageElement

    if (imageValue.alt) {
      node.setAttribute('alt', imageValue.alt)
    }

    if (imageValue.title) {
      node.setAttribute('title', imageValue.title)
    }

    if (imageValue.placeholder) {
      node.setAttribute('data-media-placeholder', imageValue.placeholder)
    }

    if (imageValue.mediaId) {
      node.setAttribute('data-media-id', imageValue.mediaId)
    }

    return node
  }

  static formats(domNode: HTMLElement): Record<string, unknown> {
    const formats = super.formats?.(domNode) ?? {}
    const mediaId = domNode.getAttribute('data-media-id')?.trim()
    const placeholder = domNode.getAttribute('data-media-placeholder')?.trim()

    if (mediaId) {
      formats.mediaId = mediaId
    }

    if (placeholder) {
      formats.mediaPlaceholder = placeholder
    }

    return formats
  }

  static value(domNode: HTMLElement): RichTextImageValue {
    return {
      alt: domNode.getAttribute('alt')?.trim() || undefined,
      mediaId: domNode.getAttribute('data-media-id')?.trim() || undefined,
      placeholder: domNode.getAttribute('data-media-placeholder')?.trim() || undefined,
      title: domNode.getAttribute('title')?.trim() || undefined,
      url: domNode.getAttribute('src')?.trim() ?? ''
    }
  }

  format(name: string, value: unknown): void {
    const domNode = this.domNode

    if (name === 'mediaId') {
      if (typeof value === 'string' && value.trim()) {
        domNode.setAttribute('data-media-id', value.trim())
      } else {
        domNode.removeAttribute('data-media-id')
      }
      return
    }

    if (name === 'mediaPlaceholder') {
      if (typeof value === 'string' && value.trim()) {
        domNode.setAttribute('data-media-placeholder', value.trim())
      } else {
        domNode.removeAttribute('data-media-placeholder')
      }
      return
    }

    super.format(name, value)
  }
}

Quill.register('formats/divider', DividerBlot, true)
Quill.register('formats/image', RichTextImageBlot, true)

icons.divider = `
  <svg viewBox="0 0 18 18" aria-hidden="true">
    <line class="ql-stroke" x1="3" x2="15" y1="9" y2="9"></line>
    <line class="ql-stroke" x1="3" x2="15" y1="5" y2="5"></line>
    <line class="ql-stroke" x1="3" x2="15" y1="13" y2="13"></line>
  </svg>
`

if (typeof icons.header === 'object' && icons.header) {
  icons.header['1'] = 'H1'
  icons.header['2'] = 'H2'
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    disabled?: boolean
    minHeight?: string
  }>(),
  {
    placeholder: '请输入内容',
    disabled: false,
    minHeight: '320px'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'selection-change': [snapshot: RichTextEditorSelectionSnapshot | null]
}>()

const hostRef = ref<HTMLDivElement | null>(null)
const editorRef = ref<HTMLDivElement | null>(null)
const videoDialogVisible = ref(false)
const videoDraftSource = ref('')
const resolvedVideoEmbed = computed(() =>
  normalizeRichTextEmbeddedVideoInput(videoDraftSource.value)
)

let quill: Quill | null = null
let syncingFromOutside = false
let removePasteListener: (() => void) | null = null
let lastKnownRange: { index: number; length: number } | null = null

function normalizeHtml(value: string): string {
  const trimmedValue = value.trim()
  return trimmedValue === '<p><br></p>' ? '' : trimmedValue
}

function getEditorHtml(): string {
  if (!quill) {
    return ''
  }

  return quill.getText().trim().length === 0 ? '' : normalizeHtml(quill.root.innerHTML)
}

function syncEditorContent(value: string): void {
  if (!quill) {
    return
  }

  const currentValue = getEditorHtml()
  const nextValue = normalizeHtml(value)

  if (currentValue === nextValue) {
    return
  }

  syncingFromOutside = true
  quill.clipboard.dangerouslyPasteHTML(nextValue || '')
  syncingFromOutside = false
}

function resolveActiveRange(): { index: number; length: number } | null {
  if (!quill) {
    return null
  }

  const currentRange = quill.getSelection()
  if (currentRange) {
    lastKnownRange = {
      index: currentRange.index,
      length: currentRange.length
    }

    return lastKnownRange
  }

  return lastKnownRange
}

function createSelectionSnapshot(): RichTextEditorSelectionSnapshot | null {
  if (!quill || !hostRef.value) {
    return null
  }

  const range = resolveActiveRange()
  if (!range) {
    return null
  }

  const plainText = quill.getText().replace(/\u00a0/g, ' ')
  const selectionStart = range.index
  const selectionEnd = range.index + range.length
  const bounds = quill.getBounds(range.index, range.length || 1) ?? {
    left: 0,
    top: 0,
    width: 0,
    height: 18
  }
  const editorRect = quill.root.getBoundingClientRect()
  const hostRect = hostRef.value.getBoundingClientRect()

  return {
    mode: range.length > 0 ? 'range' : 'caret',
    plainText,
    selectedText: range.length > 0 ? plainText.slice(selectionStart, selectionEnd) : '',
    range: {
      index: range.index,
      length: range.length
    },
    anchor: {
      left: editorRect.left - hostRect.left + bounds.left + bounds.width / 2,
      top: editorRect.top - hostRect.top + bounds.top,
      width: bounds.width,
      height: bounds.height,
      containerHeight: hostRect.height
    }
  }
}

function emitSelectionSnapshot(): void {
  emit('selection-change', createSelectionSnapshot())
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function createHtmlDocument(html: string): Document | null {
  if (typeof DOMParser === 'undefined') {
    return null
  }

  return new DOMParser().parseFromString(html, 'text/html')
}

function unwrapElement(element: Element): void {
  const parent = element.parentNode
  if (!parent) {
    return
  }

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element)
  }

  parent.removeChild(element)
}

function sanitizePastedHtml(html: string): string {
  const doc = createHtmlDocument(html)
  if (!doc) {
    return ''
  }

  doc.querySelectorAll('script, style, meta, link').forEach((node) => node.remove())
  ;['span', 'font', 'u', 'i', 'em', 'mark'].forEach((selector) => {
    doc.querySelectorAll(selector).forEach((node) => unwrapElement(node))
  })

  doc.body.querySelectorAll('*').forEach((node) => {
    Array.from(node.attributes).forEach((attribute) => {
      const attributeName = attribute.name.toLowerCase()
      const keepLinkHref = node.tagName === 'A' && attributeName === 'href'
      const keepLinkTarget = node.tagName === 'A' && attributeName === 'target'
      const keepLinkRel = node.tagName === 'A' && attributeName === 'rel'
      const keepIframeSrc = node.tagName === 'IFRAME' && attributeName === 'src'

      if (keepLinkHref || keepLinkTarget || keepLinkRel || keepIframeSrc) {
        return
      }

      node.removeAttribute(attribute.name)
    })
  })

  doc.body.querySelectorAll<HTMLIFrameElement>('iframe').forEach((node) => {
    const normalizedVideo = normalizeRichTextEmbeddedVideoInput(
      node.getAttribute('src')?.trim() || ''
    )

    if (!normalizedVideo) {
      node.remove()
      return
    }

    node.setAttribute('src', normalizedVideo.embedUrl)
    node.setAttribute('class', 'ql-video')
    node.setAttribute('frameborder', '0')
    node.setAttribute('allowfullscreen', 'true')
    node.setAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
    )
    node.setAttribute('loading', 'lazy')
    node.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
  })

  return doc.body.innerHTML.trim()
}

function insertPlainText(text: string): void {
  if (!quill) {
    return
  }

  const range = quill.getSelection(true)
  let insertIndex = range?.index ?? quill.getLength()

  if (range && range.length > 0) {
    quill.deleteText(range.index, range.length, 'user')
    insertIndex = range.index
  }

  quill.insertText(insertIndex, text, 'user')
  quill.setSelection(insertIndex + text.length, 0, 'silent')
  lastKnownRange = {
    index: insertIndex + text.length,
    length: 0
  }
  emitSelectionSnapshot()
}

function insertStructuredPlainText(text: string, range: { index: number; length: number }): void {
  if (!quill) {
    return
  }

  const normalizedText = text.replace(/\r\n?/g, '\n')
  if (!normalizedText.includes('\n')) {
    if (range.length > 0) {
      quill.deleteText(range.index, range.length, 'user')
    }

    quill.insertText(range.index, normalizedText, 'user')
    quill.setSelection(range.index + normalizedText.length, 0, 'silent')
    lastKnownRange = {
      index: range.index + normalizedText.length,
      length: 0
    }
    emitSelectionSnapshot()
    return
  }

  const structuredHtml = convertPlainTextToRichTextHtml(normalizedText)
  if (!structuredHtml) {
    return
  }

  const previousLength = quill.getLength()

  if (range.length > 0) {
    quill.deleteText(range.index, range.length, 'user')
  }

  // AI 返回的是纯文本，但其中如果已经带了空行分段，就应该按段落写回编辑器，
  // 这样正文改写和续写才能保留层次，而不是被当成一整段普通文本压平。
  quill.clipboard.dangerouslyPasteHTML(range.index, structuredHtml, 'user')

  const insertedLength = Math.max(quill.getLength() - previousLength + range.length, 0)
  quill.setSelection(range.index + insertedLength, 0, 'silent')
  lastKnownRange = {
    index: range.index + insertedLength,
    length: 0
  }
  emitSelectionSnapshot()
}

function insertAiSuggestionContent(text: string, range: { index: number; length: number }): void {
  if (!quill) {
    return
  }

  const normalizedText = text.replace(/\r\n?/g, '\n').trim()
  if (!normalizedText) {
    return
  }

  if (containsRichTextHtml(normalizedText)) {
    const sanitizedHtml = sanitizeAiRichTextHtml(normalizedText)
    if (!sanitizedHtml) {
      return
    }

    const previousLength = quill.getLength()

    if (range.length > 0) {
      quill.deleteText(range.index, range.length, 'user')
    }

    // 正文 AI 允许返回受限 HTML 片段，用来表达标题、列表、引用等稳定结构；
    // 这里先在 utils 做白名单清洗，再写回 Quill，避免把样式和不受控标签带进正文。
    quill.clipboard.dangerouslyPasteHTML(range.index, sanitizedHtml, 'user')

    const insertedLength = Math.max(quill.getLength() - previousLength + range.length, 0)
    quill.setSelection(range.index + insertedLength, 0, 'silent')
    lastKnownRange = {
      index: range.index + insertedLength,
      length: 0
    }
    emitSelectionSnapshot()
    return
  }

  insertStructuredPlainText(normalizedText, range)
}

function insertSanitizedHtml(html: string): void {
  if (!quill) {
    return
  }

  const sanitizedHtml = sanitizePastedHtml(html)
  if (!sanitizedHtml) {
    return
  }

  const range = quill.getSelection(true)
  const insertIndex = range?.index ?? quill.getLength()

  if (range && range.length > 0) {
    quill.deleteText(range.index, range.length, 'user')
  }

  quill.clipboard.dangerouslyPasteHTML(insertIndex, sanitizedHtml, 'user')
  lastKnownRange = {
    index: insertIndex,
    length: 0
  }
  emitSelectionSnapshot()
}

function insertDivider(): void {
  if (!quill) {
    return
  }

  const range = quill.getSelection(true)
  const insertIndex = range?.index ?? quill.getLength()

  quill.insertText(insertIndex, '\n', 'user')
  quill.insertEmbed(insertIndex + 1, 'divider', true, 'user')
  quill.insertText(insertIndex + 2, '\n', 'user')
  quill.setSelection(insertIndex + 3, 0, 'silent')
  lastKnownRange = {
    index: insertIndex + 3,
    length: 0
  }
  emitSelectionSnapshot()
}

function insertVideo(embedUrl: string): void {
  if (!quill) {
    return
  }

  const range = quill.getSelection(true)
  let insertIndex = range?.index ?? quill.getLength()

  if (range && range.length > 0) {
    quill.deleteText(range.index, range.length, 'user')
    insertIndex = range.index
  }

  quill.insertText(insertIndex, '\n', 'user')
  quill.insertEmbed(insertIndex + 1, 'video', embedUrl, 'user')
  quill.insertText(insertIndex + 2, '\n', 'user')
  quill.setSelection(insertIndex + 3, 0, 'silent')
  lastKnownRange = {
    index: insertIndex + 3,
    length: 0
  }
  emitSelectionSnapshot()
}

function openVideoDialog(): void {
  videoDraftSource.value = ''
  videoDialogVisible.value = true
}

function closeVideoDialog(): void {
  videoDialogVisible.value = false
  videoDraftSource.value = ''
}

async function submitVideoDialog(): Promise<void> {
  const normalizedVideo = resolvedVideoEmbed.value

  if (!normalizedVideo) {
    ElMessage.warning('当前视频地址暂时无法解析，请使用完整的视频页地址或 iframe 代码')
    return
  }

  insertVideo(normalizedVideo.embedUrl)
  closeVideoDialog()
  await nextTick()
  quill?.focus()
}

function replaceSelection(text: string): void {
  if (!quill) {
    return
  }

  const range = resolveActiveRange()
  if (!range) {
    return
  }

  // 选区改写需要基于上一次稳定选区做替换，这样点击浮层按钮后即便编辑器暂时失焦，
  // 仍然能把建议精确写回原位置，而不是误插到正文末尾。
  insertAiSuggestionContent(text, range)
}

function insertAtCursor(text: string): void {
  if (!quill) {
    return
  }

  const range = resolveActiveRange() ?? {
    index: quill.getLength(),
    length: 0
  }

  insertAiSuggestionContent(text, range)
}

function focus(): void {
  quill?.focus()
}

function bindPasteBehavior(): void {
  if (!quill) {
    return
  }

  const handlePaste = (event: ClipboardEvent) => {
    if (!quill || props.disabled) {
      return
    }

    const clipboard = event.clipboardData
    if (!clipboard) {
      return
    }

    const imageFiles = Array.from(clipboard.items).filter(
      (item) => item.kind === 'file' && item.type.startsWith('image/')
    )

    if (imageFiles.length > 0) {
      return
    }

    const range = quill.getSelection(true)
    if (!range) {
      return
    }

    const rawText = clipboard.getData('text/plain')
    const htmlText = clipboard.getData('text/html')
    const pastedText = rawText.trim()

    if (isHttpUrl(pastedText)) {
      event.preventDefault()

      if (range.length > 0) {
        quill.formatText(range.index, range.length, 'link', pastedText, 'user')
        quill.setSelection(range.index + range.length, 0, 'silent')
        return
      }

      quill.insertText(range.index, pastedText, { link: pastedText }, 'user')
      quill.setSelection(range.index + pastedText.length, 0, 'silent')
      return
    }

    if (htmlText.trim().length > 0) {
      event.preventDefault()
      insertSanitizedHtml(htmlText)
      return
    }

    if (rawText.length > 0) {
      event.preventDefault()
      insertPlainText(rawText)
    }
  }

  quill.root.addEventListener('paste', handlePaste, true)
  removePasteListener = () => {
    quill?.root.removeEventListener('paste', handlePaste, true)
  }
}

onMounted(() => {
  if (!editorRef.value) {
    return
  }

  quill = new Quill(editorRef.value, {
    theme: 'snow',
    readOnly: props.disabled,
    placeholder: props.placeholder,
    formats: [
      'background',
      'blockquote',
      'bold',
      'color',
      'divider',
      'header',
      'image',
      'italic',
      'link',
      'list',
      'strike',
      'underline',
      'video'
    ],
    modules: {
      toolbar: {
        container: [
          [{ header: 1 }, { header: 2 }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'link', 'video', 'divider'],
          ['clean']
        ],
        handlers: {
          divider: () => insertDivider(),
          video: () => openVideoDialog()
        }
      }
    }
  })

  bindPasteBehavior()
  syncEditorContent(props.modelValue)

  quill.on('text-change', () => {
    if (syncingFromOutside) {
      return
    }

    emit('update:modelValue', getEditorHtml())
    emitSelectionSnapshot()
  })

  quill.on('selection-change', (range) => {
    if (range) {
      lastKnownRange = {
        index: range.index,
        length: range.length
      }
    }

    emitSelectionSnapshot()
  })

  emitSelectionSnapshot()
})

watch(
  () => props.modelValue,
  (value) => {
    syncEditorContent(value)
  }
)

watch(
  () => props.disabled,
  (value) => {
    quill?.enable(!value)
  }
)

onBeforeUnmount(() => {
  removePasteListener?.()
  removePasteListener = null
  quill = null
  lastKnownRange = null
})

defineExpose<RichTextEditorExpose>({
  replaceSelection,
  insertAtCursor,
  focus
})
</script>

<style scoped>
.rich-text-editor {
  position: relative;
  width: 100%;
  max-width: 100%;
  border: 1px solid var(--community-border);
  border-radius: 24px;
  overflow: visible;
  background: var(--community-surface-soft);
  box-shadow: var(--community-inner-glow);
}

.rich-text-editor :deep(.ql-toolbar.ql-snow),
.rich-text-editor :deep(.ql-container.ql-snow),
.rich-text-editor :deep(.ql-editor),
.editor-root {
  width: 100%;
}

.rich-text-editor :deep(.ql-toolbar.ql-snow) {
  position: sticky;
  top: 0;
  z-index: 12;
  border: 0;
  border-bottom: 1px solid var(--community-divider);
  border-radius: 23px 23px 0 0;
  padding: 12px 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.52), rgba(255, 255, 255, 0.2));
  backdrop-filter: blur(18px);
  box-shadow:
    0 12px 26px rgba(34, 67, 112, 0.1),
    var(--community-inner-glow);
}

.rich-text-editor :deep(.ql-container.ql-snow) {
  border: 0;
  border-radius: 0 0 23px 23px;
  background: transparent;
}

.rich-text-editor :deep(.ql-editor) {
  min-height: var(--editor-min-height);
  padding: 18px 20px 22px;
  font-size: 16px;
  line-height: 1.78;
  color: var(--app-text-color);
}

.rich-text-editor :deep(.ql-editor > :first-child) {
  margin-top: 0;
}

.rich-text-editor :deep(.ql-editor > :last-child) {
  margin-bottom: 0;
}

.rich-text-editor :deep(.ql-editor > p:first-of-type) {
  color: color-mix(in srgb, var(--app-text-color) 96%, transparent);
  font-size: 17px;
  line-height: 1.84;
}

.rich-text-editor :deep(.ql-editor.ql-blank::before) {
  font-style: normal;
  color: var(--el-text-color-placeholder);
}

.rich-text-editor :deep(.ql-editor p) {
  margin: 0;
  color: color-mix(in srgb, var(--app-text-color) 92%, transparent);
}

.rich-text-editor :deep(.ql-editor p + p) {
  margin-top: 16px;
}

.rich-text-editor :deep(.ql-editor a) {
  color: var(--community-blue);
  text-decoration: underline;
}

.rich-text-editor :deep(.ql-editor img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 14px 0;
  border-radius: 18px;
}

.rich-text-editor :deep(.ql-editor hr) {
  margin: 28px 0;
  border: 0;
  border-top: 1px solid var(--community-divider);
}

.rich-text-editor :deep(.ql-editor h1) {
  margin: 28px 0 12px;
  font-size: 24px;
  line-height: 1.35;
}

.rich-text-editor :deep(.ql-editor h2) {
  margin: 30px 0 12px;
  font-size: 22px;
  line-height: 1.4;
  letter-spacing: -0.022em;
}

.rich-text-editor :deep(.ql-editor h3),
.rich-text-editor :deep(.ql-editor h4) {
  margin: 24px 0 10px;
  font-size: 20px;
  line-height: 1.45;
  letter-spacing: -0.018em;
}

.rich-text-editor :deep(.ql-editor ul),
.rich-text-editor :deep(.ql-editor ol) {
  margin: 16px 0 18px;
  padding-left: 1.4em;
}

.rich-text-editor :deep(.ql-editor li) {
  color: color-mix(in srgb, var(--app-text-color) 90%, transparent);
}

.rich-text-editor :deep(.ql-editor li + li) {
  margin-top: 8px;
}

.rich-text-editor :deep(.ql-editor li > p) {
  margin-bottom: 0;
}

.rich-text-editor :deep(.ql-editor ul li::marker),
.rich-text-editor :deep(.ql-editor ol li::marker) {
  color: color-mix(in srgb, var(--community-blue) 58%, var(--app-text-color) 42%);
  font-weight: 700;
}

.rich-text-editor :deep(.ql-editor blockquote) {
  position: relative;
  margin: 22px 0 24px;
  padding: 14px 18px 14px 20px;
  border: 1px solid color-mix(in srgb, var(--community-border) 84%, white 16%);
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(246, 250, 255, 0.92)),
    var(--community-surface-soft);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.56);
  color: color-mix(in srgb, var(--app-text-color) 96%, transparent);
}

.rich-text-editor :deep(.ql-editor blockquote)::before {
  content: '';
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 0;
  width: 3px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--community-blue), transparent);
}

.rich-text-editor :deep(.ql-editor blockquote > :first-child) {
  margin-top: 0;
}

.rich-text-editor :deep(.ql-editor blockquote > :last-child) {
  margin-bottom: 0;
}

.rich-text-editor :deep(.ql-editor blockquote p + p) {
  margin-top: 10px;
}

.rich-text-editor :deep(.ql-editor iframe.ql-video) {
  display: block;
  width: min(100%, 720px);
  aspect-ratio: 16 / 9;
  height: auto;
  margin: 18px auto;
  border: 1px solid var(--community-border);
  border-radius: 22px;
  background:
    radial-gradient(circle at top, rgba(113, 208, 255, 0.18), transparent 34%),
    linear-gradient(180deg, rgba(10, 19, 34, 0.94), rgba(12, 24, 43, 0.9));
  box-shadow: var(--community-card-shadow);
}

.rich-text-editor :deep(.ql-snow .ql-picker) {
  color: inherit;
}

.rich-text-editor :deep(.ql-snow .ql-picker-options) {
  max-height: 240px;
  overflow-y: auto;
}

.rich-text-editor :deep(.rich-text-editor__video-dialog .el-dialog) {
  border: 1px solid var(--community-border);
  border-radius: 28px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(246, 250, 255, 0.96)),
    var(--community-surface-soft);
  box-shadow: var(--community-card-shadow);
}

.rich-text-editor :deep(.rich-text-editor__video-dialog .el-dialog__header) {
  margin: 0;
  padding: 18px 22px 0;
}

.rich-text-editor :deep(.rich-text-editor__video-dialog .el-dialog__body) {
  padding: 18px 22px 10px;
}

.rich-text-editor :deep(.rich-text-editor__video-dialog .el-dialog__footer) {
  padding: 0 22px 20px;
}

.rich-text-editor__video-dialog-header {
  display: grid;
  gap: 6px;
}

.rich-text-editor__video-dialog-header strong {
  color: var(--app-text-color);
  font-size: 18px;
  font-weight: 700;
}

.rich-text-editor__video-dialog-header p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.rich-text-editor__video-dialog-body {
  display: grid;
  gap: 14px;
}

.rich-text-editor__video-dialog-tips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rich-text-editor__video-dialog-tips span {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--community-border) 82%, white 18%);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.74);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 600;
}

.rich-text-editor__video-dialog-preview {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border: 1px dashed color-mix(in srgb, var(--community-border) 78%, white 22%);
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(248, 250, 255, 0.9)),
    var(--community-surface-soft);
}

.rich-text-editor__video-dialog-preview.is-ready {
  border-style: solid;
  border-color: color-mix(in srgb, var(--community-blue) 26%, var(--community-border) 74%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.56);
}

.rich-text-editor__video-dialog-preview strong {
  color: var(--app-text-color);
  font-size: 14px;
  font-weight: 700;
}

.rich-text-editor__video-dialog-preview p,
.rich-text-editor__video-dialog-preview code {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.rich-text-editor__video-dialog-preview code {
  display: block;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(13, 23, 38, 0.06);
  color: var(--community-blue);
  word-break: break-all;
}

.rich-text-editor__video-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
