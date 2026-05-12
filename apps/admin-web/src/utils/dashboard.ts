import type { BusinessStatsByType, BusinessStatsDailyItem } from '@/api/dashboard'

export type BusinessSeriesKey = 'articles' | 'books' | 'images' | 'topics'

export interface MonthDescriptor {
  key: string
  label: string
}

export interface MonthlyBusinessPoint extends Record<BusinessSeriesKey, number> {
  key: string
  label: string
}

const DASHBOARD_SERIES_KEYS: BusinessSeriesKey[] = ['articles', 'books', 'images', 'topics']

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function formatMonthKey(year: number, monthIndex: number): string {
  return `${year}-${pad(monthIndex + 1)}`
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function createEmptyBusinessBucket(): Record<BusinessSeriesKey, number> {
  return {
    articles: 0,
    books: 0,
    images: 0,
    topics: 0
  }
}

export function createEmptyBusinessStats(): BusinessStatsByType {
  return {
    articles: 0,
    books: 0,
    images: 0,
    topics: 0
  }
}

export function createRecentMonthTimeline(
  monthCount = 6,
  anchorDate = new Date()
): MonthDescriptor[] {
  return Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(
      anchorDate.getFullYear(),
      anchorDate.getMonth() - (monthCount - index - 1),
      1
    )
    const key = formatMonthKey(date.getFullYear(), date.getMonth())

    return {
      key,
      label: `${date.getFullYear()}/${pad(date.getMonth() + 1)}`
    }
  })
}

export function createRecentMonthRange(
  monthCount = 6,
  anchorDate = new Date()
): {
  startDate: string
  endDate: string
} {
  const firstMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - (monthCount - 1), 1)
  return {
    startDate: formatDate(firstMonth),
    endDate: formatDate(anchorDate)
  }
}

export function aggregateMonthlyBusinessStats(
  items: BusinessStatsDailyItem[],
  monthCount = 6,
  anchorDate = new Date()
): MonthlyBusinessPoint[] {
  const timeline = createRecentMonthTimeline(monthCount, anchorDate)
  const buckets = new Map<string, Record<BusinessSeriesKey, number>>()

  timeline.forEach((item) => {
    buckets.set(item.key, createEmptyBusinessBucket())
  })

  // 后端目前提供的是按日统计，首页趋势图在前端收口为按月聚合。
  items.forEach((item) => {
    const monthKey = item.date.slice(0, 7)
    const bucket = buckets.get(monthKey)
    if (!bucket) {
      return
    }

    DASHBOARD_SERIES_KEYS.forEach((key) => {
      bucket[key] += Number(item[key] ?? 0)
    })
  })

  return timeline.map((item) => ({
    key: item.key,
    label: item.label,
    ...buckets.get(item.key)!
  }))
}
