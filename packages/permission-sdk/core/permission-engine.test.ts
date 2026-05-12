import { describe, expect, it } from 'vitest'

import { PermissionEngine } from './permission-engine'

describe('PermissionEngine', () => {
  it('supports canAny and canAll checks', async () => {
    const engine = new PermissionEngine({
      canAccess(context) {
        return context.resource === 'article' && context.action !== 'delete'
      }
    })

    await expect(
      engine.canAny([
        { resource: 'topic', action: 'publish' },
        { resource: 'article', action: 'publish' }
      ])
    ).resolves.toBe(true)

    await expect(
      engine.canAll([
        { resource: 'article', action: 'read' },
        { resource: 'article', action: 'publish' }
      ])
    ).resolves.toBe(true)

    await expect(
      engine.canAll([
        { resource: 'article', action: 'read' },
        { resource: 'article', action: 'delete' }
      ])
    ).resolves.toBe(false)
  })
})
