"use client"

import { API_ROUTE_CSRF, API_ROUTE_SESSION } from "@/lib/routes"
import { useQuery } from "@tanstack/react-query"

export function LayoutClient() {
  useQuery({
    queryKey: ["csrf-init"],
    queryFn: async () => {
      await fetch(API_ROUTE_CSRF)
      return true
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  })

  useQuery({
    queryKey: ["session-init"],
    queryFn: async () => {
      await fetch(API_ROUTE_SESSION, { method: "POST" })
      return true
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  })

  return null
}
