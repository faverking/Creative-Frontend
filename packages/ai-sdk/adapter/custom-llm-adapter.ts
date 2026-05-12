export class CustomLlmAdapter {
  constructor(private readonly provider = 'custom-provider') {}

  getProvider(): string {
    return this.provider
  }
}
