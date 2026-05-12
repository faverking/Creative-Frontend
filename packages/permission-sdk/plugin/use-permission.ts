import type { InjectionKey } from 'vue'

import type { PermissionEngine } from '../core/permission-engine'

export const permissionEngineKey: InjectionKey<PermissionEngine> = Symbol('permission-engine')
