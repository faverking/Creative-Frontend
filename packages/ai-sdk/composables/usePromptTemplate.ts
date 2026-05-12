export function usePromptTemplate(template: string) {
  const format = (variables: Record<string, string>) =>
    Object.entries(variables).reduce(
      (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
      template
    )

  return {
    format
  }
}
