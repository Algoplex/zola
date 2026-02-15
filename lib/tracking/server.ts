import { type NextRequest } from "next/server"

export interface RequestMetadata {
  ip?: string
  country?: string
  region?: string
  city?: string
  isp?: string
  asn?: number
  userAgent?: string
  acceptLanguage?: string
  accept?: string
  acceptEncoding?: string
  referer?: string
}

/**
 * Extract client IP from request headers
 * Supports: cf-connecting-ip (Cloudflare), x-forwarded-for, x-real-ip, remoteAddr
 */
export function getClientIp(request: NextRequest): string | undefined {
  // Cloudflare
  const cfIp = request.headers.get("cf-connecting-ip")
  if (cfIp) return cfIp

  // Vercel
  const vercelIp = request.headers.get("x-forwarded-for")
  if (vercelIp) return vercelIp.split(",")[0].trim()

  // Standard
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp

  return undefined
}

/**
 * Extract country code from request headers
 * Cloudflare: cf-ipcountry, Vercel: vercel-country-code
 */
export function getCountryCode(request: NextRequest): string | undefined {
  // Cloudflare
  const cfCountry = request.headers.get("cf-ipcountry")
  if (cfCountry && cfCountry !== "XX") return cfCountry

  // Vercel
  const vercelCountry = request.headers.get("x-vercel-ip-country")
  if (vercelCountry) return vercelCountry

  return undefined
}

/**
 * Extract region/state from request headers
 */
export function getRegion(request: NextRequest): string | undefined {
  // Cloudflare
  const cfRegion = request.headers.get("cf-region")
  if (cfRegion) return cfRegion

  const cfRegionCode = request.headers.get("cf-region-code")
  if (cfRegionCode) return cfRegionCode

  // Vercel
  const vercelRegion = request.headers.get("x-vercel-ip-country-region")
  if (vercelRegion) return vercelRegion

  return undefined
}

/**
 * Extract city from request headers
 */
export function getCity(request: NextRequest): string | undefined {
  // Cloudflare
  const cfCity = request.headers.get("cf-ipcity")
  if (cfCity) return cfCity

  // Vercel
  const vercelCity = request.headers.get("x-vercel-ip-city")
  if (vercelCity) return vercelCity

  return undefined
}

/**
 * Extract ISP from request headers (rare, mostly Cloudflare Enterprise)
 */
export function getIsp(request: NextRequest): string | undefined {
  // Cloudflare Enterprise only
  const cfIsp = request.headers.get("cf-isp")
  if (cfIsp) return cfIsp

  const vercelIsp = request.headers.get("x-vercel-ip-isp")
  if (vercelIsp) return vercelIsp

  return undefined
}

/**
 * Extract ASN from request headers
 */
export function getAsn(request: NextRequest): number | undefined {
  const cfAsn = request.headers.get("cf-asn")
  if (cfAsn) {
    const parsed = Number.parseInt(cfAsn, 10)
    if (Number.isFinite(parsed)) return parsed
  }

  const vercelAsn = request.headers.get("x-vercel-ip-asn")
  if (vercelAsn) {
    const parsed = Number.parseInt(vercelAsn, 10)
    if (Number.isFinite(parsed)) return parsed
  }

  return undefined
}

/**
 * Extract all headers as an object
 */
export function getHeaders(
  request: NextRequest
): Record<string, string | null> {
  const headers: Record<string, string | null> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })
  return headers
}

/**
 * Parse User-Agent to extract browser, OS, device info
 */
