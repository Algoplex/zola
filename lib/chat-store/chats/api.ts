import { readFromIndexedDB, writeToIndexedDB } from "@/lib/chat-store/persist"
import type { Chat, Chats } from "@/lib/chat-store/types"
import { MODEL_DEFAULT } from "../../config"
import { fetchClient } from "../../fetch"
import {
  API_ROUTE_TOGGLE_CHAT_PIN,
  API_ROUTE_UPDATE_CHAT_MODEL,
} from "../../routes"

export async function getChatsFromServer(): Promise<Chats[]> {
  // Fetch from API which uses Drizzle
  try {
    const res = await fetchClient("/api/chats", { method: "GET" })
    if (res.ok) {
      const data = await res.json()
      const chats = (Array.isArray(data.chats) ? data.chats : []).filter(
        Boolean
      )
      // Cache the results
      if (chats.length > 0) {
        await writeToIndexedDB("chats", chats)
      }
      return chats
    }
  } catch (error) {
    console.error("Failed to fetch chats from server:", error)
  }

  // Fallback to cached
  return getCachedChats()
}

// Alias for backwards compatibility with provider
export async function fetchAndCacheChats(_userId?: string): Promise<Chats[]> {
  return getChatsFromServer()
}

export async function getCachedChats(): Promise<Chats[]> {
  const all = await readFromIndexedDB<Chats>("chats")
  return (all as Chats[])
    .filter(Boolean)
    .sort(
      (a, b) => +new Date(b.createdAt || "") - +new Date(a.createdAt || "")
    )
}

export async function updateChatTitle(
  id: string,
  title: string
): Promise<void> {
  // Update locally for now
  const all = await getCachedChats()
  const updated = (all as Chats[]).map((c) =>
    c.id === id ? { ...c, title } : c
  )
  await writeToIndexedDB("chats", updated)
}

export async function deleteChat(id: string): Promise<void> {
  const all = await getCachedChats()
  await writeToIndexedDB(
    "chats",
    (all as Chats[]).filter((c) => c.id !== id)
  )
}

export async function getChat(chatId: string): Promise<Chat | null> {
  // First check cache
  const all = await readFromIndexedDB<Chat>("chats")
  const cached = (all as Chat[]).find((c) => c.id === chatId)
  if (cached) return cached

  // Then try server
  try {
    const res = await fetchClient(`/api/chats/${chatId}`, { method: "GET" })
    if (res.ok) {
      const data = await res.json()
      return data.chat
    }
  } catch (error) {
    console.error("Failed to fetch chat from server:", error)
  }

  return null
}

export async function createNewChat(
  title?: string,
  model?: string
): Promise<Chats> {
  try {
    const res = await fetchClient("/api/create-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || "New Chat",
        model: model || MODEL_DEFAULT,
      }),
    })

    const responseData = await res.json()

    if (!res.ok || !responseData.chat) {
      throw new Error(responseData.error || "Failed to create chat")
    }

    const chat: Chats = {
      id: responseData.chat.id,
      title: responseData.chat.title,
      createdAt: responseData.chat.createdAt,
      model: responseData.chat.model,
      sessionId: responseData.chat.sessionId,
      updatedAt: responseData.chat.updatedAt,
      pinned: responseData.chat.pinned ?? false,
      pinnedAt: responseData.chat.pinnedAt ?? null,
    }

    await writeToIndexedDB("chats", chat)
    return chat
  } catch (error) {
    console.error("Error creating new chat:", error)
    throw error
  }
}

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

    const all = await getCachedChats()
    const updated = (all as Chats[]).map((c) =>
      c.id === chatId ? { ...c, model } : c
    )
    await writeToIndexedDB("chats", updated)

    return responseData
  } catch (error) {
    console.error("Error updating chat model:", error)
    throw error
  }
}

export async function toggleChatPin(chatId: string, pinned: boolean) {
  try {
    const res = await fetchClient(API_ROUTE_TOGGLE_CHAT_PIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, pinned }),
    })
    const responseData = await res.json()
    if (!res.ok) {
      throw new Error(
        responseData.error ||
          `Failed to update pinned: ${res.status} ${res.statusText}`
      )
    }
    const all = await getCachedChats()
    const now = new Date().toISOString()
    const updated = (all as Chats[]).map((c) =>
      c.id === chatId ? { ...c, pinned, pinned_at: pinned ? now : null } : c
    )
    await writeToIndexedDB("chats", updated)
    return responseData
  } catch (error) {
    console.error("Error updating chat pinned:", error)
    throw error
  }
}
