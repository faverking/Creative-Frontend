import type { DirectiveBinding, ObjectDirective } from 'vue'

import { normalizePermissionContext } from './context'
import type { PermissionEngine } from './permission-engine'
import type { PermissionValue } from './types'

const originalDisplayMap = new WeakMap<HTMLElement, string>()

async function applyPermission(
  el: HTMLElement,
  binding: DirectiveBinding<PermissionValue>,
  engine: PermissionEngine
): Promise<void> {
  const context = normalizePermissionContext(binding.value, {
    resource: 'unknown',
    action: 'read'
  })

  const allowed = context ? await engine.canAccess(context) : false
  if (allowed) {
    const originalDisplay = originalDisplayMap.get(el)
    if (originalDisplay !== undefined) {
      el.style.display = originalDisplay
    } else {
      el.style.removeProperty('display')
    }
    return
  }

  if (!originalDisplayMap.has(el)) {
    originalDisplayMap.set(el, el.style.display)
  }

  el.style.display = 'none'
}

export function createPermissionDirective(engine: PermissionEngine): ObjectDirective {
  return {
    // 首次挂载和后续更新都重新判定，保证按钮权限和菜单权限能跟随状态刷新。
    async mounted(el, binding) {
      await applyPermission(el as HTMLElement, binding as DirectiveBinding<PermissionValue>, engine)
    },
    async updated(el, binding) {
      await applyPermission(el as HTMLElement, binding as DirectiveBinding<PermissionValue>, engine)
    },
    unmounted(el) {
      originalDisplayMap.delete(el as HTMLElement)
    }
  }
}
