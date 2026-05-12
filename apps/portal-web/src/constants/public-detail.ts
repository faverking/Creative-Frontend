import type { PortalIconName } from '@/components/icons/portalIconRegistry'

export type PublicDetailActionKey = 'favorite' | 'download' | 'share'
export type PublicDetailAccent = 'article' | 'topic' | 'book' | 'gallery'
export type PublicDetailSectionTone = PublicDetailAccent | 'neutral' | 'bookshelf'

export interface PublicDetailActionItem {
  key: PublicDetailActionKey
  label: string
  protected?: boolean
  tone?: 'primary' | 'secondary'
}

const ARTICLE_THEME_LABELS: Record<number, string> = {
  1: '新番情报',
  2: '二游动态',
  3: '圈内杂谈',
  4: '业界观察'
}

const TOPIC_LABELS: Record<number, string> = {
  1: 'Galgame',
  2: 'RPG游戏',
  3: 'SLG游戏',
  4: 'ACT游戏',
  5: '养成模拟',
  6: '综合分区'
}

const TOPIC_TYPE_LABELS: Record<number, string> = {
  1: '作品浏览',
  2: '资源下载',
  3: '版本更新',
  4: '合集整理'
}

const BOOK_PART_LABELS: Record<number, string> = {
  1: '漫画',
  2: '小说',
  3: '资料'
}

const BOOK_AREA_LABELS: Record<number, string> = {
  1: '日系',
  2: '国创',
  3: '其他'
}

const BOOK_STATUS_LABELS: Record<number, string> = {
  1: '连载中',
  2: '已完结'
}

const IMAGE_THEME_LABELS: Record<number, string> = {
  1: '壁纸图包',
  2: '插画图集',
  3: '剧情CG',
  4: '收藏图集'
}

const PUBLIC_DETAIL_ACTION_ICON_NAMES: Record<PublicDetailActionKey, PortalIconName> = {
  favorite: 'favorite',
  download: 'download',
  share: 'copy'
}

export function resolvePublicArticleThemeLabel(themeId?: number, fallback = '公开情报'): string {
  return ARTICLE_THEME_LABELS[themeId ?? -1] ?? fallback
}

export function resolvePublicTopicThemeLabel(topicId?: number, fallback = '公开游戏'): string {
  return TOPIC_LABELS[topicId ?? -1] ?? fallback
}

export function resolvePublicTopicSectionLabel(typeId?: number, fallback = '游戏内容'): string {
  return TOPIC_TYPE_LABELS[typeId ?? -1] ?? fallback
}

export function resolvePublicTopicFeatureFlagLabels(
  labels?: Array<string | undefined | null>,
  limit = Number.POSITIVE_INFINITY
): string[] {
  return Array.from(
    new Set((labels ?? []).map((label) => label?.trim() || '').filter(Boolean))
  ).slice(0, limit)
}

export function resolvePublicBookPartLabel(part?: number, fallback = '公开书库'): string {
  return BOOK_PART_LABELS[part ?? -1] ?? fallback
}

export function resolvePublicBookAreaLabel(area?: number, fallback = '地区待补充'): string {
  return BOOK_AREA_LABELS[area ?? -1] ?? fallback
}

export function resolvePublicBookStatusLabel(status?: number, fallback = '状态待补充'): string {
  return BOOK_STATUS_LABELS[status ?? -1] ?? fallback
}

export function resolvePublicGalleryThemeLabel(themeId?: number, fallback = '公开图包'): string {
  return IMAGE_THEME_LABELS[themeId ?? -1] ?? fallback
}

export function resolvePublicDetailActionIconName(
  actionKey: PublicDetailActionKey
): PortalIconName {
  return PUBLIC_DETAIL_ACTION_ICON_NAMES[actionKey]
}

export function createArticleDetailActions(): PublicDetailActionItem[] {
  return [
    {
      key: 'favorite',
      label: '收藏情报',
      protected: true,
      tone: 'primary'
    },
    {
      key: 'share',
      label: '复制链接',
      tone: 'secondary'
    }
  ]
}

export function createTopicDetailActions(): PublicDetailActionItem[] {
  return [
    {
      key: 'favorite',
      label: '收藏游戏',
      protected: true,
      tone: 'primary'
    },
    {
      key: 'share',
      label: '复制链接',
      tone: 'secondary'
    }
  ]
}

export function createBookDetailActions(): PublicDetailActionItem[] {
  return [
    {
      key: 'favorite',
      label: '收藏书库',
      protected: true,
      tone: 'primary'
    },
    {
      key: 'share',
      label: '复制链接',
      tone: 'secondary'
    }
  ]
}

export function createGalleryDetailActions(): PublicDetailActionItem[] {
  return [
    {
      key: 'favorite',
      label: '收藏图包',
      protected: true,
      tone: 'primary'
    },
    {
      key: 'download',
      label: '下载原图',
      protected: true,
      tone: 'secondary'
    },
    {
      key: 'share',
      label: '复制链接',
      tone: 'secondary'
    }
  ]
}
