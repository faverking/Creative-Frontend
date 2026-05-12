export interface AppEnvConfig {
  appTitle: string
  apiBaseUrl: string
  apiPrefix: string
  adminWebBaseUrl: string
  oauthProvider: string
  ssoBaseUrl: string
  monitorDsn: string
  trackingAppId: string
  aiApiBaseUrl: string
}

export type EnvValue = string | boolean | undefined
export type EnvSource = Record<string, EnvValue>
