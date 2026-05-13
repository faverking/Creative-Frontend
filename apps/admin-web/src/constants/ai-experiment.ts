type ExperimentEnvValue = string | boolean | undefined
type ExperimentEnvSource = Record<string, ExperimentEnvValue>

export const ADMIN_AI_EXPERIMENT_ENABLED_ENV_KEY = 'VITE_ADMIN_AI_EXPERIMENT_ENABLED'

function readBoolean(value: ExperimentEnvValue): boolean {
  return value === true || value === 'true'
}

export function isAdminAiExperimentEnabled(source: ExperimentEnvSource): boolean {
  return readBoolean(source[ADMIN_AI_EXPERIMENT_ENABLED_ENV_KEY])
}
