import { LoginSdk } from './auth'
import type { LoginUser } from './types'

export class UserService {
  constructor(private readonly auth: LoginSdk) {}

  fetchCurrentUser(): Promise<LoginUser | null> {
    return this.auth.getCurrentUser()
  }
}
