import type { AiClient } from './client'

export async function completion(client: AiClient, prompt: string): Promise<string> {
  return `completion placeholder from ${client.getEndpoint()} for: ${prompt}`
}
