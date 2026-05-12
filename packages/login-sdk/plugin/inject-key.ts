import type { InjectionKey } from 'vue'

import type { LoginSdk } from '../core/auth'

export const loginSdkKey: InjectionKey<LoginSdk> = Symbol('login-sdk')
