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
          <strong>近 6 个月业务录入走势</strong>
          <p>后端提供按日统计，这里按月聚合情报、书库、图包和游戏四类业务数量。</p>
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

      <monthly-business-trend-chart :loading="loading" :points="monthlyPoints" />
    </el-card>

    <el-card shadow="never" class="overview-note-card">
      <div class="overview-note">
        <strong>统计口径</strong>
        <p>
          累计概览来自 `/users/me/business-stats`，趋势图来自
          `/users/me/business-stats/daily`，并按月汇总最近 6 个月的核心业务数据。
        </p>
      </div>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { dashboardApi, type BusinessStatsSummary } from '@/api/dashboard'
import BusinessTypeIcon from '@/components/BusinessTypeIcon.vue'
import MonthlyBusinessTrendChart from '@/components/MonthlyBusinessTrendChart.vue'
import {
  aggregateMonthlyBusinessStats,
  createEmptyBusinessStats,
  createRecentMonthRange,
  type BusinessSeriesKey
} from '@/utils/dashboard'

interface OverviewStatMeta {
  key: BusinessSeriesKey
  label: string
  description: string
  icon: 'articles' | 'books' | 'images' | 'topics'
}

interface SummaryMetric {
  key: 'total' | 'period'
  label: string
  icon: 'manage' | 'overview'
  valueText: string
}

const MONTH_COUNT = 6
const numberFormatter = new Intl.NumberFormat('zh-CN')
const loading = ref(true)
const loadError = ref('')
const overviewSummary = ref<BusinessStatsSummary>({
  userId: '',
  byType: createEmptyBusinessStats(),
  total: 0
})
const monthlyPoints = ref(aggregateMonthlyBusinessStats([], MONTH_COUNT))

const statMeta: OverviewStatMeta[] = [
  {
    key: 'articles',
    label: '情报总数',
    description: '当前账号累计录入的情报数量。',
    icon: 'articles'
  },
  {
    key: 'books',
    label: '书库总数',
    description: '书库内容的累计录入量。',
    icon: 'books'
  },
  {
    key: 'images',
    label: '图包总数',
    description: '图包与图集类内容的累计发布数量。',
    icon: 'images'
  },
  {
    key: 'topics',
    label: '游戏总数',
    description: '游戏内容与运营页面的累计数量。',
    icon: 'topics'
  }
]

const statCards = computed(() =>
  statMeta.map((item) => ({
    ...item,
    valueText: numberFormatter.format(overviewSummary.value.byType[item.key] ?? 0)
  }))
)

const summaryMetrics = computed<SummaryMetric[]>(() => [
  {
    key: 'total',
    label: '累计内容',
    icon: 'manage',
    valueText: numberFormatter.format(overviewSummary.value.total ?? 0)
  },
  {
    key: 'period',
    label: '趋势周期',
    icon: 'overview',
    valueText: `近 ${MONTH_COUNT} 个月`
  }
])

async function loadOverviewData(): Promise<void> {
  loading.value = true
  loadError.value = ''

  try {
    const range = createRecentMonthRange(MONTH_COUNT)
    const [summary, dailyStats] = await Promise.all([
      dashboardApi.getMyBusinessStats(),
      dashboardApi.getMyBusinessStatsDaily(range)
    ])

    overviewSummary.value = summary
    monthlyPoints.value = aggregateMonthlyBusinessStats(dailyStats.items, MONTH_COUNT)
  } catch (error) {
    console.error('Failed to load overview stats:', error)
    loadError.value = '首页统计加载失败，请刷新后重试。'
    overviewSummary.value = {
      userId: '',
      byType: createEmptyBusinessStats(),
      total: 0
    }
    monthlyPoints.value = aggregateMonthlyBusinessStats([], MONTH_COUNT)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadOverviewData()
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

.overview-note {
  display: grid;
  gap: 8px;
}
</style>
