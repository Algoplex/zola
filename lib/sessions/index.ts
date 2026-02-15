import {
  db,
  deviceTypeEnum,
  sessions,
  type NewSession,
  type Session,
} from "@/lib/db"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"

// Type for deviceType enum values
type DeviceType = "desktop" | "mobile" | "tablet" | "bot" | "unknown"

const SESSION_COOKIE_NAME = "zola_sid"
const SESSION_MAX_AGE = 60 * 60 * 24 * 365 // 1 year in seconds

// Retry helper for handling transient connection errors
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      const message = lastError.message.toLowerCase()
      // Only retry on connection-related errors
      if (
        !message.includes("connection") &&
        !message.includes("timeout") &&
        !message.includes("econn")
      ) {
        throw error
      }
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)))
      }
    }
  }
  throw lastError
}

export interface SessionData {
  id: string
  ipAddress?: string
  countryCode?: string
  region?: string
  city?: string
  isp?: string
  asn?: number
  userAgent?: string
  browser?: string
  browserVersion?: string
  os?: string
  osVersion?: string
  deviceType?: string
  screenWidth?: number
  screenHeight?: number
  screenColorDepth?: number
  devicePixelRatio?: number
  viewportWidth?: number
  viewportHeight?: number
  cpuCores?: number
  deviceMemory?: number
  hasTouch?: boolean
  maxTouchPoints?: number
  gpuRenderer?: string
  gpuVendor?: string
  language?: string
  languages?: string
  timezone?: string
  timezoneOffset?: number
  connectionType?: string
  downlinkMbps?: number
  rttMs?: number
  canvasFingerprint?: string
  audioFingerprint?: string
  webglFingerprint?: string
  acceptLanguage?: string
  accept?: string
  acceptEncoding?: string
  referer?: string
  doNotTrack?: boolean
  cookiesEnabled?: boolean
  isBot?: boolean
}

function generateSessionId(): string {
  return crypto.randomUUID()
}

export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)
  return sessionCookie?.value || null
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    maxAge: SESSION_MAX_AGE,
    path: "/",
    httpOnly: false, // Need JS access for fingerprinting
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  })
}

export async function getOrCreateSession(
  data?: Partial<SessionData>
): Promise<Session> {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (sessionId) {
    // Capture sessionId for use in async callback
    const currentSessionId = sessionId

    // Try to get existing session with retry
    const [existing] = await withRetry(async () => {
      return await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, currentSessionId))
        .limit(1)
    })

    if (existing) {
      // Update last active and any new data
      await withRetry(async () => {
        return await db
          .update(sessions)
          .set({
            lastActiveAt: new Date(),
            ...(data && {
              ipAddress: data.ipAddress,
              countryCode: data.countryCode,
              region: data.region,
              city: data.city,
              isp: data.isp,
              asn: data.asn,
              userAgent: data.userAgent,
              browser: data.browser,
              browserVersion: data.browserVersion,
              os: data.os,
              osVersion: data.osVersion,
              deviceType: (data.deviceType || "unknown") as DeviceType,
              screenWidth: data.screenWidth,
              screenHeight: data.screenHeight,
              screenColorDepth: data.screenColorDepth,
              devicePixelRatio: data.devicePixelRatio,
              viewportWidth: data.viewportWidth,
              viewportHeight: data.viewportHeight,
              cpuCores: data.cpuCores,
              deviceMemory: data.deviceMemory,
              hasTouch: data.hasTouch,
              maxTouchPoints: data.maxTouchPoints,
              gpuRenderer: data.gpuRenderer,
              gpuVendor: data.gpuVendor,
              language: data.language,
              languages: data.languages,
              timezone: data.timezone,
              timezoneOffset: data.timezoneOffset,
              connectionType: data.connectionType,
              downlinkMbps: data.downlinkMbps,
              rttMs: data.rttMs,
              canvasFingerprint: data.canvasFingerprint,
              audioFingerprint: data.audioFingerprint,
              webglFingerprint: data.webglFingerprint,
              acceptLanguage: data.acceptLanguage,
              accept: data.accept,
              acceptEncoding: data.acceptEncoding,
              referer: data.referer,
              doNotTrack: data.doNotTrack,
              cookiesEnabled: data.cookiesEnabled,
              isBot: data.isBot,
            }),
          })
          .where(eq(sessions.id, currentSessionId))
      })

      return existing
    }
  }

  // Create new session
  sessionId = generateSessionId()
  const newSession: NewSession = {
    id: sessionId as any,
    ipAddress: data?.ipAddress,
    countryCode: data?.countryCode,
    region: data?.region,
    city: data?.city,
    isp: data?.isp,
    asn: data?.asn,
    userAgent: data?.userAgent,
    browser: data?.browser,
    browserVersion: data?.browserVersion,
    os: data?.os,
    osVersion: data?.osVersion,
    deviceType: (data?.deviceType || "unknown") as DeviceType,
    screenWidth: data?.screenWidth,
    screenHeight: data?.screenHeight,
    screenColorDepth: data?.screenColorDepth,
    devicePixelRatio: data?.devicePixelRatio,
    viewportWidth: data?.viewportWidth,
    viewportHeight: data?.viewportHeight,
    cpuCores: data?.cpuCores,
    deviceMemory: data?.deviceMemory,
    hasTouch: data?.hasTouch,
    maxTouchPoints: data?.maxTouchPoints,
    gpuRenderer: data?.gpuRenderer,
    gpuVendor: data?.gpuVendor,
    language: data?.language,
    languages: data?.languages,
    timezone: data?.timezone,
    timezoneOffset: data?.timezoneOffset,
    connectionType: data?.connectionType,
    downlinkMbps: data?.downlinkMbps,
    rttMs: data?.rttMs,
    canvasFingerprint: data?.canvasFingerprint,
    audioFingerprint: data?.audioFingerprint,
    webglFingerprint: data?.webglFingerprint,
    acceptLanguage: data?.acceptLanguage,
    accept: data?.accept,
    acceptEncoding: data?.acceptEncoding,
    referer: data?.referer,
    doNotTrack: data?.doNotTrack,
    cookiesEnabled: data?.cookiesEnabled,
    isBot: data?.isBot,
  }

  await withRetry(async () => {
    return await db.insert(sessions).values(newSession)
  })
  await setSessionCookie(sessionId)

  return newSession as Session
}

export async function getSession(): Promise<Session | null> {
  const sessionId = await getSessionCookie()
  if (!sessionId) return null

  const [session] = await withRetry(async () => {
    return await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1)
  })

  return session || null
}

export async function getSessionId(): Promise<string | null> {
  return getSessionCookie()
}
