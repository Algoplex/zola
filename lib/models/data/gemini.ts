import { gateway } from "ai"
import { ModelConfig } from "../types"

const geminiModels: ModelConfig[] = [
  {
    id: "gemini-3-flash-preview",
    name: "ChatGPT EU",
    provider: "Google",
    providerId: "google",
    modelFamily: "Gemini",
    baseProviderId: "google",
    description: "Fast and capable model for most tasks",
    tags: ["fast", "vision", "multimodal"],
    contextWindow: 1000000,
    inputCost: 0.0,
    outputCost: 0.0,
    priceUnit: "per 1M tokens",
    vision: true,
    tools: true,
    audio: false,
    openSource: false,
    accessible: true,
    speed: "Fast",
    website: "https://deepmind.google",
    apiDocs: "https://ai.google.dev/docs",
    modelPage: "https://deepmind.google",
    icon: "openai",
    apiSdk: () => gateway("google/gemini-3-flash-preview"),
  },
]

export { geminiModels }
