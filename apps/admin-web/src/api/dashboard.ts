import { getHttpClient } from './index'

export interface BusinessStatsByType {
  articles: number
  books: number
  images: number
  topics: number
}

export interface BusinessStatsTrendByType {
  articles: number
  books: number
  images: number
  topics: number
}

export interface BusinessStatsSummary {
  userId: string
  byType: BusinessStatsByType
  total: number
}

export interface BusinessStatsDailyRange {
  startDate: string
  endDate: string
  days: number
  timezone: string
}

export interface BusinessStatsDailyItem extends BusinessStatsTrendByType {
  date: string
  total: number
}

export interface BusinessStatsDailyResult {
  userId: string
  range: BusinessStatsDailyRange
  byType: BusinessStatsTrendByType
  total: number
  items: BusinessStatsDailyItem[]
}

export interface BusinessStatsDailyQuery {
  days?: number
  startDate?: string
  endDate?: string
}

export const dashboardApi = {
  async getMyBusinessStats(): Promise<BusinessStatsSummary> {
    return getHttpClient().get('/users/me/business-stats')
  },

  async getMyBusinessStatsDaily(
    query: BusinessStatsDailyQuery = {}
  ): Promise<BusinessStatsDailyResult> {
    return getHttpClient().get('/users/me/business-stats/daily', {
      params: query
    })
  }
}
