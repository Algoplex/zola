import { getOrCreateSession } from "@/lib/sessions"
import { getTrackingDataWithParsing } from "@/lib/tracking/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get server-side tracking data
    const serverData = getTrackingDataWithParsing(request)

    // Get client-side fingerprint from body
    const clientData = await request.json()

    // Merge server and client data
    const sessionData = {
      ...serverData,
      ipAddress: serverData.ip,
      deviceType: serverData.deviceType,
      isBot: serverData.isBot,
      screenWidth: clientData.screenWidth,
      screenHeight: clientData.screenHeight,
      screenColorDepth: clientData.screenColorDepth,
      devicePixelRatio: clientData.devicePixelRatio,
      viewportWidth: clientData.viewportWidth,
      viewportHeight: clientData.viewportHeight,
      cpuCores: clientData.cpuCores,
      deviceMemory: clientData.deviceMemory,
      hasTouch: clientData.hasTouch,
      maxTouchPoints: clientData.maxTouchPoints,
      gpuRenderer: clientData.gpuRenderer,
      gpuVendor: clientData.gpuVendor,
      language: clientData.language,
      languages: clientData.languages,
      timezone: clientData.timezone,
      timezoneOffset: clientData.timezoneOffset,
      connectionType: clientData.connectionType,
      downlinkMbps: clientData.downlinkMbps,
      rttMs: clientData.rttMs,
      canvasFingerprint: clientData.canvasFingerprint,
      audioFingerprint: clientData.audioFingerprint,
      webglFingerprint: clientData.webglFingerprint,
      doNotTrack: clientData.doNotTrack,
      cookiesEnabled: clientData.cookiesEnabled,
    }

    // Create or update session with all data
    await getOrCreateSession(sessionData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in fingerprint endpoint:", error)
    return NextResponse.json(
      { error: "Failed to save fingerprint" },
      { status: 500 }
    )
  }
}
