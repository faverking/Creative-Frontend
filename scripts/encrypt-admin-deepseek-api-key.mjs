import { encryptEnvValue } from './env-crypto.mjs'

const apiKey = process.env.ADMIN_DEEPSEEK_API_KEY
const encryptionKey = process.env.ADMIN_DEEPSEEK_API_KEY_ENCRYPTION_KEY

if (!apiKey) {
  throw new Error('Missing ADMIN_DEEPSEEK_API_KEY.')
}

if (!encryptionKey) {
  throw new Error('Missing ADMIN_DEEPSEEK_API_KEY_ENCRYPTION_KEY.')
}

console.log(encryptEnvValue(apiKey, encryptionKey))
