import type { DirectiveBinding } from 'vue'
import { describe, expect, it } from 'vitest'

import { createPermissionDirective } from './directive'
import { PermissionEngine } from './permission-engine'
import type { PermissionValue } from './types'

function createElement(initialDisplay = 'inline-flex'): HTMLElement {
  return {
    style: {
      display: initialDisplay,
      removeProperty(property: string) {
        if (property === 'display') {
          this.display = ''
        }
      }
    }
  } as unknown as HTMLElement
}

function createBinding(value: PermissionValue): DirectiveBinding<PermissionValue> {
  return {
    value
  } as unknown as DirectiveBinding<PermissionValue>
}

describe('createPermissionDirective', () => {
  it('re-evaluates button visibility on updated', async () => {
    let allowed = false
    const engine = new PermissionEngine({
      canAccess: () => allowed
    })
    const directive = createPermissionDirective(engine)
    const element = createElement('inline-flex')

    await directive.mounted?.(
      element,
      createBinding('article:publish'),
      undefined as never,
      undefined as never
    )
    expect(element.style.display).toBe('none')

    allowed = true
    await directive.updated?.(
      element,
      createBinding('article:publish'),
      undefined as never,
      undefined as never
    )
    expect(element.style.display).toBe('inline-flex')
  })
})
