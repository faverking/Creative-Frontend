import { watch } from 'vue'
import type { Router } from 'vue-router'

import { CustomMonitorAdapter, Monitor } from '@frontend/monitor-sdk'
import type { GlobalUserProfile } from '@frontend/store'
import { InternalTrackingAdapter, Tracker } from '@frontend/tracking-sdk'

// observability 负责把埋点和监控装配成同一套运行时上下文：
// 路由、用户、租户、traceId 等信息会同时进入 tracker 和 monitor，
// 这样排查问题时两边上下文是一致的。

interface UserStoreLike {
  profile: GlobalUserProfile | null
}

interface TenantAwareProfile extends GlobalUserProfile {
  tenantId?: string
}

export interface ObservabilityRuntime {
  tracker: Tracker
  monitor: Monitor
  syncContext: () => void
  setTraceId: (traceId?: string) => void
}

export interface SetupObservabilityRuntimeOptions {
  router: Router
  userStore: UserStoreLike
  appId: string
}

function resolveTenantId(profile: GlobalUserProfile | null): string | undefined {
  const tenantProfile = profile as TenantAwareProfile | null

  return typeof tenantProfile?.tenantId === 'string' ? tenantProfile.tenantId : undefined
}

export async function setupObservabilityRuntime(
  options: SetupObservabilityRuntimeOptions
): Promise<ObservabilityRuntime> {
  let latestTraceId: string | undefined
  const tracker = new Tracker(new InternalTrackingAdapter())
  await tracker.initialize()

  const monitor = new Monitor(new CustomMonitorAdapter())

  const syncContext = (): void => {
    // 所有观测上下文都从当前路由和当前用户派生，避免页面层手动维护多套上下文。
    const currentRoute = options.router.currentRoute.value
    const routeName = typeof currentRoute.name === 'string' ? currentRoute.name : currentRoute.path
    const nextContext = {
      appId: options.appId,
      userId: options.userStore.profile?.id,
      tenantId: resolveTenantId(options.userStore.profile),
      routeName,
      pageId: currentRoute.path,
      deviceInfo: typeof navigator === 'undefined' ? undefined : navigator.userAgent,
      traceId: latestTraceId
    }

    tracker.setContext(nextContext)
    monitor.setContext(nextContext)
  }

  watch(
    () => options.userStore.profile,
    () => {
      syncContext()
    },
    {
      deep: true,
      immediate: true
    }
  )

  syncContext()
  // 性能采集和全局异常捕获在运行时层统一安装，应用层只负责消费结果。
  monitor.installBrowserPerformanceCapture()
  monitor.installGlobalErrorCapture({
    onCaptured: (event) => {
      tracker.track('runtime-error', event.payload, {
        category: 'error'
      })
    }
  })
  tracker.installPageLifecycleFlush()

  options.router.afterEach((to) => {
    // 路由切换是门户/后台应用最稳定的 page-view 边界，在这里统一打点。
    const routeName = typeof to.name === 'string' ? to.name : to.path
    const routeMeta = {
      routeName,
      path: to.fullPath
    }

    syncContext()
    tracker.track('page-view', routeMeta, {
      category: 'behavior'
    })
  })

  return {
    tracker,
    monitor,
    syncContext,
    setTraceId: (traceId) => {
      latestTraceId = traceId
      syncContext()
    }
  }
}
