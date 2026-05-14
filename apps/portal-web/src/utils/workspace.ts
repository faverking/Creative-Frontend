import type { RouteLocationRaw } from 'vue-router'

import type { PublicMediaAsset } from '@/api/public-detail'
import type {
  WorkspaceContentMeta,
  WorkspaceFavoritesQuery,
  WorkspaceNotificationActionResponse,
  WorkspaceNotificationsQuery,
  WorkspaceTargetType,
  WorkspaceUserIdentity,
  WorkspaceHistoryQuery
} from '@/api/workspace'
import {
  PORTAL_WORKSPACE_DEFAULT_SECTION,
  PORTAL_WORKSPACE_ROOT_PATH,
  PORTAL_WORKSPACE_ROUTE_PATHS,
  WORKSPACE_DEFAULT_PAGE,
  WORKSPACE_PAGE_SIZE,
  type PortalWorkspaceSection,
  type WorkspaceContentFilterKey,
  type WorkspaceMessageFilterKey
} from '@/constants/workspace'
import { HOME_CONTENT_LABELS, type PortalBusinessType } from '@/constants/portal-business'
import { resolveAssetUrl } from '@/utils/assets'
import {
  formatCompactCount,
  formatPublishTimeLabel,
  resolvePortalContentDetailLocation
} from '@/utils/content'

export interface WorkspaceHistoryGroup<T> {
  countLabel: string
  items: T[]
  key: string
  label: string
}

export interface WorkspaceMetricEntry {
  iconName: 'favorite' | 'message' | 'view'
  label: string
  value: string
}

const workspaceDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

const workspaceDateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
})

const workspaceTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeErrorStatus(status: number): 401 | 403 | 404 | 500 {
  if (status === 401 || status === 403 || status === 404) {
    return status
  }

  return 500
}

function readNumber(meta: WorkspaceContentMeta, key: string): number | null {
  const value = meta[key]
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

function readString(meta: WorkspaceContentMeta, key: string): string {
  const value = meta[key]
  return typeof value === 'string' ? value.trim() : ''
}

function readStringArray(meta: WorkspaceContentMeta, key: string): string[] {
  const value = meta[key]
  return Array.isArray(value)
    ? value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
    : []
}

export function resolveWorkspaceMetricEntries(meta: WorkspaceContentMeta): WorkspaceMetricEntry[] {
  return [
    {
      iconName: 'view',
      label: `浏览 ${formatCompactCount(readNumber(meta, 'viewCount') ?? 0)}`,
      value: formatCompactCount(readNumber(meta, 'viewCount') ?? 0)
    },
    {
      iconName: 'favorite',
      label: `收藏 ${formatCompactCount(readNumber(meta, 'favorCount') ?? 0)}`,
      value: formatCompactCount(readNumber(meta, 'favorCount') ?? 0)
    },
    {
      iconName: 'message',
      label: `评论 ${formatCompactCount(readNumber(meta, 'replyCount') ?? 0)}`,
      value: formatCompactCount(readNumber(meta, 'replyCount') ?? 0)
    }
  ]
}

export function formatWorkspaceDateLabel(value?: string, withTime = false): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return (withTime ? workspaceDateTimeFormatter : workspaceDateFormatter)
    .format(date)
    .replaceAll('/', '-')
}

export function resolveWorkspaceRequestErrorCode(error: unknown): 401 | 403 | 404 | 500 {
  if (!isRecord(error)) {
    return 500
  }

  const response = error.response
  if (!isRecord(response) || typeof response.status !== 'number') {
    return 500
  }

  return normalizeErrorStatus(response.status)
}

export function createWorkspaceNotificationsQuery(
  filter: WorkspaceMessageFilterKey,
  page = WORKSPACE_DEFAULT_PAGE,
  limit = WORKSPACE_PAGE_SIZE
): WorkspaceNotificationsQuery {
  const query: WorkspaceNotificationsQuery = {
    page,
    limit
  }

  if (filter === 'comment' || filter === 'reply') {
    query.kind = filter
  }

  if (filter === 'unread') {
    query.unread = true
  }

  return query
}

export function createWorkspaceContentQuery(
  filter: WorkspaceContentFilterKey,
  page = WORKSPACE_DEFAULT_PAGE,
  limit = WORKSPACE_PAGE_SIZE
): WorkspaceFavoritesQuery & WorkspaceHistoryQuery {
  return {
    page,
    limit,
    ...(filter === 'all' ? {} : { targetType: filter })
  }
}

export function buildWorkspacePath(section?: PortalWorkspaceSection): string {
  const targetSection = section ?? PORTAL_WORKSPACE_DEFAULT_SECTION
  return `${PORTAL_WORKSPACE_ROOT_PATH}/${PORTAL_WORKSPACE_ROUTE_PATHS[targetSection]}`
}

export function resolveWorkspaceAvatarUrl(path?: string): string {
  const normalizedPath = path?.trim() || ''
  return normalizedPath ? resolveAssetUrl(normalizedPath) : ''
}

export function resolveWorkspaceMediaUrl(asset?: PublicMediaAsset | null): string {
  const path = asset?.previewPath || asset?.downloadPath || ''
  return path ? resolveAssetUrl(path) : ''
}

