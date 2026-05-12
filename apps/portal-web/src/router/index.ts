import {
  createRouter,
  createWebHistory,
  type NavigationGuardReturn,
  type RouteLocationNormalized,
  type RouteComponent,
  type RouteRecordRaw
} from 'vue-router'

import { TokenManager } from '@frontend/login-sdk'
import { createRouteGuard } from '@frontend/permission-sdk'

import {
  loadArticleDetailView,
  loadArticleModuleView,
  loadBookDetailView,
  loadBookModuleView,
  loadForbiddenView,
  loadGalleryDetailView,
  loadGalleryModuleView,
  loadHomeView,
  loadLoginView,
  loadRegisterView,
  loadWorkspaceFavoritesView,
  loadWorkspaceHistoryView,
  loadWorkspaceMessagesView,
  loadTopicModuleView,
  loadTopicDetailView,
  loadWorkspaceView,
  schedulePortalRoutePreload,
  scheduleProtectedRoutePreload
} from './loaders'
import { ensureFreshAccessToken, ensurePermissionHydrated, getAuthRuntime } from '@/auth/runtime'
import {
  PORTAL_DETAIL_ROUTE_NAMES,
  PORTAL_MODULE_ROUTE_NAMES,
  PORTAL_MODULE_ROUTE_PATHS
} from '@/constants/portal-business'
import {
  PORTAL_WORKSPACE_DEFAULT_SECTION,
  PORTAL_WORKSPACE_ROOT_PATH,
  PORTAL_WORKSPACE_ROUTE_PATHS,
  PORTAL_WORKSPACE_ROUTE_NAMES
} from '@/constants/workspace'
import { PORTAL_ROUTE_PERMISSIONS } from '@/permission'

function buildLoginRedirect(redirectPath: string): {
  name: 'login'
  query: { redirect: string }
} {
  return {
    name: 'login',
    query: {
      redirect: redirectPath
    }
  }
}

function resolveAuthEntryRedirect(to: RouteLocationNormalized): string {
  const redirect = to.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/'
}

async function syncExistingSession(): Promise<boolean> {
  if (!TokenManager.hasAccessToken()) {
    return false
  }

  if (TokenManager.isAccessTokenExpired()) {
    const refreshed = await ensureFreshAccessToken()
    if (!refreshed) {
      return false
    }
  }

  const runtime = getAuthRuntime()
  if (runtime && !runtime.userStore.hydrated) {
    await ensurePermissionHydrated()
  }

  return TokenManager.hasAccessToken()
}

async function runPortalRouteGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
): Promise<NavigationGuardReturn> {
  const runtime = getAuthRuntime()
  if (!runtime) {
    return true
  }

  return createRouteGuard({
    engine: runtime.permissionEngine,
    onDenied: ({ to: deniedTo }) => (deniedTo.meta.requiresAuth ? '/forbidden' : '/')
  })(to, from, undefined as never)
}

const homeView = loadHomeView
const loginView = loadLoginView
const registerView = loadRegisterView

interface PublicDetailRouteDefinition {
  path: string
  name: `${string}-detail`
  component: RouteComponent
  defaultProps?: Record<string, unknown>
}

interface PublicModuleRouteDefinition {
  component: RouteComponent
  path: string
  name: `${string}-module`
}

interface WorkspaceRouteDefinition {
  component: RouteComponent
  path: string
  name: string
}

function createPublicDetailRoutes(definition: PublicDetailRouteDefinition): RouteRecordRaw[] {
  const meta = {
    permission: PORTAL_ROUTE_PERMISSIONS.home
  }

  return [
    {
      path: definition.path,
      name: definition.name,
      component: definition.component,
      props: definition.defaultProps,
      meta
    },
    {
      path: `${definition.path}/login`,
      name: `${definition.name}-login`,
      components: {
        default: definition.component,
        dialog: loginView
      },
      props: definition.defaultProps ? { default: definition.defaultProps } : undefined,
      meta
    },
    {
      path: `${definition.path}/register`,
      name: `${definition.name}-register`,
      components: {
        default: definition.component,
        dialog: registerView
      },
      props: definition.defaultProps ? { default: definition.defaultProps } : undefined,
      meta
    }
  ]
}

function createPublicModuleRoute(definition: PublicModuleRouteDefinition): RouteRecordRaw {
  return {
    path: definition.path,
    name: definition.name,
    component: definition.component,
    meta: {
      permission: PORTAL_ROUTE_PERMISSIONS.home
    }
  }
}

function createWorkspaceRoute(definition: WorkspaceRouteDefinition): RouteRecordRaw {
  return {
    path: definition.path,
    name: definition.name,
    component: definition.component
  }
}

