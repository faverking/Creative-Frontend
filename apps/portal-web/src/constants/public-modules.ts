export type PortalModuleSort = 'latest' | 'hot' | 'recommend'
export type PortalModuleFilterTone = 'neutral' | 'amber' | 'pink' | 'blue' | 'mint' | 'violet'
export type PortalModuleListMode = 'paged' | 'append'

export interface PortalModuleSortOption {
  value: PortalModuleSort
  label: string
  description: string
}

export interface PortalModuleCategoryOption<TValue extends number | string = number | string> {
  value: TValue
  label: string
  description: string
  tone?: PortalModuleFilterTone
}

export const PORTAL_MODULE_DEFAULT_SORT: PortalModuleSort = 'recommend'

export const PORTAL_MODULE_SORT_OPTIONS = [
  {
    value: 'recommend',
    label: '推荐',
    description: '优先展示互动更好、适合继续浏览的公开内容。'
  },
  {
    value: 'latest',
    label: '最新',
    description: '按发布时间排序，优先查看最近更新的内容。'
  },
  {
    value: 'hot',
    label: '热度',
    description: '按浏览和互动热度排序，优先查看讨论度更高的内容。'
  }
] as const satisfies PortalModuleSortOption[]

export const CONTENT_MODULE_PAGE_SIZE = 8
export const GALLERY_MODULE_PAGE_SIZE = 18

export const ARTICLE_MODULE_CATEGORIES = [
  {
    value: 1,
    label: '新番情报',
    description: '围绕新番开播、档期追踪和官方情报整理的公开情报。',
    tone: 'blue'
  },
  {
    value: 2,
    label: '二游动态',
    description: '聚焦二游版本更新、活动速递和卡池情报的公开情报。',
    tone: 'violet'
  },
  {
    value: 3,
    label: '圈内杂谈',
    description: '偏向圈内讨论、作者观察和轻量随笔表达的公开情报。',
    tone: 'pink'
  },
  {
    value: 4,
    label: '业界观察',
    description: '面向厂商动态、企划消息和市场观察的公开情报。',
    tone: 'amber'
  }
] as const satisfies Array<PortalModuleCategoryOption<number>>

export const TOPIC_MODULE_CATEGORIES = [
  {
    value: 1,
    label: 'Galgame',
    description: 'Galgame 分区，集中浏览剧情向游戏、汉化与资源整理。',
    tone: 'pink'
  },
  {
    value: 2,
    label: 'RPG游戏',
    description: 'RPG 游戏分区，适合查看资源下载、版本更新和合集整理。',
    tone: 'violet'
  },
  {
    value: 3,
    label: 'SLG游戏',
    description: 'SLG 游戏分区，收录策略模拟与经营向游戏内容。',
    tone: 'blue'
  },
  {
    value: 4,
    label: 'ACT游戏',
    description: 'ACT 游戏分区，聚合动作题材游戏与补丁更新。',
    tone: 'amber'
  },
  {
    value: 5,
    label: '养成模拟',
    description: '养成模拟分区，集中整理养成题材游戏和资源。',
    tone: 'mint'
  },
  {
    value: 6,
    label: '综合分区',
    description: '综合分区，承载跨题材合集、资源导航与补充内容。',
    tone: 'neutral'
  }
] as const satisfies Array<PortalModuleCategoryOption<number>>

export const BOOK_MODULE_CATEGORIES = [
  {
    value: 1,
    label: '漫画',
    description: '以漫画、分镜式内容和连续章节阅读为主的公开书库。',
    tone: 'pink'
  },
  {
    value: 2,
    label: '小说',
    description: '偏文字叙事、长篇阅读和章节追更体验的书库内容。',
    tone: 'violet'
  },
  {
    value: 3,
    label: '资料',
    description: '更适合查阅、收藏和按主题整理的资料型书库。',
    tone: 'blue'
  }
] as const satisfies Array<PortalModuleCategoryOption<number>>

export const GALLERY_MODULE_TOPICS = [
  {
    value: 1,
    label: '壁纸图包',
    description: '适合按桌面、横图和移动端壁纸场景筛选的图包。',
    tone: 'blue'
  },
  {
    value: 2,
    label: '插画图集',
    description: '更适合浏览完整画面与角色插画表达的公开图集。',
    tone: 'pink'
  },
  {
    value: 3,
    label: '剧情CG',
    description: '偏游戏剧情 CG、场景图和关键插页整理的图包内容。',
    tone: 'violet'
  },
  {
    value: 4,
    label: '收藏图集',
    description: '适合归档、收藏和成套保存的精选图集。',
    tone: 'mint'
  }
] as const satisfies Array<PortalModuleCategoryOption<number>>

export const PUBLIC_MODULE_QUERY_CONFIG = {
  article: {
    categoryQueryKey: 'themeId',
    listMode: 'paged',
    pageSize: CONTENT_MODULE_PAGE_SIZE,
    routeName: 'article-module'
  },
  topic: {
    categoryQueryKey: 'topicId',
    listMode: 'paged',
    pageSize: CONTENT_MODULE_PAGE_SIZE,
    routeName: 'topic-module'
  },
  book: {
    categoryQueryKey: 'part',
    listMode: 'paged',
    pageSize: CONTENT_MODULE_PAGE_SIZE,
    routeName: 'book-module'
  },
  gallery: {
    categoryQueryKey: 'themeId',
    listMode: 'append',
    pageSize: GALLERY_MODULE_PAGE_SIZE,
    routeName: 'gallery-module'
  }
} as const satisfies Record<
  'article' | 'topic' | 'book' | 'gallery',
  {
    categoryQueryKey: string
    listMode: PortalModuleListMode
    pageSize: number
    routeName: string
  }
>
