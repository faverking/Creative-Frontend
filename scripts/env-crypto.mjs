import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

const FORMAT_VERSION = 'v1'
const IV_BYTE_LENGTH = 12

function deriveAesKey(secret) {
  if (typeof secret !== 'string' || secret.length === 0) {
    throw new Error('Missing encryption secret.')
  }

  return createHash('sha256').update(secret, 'utf8').digest()
}

export function encryptEnvValue(plainText, secret) {
  if (typeof plainText !== 'string' || plainText.length === 0) {
    throw new Error('Missing plaintext env value.')
  }

  const iv = randomBytes(IV_BYTE_LENGTH)
  const cipher = createCipheriv('aes-256-gcm', deriveAesKey(secret), iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [
    FORMAT_VERSION,
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64')
  ].join(':')
}

export function decryptEnvValue(encryptedValue, secret) {
  const [version, iv, authTag, encrypted] = encryptedValue.split(':')

  if (version !== FORMAT_VERSION || !iv || !authTag || !encrypted) {
    throw new Error(`Unsupported encrypted env value format: ${version || 'empty'}.`)
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    deriveAesKey(secret),
    Buffer.from(iv, 'base64')
  )
  decipher.setAuthTag(Buffer.from(authTag, 'base64'))

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64')),
    decipher.final()
  ]).toString('utf8')
}
