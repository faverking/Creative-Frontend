import type { AiClient } from './client'

export async function chat(client: AiClient, prompt: string): Promise<string> {
  return `placeholder response from ${client.getEndpoint()} for: ${prompt}`
}
