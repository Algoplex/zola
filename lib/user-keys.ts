import { env } from "./openproviders/env"
import { Provider } from "./openproviders/types"

export type { Provider } from "./openproviders/types"
export type ProviderWithoutOllama = Exclude<Provider, "ollama">

/**
 * Get user-provided API key for a provider.
 * Currently returns null - user keys are stored client-side in localStorage.
 * Can be extended to store in DB if needed.
 */
export async function getUserKey(
  userId: string,
  provider: ProviderWithoutOllama
): Promise<string | null> {
  // User keys are stored client-side in localStorage for now
  // Can be extended to use DB storage via Drizzle
  return null
}

/**
 * Get effective API key - first checks user key, then falls back to env
 */
export async function getEffectiveApiKey(
  userId: string | null,
  provider: ProviderWithoutOllama
): Promise<string | null> {
  // First check if user provided a key (stored client-side)
  // For now, just use env keys
  const envKeyMap: Record<string, string | undefined> = {
    openai: env.OPENAI_API_KEY,
    mistral: env.MISTRAL_API_KEY,
    perplexity: env.PERPLEXITY_API_KEY,
    google: env.GOOGLE_GENERATIVE_AI_API_KEY,
    anthropic: env.ANTHROPIC_API_KEY,
    xai: env.XAI_API_KEY,
    openrouter: env.OPENROUTER_API_KEY,
  }

  return envKeyMap[provider] || null
}
