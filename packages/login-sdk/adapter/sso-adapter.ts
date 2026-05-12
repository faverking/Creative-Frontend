import type { LoginAdapter, LoginUser } from '../core/types'

export class SsoAdapter implements LoginAdapter {
  constructor(private readonly baseUrl: string = '') {}

  async login(redirectUrl?: string): Promise<void> {
    if (typeof window === 'undefined') {
      return
    }

    const target = redirectUrl ?? window.location.href
    window.location.assign(`${this.baseUrl}/login?redirect=${encodeURIComponent(target)}`)
  }

  async logout(): Promise<void> {
    if (typeof window === 'undefined') {
      return
    }
    window.location.assign(`${this.baseUrl}/logout`)
  }

  async fetchCurrentUser(): Promise<LoginUser | null> {
    return null
  }
}
