import {
  PORTAL_DETAIL_ROUTE_NAMES,
  PORTAL_MODULE_ROUTE_NAMES,
  PORTAL_PUBLIC_DETAIL_ROUTE_NAMES
} from '@/constants/portal-business'

const routePreloadCache = new WeakSet<RouteLoader>()

type RouteLoader = () => Promise<unknown>

const loadPublicBrowseRouteStyles = () => import('@/styles/routes/public-browse.css')
const loadPublicDetailRouteStyles = () => import('@/styles/routes/public-detail.css')
const loadWorkspaceRouteStyles = () => import('@/styles/routes/workspace.css')

const HOME_ROUTE_NAMES = new Set(['home', 'login', 'register'])
const PUBLIC_MODULE_ROUTE_NAME_SET: ReadonlySet<string> = new Set(
  Object.values(PORTAL_MODULE_ROUTE_NAMES)
)
const PUBLIC_DETAIL_ROUTE_NAME_SET: ReadonlySet<string> = new Set([
  ...PORTAL_PUBLIC_DETAIL_ROUTE_NAMES,
  ...Object.values(PORTAL_DETAIL_ROUTE_NAMES).flatMap((routeName) => [
    `${routeName}-login`,
    `${routeName}-register`
  ])
])

function withRouteStyles<T>(
  loadStyles: RouteLoader,
  loadRouteComponent: () => Promise<T>
): () => Promise<T> {
  return async () => {
    const [, routeComponent] = await Promise.all([loadStyles(), loadRouteComponent()])
    return routeComponent
  }
}

export const loadHomeView = withRouteStyles(
  loadPublicBrowseRouteStyles,
  () => import('@/views/home/PortalHomeView.vue')
)
export const loadLoginView = () => import('@/views/auth/LoginView.vue')
export const loadRegisterView = () => import('@/views/auth/RegisterView.vue')
export const loadForbiddenView = withRouteStyles(
  loadWorkspaceRouteStyles,
  () => import('@/views/workspace/ForbiddenView.vue')
)
export const loadWorkspaceView = withRouteStyles(
  loadWorkspaceRouteStyles,
  () => import('@/views/workspace/PortalWorkspaceView.vue')
)
export const loadWorkspaceMessagesView = () =>
  import('@/views/workspace/PortalWorkspaceMessagesView.vue')
export const loadWorkspaceFavoritesView = () =>
  import('@/views/workspace/PortalWorkspaceFavoritesView.vue')
export const loadWorkspaceHistoryView = () =>
  import('@/views/workspace/PortalWorkspaceHistoryView.vue')
export const loadArticleModuleView = withRouteStyles(
  loadPublicBrowseRouteStyles,
  () => import('@/views/modules/PortalArticleModuleView.vue')
)
export const loadTopicModuleView = withRouteStyles(
  loadPublicBrowseRouteStyles,
  () => import('@/views/modules/PortalTopicModuleView.vue')
)
export const loadBookModuleView = withRouteStyles(
  loadPublicBrowseRouteStyles,
  () => import('@/views/modules/PortalBookModuleView.vue')
)
export const loadGalleryModuleView = withRouteStyles(
  loadPublicBrowseRouteStyles,
  () => import('@/views/modules/PortalGalleryModuleView.vue')
)
export const loadArticleDetailView = withRouteStyles(
  loadPublicDetailRouteStyles,
  () => import('@/views/public/PortalArticleDetailView.vue')
)
export const loadTopicDetailView = withRouteStyles(
  loadPublicDetailRouteStyles,
  () => import('@/views/public/PortalTopicDetailView.vue')
)
export const loadBookDetailView = withRouteStyles(
  loadPublicDetailRouteStyles,
  () => import('@/views/public/PortalBookDetailView.vue')
)
export const loadBookReaderView = withRouteStyles(
  loadPublicDetailRouteStyles,
  () => import('@/views/public/PortalBookReaderView.vue')
)
export const loadGalleryDetailView = withRouteStyles(
  loadPublicDetailRouteStyles,
  () => import('@/views/public/PortalGalleryDetailView.vue')
)

const homeFollowupLoaders = [
  loadLoginView,
  loadRegisterView,
  loadArticleModuleView,
  loadTopicModuleView,
  loadBookModuleView,
  loadGalleryModuleView,
  loadArticleDetailView,
  loadTopicDetailView,
  loadBookDetailView,
  loadBookReaderView,
  loadGalleryDetailView
]

const workspaceFollowupLoaders = [
  loadForbiddenView,
  loadWorkspaceView,
  loadWorkspaceMessagesView,
  loadWorkspaceFavoritesView,
  loadWorkspaceHistoryView
]

function scheduleIdleTask(task: () => void): void {
  if (typeof window === 'undefined') {
    return
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(task, {
      timeout: 1200
    })
    return
  }

  globalThis.setTimeout(task, 320)
}

function preloadRoutes(loaders: RouteLoader[]): void {
  for (const loader of loaders) {
    if (routePreloadCache.has(loader)) {
      continue
    }

    routePreloadCache.add(loader)
    void loader().catch(() => {
      routePreloadCache.delete(loader)
    })
  }
}

function scheduleRoutePreload(loaders: RouteLoader[]): void {
  scheduleIdleTask(() => preloadRoutes(loaders))
}

export function schedulePortalRoutePreload(routeName: string | null | undefined): void {
  if (!routeName) {
    return
  }

  if (
    HOME_ROUTE_NAMES.has(routeName) ||
    PUBLIC_MODULE_ROUTE_NAME_SET.has(routeName) ||
    PUBLIC_DETAIL_ROUTE_NAME_SET.has(routeName)
  ) {
    scheduleRoutePreload(homeFollowupLoaders)
  }
}

export function scheduleProtectedRoutePreload(isAuthenticated: boolean): void {
  if (!isAuthenticated) {
    return
  }

  scheduleRoutePreload(workspaceFollowupLoaders)
}
