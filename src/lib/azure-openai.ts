import { AzureOpenAI } from 'openai'

// Single client for GPT-4o (chat completions, treatment plan, summary)
export function getAzureGPT() {
  return new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION ?? '2024-12-01-preview',
    deployment: process.env.AZURE_OPENAI_GPT4O_DEPLOYMENT ?? 'gpt-4o',
  })
}
