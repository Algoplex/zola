import { fetchClient } from "./fetch"
import { API_ROUTE_UPDATE_CHAT_MODEL } from "./routes"

/**
 * Stub: Rate limiting is not enforced in session-based mode
 */
export async function checkRateLimits(
  _userId: string,
  _isAuthenticated: boolean
) {
  // Return success - no rate limiting in session mode
  return { allowed: true, remaining: 9999, remainingPro: 9999 }
}

/**
 * Stub: Guest users are not used in session-based mode
 */
export async function getOrCreateGuestUserId(
  _user: unknown
): Promise<string | null> {
  if (typeof _user === "object" && _user && "id" in _user) {
    const userId = (_user as { id?: string }).id
    if (userId) return userId
  }

  if (typeof document === "undefined") return null

  const sessionId = document.cookie
    .split("; ")
    .find((c) => c.startsWith("zola_sid="))
    ?.split("=")[1]

  return sessionId || null
}

/**
 * Updates the model for an existing chat
 */
export async function updateChatModel(chatId: string, model: string) {
  try {
    const res = await fetchClient(API_ROUTE_UPDATE_CHAT_MODEL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, model }),
    })
    const responseData = await res.json()

    if (!res.ok) {
      throw new Error(
        responseData.error ||
          `Failed to update chat model: ${res.status} ${res.statusText}`
      )
    }

    return responseData
  } catch (error) {
    console.error("Error updating chat model:", error)
    throw error
  }
}
