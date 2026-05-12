import type { InjectionKey } from 'vue'

import type { Monitor } from '../core/monitor'

export const monitorKey: InjectionKey<Monitor> = Symbol('monitor-key')