export function resolveWorkspaceBusinessKey(targetType: WorkspaceTargetType): PortalBusinessType {
  if (targetType === 'image') {
    return 'gallery'
  }

  return targetType
}

export function resolveWorkspaceTargetLabel(targetType: WorkspaceTargetType): string {
  return HOME_CONTENT_LABELS[targetType]
}

export function resolveWorkspaceDetailLocation(
  targetType: WorkspaceTargetType,
  targetId: string
): RouteLocationRaw {
  return resolvePortalContentDetailLocation(targetType, targetId)
}

export function resolveWorkspaceActionLocation(
  action?: WorkspaceNotificationActionResponse | null
): RouteLocationRaw | null {
  if (action?.type !== 'view-target' || !action.targetType || !action.targetId) {
    return null
  }

  return resolveWorkspaceDetailLocation(action.targetType, action.targetId)
}

export function resolveWorkspacePrimaryActionLabel(targetType: WorkspaceTargetType): string {
  if (targetType === 'topic') {
    return '查看游戏'
  }

  if (targetType === 'image') {
    return '查看图包'
  }

  if (targetType === 'book') {
    return '查看书库'
  }

  return '查看详情'
}

export function resolveWorkspaceNotificationAction(
  kind: 'comment' | 'reply',
  targetType: WorkspaceTargetType
): string {
  if (kind === 'reply') {
    return `回复了你在${resolveWorkspaceTargetLabel(targetType)}下的讨论`
  }

  return `评论了你的${resolveWorkspaceTargetLabel(targetType)}`
}

export function resolveWorkspaceNotificationExcerptLabel(kind: 'comment' | 'reply'): string {
  return kind === 'reply' ? '对方回复' : '评论内容'
}

export function resolveWorkspaceNotificationTimeLabel(createdAt: string): string {
  const relative = formatPublishTimeLabel(createdAt)
  return relative || formatWorkspaceDateLabel(createdAt, true)
}

export function resolveWorkspaceMetaItems(
  targetType: WorkspaceTargetType,
  meta: WorkspaceContentMeta,
  author?: WorkspaceUserIdentity,
  sourceLabel?: string
): string[] {
  const fragments: string[] = []

  if (targetType === 'book') {
    const authorNames = readStringArray(meta, 'authorNames')
    if (authorNames.length > 0) {
      fragments.push(authorNames.join(' / '))
    }

    const total = readNumber(meta, 'total')
    if (total !== null) {
      fragments.push(`共 ${total} 章`)
    }
  } else {
    if (author?.name) {
      fragments.push(author.name)
    }

    if (targetType === 'topic') {
      const featureFlagLabels = readStringArray(meta, 'featureFlagLabels').slice(0, 2)
      if (featureFlagLabels.length > 0) {
        fragments.push(...featureFlagLabels)
      }
    }

    if (targetType === 'image') {
      const packageMeta = readString(meta, 'packageMeta')
      if (packageMeta) {
        fragments.push(packageMeta)
      }
    }
  }

  if (sourceLabel) {
    fragments.push(sourceLabel)
  }

  const publishTime =
    targetType === 'book'
      ? formatPublishTimeLabel(readString(meta, 'releaseTime'))
      : formatPublishTimeLabel(readString(meta, 'publishTime'))

  if (publishTime) {
    fragments.push(publishTime)
  }

  return fragments.filter(Boolean)
}

export function resolveWorkspaceSavedAtLabel(savedAt: string): string {
  const formatted = formatWorkspaceDateLabel(savedAt)
  return formatted ? `收藏于 ${formatted}` : '收藏记录'
}

export function resolveWorkspaceVisitedTimeLabel(visitedAt: string): string {
  if (!visitedAt) {
    return ''
  }

  const date = new Date(visitedAt)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return workspaceTimeFormatter.format(date)
}

function resolveWorkspaceHistoryGroupLabel(date: Date): string {
  const now = new Date()
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
  const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

  if (todayKey === dateKey) {
    return '今天'
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`

  if (yesterdayKey === dateKey) {
    return '昨天'
  }

  const currentYear = now.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return date.getFullYear() === currentYear
    ? `${month} 月 ${day} 日`
    : `${date.getFullYear()}-${month}-${day}`
}

export function groupWorkspaceHistoryItems<T extends { visitedAt: string }>(
  items: T[]
): WorkspaceHistoryGroup<T>[] {
  const groups = new Map<string, WorkspaceHistoryGroup<T>>()

  for (const item of items) {
    const date = new Date(item.visitedAt)
    const key = Number.isNaN(date.getTime())
      ? 'unknown'
      : `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    const label = Number.isNaN(date.getTime())
      ? '更早之前'
      : resolveWorkspaceHistoryGroupLabel(date)
    const current = groups.get(key)

    if (current) {
      current.items.push(item)
      current.countLabel = `${current.items.length} 条浏览`
      continue
    }

    groups.set(key, {
      key,
      label,
      items: [item],
      countLabel: '1 条浏览'
    })
  }

  return Array.from(groups.values())
}
