export type PortalBusinessType = 'article' | 'topic' | 'book' | 'gallery'
export type HOME_CONTENT_TYPE = 'article' | 'topic' | 'book' | 'image'
export type HomeContentType = HOME_CONTENT_TYPE

export const PORTAL_BUSINESS_LABELS = {
  article: '情报',
  topic: '游戏',
  book: '书库',
  gallery: '图包'
} as const satisfies Record<PortalBusinessType, string>

export const HOME_CONTENT_LABELS = {
  article: PORTAL_BUSINESS_LABELS.article,
  topic: PORTAL_BUSINESS_LABELS.topic,
  book: PORTAL_BUSINESS_LABELS.book,
  image: PORTAL_BUSINESS_LABELS.gallery
} as const satisfies Record<HOME_CONTENT_TYPE, string>

export const PORTAL_MODULE_ROUTE_NAMES = {
  article: 'article-module',
  topic: 'topic-module',
  book: 'book-module',
  gallery: 'gallery-module'
} as const satisfies Record<PortalBusinessType, `${PortalBusinessType}-module`>

export const PORTAL_MODULE_ROUTE_PATHS = {
  article: '/articles',
  topic: '/topics',
  book: '/books',
  gallery: '/galleries'
} as const satisfies Record<PortalBusinessType, string>

export const PORTAL_DETAIL_ROUTE_NAMES = {
  article: 'article-detail',
  topic: 'topic-detail',
  book: 'book-detail',
  gallery: 'gallery-detail'
} as const satisfies Record<PortalBusinessType, `${PortalBusinessType}-detail`>

export interface PortalBusinessItem {
  detailRouteName: (typeof PORTAL_DETAIL_ROUTE_NAMES)[PortalBusinessType]
  key: PortalBusinessType
  label: string
  moduleRouteName: (typeof PORTAL_MODULE_ROUTE_NAMES)[PortalBusinessType]
  moduleRoutePath: string
}

export const PORTAL_BUSINESS_ITEMS = (
  Object.keys(PORTAL_MODULE_ROUTE_NAMES) as PortalBusinessType[]
).map((key) => ({
  key,
  label: PORTAL_BUSINESS_LABELS[key],
  moduleRouteName: PORTAL_MODULE_ROUTE_NAMES[key],
  moduleRoutePath: PORTAL_MODULE_ROUTE_PATHS[key],
  detailRouteName: PORTAL_DETAIL_ROUTE_NAMES[key]
})) satisfies ReadonlyArray<PortalBusinessItem>

export const HOME_CONTENT_MODULE_ROUTE_NAMES = {
  article: PORTAL_MODULE_ROUTE_NAMES.article,
  topic: PORTAL_MODULE_ROUTE_NAMES.topic,
  book: PORTAL_MODULE_ROUTE_NAMES.book,
  image: PORTAL_MODULE_ROUTE_NAMES.gallery
} as const satisfies Record<HOME_CONTENT_TYPE, string>

export const HOME_CONTENT_DETAIL_ROUTE_NAMES = {
  article: PORTAL_DETAIL_ROUTE_NAMES.article,
  topic: PORTAL_DETAIL_ROUTE_NAMES.topic,
  book: PORTAL_DETAIL_ROUTE_NAMES.book,
  image: PORTAL_DETAIL_ROUTE_NAMES.gallery
} as const satisfies Record<HOME_CONTENT_TYPE, string>
