type ExperimentEnvValue = string | boolean | undefined
type ExperimentEnvSource = Record<string, ExperimentEnvValue>

export const ADMIN_AI_EXPERIMENT_ENABLED_ENV_KEY = 'VITE_ADMIN_AI_EXPERIMENT_ENABLED'

function readBoolean(value: ExperimentEnvValue): boolean {
  return value === true || value === 'true'
}

function readMode(source: ExperimentEnvSource): string {
  return typeof source.MODE === 'string' ? source.MODE : ''
}

export function isAdminAiExperimentEnabled(source: ExperimentEnvSource): boolean {
  const isDevRuntime = readBoolean(source.DEV) || readMode(source) === 'development'
  return isDevRuntime && readBoolean(source[ADMIN_AI_EXPERIMENT_ENABLED_ENV_KEY])
}