export function parseUserAgent(userAgent: string): {
  browser: string
  browserVersion: string
  os: string
  osVersion: string
  deviceType: string
  isBot: boolean
} {
  const ua = userAgent.toLowerCase()

  // Bot detection
  const bots = [
    "bot",
    "spider",
    "crawler",
    "slurp",
    "mediapartners",
    "googlebot",
    "bingbot",
    "yandex",
    "baidu",
    "duckduckbot",
  ]
  const isBot = bots.some((bot) => ua.includes(bot))

  // Browser detection
  let browser = "Unknown"
  let browserVersion = ""

  if (ua.includes("firefox")) {
    browser = "Firefox"
    const match = ua.match(/firefox\/(\d+)/)
    browserVersion = match?.[1] || ""
  } else if (ua.includes("edg/")) {
    browser = "Edge"
    const match = ua.match(/edg\/(\d+)/)
    browserVersion = match?.[1] || ""
  } else if (ua.includes("chrome")) {
    browser = "Chrome"
    const match = ua.match(/chrome\/(\d+)/)
    browserVersion = match?.[1] || ""
  } else if (ua.includes("safari")) {
    browser = "Safari"
    const match = ua.match(/version\/(\d+)/)
    browserVersion = match?.[1] || ""
  } else if (ua.includes("opera") || ua.includes("opr/")) {
    browser = "Opera"
    const match = ua.match(/(?:opera|opr)\/(\d+)/)
    browserVersion = match?.[1] || ""
  }

  // OS detection
  let os = "Unknown"
  let osVersion = ""

  if (ua.includes("windows")) {
    os = "Windows"
    const match = ua.match(/windows nt (\d+\.\d+)/)
    if (match) {
      const versionMap: Record<string, string> = {
        "10.0": "10",
        "6.3": "8.1",
        "6.2": "8",
        "6.1": "7",
        "6.0": "Vista",
        "5.1": "XP",
      }
      osVersion = versionMap[match[1]] || match[1]
    }
  } else if (ua.includes("mac os x")) {
    os = "macOS"
    const match = ua.match(/mac os x (\d+[._]\d+[._]?\d*)/)
    osVersion = match?.[1]?.replace(/_/g, ".") || ""
  } else if (ua.includes("linux")) {
    os = "Linux"
  } else if (ua.includes("android")) {
    os = "Android"
    const match = ua.match(/android (\d+\.\d+)/)
    osVersion = match?.[1] || ""
  } else if (ua.includes("iphone os") || ua.includes("ipad")) {
    os = "iOS"
    const match = ua.match(/(?:iphone os|ipad)\s*(\d+[._]\d+)/)
    osVersion = match?.[1]?.replace(/_/g, ".") || ""
  }

  // Device type
  let deviceType = "desktop"
  if (
    ua.includes("mobile") ||
    ua.includes("android") ||
    ua.includes("iphone")
  ) {
    deviceType = "mobile"
  } else if (ua.includes("ipad") || ua.includes("tablet")) {
    deviceType = "tablet"
  }

  return { browser, browserVersion, os, osVersion, deviceType, isBot }
}

/**
 * Get all server-side tracking data from a request
 */
export function getServerTrackingData(request: NextRequest): RequestMetadata {
  const ip = getClientIp(request)
  const userAgent = request.headers.get("user-agent") || undefined

  const uaData = userAgent ? parseUserAgent(userAgent) : undefined

  return {
    ip,
    country: getCountryCode(request),
    region: getRegion(request),
    city: getCity(request),
    isp: getIsp(request),
    asn: getAsn(request),
    userAgent,
    acceptLanguage: request.headers.get("accept-language") || undefined,
    accept: request.headers.get("accept") || undefined,
    acceptEncoding: request.headers.get("accept-encoding") || undefined,
    referer: request.headers.get("referer") || undefined,
  }
}

export function getTrackingDataWithParsing(request: NextRequest): {
  ip?: string
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
  isBot?: boolean
  acceptLanguage?: string
  accept?: string
  acceptEncoding?: string
  referer?: string
} {
  const ip = getClientIp(request)
  const userAgent = request.headers.get("user-agent") || undefined
  const uaData = userAgent ? parseUserAgent(userAgent) : undefined

  return {
    ip,
    countryCode: getCountryCode(request),
    region: getRegion(request),
    city: getCity(request),
    isp: getIsp(request),
    asn: getAsn(request),
    userAgent,
    browser: uaData?.browser,
    browserVersion: uaData?.browserVersion,
    os: uaData?.os,
    osVersion: uaData?.osVersion,
    deviceType: uaData?.deviceType,
    isBot: uaData?.isBot,
    acceptLanguage: request.headers.get("accept-language") || undefined,
    accept: request.headers.get("accept") || undefined,
    acceptEncoding: request.headers.get("accept-encoding") || undefined,
    referer: request.headers.get("referer") || undefined,
  }
}
