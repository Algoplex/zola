// AI SDK 6 types - defined locally since Message type no longer exported
import { readFromIndexedDB, writeToIndexedDB } from "../persist"

export interface MessageAI {
  role: "user" | "assistant" | "system"
  content: string
  id: string
  createdAt?: Date
  parts: any
  /* FIXME(@ai-sdk-upgrade-v5): The `experimental_attachments` property has been replaced with the parts array. Please manually migrate following https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0#attachments--file-parts */
  experimental_attachments?: unknown[]
}

export interface ExtendedMessageAI extends MessageAI {
  message_group_id?: string
  model?: string
}

// Alias for SDK usage in components
export type ExtendedMessageAISDK = ExtendedMessageAI

export async function getMessagesFromDb(chatId: string): Promise<MessageAI[]> {
  // Use local cache only
  const cached = await getCachedMessages(chatId)
  return cached
}

export async function getLastMessagesFromDb(
  chatId: string,
  limit: number = 2
): Promise<MessageAI[]> {
  // Use local cache only
  const cached = await getCachedMessages(chatId)
  return cached.slice(-limit)
}

async function insertMessageToDb(chatId: string, message: ExtendedMessageAI) {
  // No-op: using local cache only
}

async function insertMessagesToDb(
  chatId: string,
  messages: ExtendedMessageAI[]
) {
  // No-op: using local cache only
}

async function deleteMessagesFromDb(chatId: string) {
  // No-op: using local cache only
}

type ChatMessageEntry = {
  id: string
  messages: MessageAI[]
}

export async function getCachedMessages(chatId: string): Promise<MessageAI[]> {
  const entry = await readFromIndexedDB<ChatMessageEntry>("messages", chatId)

  if (!entry || Array.isArray(entry)) return []

  return (entry.messages || []).sort(
    (a, b) => +new Date(a.createdAt || 0) - +new Date(b.createdAt || 0)
  )
}

export async function cacheMessages(
  chatId: string,
  messages: MessageAI[]
): Promise<void> {
  await writeToIndexedDB("messages", { id: chatId, messages })
}

export async function addMessage(
  chatId: string,
  message: MessageAI
): Promise<void> {
  await insertMessageToDb(chatId, message)
  const current = await getCachedMessages(chatId)
  const updated = [...current, message]

  await writeToIndexedDB("messages", { id: chatId, messages: updated })
}

export async function setMessages(
  chatId: string,
  messages: MessageAI[]
): Promise<void> {
  await insertMessagesToDb(chatId, messages)
  await writeToIndexedDB("messages", { id: chatId, messages })
}

export async function clearMessagesCache(chatId: string): Promise<void> {
  await writeToIndexedDB("messages", { id: chatId, messages: [] })
}

export async function clearMessagesForChat(chatId: string): Promise<void> {
  await deleteMessagesFromDb(chatId)
  await clearMessagesCache(chatId)
}
