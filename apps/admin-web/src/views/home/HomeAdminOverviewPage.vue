<template>
  <section class="overview-page">
    <div v-if="loadError" class="overview-alert-wrap">
      <el-alert :closable="false" :title="loadError" type="warning" show-icon />
    </div>

    <div class="overview-grid">
      <el-card v-for="card in statCards" :key="card.key" shadow="never" class="overview-stat-card">
        <div class="overview-card-top">
          <span
            class="overview-card-icon"
            :class="`overview-card-icon-${card.key}`"
            aria-hidden="true"
          >
            <business-type-icon :name="card.icon" />
          </span>

          <div class="overview-card-copy">
            <span>{{ card.label }}</span>
            <small>{{ card.description }}</small>
          </div>
        </div>

        <strong>{{ card.valueText }}</strong>
      </el-card>
    </div>

    <el-card shadow="never" class="overview-chart-card">
      <div class="overview-section-head">
        <div class="overview-section-copy">
          <strong>全站业务状态分布</strong>
          <p>基于 `/admin/content/summary` 汇总公开、私有、待审、驳回和推荐中的业务数量。</p>
        </div>

        <div class="overview-meta-list">
          <div v-for="item in summaryMetrics" :key="item.key" class="overview-meta-chip">
            <span class="overview-meta-icon" aria-hidden="true">
              <business-type-icon :name="item.icon" />
            </span>
            <span>{{ item.label }}</span>
            <strong>{{ item.valueText }}</strong>
          </div>
        </div>
      </div>

      <div v-loading="loading" class="status-chart-shell">
        <div ref="chartRef" class="status-chart" />
      </div>
    </el-card>

    <el-card shadow="never" class="overview-note-card">
      <div class="overview-note">
        <strong>统计口径</strong>
        <p>
          管理概览来自 `/admin/content/summary`。情报统计额外包含“已删除”数量，其余业务聚焦公开、
          私有、待审、驳回和推荐中的内容分布。
        </p>
      </div>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useThemeStore } from '@frontend/store'
import { BarChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { init, use, type EChartsType } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

import { contentApi, type AdminContentSummaryCounts } from '@/api/content'
import BusinessTypeIcon from '@/components/BusinessTypeIcon.vue'

use([BarChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

type SummaryKey = 'article' | 'book' | 'topic' | 'image'

interface AdminStatMeta {
  key: SummaryKey
  label: string
  description: string
  icon: 'articles' | 'books' | 'topics' | 'images'
}

interface SummaryMetric {
  key: 'featured' | 'public' | 'deleted'
  label: string
  icon: 'manage' | 'overview' | 'articles'
  valueText: string
}

const numberFormatter = new Intl.NumberFormat('zh-CN')
const themeStore = useThemeStore()
const chartRef = ref<HTMLDivElement | null>(null)
const loading = ref(true)
const loadError = ref('')
const summaryCounts = ref<AdminContentSummaryCounts>({
  article: {
    total: 0,
    deleted: 0,
    public: 0,
    private: 0,
    pending: 0,
    rejected: 0,
    featured: 0
  },
  book: {
    total: 0,
    public: 0,
    private: 0,
    pending: 0,
    rejected: 0,
    featured: 0
  },
  topic: {
    total: 0,
    public: 0,
    private: 0,
    pending: 0,
    rejected: 0,
    featured: 0
  },
  image: {
    total: 0,
    public: 0,
    private: 0,
    pending: 0,
    rejected: 0,
    featured: 0
  }
})

const statMeta: AdminStatMeta[] = [
  {
    key: 'article',
    label: '情报总量',
    description: '当前全站未删除情报总数。',
    icon: 'articles'
  },
  {
    key: 'book',
    label: '书库总量',
    description: '当前全站书库内容总数。',
    icon: 'books'
  },
  {
    key: 'topic',
    label: '游戏总量',
    description: '当前全站游戏内容总数。',
    icon: 'topics'
  },
  {
    key: 'image',
    label: '图包总量',
    description: '当前全站图包与图集内容总数。',
    icon: 'images'
  }
]

const summarySeriesMeta = [
  { key: 'public', label: '公开', color: '#59befe' },
  { key: 'private', label: '私有', color: '#5fd3c2' },
  { key: 'pending', label: '待审', color: '#f6be62' },
  { key: 'rejected', label: '驳回', color: '#ef7d7d' },
  { key: 'featured', label: '推荐中', color: '#909eff' }
] as const

const chartCategories = statMeta.map((item) => item.label.replace('总量', ''))
let chart: EChartsType | null = null
let resizeObserver: ResizeObserver | null = null

const statCards = computed(() =>
  statMeta.map((item) => ({
    ...item,
    valueText: numberFormatter.format(summaryCounts.value[item.key].total ?? 0)
  }))
)

const summaryMetrics = computed<SummaryMetric[]>(() => [
  {
    key: 'featured',
    label: '推荐中内容',
    icon: 'manage',
    valueText: numberFormatter.format(
      summaryCounts.value.article.featured +
        summaryCounts.value.book.featured +
        summaryCounts.value.topic.featured +
        summaryCounts.value.image.featured
    )
  },
  {
    key: 'public',
    label: '公开内容',
    icon: 'overview',
    valueText: numberFormatter.format(
      summaryCounts.value.article.public +
        summaryCounts.value.book.public +
        summaryCounts.value.topic.public +
        summaryCounts.value.image.public
    )
  },
  {
    key: 'deleted',
    label: '已删除情报',
    icon: 'articles',
    valueText: numberFormatter.format(summaryCounts.value.article.deleted ?? 0)
  }
])

function buildChartOption() {
  const isDark = themeStore.mode === 'dark'
  const axisColor = isDark ? 'rgba(221, 234, 247, 0.78)' : '#5a7390'
  const gridLineColor = isDark ? 'rgba(120, 150, 188, 0.16)' : 'rgba(106, 145, 189, 0.12)'
  const tooltipBackground = isDark ? 'rgba(10, 19, 32, 0.96)' : 'rgba(255, 255, 255, 0.96)'
  const tooltipTextColor = isDark ? '#eef6ff' : '#18314f'

  return {
    color: summarySeriesMeta.map((item) => item.color),
    animationDuration: 420,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: tooltipBackground,
      borderColor: isDark ? 'rgba(102, 154, 216, 0.24)' : 'rgba(106, 145, 189, 0.18)',
      borderWidth: 1,
      textStyle: {
        color: tooltipTextColor,
        fontSize: 13
      },
      extraCssText: 'box-shadow: 0 18px 36px rgba(16, 33, 55, 0.18); border-radius: 16px;'
    },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 10,
      itemHeight: 10,
      icon: 'circle',
      textStyle: {
        color: axisColor,
        fontSize: 13,
        fontWeight: 600
      }
    },
    grid: {
      top: 48,
      left: 18,
      right: 24,
      bottom: 8,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartCategories,
      axisTick: {
        show: false
      },
      axisLine: {
        lineStyle: {
          color: 'transparent'
        }
      },
      axisLabel: {
        color: axisColor,
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: {
        lineStyle: {
          color: gridLineColor
        }
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: axisColor,
        fontSize: 12
      }
    },
    series: summarySeriesMeta.map((item) => ({
      name: item.label,
      type: 'bar',
      barMaxWidth: 18,
      itemStyle: {
        color: item.color,
        borderRadius: [10, 10, 0, 0]
      },
      data: statMeta.map((meta) => summaryCounts.value[meta.key][item.key] ?? 0)
    }))
  }
}

function syncChart(): void {
  if (!chartRef.value) {
    return
  }

  if (!chart) {
    chart = init(chartRef.value)
  }

  chart.setOption(buildChartOption(), true)
  chart.resize()
}

function handleResize(): void {
  chart?.resize()
}

async function loadOverviewData(): Promise<void> {
  loading.value = true
  loadError.value = ''

  try {
    const result = await contentApi.getAdminContentSummary()
    summaryCounts.value = result.counts
  } catch (error) {
    console.error('Failed to load admin overview summary:', error)
    loadError.value = '管理概览加载失败，请刷新后重试。'
  } finally {
    loading.value = false
    syncChart()
  }
}

onMounted(() => {
  void loadOverviewData()

  if (typeof ResizeObserver !== 'undefined' && chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserver.observe(chartRef.value)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
  }
})

watch(
  [summaryCounts, () => themeStore.mode],
  () => {
    syncChart()
  },
  {
    deep: true
  }
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null

  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }

  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.overview-page {
  display: grid;
  gap: 18px;
}

.overview-alert-wrap {
  display: grid;
}

.overview-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.overview-stat-card,
.overview-chart-card,
.overview-note-card {
  border: 1px solid var(--community-border);
  border-radius: 30px;
  background: var(--community-surface);
  box-shadow: var(--community-shadow), var(--community-inner-glow);
}

.overview-stat-card :deep(.el-card__body),
.overview-chart-card :deep(.el-card__body),
.overview-note-card :deep(.el-card__body) {
  display: grid;
  gap: 18px;
}

.overview-stat-card :deep(.el-card__body) {
  gap: 16px;
}

.overview-card-top {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.overview-card-icon,
.overview-meta-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  box-shadow: var(--community-inner-glow);
}

.overview-card-icon {
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  font-size: 22px;
  background: rgba(95, 208, 255, 0.14);
  color: #337db8;
}

.overview-card-icon-books {
  color: #3b8a8e;
  background: rgba(95, 211, 194, 0.16);
}

.overview-card-icon-images {
  color: #d5679d;
  background: rgba(243, 157, 192, 0.16);
}

.overview-card-icon-topics {
  color: #6876df;
  background: rgba(144, 158, 255, 0.16);
}

.overview-card-copy {
  display: grid;
  gap: 6px;
}

.overview-card-copy span,
.overview-card-copy small,
.overview-section-copy p,
.overview-note p {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.overview-card-copy span {
  font-weight: 700;
  color: var(--app-text-color, var(--community-text-strong));
}

.overview-card-copy small,
.overview-section-copy p,
.overview-note p {
  line-height: 1.7;
}

.overview-stat-card strong {
  font-size: 28px;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.overview-section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  flex-wrap: wrap;
}

.overview-section-copy {
  display: grid;
  gap: 8px;
  max-width: 620px;
}

.overview-section-copy strong,
.overview-note strong {
  font-size: 24px;
  line-height: 1.2;
}

.overview-section-copy p,
.overview-note p {
  margin: 0;
}

.overview-meta-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.overview-meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 10px 14px;
  border: 1px solid var(--community-border);
  border-radius: 18px;
  background: var(--community-surface-soft);
  box-shadow: var(--community-inner-glow);
}

.overview-meta-chip span {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.overview-meta-chip strong {
  font-size: 18px;
  line-height: 1;
}

.overview-meta-icon {
  width: 34px;
  height: 34px;
  font-size: 16px;
  background: rgba(95, 208, 255, 0.12);
  color: #3277b0;
}

.overview-meta-chip:nth-child(2) .overview-meta-icon {
  color: #7467cc;
  background: rgba(144, 158, 255, 0.14);
}

.overview-meta-chip:nth-child(3) .overview-meta-icon {
  color: #df7f63;
  background: rgba(255, 186, 143, 0.16);
}

.overview-note {
  display: grid;
  gap: 8px;
}

.status-chart-shell {
  min-height: 360px;
}

.status-chart {
  width: 100%;
  height: 360px;
}
</style>
