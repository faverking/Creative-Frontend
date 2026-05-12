import { describe, expect, it } from 'vitest'

import { createAclPermissionEngine } from './acl-factory'
import { createRbacPermissionEngine } from './rbac-factory'

describe('permission engine factories', () => {
  it('creates an RBAC engine from permission keys', async () => {
    const engine = createRbacPermissionEngine(['article:publish'])

    await expect(engine.canAccess({ resource: 'article', action: 'publish' })).resolves.toBe(true)
    await expect(engine.canAccess({ resource: 'article', action: 'delete' })).resolves.toBe(false)
  })

  it('creates an ACL engine and supports runtime permission injection', async () => {
    const engine = createAclPermissionEngine({
      article: ['read']
    })

    await expect(engine.canAccess({ resource: 'article', action: 'read' })).resolves.toBe(true)
    await expect(engine.canAccess({ resource: 'article', action: 'publish' })).resolves.toBe(false)

    engine.setPermissions(['article:publish', 'image:upload'])

    await expect(engine.canAccess({ resource: 'article', action: 'publish' })).resolves.toBe(true)
    await expect(engine.canAccess({ resource: 'image', action: 'upload' })).resolves.toBe(true)
  })
})
