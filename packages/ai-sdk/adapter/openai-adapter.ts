export class OpenAiAdapter {
  constructor(private readonly model = 'gpt-4o-mini') {}

  getModel(): string {
    return this.model
  }
}
