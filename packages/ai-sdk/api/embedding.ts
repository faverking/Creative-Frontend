import type { AiClient } from './client'

export async function embedding(client: AiClient, text: string): Promise<number[]> {
  const score = client.getEndpoint().length + text.length
  return [score]
}
