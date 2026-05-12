import type { RouteLocationNormalized } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

import { PermissionEngine } from './permission-engine'
import { createRouteGuard, resolveRoutePermissionContext } from './route-guard'

function createRoute(metas: Array<Record<string, unknown>>): RouteLocationNormalized {
  return {
    matched: metas.map((meta) => ({ meta }))
  } as unknown as RouteLocationNormalized
}

describe('resolveRoutePermissionContext', () => {
  it('prefers the deepest matched permission meta', () => {
    const route = createRoute([
      {
        permission: 'topic:read'
      },
      {
        permission: {
          resource: 'article',
          action: 'publish'
        }
      }
    ])

    expect(resolveRoutePermissionContext(route)).toEqual({
      resource: 'article',
      action: 'publish',
      userId: undefined,
      tenantId: undefined
    })
  })
})

describe('createRouteGuard', () => {
  it('uses custom denied handling for real route permission fallback', async () => {
    const engine = new PermissionEngine({
      canAccess: vi.fn().mockResolvedValue(false)
    })

    const guard = createRouteGuard({
      engine,
      onDenied: () => '/home/overview'
    })

    await expect(
      guard(
        createRoute([
          {
            permission: 'article:publish'
          }
        ]),
        createRoute([]),
        undefined as never
      )
    ).resolves.toBe('/home/overview')
  })
})
