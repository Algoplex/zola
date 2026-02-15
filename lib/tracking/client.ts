"use client"

export interface ClientFingerprint {
  screenWidth: number
  screenHeight: number
  screenColorDepth: number
  devicePixelRatio: number
  viewportWidth: number
  viewportHeight: number
  cpuCores: number
  deviceMemory: number
  hasTouch: boolean
  maxTouchPoints: number
  gpuRenderer: string
  gpuVendor: string
  language: string
  languages: string
  timezone: string
  timezoneOffset: number
  connectionType: string
  downlinkMbps: number
  rttMs: number
  canvasFingerprint: string
  audioFingerprint: string
  webglFingerprint: string
  doNotTrack: boolean
  cookiesEnabled: boolean
}

/**
 * Generate canvas fingerprint
 */
function generateCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return ""

    canvas.width = 200
    canvas.height = 50

    // Draw various elements that vary by browser/OS
    ctx.textBaseline = "top"
    ctx.font = "14px Arial"
    ctx.textBaseline = "alphabetic"
    ctx.fillStyle = "#f60"
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = "#069"
    ctx.fillText("Zola", 2, 15)
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)"
    ctx.fillText("Zola", 4, 17)

    return canvas.toDataURL()
  } catch {
    return ""
  }
}

/**
 * Generate audio context fingerprint
 */
function generateAudioFingerprint(): string {
  try {
    const audioCtx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )()
    const oscillator = audioCtx.createOscillator()
    const analyser = audioCtx.createAnalyser()
    const gain = audioCtx.createGain()
    const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1)

    gain.gain.value = 0
    oscillator.type = "triangle"
    oscillator.connect(analyser)
    analyser.connect(scriptProcessor)
    scriptProcessor.connect(gain)
    gain.connect(audioCtx.destination)

    oscillator.start(0)

    const fingerprint = scriptProcessor.onaudioprocess?.toString() || ""

    oscillator.stop()
    audioCtx.close()

    return btoa(fingerprint.slice(0, 100))
  } catch {
    return ""
  }
}

/**
 * Get WebGL renderer and vendor
 */
function getWebGLInfo(): { renderer: string; vendor: string } {
  try {
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") as WebGLRenderingContext | null
    if (!gl) return { renderer: "", vendor: "" }

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info")
    if (!debugInfo) return { renderer: "", vendor: "" }

    return {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
    }
  } catch {
    return { renderer: "", vendor: "" }
  }
}

/**
 * Get network connection info
 */
function getNetworkInfo(): {
  type: string
  downlink: number
  rtt: number
} {
  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection

  if (!connection) {
    return { type: "", downlink: 0, rtt: 0 }
  }

  return {
    type: connection.effectiveType || connection.type || "",
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
  }
}

/**
 * Collect all client-side fingerprinting data
 */
export async function collectFingerprint(): Promise<ClientFingerprint> {
  const webgl = getWebGLInfo()
  const network = getNetworkInfo()

  return {
    // Screen
    screenWidth: screen.width,
    screenHeight: screen.height,
    screenColorDepth: screen.colorDepth,
    devicePixelRatio: window.devicePixelRatio,

    // Viewport
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,

    // Hardware
    cpuCores: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory || 0,
    hasTouch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    maxTouchPoints: navigator.maxTouchPoints || 0,

    // GPU
    gpuRenderer: webgl.renderer,
    gpuVendor: webgl.vendor,

    // Locale
    language: navigator.language,
    languages: navigator.languages?.join(",") || "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),

    // Network
    connectionType: network.type,
    downlinkMbps: network.downlink,
    rttMs: network.rtt,

    // Fingerprints
    canvasFingerprint: generateCanvasFingerprint(),
    audioFingerprint: generateAudioFingerprint(),
    webglFingerprint: webgl.renderer + webgl.vendor,

    // Flags
    doNotTrack: navigator.doNotTrack === "1" || navigator.doNotTrack === "yes",
    cookiesEnabled: navigator.cookieEnabled,
  }
}

/**
 * Send fingerprint data to the server to update session
 */
export async function sendFingerprintToServer(): Promise<void> {
  try {
    const fingerprint = await collectFingerprint()

    await fetch("/api/tracking/fingerprint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fingerprint),
    })
  } catch (error) {
    console.error("Failed to send fingerprint:", error)
  }
}
