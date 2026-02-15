/**
 * Usage tracking - disabled for now (no auth)
 * Can be added back with Drizzle-based session tracking if needed
 */

export async function checkUsage() {
  // No usage limits for now
  return null
}

export async function incrementUsage(): Promise<void> {
  // No-op
}

export async function checkProUsage() {
  // No-op
}

export async function incrementProUsage() {
  // No-op
}

export async function checkUsageByModel() {
  // No usage limits
  return null
}

export async function incrementUsageByModel() {
  // No-op
}
