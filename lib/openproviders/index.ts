import { gateway } from "ai"

// Model IDs should be in format "provider/model-id" (e.g., "openai/gpt-4o", "google/gemini-2.0-flash")
export function openproviders(
  modelId: string,
  _settings?: unknown,
  _apiKey?: string
) {
  return gateway(modelId)
}

// Export gateway for direct use
export { gateway }

// API route handler for provider status
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json()

    // With AI Gateway, we only have one provider configuration
    const hasGatewayKey = Boolean(process.env.AI_GATEWAY_API_KEY)

    return NextResponse.json({
      hasUserKey: hasGatewayKey,
      provider,
    })
  } catch (error) {
    console.error("Error checking provider keys:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
