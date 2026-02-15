import {
  logUserMessage as saveUserMessage,
  storeAssistantMessage as saveAssistantMessage,
} from "@/lib/db/chat"
import { sanitizeUserInput } from "@/lib/sanitize"
import { getSessionId } from "@/lib/sessions"
import type {
  ChatApiParams,
  LogUserMessageParams,
  StoreAssistantMessageParams,
} from "@/app/types/api.types"

export async function validateAndTrackUsage({
  userId,
  model,
  isAuthenticated,
}: ChatApiParams): Promise<string | null> {
  // No auth required - session-based only
  // Usage tracking can be added later if needed
  return userId
}

export async function incrementMessageCount({
  userId,
}: {
  userId: string
}): Promise<void> {
  // Usage tracking can be added later if needed
}

export async function logUserMessage({
  userId,
  chatId,
  content,
  attachments,
  model,
  isAuthenticated,
  message_group_id,
}: LogUserMessageParams): Promise<void> {
  await saveUserMessage({
    chatId,
    content: sanitizeUserInput(content),
    role: "user",
    model,
    experimentalAttachments: attachments,
    messageGroupId: message_group_id,
  })
}

export async function storeAssistantMessage({
  chatId,
  messages,
  message_group_id,
  model,
}: StoreAssistantMessageParams): Promise<void> {
  // Transform messages to match the expected format
  const transformedMessages = messages.map((msg) => ({
    role: msg.role,
    content: typeof msg.content === "string" ? msg.content : "",
    parts:
      typeof msg.content === "object" && Array.isArray(msg.content)
        ? msg.content
        : undefined,
  }))

  await saveAssistantMessage({
    chatId,
    messages: transformedMessages,
    messageGroupId: message_group_id,
    model,
  })
}
