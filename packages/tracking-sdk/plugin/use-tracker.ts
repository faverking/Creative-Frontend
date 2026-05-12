import type { InjectionKey } from 'vue'

import type { Tracker } from '../core/tracker'

export const trackerKey: InjectionKey<Tracker> = Symbol('tracking-tracker')