const publicModuleRoutes = [
  createPublicModuleRoute({
    path: PORTAL_MODULE_ROUTE_PATHS.article,
    name: PORTAL_MODULE_ROUTE_NAMES.article,
    component: loadArticleModuleView
  }),
  createPublicModuleRoute({
    path: PORTAL_MODULE_ROUTE_PATHS.topic,
    name: PORTAL_MODULE_ROUTE_NAMES.topic,
    component: loadTopicModuleView
  }),
  createPublicModuleRoute({
    path: PORTAL_MODULE_ROUTE_PATHS.book,
    name: PORTAL_MODULE_ROUTE_NAMES.book,
    component: loadBookModuleView
  }),
  createPublicModuleRoute({
    path: PORTAL_MODULE_ROUTE_PATHS.gallery,
    name: PORTAL_MODULE_ROUTE_NAMES.gallery,
    component: loadGalleryModuleView
  })
] satisfies RouteRecordRaw[]

const publicDetailRoutes = [
  ...createPublicDetailRoutes({
    path: '/articles/:id',
    name: PORTAL_DETAIL_ROUTE_NAMES.article,
    component: loadArticleDetailView
  }),
  ...createPublicDetailRoutes({
    path: '/topics/:id',
    name: PORTAL_DETAIL_ROUTE_NAMES.topic,
    component: loadTopicDetailView
  }),
  ...createPublicDetailRoutes({
    path: '/books/:id',
    name: PORTAL_DETAIL_ROUTE_NAMES.book,
    component: loadBookDetailView
  }),
  ...createPublicDetailRoutes({
    path: '/galleries/:id',
    name: PORTAL_DETAIL_ROUTE_NAMES.gallery,
    component: loadGalleryDetailView
  })
] satisfies RouteRecordRaw[]

const workspaceRoutes = [
  createWorkspaceRoute({
    path: PORTAL_WORKSPACE_ROUTE_PATHS.messages,
    name: PORTAL_WORKSPACE_ROUTE_NAMES.messages,
    component: loadWorkspaceMessagesView
  }),
  createWorkspaceRoute({
    path: PORTAL_WORKSPACE_ROUTE_PATHS.favorites,
    name: PORTAL_WORKSPACE_ROUTE_NAMES.favorites,
    component: loadWorkspaceFavoritesView
  }),
  createWorkspaceRoute({
    path: PORTAL_WORKSPACE_ROUTE_PATHS.history,
    name: PORTAL_WORKSPACE_ROUTE_NAMES.history,
    component: loadWorkspaceHistoryView
  })
] satisfies RouteRecordRaw[]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    return {
      left: 0,
      top: 0
    }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: homeView,
      meta: {
        permission: PORTAL_ROUTE_PERMISSIONS.home
      }
    },
    {
      path: '/login',
      name: 'login',
      components: {
        default: homeView,
        dialog: loginView
      },
      meta: {
        permission: PORTAL_ROUTE_PERMISSIONS.home
      }
    },
    {
      path: '/register',
      name: 'register',
      components: {
        default: homeView,
        dialog: registerView
      },
      meta: {
        permission: PORTAL_ROUTE_PERMISSIONS.home
      }
    },
    {
      path: '/forbidden',
      name: 'forbidden',
      component: loadForbiddenView
    },
    {
      path: PORTAL_WORKSPACE_ROOT_PATH,
      name: PORTAL_WORKSPACE_ROUTE_NAMES.root,
      component: loadWorkspaceView,
      redirect: {
        name: PORTAL_WORKSPACE_ROUTE_NAMES[PORTAL_WORKSPACE_DEFAULT_SECTION]
      },
      meta: {
        requiresAuth: true,
        permission: PORTAL_ROUTE_PERMISSIONS.workspace
      },
      children: workspaceRoutes
    },
    ...publicModuleRoutes,
    ...publicDetailRoutes,
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.beforeEach(async (to, from) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const hasSession = await syncExistingSession()

  if (requiresAuth && !hasSession) {
    return buildLoginRedirect(to.fullPath)
  }

  if ((to.name === 'login' || to.name === 'register') && hasSession) {
    return resolveAuthEntryRedirect(to)
  }

  const routeGuardResult = await runPortalRouteGuard(to, from)
  if (routeGuardResult !== true) {
    return routeGuardResult
  }

  return true
})

router.afterEach((to) => {
  const routeName = typeof to.name === 'string' ? to.name : null
  schedulePortalRoutePreload(routeName)
  scheduleProtectedRoutePreload(TokenManager.hasAccessToken())
})

export default router
