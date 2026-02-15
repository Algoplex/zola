import { NextRequest, NextResponse } from "next/server"
import { updateChatInDb } from "@/lib/db/chat"

export async function POST(request: NextRequest) {
  try {
    const { chatId, model } = await request.json()

    if (!chatId || !model) {
      return NextResponse.json(
        { error: "Missing chatId or model" },
        { status: 400 }
      )
    }

    const chat = await updateChatInDb(chatId, { model })

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, chat })
  } catch (err: unknown) {
    console.error("Error in update-chat-model endpoint:", err)
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    )
  }
}
