// app-runtime 不是新的业务 SDK，而是“跨应用装配层”：
// 它把登录、权限、HTTP、观测这些本来分散在多个包里的能力，
// 收成一组更适合应用启动阶段直接调用的运行时 API。

// 会话运行时：负责把 login-sdk、permission-sdk 与 userStore 串起来，
// 统一处理“刷新 token / 权限水合 / 清理会话脏状态”。
export {
  clearAuthSessionState,
  ensureAuthSessionFreshAccessToken,
  ensureAuthSessionHydrated,
  getAuthSessionRuntime,
  markAuthSessionDirty,
  setupAuthSessionRuntime
} from './auth-session'
export type { AuthSessionRuntimeOptions } from './auth-session'

// 认证核心：只关心并发控制和状态机本身，不直接依赖 Vue、store 或路由。
export { createAuthRuntimeCore } from './auth-runtime-core'
export type { AuthRuntimeCore, AuthRuntimeCoreOptions } from './auth-runtime-core'

// 认证 API：提供最小认证接口封装，避免应用层重复写 register / me 逻辑。
export { createAuthApi } from './auth-api'
export type { AuthApi, RegisterPayload, RegisterResult, RegisterUserProfile } from './auth-api'

// HTTP 运行时：负责统一 baseURL、token 注入、刷新、错误解包与全局回调接线。
export {
  getAppHttpClient,
  resolveBusinessErrorMessage,
  resolveHttpErrorMessage,
  setupAppHttpClient
} from './http-client'
export type { SetupAppHttpClientOptions } from './http-client'

// 观测运行时：把 tracker、monitor、router、user context 连接成一套可复用装配。
export { setupObservabilityRuntime } from './observability'
export type { ObservabilityRuntime, SetupObservabilityRuntimeOptions } from './observability'
