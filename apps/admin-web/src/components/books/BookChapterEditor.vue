<template>
  <section class="chapter-editor">
    <div class="chapter-header">
      <div>
        <strong>{{ TEXT.title }}</strong>
        <p>{{ TEXT.hint }}</p>
      </div>

      <div class="chapter-header-actions">
        <el-button round @click="handleNormalizeOrder">{{ TEXT.actions.normalize }}</el-button>
        <el-button round @click="handleAddChapter">{{ TEXT.actions.add }}</el-button>
      </div>
    </div>

    <div class="chapter-config-grid">
      <article class="chapter-config-card">
        <header class="card-heading">
          <strong>{{ TEXT.source.title }}</strong>
          <small>{{ currentSourceOption.label }}</small>
        </header>

        <div class="form-grid form-grid-source">
          <el-form-item :label="TEXT.source.presetLabel">
            <el-select v-model="selectedSourcePreset">
              <el-option
                v-for="option in SOURCE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="TEXT.source.originLabel">
            <el-input
              v-model="source.origin"
              maxlength="120"
              :placeholder="TEXT.source.originPlaceholder"
            />
          </el-form-item>
        </div>

        <p class="field-helper">{{ currentSourceOption.description }}</p>

        <div class="form-grid form-grid-source">
          <el-form-item :label="TEXT.source.comicLabel">
            <el-input
              v-model="source.comicId"
              maxlength="120"
              :placeholder="TEXT.source.comicPlaceholder"
            />
          </el-form-item>

          <el-form-item :label="TEXT.source.novelLabel">
            <el-input
              v-model="source.novelId"
              maxlength="120"
              :placeholder="TEXT.source.novelPlaceholder"
            />
          </el-form-item>
        </div>

        <el-form-item :label="TEXT.source.otherLabel">
          <el-input
            v-model="source.otherId"
            maxlength="120"
            :placeholder="TEXT.source.otherPlaceholder"
          />
        </el-form-item>
      </article>

      <article class="chapter-config-card">
        <header class="card-heading">
          <strong>{{ TEXT.generator.title }}</strong>
          <small>{{ TEXT.generator.tag }}</small>
        </header>

        <p class="field-helper">{{ TEXT.generator.hint }}</p>

        <div class="form-grid form-grid-generator">
          <el-form-item :label="TEXT.generator.startOrderLabel">
            <el-input-number v-model="draftOptions.startOrder" :min="1" :step="1" />
          </el-form-item>

          <el-form-item :label="TEXT.generator.countLabel">
            <el-input-number v-model="draftOptions.count" :min="1" :max="200" :step="1" />
          </el-form-item>

          <el-form-item :label="TEXT.generator.sizeLabel">
            <el-input-number v-model="draftOptions.size" :min="0" :step="1" />
          </el-form-item>
        </div>

        <el-form-item :label="TEXT.generator.titleTemplateLabel">
          <el-input
            v-model="draftOptions.titleTemplate"
            maxlength="80"
            :placeholder="currentSourceOption.defaultTitleTemplate"
          />
        </el-form-item>

        <div class="field-helper">{{ TEXT.generator.templateHint }}</div>

        <div class="generator-actions">
          <el-button round @click="handleUseNextOrder">{{ TEXT.actions.useNextOrder }}</el-button>
          <el-button type="primary" round @click="handleGenerateDrafts">
            {{ TEXT.actions.generate }}
          </el-button>
        </div>
      </article>
    </div>

    <div class="chapter-list-header">
      <div>
        <strong>{{ TEXT.list.title }}</strong>
        <p>{{ TEXT.list.hint }}</p>
      </div>
      <small>{{ TEXT.list.maxHeight }}</small>
    </div>

    <div v-if="chapters.length === 0" class="chapter-empty">
      <el-empty :description="TEXT.list.empty" />
    </div>

    <article v-else class="chapter-table-card">
      <el-table
        :data="chapters"
        row-key="uid"
        size="small"
        stripe
        border
        max-height="560"
        table-layout="fixed"
        class="chapter-table"
      >
        <el-table-column :label="TEXT.list.indexLabel" width="72" align="center">
          <template #default="scope">
            <span class="table-index">{{ scope.$index + 1 }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="id" :label="TEXT.list.idLabel" width="180">
          <template #default="scope">
            <el-input-number v-model="scope.row.id" size="small" :min="1" :step="1" />
          </template>
        </el-table-column>

        <el-table-column prop="order" :label="TEXT.list.orderLabel" width="180">
          <template #default="scope">
            <el-input-number v-model="scope.row.order" size="small" :min="1" :step="1" />
          </template>
        </el-table-column>

        <el-table-column prop="size" :label="TEXT.list.sizeLabel" width="180">
          <template #default="scope">
            <el-input-number v-model="scope.row.size" size="small" :min="0" :step="1" />
          </template>
        </el-table-column>

        <el-table-column prop="title" :label="TEXT.list.titleLabel" min-width="260">
          <template #default="scope">
            <el-input
              v-model="scope.row.title"
              size="small"
              maxlength="120"
              :placeholder="TEXT.list.titlePlaceholder"
            />
          </template>
        </el-table-column>

        <el-table-column prop="rule" :label="TEXT.list.ruleLabel" min-width="280">
          <template #default="scope">
            <el-input
              v-model="scope.row.rule"
              size="small"
              maxlength="200"
              :placeholder="TEXT.list.rulePlaceholder"
            />
          </template>
        </el-table-column>

        <el-table-column :label="TEXT.list.actionsLabel" width="92" fixed="right" align="center">
          <template #default="scope">
            <el-button link type="danger" @click="handleRemoveChapter(scope.row.uid)">
              {{ TEXT.actions.remove }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'

import {
  BOOK_CHAPTER_SOURCE_OPTIONS,
  buildGeneratedBookChapters,
  createEmptyChapter,
  getBookChapterSourceOption,
  getNextBookChapterOrder,
  inferBookChapterSourcePreset,
  type BookChapterSourceConfig,
  type BookChapterSourcePreset,
  type EditableBookChapter
} from './book-chapter-editor'

const chapters = defineModel<EditableBookChapter[]>('chapters', {
  required: true
})

const source = defineModel<BookChapterSourceConfig>('source', {
  required: true
})

const SOURCE_OPTIONS = BOOK_CHAPTER_SOURCE_OPTIONS

const TEXT = {
  title: '章节目录',
  hint: '章节改成表格化编辑，保持批量生成能力的同时，把每章占用高度压缩到一行。',
  source: {
    title: '来源配置',
    presetLabel: '来源类型',
    originLabel: '来源标识',
    originPlaceholder: '例如：bilibili-comic 或 custom-source',
    comicLabel: '漫画 ID（可选）',
    comicPlaceholder: '例如：mc123456',
    novelLabel: '小说 ID（可选）',
    novelPlaceholder: '例如：novel_8899',
    otherLabel: '其他 ID（可选）',
    otherPlaceholder: '例如：站点章节簇 ID 或任务单号'
  },
  generator: {
    title: '批量草稿生成',
    tag: '为后续抓取预留',
    hint: '当前先按来源规则批量生成章节草稿，后续如果接后端抓取接口，可直接复用这套来源与模板。',
    startOrderLabel: '起始序号',
    countLabel: '生成数量',
    sizeLabel: '默认大小',
    titleTemplateLabel: '标题模板',
    templateHint: '支持 {n} 和 {sourceId} 占位符；未填写时会按来源类型自动带默认模板。'
  },
  list: {
    title: '章节列表',
    hint: '使用紧凑表格编辑，并限制最大高度，章节多时只滚动表格区。',
    maxHeight: '表格最大高度：560px',
    empty: '还没有章节，可手动新增或先批量生成草稿。',
    indexLabel: '#',
    idLabel: '章节 ID',
    orderLabel: '顺序',
    sizeLabel: '章节大小',
    titleLabel: '章节标题',
    titlePlaceholder: '例如：第 1 话 社区开场',
    ruleLabel: '规则字段',
    rulePlaceholder: '可记录来源规则、抓取标记或后续任务追踪信息',
    actionsLabel: '操作'
  },
  actions: {
    add: '新增章节',
    remove: '删除',
    normalize: '重排顺序',
    useNextOrder: '从下一章开始',
    generate: '生成章节草稿'
  },
  message: {
    presetIdRequired: '当前来源类型建议先补充对应来源 ID，再生成章节草稿。',
    countRequired: '请至少生成 1 个章节草稿。',
    generated: '章节草稿已追加到列表。',
    normalized: '章节顺序已按当前列表重排。'
  }
} as const

const draftOptions = reactive({
  startOrder: 1,
  count: 5,
  size: 0,
  titleTemplate: ''
})

const nextChapterOrder = computed(() => getNextBookChapterOrder(chapters.value))
const currentSourcePreset = computed(() => inferBookChapterSourcePreset(source.value.origin))
const currentSourceOption = computed(() => getBookChapterSourceOption(currentSourcePreset.value))

const selectedSourcePreset = computed<BookChapterSourcePreset>({
  get: () => currentSourcePreset.value,
  set: (nextPreset) => {
    const previousTemplate = draftOptions.titleTemplate.trim()
    const previousDefaultTemplate = currentSourceOption.value.defaultTitleTemplate
    const nextOption = getBookChapterSourceOption(nextPreset)

    if (nextPreset === 'manual') {
      source.value.origin = ''
    } else if (nextPreset === 'custom') {
      if (!source.value.origin.trim()) {
        source.value.origin = nextOption.defaultOrigin
      }
    } else {
      source.value.origin = nextOption.defaultOrigin
    }

    if (!previousTemplate || previousTemplate === previousDefaultTemplate) {
      draftOptions.titleTemplate = nextOption.defaultTitleTemplate
    }
  }
})

function handleUseNextOrder(): void {
  draftOptions.startOrder = nextChapterOrder.value
}

function handleAddChapter(): void {
  chapters.value.push(createEmptyChapter(nextChapterOrder.value))
  draftOptions.startOrder = getNextBookChapterOrder(chapters.value)
}

function handleRemoveChapter(uid: string): void {
  chapters.value = chapters.value.filter((chapter) => chapter.uid !== uid)
  draftOptions.startOrder = getNextBookChapterOrder(chapters.value)
}

function handleNormalizeOrder(): void {
  chapters.value = [...chapters.value]
    .sort((current, next) => current.order - next.order || current.id - next.id)
    .map((chapter, index) => ({
      ...chapter,
      order: index + 1
    }))

  draftOptions.startOrder = getNextBookChapterOrder(chapters.value)
  ElMessage.success(TEXT.message.normalized)
}

function handleGenerateDrafts(): void {
  if (draftOptions.count < 1) {
    ElMessage.warning(TEXT.message.countRequired)
    return
  }

  if (
    currentSourceOption.value.preferredIdField &&
    !source.value[currentSourceOption.value.preferredIdField]
  ) {
    ElMessage.warning(TEXT.message.presetIdRequired)
    return
  }

  const generatedChapters = buildGeneratedBookChapters(source.value, {
    count: draftOptions.count,
    startOrder: draftOptions.startOrder || nextChapterOrder.value,
    size: draftOptions.size,
    titleTemplate: draftOptions.titleTemplate
  })

  chapters.value = [...chapters.value, ...generatedChapters]
  draftOptions.startOrder = getNextBookChapterOrder(chapters.value)
  ElMessage.success(TEXT.message.generated)
}

handleUseNextOrder()
if (!draftOptions.titleTemplate) {
  draftOptions.titleTemplate = currentSourceOption.value.defaultTitleTemplate
}
</script>

<style scoped>
.chapter-editor {
  display: grid;
  gap: 16px;
}

.chapter-header,
.chapter-config-card,
.chapter-empty,
.chapter-table-card {
  border: 1px solid var(--community-border);
  border-radius: 28px;
  background: var(--community-surface-soft);
  box-shadow: var(--community-shadow-soft);
}

.chapter-header,
.chapter-config-card,
.chapter-empty {
  padding: 20px 22px;
}

.chapter-table-card {
  overflow: hidden;
}

.chapter-header,
.chapter-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.chapter-header p,
.chapter-list-header p,
.field-helper,
.card-heading small {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
}

.chapter-header-actions,
.generator-actions {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
}

.chapter-config-grid,
.form-grid {
  display: grid;
  gap: 16px;
}

.chapter-config-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.chapter-config-card {
  align-content: start;
}

.card-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.card-heading strong,
.chapter-header strong,
.chapter-list-header strong {
  font-size: 16px;
  line-height: 1.5;
}

.form-grid-source,
.form-grid-generator {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid-generator {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.generator-actions {
  margin-top: 12px;
}

.chapter-list-header small {
  color: var(--el-text-color-secondary);
}

.chapter-table {
  --el-table-border-color: var(--community-border);
  --el-table-header-bg-color: rgba(255, 255, 255, 0.84);
  --el-table-tr-bg-color: rgba(255, 255, 255, 0.42);
  --el-table-row-hover-bg-color: rgba(217, 238, 255, 0.56);
  --el-fill-color-lighter: rgba(255, 255, 255, 0.7);
  --el-table-bg-color: rgba(255, 255, 255, 0.32);
  --el-table-fixed-box-shadow: none;
}

.chapter-table :deep(.el-table__cell) {
  padding: 8px 0;
  vertical-align: middle;
}

.chapter-table :deep(.cell) {
  padding-inline: 10px;
}

.chapter-table :deep(.el-input__wrapper),
.chapter-table :deep(.el-input-number),
.chapter-table :deep(.el-input-number .el-input__wrapper) {
  width: 100%;
}

.chapter-table :deep(.el-input__wrapper),
.chapter-table :deep(.el-input-number .el-input__wrapper) {
  min-height: 34px;
  border-radius: 12px;
}

.table-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--community-violet);
  background: rgba(var(--community-violet-rgb), 0.08);
}

.chapter-empty :deep(.el-empty) {
  padding-block: 26px 10px;
}
</style>
