import { NextRequest, NextResponse } from "next/server"
import { createChatInDb } from "@/lib/db/chat"

export async function POST(request: NextRequest) {
  try {
    const { title, model } = await request.json()

    if (!model) {
      return NextResponse.json({ error: "Missing model" }, { status: 400 })
    }

    const chat = await createChatInDb({
      title,
      model,
    })

    if (!chat) {
      return NextResponse.json(
        { error: "Failed to create chat" },
        { status: 500 }
      )
    }

    return NextResponse.json({ chat })
  } catch (err: unknown) {
    console.error("Error in create-chat endpoint:", err)

    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    )
  }
}
