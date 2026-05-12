export class AzureOpenAiAdapter {
  constructor(private readonly deployment = 'default-deployment') {}

  getDeployment(): string {
    return this.deployment
  }
}
