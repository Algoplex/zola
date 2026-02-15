import type { Provider } from "./types"

export function getProviderForModel(_model: string): Provider {
  // All models route through AI Gateway
  return "gateway"
}
