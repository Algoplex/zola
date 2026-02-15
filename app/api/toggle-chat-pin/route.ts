import { NextRequest, NextResponse } from "next/server"
import { toggleChatPin } from "@/lib/db/chat"

export async function POST(request: NextRequest) {
  try {
    const { chatId } = await request.json()

    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 })
    }

    const chat = await toggleChatPin(chatId)

    if (!chat) {
      return NextResponse.json(
        { error: "Failed to toggle pin or chat not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, chat })
  } catch (error) {
    console.error("toggle-chat-pin unhandled error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
