"use client"

import { createContext, useContext, useState, useCallback } from "react"

interface User {
  id: string
  email?: string
  systemPrompt?: string
  profileImage?: string
  displayName?: string
  favoriteModels?: string[]
}

interface UserContextType {
  user: User | null
  isAuthenticated: boolean
  signOut: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
  user: null,
  isAuthenticated: false,
  signOut: async () => {},
  updateUser: async () => {},
  refreshUser: async () => {},
})

export function useUser() {
  return useContext(UserContext)
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{
    id: string
    email?: string
    systemPrompt?: string
    profileImage?: string
    displayName?: string
    favoriteModels?: string[]
  } | null>(null)

  const signOut = useCallback(async () => {
    setUser(null)
  }, [])

  const updateUser = useCallback(async (updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null))
  }, [])

  const refreshUser = useCallback(async () => {
    // No auth - no-op, but provide the method for API compatibility
  }, [])

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        signOut,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
