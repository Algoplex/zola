import { getModelsWithAccessFlags, refreshModelsCache } from "@/lib/models"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const models = await getModelsWithAccessFlags()
    return NextResponse.json({ models })
  } catch (error) {
    console.error("Error fetching models:", error)
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    refreshModelsCache()
    const models = await getModelsWithAccessFlags()

    return NextResponse.json({
      message: "Models cache refreshed",
      models,
      timestamp: new Date().toISOString(),
      count: models.length,
    })
  } catch (error) {
    console.error("Failed to refresh models:", error)
    return NextResponse.json(
      { error: "Failed to refresh models" },
      { status: 500 }
    )
  }
}
