import {
  db,
  chats,
  messages,
  sessions,
  type Chat,
  type Message,
} from "@/lib/db"
import { eq, desc } from "drizzle-orm"
import { getSessionId } from "@/lib/sessions"

/**
 * Create a new chat for the current session
 */
export async function createChatInDb({
  title,
  model,
}: {
  title?: string
  model: string
}): Promise<Chat | null> {
  const sessionId = await getSessionId()

  if (!sessionId) {
    console.error("No session found when creating chat")
    return null
  }

  try {
    const [chat] = await db
      .insert(chats)
      .values({
        sessionId,
        title: title || "New Chat",
        model,
      })
      .returning()

    return chat
  } catch (error) {
    console.error("Error creating chat:", error)
    return null
  }
}

/**
 * Get all chats for the current session
 */
export async function getChatsForSession(): Promise<Chat[]> {
  const sessionId = await getSessionId()

  if (!sessionId) {
    return []
  }

  try {
    return await db
      .select()
      .from(chats)
      .where(eq(chats.sessionId, sessionId))
      .orderBy(desc(chats.createdAt))
  } catch (error) {
    console.error("Error fetching chats:", error)
    return []
  }
}

/**
 * Get a specific chat by ID
 */
export async function getChatById(chatId: string): Promise<Chat | null> {
  const sessionId = await getSessionId()

  if (!sessionId) {
    return null
  }

  try {
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1)

    // Verify the chat belongs to this session
    if (chat && chat.sessionId === sessionId) {
      return chat
    }
    return null
  } catch (error) {
    console.error("Error fetching chat:", error)
    return null
  }
}

/**
 * Update a chat
 */
export async function updateChatInDb(
  chatId: string,
  updates: Partial<
    Pick<Chat, "title" | "model" | "pinned" | "pinnedAt" | "updatedAt">
  >
): Promise<Chat | null> {
  const sessionId = await getSessionId()

  if (!sessionId) {
    return null
  }

  try {
    const [chat] = await db
      .update(chats)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(chats.id, chatId))
      .returning()

    return chat
  } catch (error) {
    console.error("Error updating chat:", error)
    return null
  }
}

/**
 * Delete a chat
 */
export async function deleteChatFromDb(chatId: string): Promise<boolean> {
  const sessionId = await getSessionId()

  if (!sessionId) {
    return false
  }

  try {
    await db.delete(chats).where(eq(chats.id, chatId))
    return true
  } catch (error) {
    console.error("Error deleting chat:", error)
    return false
  }
}

/**
 * Get messages for a chat
 */
export async function getMessagesForChat(chatId: string): Promise<Message[]> {
  const sessionId = await getSessionId()

  if (!sessionId) {
    return []
  }

  try {
    // Verify the chat belongs to this session first
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1)

    if (!chat || chat.sessionId !== sessionId) {
      return []
    }

    return await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return []
  }
}

/**
 * Save a user message
 */
export async function logUserMessage({
  chatId,
  content,
  role = "user",
  model,
  parts,
  experimentalAttachments,
  messageGroupId,
}: {
  chatId: string
  content: string
  role?: "user" | "assistant" | "system"
  model?: string
  parts?: any
  experimentalAttachments?: any
  messageGroupId?: string
}): Promise<Message | null> {
  const sessionId = await getSessionId()

  if (!sessionId) {
    return null
  }

  try {
    const [message] = await db
      .insert(messages)
      .values({
        chatId,
        sessionId,
        role,
        content,
        model,
        parts,
        experimentalAttachments,
        messageGroupId,
      })
      .returning()

    return message
  } catch (error) {
    console.error("Error saving message:", error)
    return null
  }
}

/**
 * Save assistant message(s)
 */
export async function storeAssistantMessage({
  chatId,
  messages: assistantMessages,
  messageGroupId,
  model,
}: {
  chatId: string
  messages: Array<{ role: string; content: string; parts?: any }>
  messageGroupId?: string
  model?: string
}): Promise<void> {
  const sessionId = await getSessionId()

  if (!sessionId) {
    return
  }

  try {
    for (const msg of assistantMessages) {
      await db.insert(messages).values({
        chatId,
        sessionId,
        role: msg.role,
        content: msg.content,
        parts: msg.parts,
        model,
        messageGroupId,
      })
    }
  } catch (error) {
    console.error("Error saving assistant messages:", error)
  }
}

/**
 * Toggle chat pin status
 */
export async function toggleChatPin(chatId: string): Promise<Chat | null> {
  const sessionId = await getSessionId()

  if (!sessionId) {
    return null
  }

  try {
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1)

    if (!chat || chat.sessionId !== sessionId) {
      return null
    }

    const newPinned = !chat.pinned

    const [updated] = await db
      .update(chats)
      .set({
        pinned: newPinned,
        pinnedAt: newPinned ? new Date() : null,
      })
      .where(eq(chats.id, chatId))
      .returning()

    return updated
  } catch (error) {
    console.error("Error toggling pin:", error)
    return null
  }
}

/**
 * Delete messages after a cutoff timestamp (for editing)
 */
export async function deleteMessagesAfterCutoff(
  chatId: string,
  cutoffTimestamp: string
): Promise<boolean> {
  const sessionId = await getSessionId()

  if (!sessionId) {
    return false
  }

  try {
    await db.delete(messages).where(
      eq(messages.chatId, chatId) &&
        // Note: Drizzle doesn't support gte on timestamp directly in delete
        // Need to use a raw query or adjust the logic
        undefined // TODO: implement proper cutoff deletion
    )
    return true
  } catch (error) {
    console.error("Error deleting messages:", error)
    return false
  }
}
