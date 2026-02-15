import { NextRequest, NextResponse } from "next/server"
import { getChatsForSession, getMessagesForChat } from "@/lib/db/chat"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const chatId = url.pathname.split("/").pop()

    if (chatId && chatId !== "chats") {
      // Get a single chat with messages
      const { getChatById } = await import("@/lib/db/chat")
      const chat = await getChatById(chatId)

      if (!chat) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 })
      }

      const messages = await getMessagesForChat(chatId)
      return NextResponse.json({ chat, messages })
    }

    // Get all chats
    const chats = await getChatsForSession()
    return NextResponse.json({ chats })
  } catch (error) {
    console.error("Error in /api/chats:", error)
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    )
  }
}
