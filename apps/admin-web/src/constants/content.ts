export interface ContentThemeOption {
  label: string
  value: number
}

export interface BookStyleOption {
  id: number
  name: string
}

export type ArticleStatus = 'draft' | 'published' | 'offline' | 'deleted'
export type UserRoleValue = 'user' | 'admin' | 'super_admin'
export type ContentBusinessTargetType = 'article' | 'book' | 'topic' | 'image'

function createContentThemeOptions(labels: Record<number, string>): ContentThemeOption[] {
  return Object.entries(labels).map(([value, label]) => ({
    label,
    value: Number(value)
  }))
}

function createBookStyleOptions(labels: Record<number, string>): BookStyleOption[] {
  return Object.entries(labels).map(([id, name]) => ({
    id: Number(id),
    name
  }))
}

export const BUSINESS_LABELS_BY_TARGET_TYPE: Record<ContentBusinessTargetType, string> = {
  article: '情报',
  book: '书库',
  topic: '游戏',
  image: '图包'
}

export const USER_ROLE_LABEL_MAP: Record<UserRoleValue, string> = {
  user: '普通用户',
  admin: '管理员',
  super_admin: '超级管理员'
}

export const ARTICLE_STATUS_ENUMS: Record<ArticleStatus, string> = {
  draft: '草稿',
  published: '已发布',
  offline: '已下线',
  deleted: '已删除'
}

export const ARTICLE_THEME_LABELS: Record<number, string> = {
  1: '新番情报',
  2: '二游动态',
  3: '圈内杂谈',
  4: '业界观察'
}

export const IMAGE_THEME_LABELS: Record<number, string> = {
  1: '壁纸图包',
  2: '插画图集',
  3: '剧情CG',
  4: '收藏图集'
}

export const TOPIC_SERIES_LABELS: Record<number, string> = {
  1: 'Galgame',
  2: 'RPG游戏',
  3: 'SLG游戏',
  4: 'ACT游戏',
  5: '养成模拟',
  6: '综合分区'
}

export const TOPIC_SECTION_LABELS: Record<number, string> = {
  1: '作品浏览',
  2: '资源下载',
  3: '版本更新',
  4: '合集整理'
}

export const TOPIC_FEATURE_FLAG_LABELS: Record<number, string> = {
  1: '汉化',
  2: '官中',
  3: 'PC',
  4: '安卓',
  5: '新作',
  6: '经典',
  7: '同人'
}

export const BOOK_PART_LABELS: Record<number, string> = {
  1: '漫画',
  2: '小说',
  3: '资料'
}

export const BOOK_AREA_LABELS: Record<number, string> = {
  1: '日系',
  2: '国创',
  3: '其他'
}

const BOOK_STYLE_LABELS: Record<number, string> = {
  101: '校园',
  102: '奇幻',
  103: '冒险',
  104: '都市',
  105: '恋爱',
  106: '悬疑',
  107: '科幻',
  108: '治愈',
  109: '历史',
  110: '喜剧'
}

export const IMAGE_SOURCE_OPTIONS: string[] = ['原画', '壁纸', '图集']

export const ARTICLE_THEME_OPTIONS = createContentThemeOptions(ARTICLE_THEME_LABELS)

export const IMAGE_THEME_OPTIONS = createContentThemeOptions(IMAGE_THEME_LABELS)

export const TOPIC_SERIES_OPTIONS = createContentThemeOptions(TOPIC_SERIES_LABELS)

export const TOPIC_SECTION_OPTIONS = createContentThemeOptions(TOPIC_SECTION_LABELS)

export const TOPIC_FEATURE_FLAG_OPTIONS = createContentThemeOptions(TOPIC_FEATURE_FLAG_LABELS)

export const BOOK_PART_OPTIONS = createContentThemeOptions(BOOK_PART_LABELS)

export const BOOK_STATUS_OPTIONS: ContentThemeOption[] = [
  { label: '连载中', value: 1 },
  { label: '已完结', value: 2 }
]

export const BOOK_AREA_OPTIONS = createContentThemeOptions(BOOK_AREA_LABELS)

export const BOOK_STYLE_OPTIONS: BookStyleOption[] = createBookStyleOptions(BOOK_STYLE_LABELS)

export const ARTICLE_DRAFT_STORAGE_KEY = 'admin-web:articles:draft-id'

// 镜像 MonoNest 媒体上传默认配置：MEDIA_BATCH_UPLOAD_LIMIT / MEDIA_IMAGE_MAX_FILE_SIZE。
export const IMAGE_BATCH_LIMIT = 20
export const IMAGE_MAX_FILE_SIZE = 20 * 1024 * 1024

export const TOPIC_ARCHIVE_ACCEPT = '.zip,application/zip,application/x-zip-compressed'
// 和后端默认 ZIP 上传上限保持一致，避免前端放行后再被服务端拒绝。
export const TOPIC_ARCHIVE_MAX_FILE_SIZE = 100 * 1024 * 1024

// 镜像 MonoNest `src/common/constants/content-limits.ts`，用于前端提前拦截明显超限的富文本正文。
export const CONTENT_BYTE_LIMITS = {
  article: {
    min: 10,
    max: 3 * 1024 * 1024
  },
  draft: {
    min: 1,
    max: 3 * 1024 * 1024
  },
  topic: {
    min: 2,
    max: 2 * 1024 * 1024
  }
} as const

export type ContentByteLimitType = keyof typeof CONTENT_BYTE_LIMITS
