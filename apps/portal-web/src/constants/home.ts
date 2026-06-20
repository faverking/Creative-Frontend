export const HOME_FEATURED_AUTOPLAY_MS = 5600
export const HOME_FEATURED_NAV_COUNT = 5
export const HOME_FEATURED_TAG_LIMIT = 2
export const HOME_GALLERY_TILE_COUNT = 4
export const HOME_FEATURED_LIMIT = 5
export const HOME_ARTICLE_SECTION_LIMIT = 3
export const HOME_COLUMN_SECTION_LIMIT = 3
export const HOME_BOOKSHELF_SECTION_LIMIT = 2
export const HOME_GALLERY_SECTION_LIMIT = 3

export const HOME_COLUMN_COVER_BACKGROUNDS = {
  blue: 'var(--portal-module-topic-cover-blue-bg)',
  iris: 'var(--portal-module-topic-cover-iris-bg)',
  gold: 'var(--portal-module-topic-cover-gold-bg)'
} as const

export const HOME_TAG_TONES = ['cyan', 'sky', 'iris', 'soft'] as const
export const HOME_COLUMN_TONES = ['blue', 'iris', 'gold'] as const

type HomeQuickEntryPresentation = {
  title: string
  description: string
  unit: string
  iconName: 'channel-article' | 'channel-column' | 'channel-bookshelf' | 'channel-gallery'
  glow: string
  shadow: string
}

export const HOME_QUICK_ENTRY_CONTENT_TYPES = {
  articles: 'article',
  columns: 'topic',
  books: 'book',
  galleries: 'image'
} as const

export const HOME_QUICK_ENTRY_PRESENTATIONS = {
  articles: {
    title: '情报',
    description: '新番情报、二游动态、圈内杂谈、业界观察',
    unit: '篇',
    iconName: 'channel-article',
    glow: 'rgba(105, 212, 255, 0.22)',
    shadow: 'rgba(105, 212, 255, 0.14)'
  },
  columns: {
    title: '游戏',
    description: '按题材浏览游戏、资源下载与版本更新',
    unit: '栏',
    iconName: 'channel-column',
    glow: 'rgba(154, 170, 232, 0.22)',
    shadow: 'rgba(154, 170, 232, 0.12)'
  },
  books: {
    title: '书库',
    description: '漫画、小说、资料分区归档',
    unit: '本',
    iconName: 'channel-bookshelf',
    glow: 'rgba(255, 214, 150, 0.22)',
    shadow: 'rgba(255, 214, 150, 0.14)'
  },
  galleries: {
    title: '图包',
    description: '壁纸图包、插画图集、剧情CG、收藏图集',
    unit: '组',
    iconName: 'channel-gallery',
    glow: 'rgba(143, 228, 208, 0.2)',
    shadow: 'rgba(143, 228, 208, 0.12)'
  }
} as const satisfies Record<
  'articles' | 'columns' | 'books' | 'galleries',
  HomeQuickEntryPresentation
>
