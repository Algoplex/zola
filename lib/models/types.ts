// AI SDK v6 uses duck typing - the model just needs to have the right methods
type LanguageModel = any

type ModelConfig = {
  id: string // "gemini-3-flash-preview"
  name: string // "Gemini 3 Flash Preview"
  provider: string // "Google"
  providerId: string // "google"
  modelFamily?: string // "Gemini"
  baseProviderId: string // "google"

  description?: string // Short 1–2 line summary
  tags?: string[] // ["fast", "vision", "multimodal"]

  contextWindow?: number // in tokens
  inputCost?: number // USD per 1M input tokens
  outputCost?: number // USD per 1M output tokens
  priceUnit?: string // "per 1M tokens"

  vision?: boolean
  tools?: boolean
  audio?: boolean
  reasoningText?: boolean
  webSearch?: boolean
  openSource?: boolean

  speed?: "Fast" | "Medium" | "Slow"
  intelligence?: "Low" | "Medium" | "High"

  website?: string
  apiDocs?: string
  modelPage?: string
  releasedAt?: string

  icon?: string

  apiSdk?: () => LanguageModel

  accessible?: boolean
}

export type { ModelConfig }
