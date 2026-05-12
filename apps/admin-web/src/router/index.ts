import {
  createRouter,
  createWebHistory,
  type NavigationGuardReturn,
  type RouteLocationNormalized
} from 'vue-router'

import { TokenManager } from '@frontend/login-sdk'
import { createRouteGuard } from '@frontend/permission-sdk'

import { ensureFreshAccessToken, ensurePermissionHydrated, getAuthRuntime } from '@/auth/runtime'
import { MANAGE_ROUTE_PERMISSIONS, resolveHomeLandingPathByRoles } from '@/permission'

// 统一构建登录跳转对象，保留原始访问路径用于登录后回跳。
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

// 跳转至路由重定向链接，或回退首页。
function resolveAuthEntryRedirect(to: RouteLocationNormalized): string {
  const redirect = to.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    return redirect
  }

  const runtime = getAuthRuntime()
  return resolveHomeLandingPathByRoles(runtime?.userStore.profile?.roles)
}

function resolveHomeLandingPath(): string {
  const runtime = getAuthRuntime()
  return resolveHomeLandingPathByRoles(runtime?.userStore.profile?.roles)
}

async function runManageRouteGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
): Promise<NavigationGuardReturn> {
  const runtime = getAuthRuntime()
  if (!runtime) {
    return true
  }

  return createRouteGuard({
    engine: runtime.permissionEngine,
    onDenied: () => resolveHomeLandingPath()
  })(to, from, undefined as never)
}

const router = createRouter({
  history: createWebHistory(),
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
      redirect: '/home'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue')
    },
    {
      path: '/home',
      component: () => import('@/views/home/HomeManagePage.vue'),
      meta: {
        requiresAuth: true
      },
      children: [
        {
          path: '',
          redirect: '/home/overview'
        },
        {
          path: 'overview',
          name: 'home-overview',
          meta: {
            permission: MANAGE_ROUTE_PERMISSIONS.overview
          },
          component: () => import('@/views/home/HomeOverviewPage.vue')
        },
        {
          path: 'manage',
          name: 'home-manage',
          meta: {
            permission: MANAGE_ROUTE_PERMISSIONS.manage
          },
          component: () => import('@/views/home/HomeContentManagePage.vue')
        },
        {
          path: 'admin/overview',
          name: 'home-admin-overview',
          meta: {
            permission: MANAGE_ROUTE_PERMISSIONS.adminOverview
          },
          component: () => import('@/views/home/HomeAdminOverviewPage.vue')
        },
        {
          path: 'admin/manage',
          name: 'home-admin-manage',
          meta: {
            permission: MANAGE_ROUTE_PERMISSIONS.adminManage
          },
          component: () => import('@/views/home/HomeAdminManagePage.vue')
        },
        {
          path: 'books',
          name: 'home-books',
          meta: {
            permission: MANAGE_ROUTE_PERMISSIONS.books
          },
          component: () => import('@/views/home/BooksPage.vue')
        },
        {
          path: 'topics',
          name: 'home-topics',
          meta: {
            permission: MANAGE_ROUTE_PERMISSIONS.topics
          },
          component: () => import('@/views/home/TopicsPage.vue')
        },
        {
          path: 'images',
          name: 'home-images',
          meta: {
            permission: MANAGE_ROUTE_PERMISSIONS.images
          },
          component: () => import('@/views/home/ImagesPage.vue')
        },
        {
          path: 'articles',
          name: 'home-articles',
          meta: {
            permission: MANAGE_ROUTE_PERMISSIONS.articles
          },
          component: () => import('@/views/home/ArticlesPage.vue')
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/home'
    }
  ]
})

router.beforeEach(async (to, from) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth) {
    // 第一步：无 token 直接回登录页。
    if (!TokenManager.hasAccessToken()) {
      return buildLoginRedirect(to.fullPath)
    }

    // 第二步：token 过期先尝试静默刷新，失败再回登录页。
    if (TokenManager.isAccessTokenExpired()) {
      const refreshed = await ensureFreshAccessToken()
      if (!refreshed) {
        return buildLoginRedirect(to.fullPath)
      }
    }

    // 第三步：确保权限已和当前登录态同步。
    await ensurePermissionHydrated()

    if (to.path === '/home') {
      return resolveHomeLandingPath()
    }

    // 第四步：仅复用共享权限守卫做路由权限判定。
    const routeGuardResult = await runManageRouteGuard(to, from)
    if (routeGuardResult !== true) {
      return routeGuardResult
    }
  }

  if (to.name === 'login' || to.name === 'register') {
    if (!TokenManager.hasAccessToken()) {
      return true
    }

    // 已登录但 token 过期时，先尝试刷新；刷新失败允许停留登录页。
    if (TokenManager.isAccessTokenExpired()) {
      const refreshed = await ensureFreshAccessToken()
      if (!refreshed) {
        return true
      }
    }

    await ensurePermissionHydrated()

    return resolveAuthEntryRedirect(to)
  }

  return true
})

export default router
