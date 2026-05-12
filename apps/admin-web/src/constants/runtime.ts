import { loadEnvConfig } from '@frontend/config'

export const runtimeConfig = loadEnvConfig(import.meta.env)
