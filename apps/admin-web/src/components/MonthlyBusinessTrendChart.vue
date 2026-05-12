<template>
  <div v-loading="loading" class="trend-chart-shell">
    <div ref="chartRef" class="trend-chart" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useThemeStore } from '@frontend/store'
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { init, use, graphic, type EChartsType } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

import type { MonthlyBusinessPoint } from '@/utils/dashboard'

use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

const props = defineProps<{
  loading?: boolean
  points: MonthlyBusinessPoint[]
}>()

const themeStore = useThemeStore()
const chartRef = ref<HTMLDivElement | null>(null)
let chart: EChartsType | null = null
let resizeObserver: ResizeObserver | null = null

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '')
  const base =
    normalized.length === 3
      ? normalized
          .split('')
          .map((item) => `${item}${item}`)
          .join('')
      : normalized

  const red = Number.parseInt(base.slice(0, 2), 16)
  const green = Number.parseInt(base.slice(2, 4), 16)
  const blue = Number.parseInt(base.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

const seriesMeta = [
  {
    key: 'articles',
    label: '情报',
    color: '#59befe'
  },
  {
    key: 'books',
    label: '书库',
    color: '#5fd3c2'
  },
  {
    key: 'images',
    label: '图包',
    color: '#f39dc0'
  },
  {
    key: 'topics',
    label: '游戏',
    color: '#909eff'
  }
] as const

function buildOption() {
  const isDark = themeStore.mode === 'dark'
  const axisColor = isDark ? 'rgba(221, 234, 247, 0.78)' : '#5a7390'
  const gridLineColor = isDark ? 'rgba(120, 150, 188, 0.16)' : 'rgba(106, 145, 189, 0.12)'
  const tooltipBackground = isDark ? 'rgba(10, 19, 32, 0.96)' : 'rgba(255, 255, 255, 0.96)'
  const tooltipTextColor = isDark ? '#eef6ff' : '#18314f'

  return {
    color: seriesMeta.map((item) => item.color),
    animationDuration: 420,
    tooltip: {
      trigger: 'axis',
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
      top: 40,
      left: 16,
      right: 24,
      bottom: 8,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.points.map((item) => item.label),
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
    series: seriesMeta.map((item) => ({
      name: item.label,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      showSymbol: false,
      data: props.points.map((point) => point[item.key]),
      lineStyle: {
        width: 3,
        cap: 'round'
      },
      itemStyle: {
        color: item.color,
        borderWidth: 3,
        borderColor: isDark ? '#0d1828' : '#ffffff'
      },
      areaStyle: {
        color: new graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: hexToRgba(item.color, 0.22)
          },
          {
            offset: 1,
            color: hexToRgba(item.color, 0.02)
          }
        ])
      }
    }))
  }
}

function syncChart() {
  if (!chartRef.value) {
    return
  }

  if (!chart) {
    chart = init(chartRef.value)
  }

  chart.setOption(buildOption(), true)
  chart.resize()
}

function handleResize() {
  chart?.resize()
}

onMounted(() => {
  syncChart()

  // 图表宽度跟随卡片容器变化，避免首页布局切换后出现裁切。
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
  [() => props.points, () => themeStore.mode],
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
.trend-chart-shell {
  min-height: 340px;
}

.trend-chart {
  width: 100%;
  height: 340px;
}
</style>
