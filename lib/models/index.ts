import { geminiModels } from "./data/gemini"
import { ModelConfig } from "./types"

// Static models (always available) - all route through AI Gateway
const STATIC_MODELS: ModelConfig[] = [...geminiModels]

// Single model routed through AI Gateway
export async function getAllModels(): Promise<ModelConfig[]> {
  return STATIC_MODELS
}

export async function getModelsWithAccessFlags(): Promise<ModelConfig[]> {
  const models = await getAllModels()

  return models.map((model) => ({
    ...model,
    accessible: true,
  }))
}

export async function getModelsForProvider(
  _provider: string
): Promise<ModelConfig[]> {
  const models = STATIC_MODELS

  return models.map((model) => ({
    ...model,
    accessible: true,
  }))
}

// Function to get models based on user's available providers
export async function getModelsForUserProviders(
  _providers: string[]
): Promise<ModelConfig[]> {
  return STATIC_MODELS
}

// Synchronous function to get model info for simple lookups
export function getModelInfo(modelId: string): ModelConfig | undefined {
  return STATIC_MODELS.find((model) => model.id === modelId)
}

// For backward compatibility - static models only
export const MODELS: ModelConfig[] = STATIC_MODELS

// Function to refresh the models cache (no-op now)
export function refreshModelsCache(): void {
  // No-op: models are now static
}
