import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  serial,
  jsonb,
  inet,
  integer,
  real,
  char,
  pgEnum,
} from "drizzle-orm/pg-core"

// Session tracking enums
export const deviceTypeEnum = pgEnum("device_type", [
  "desktop",
  "mobile",
  "tablet",
  "bot",
  "unknown",
])

// Sessions table - one per cookie/session
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),

  // IP & Location (server-side)
  ipAddress: inet("ip_address"),
  countryCode: char("country_code", { length: 2 }),
  region: text("region"),
  city: text("city"),
  isp: text("isp"),
  asn: integer("asn"),

  // Browser & OS (from User-Agent)
  userAgent: text("user_agent"),
  browser: text("browser"),
  browserVersion: text("browser_version"),
  os: text("os"),
  osVersion: text("os_version"),
  deviceType: deviceTypeEnum("device_type").default("unknown"),

  // Screen & Display (client-side)
  screenWidth: integer("screen_width"),
  screenHeight: integer("screen_height"),
  screenColorDepth: integer("screen_color_depth"),
  devicePixelRatio: real("device_pixel_ratio"),
  viewportWidth: integer("viewport_width"),
  viewportHeight: integer("viewport_height"),

  // Hardware (client-side)
  cpuCores: integer("cpu_cores"),
  deviceMemory: real("device_memory"),
  hasTouch: boolean("has_touch"),
  maxTouchPoints: integer("max_touch_points"),
  gpuRenderer: text("gpu_renderer"),
  gpuVendor: text("gpu_vendor"),

  // Locale & Time (client-side)
  language: text("language"),
  languages: text("languages"), // JSON array
  timezone: text("timezone"),
  timezoneOffset: integer("timezone_offset"),

  // Network (client-side)
  connectionType: text("connection_type"),
  downlinkMbps: real("downlink_mbps"),
  rttMs: integer("rtt_ms"),

  // Fingerprinting (client-side)
  canvasFingerprint: text("canvas_fingerprint"),
  audioFingerprint: text("audio_fingerprint"),
  webglFingerprint: text("webgl_fingerprint"),

  // Headers (server-side)
  acceptLanguage: text("accept_language"),
  accept: text("accept"),
  acceptEncoding: text("accept_encoding"),
  referer: text("referer"),

  // Flags
  doNotTrack: boolean("do_not_track"),
  cookiesEnabled: boolean("cookies_enabled"),
  isBot: boolean("is_bot"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
})

// Chats table - linked to session
export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => sessions.id, {
    onDelete: "cascade",
  }),
  model: text("model"),
  title: text("title"),
  pinned: boolean("pinned").default(false),
  pinnedAt: timestamp("pinned_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Messages table - linked to chat and session
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: uuid("chat_id")
    .references(() => chats.id, { onDelete: "cascade" })
    .notNull(),
  sessionId: uuid("session_id").references(() => sessions.id, {
    onDelete: "cascade",
  }),
  role: text("role").notNull(), // system, user, assistant
  content: text("content"),
  parts: jsonb("parts"),
  experimentalAttachments: jsonb("experimental_attachments"),
  model: text("model"),
  messageGroupId: text("message_group_id"),
  createdAt: timestamp("created_at").defaultNow(),
})

// Type exports for queries
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type Chat = typeof chats.$inferSelect
export type NewChat = typeof chats.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
