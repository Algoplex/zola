// No auth - these are stubs
import type { UserProfile } from "@/lib/user/types"

export async function fetchUserProfile(
  id: string
): Promise<UserProfile | null> {
  // No auth - return null (session-based only)
  return null
}

export async function updateUserProfile(
  id: string,
  updates: Partial<UserProfile>
): Promise<boolean> {
  // No auth - no-op
  return false
}

export async function signOutUser(): Promise<boolean> {
  // No auth - no-op
  return true
}

export function subscribeToUserUpdates(
  userId: string,
  onUpdate: (newData: Partial<UserProfile>) => void
) {
  // No auth - no-op
  return () => {}
}
