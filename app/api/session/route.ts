import { getOrCreateSession } from "@/lib/sessions"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const session = await getOrCreateSession()
    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error("Error initializing session:", error)
    return NextResponse.json(
      { error: "Failed to initialize session" },
      { status: 500 }
    )
  }
}
