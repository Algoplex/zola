import { createChatInDb as createChat } from "@/lib/db/chat"

type CreateChatInput = {
  userId: string
  title?: string
  model: string
  isAuthenticated: boolean
  projectId?: string
}

export async function createChatInDb({
  userId,
  title,
  model,
  isAuthenticated,
}: CreateChatInput) {
  // No auth required - session-based only
  return await createChat({ title, model })
}
