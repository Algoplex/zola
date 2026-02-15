import { toast } from "@/components/ui/toast"
import { checkRateLimits } from "@/lib/api"
import type { Chats } from "@/lib/chat-store/types"
import { REMAINING_QUERY_ALERT_THRESHOLD } from "@/lib/config"
import { UIMessage } from "@ai-sdk/react"
import { useCallback, useEffect, useRef } from "react"

type UseChatOperationsProps = {
  isAuthenticated: boolean
  chatId: string | null
  messages: UIMessage[]
  selectedModel: string
  systemPrompt: string
  userId?: string | null
  updateTitle: (id: string, title: string) => Promise<void>
  createNewChat: (
    userId: string,
    title?: string,
    model?: string,
    isAuthenticated?: boolean,
    systemPrompt?: string
  ) => Promise<Chats | undefined>
  setHasDialogAuth: (value: boolean) => void
  setMessages: (
    messages: UIMessage[] | ((messages: UIMessage[]) => UIMessage[])
  ) => void
  setInput: (input: string) => void
}

export function useChatOperations({
  isAuthenticated,
  chatId,
  messages,
  selectedModel,
  systemPrompt,
  userId,
  updateTitle,
  createNewChat,
  setHasDialogAuth,
  setMessages,
}: UseChatOperationsProps) {
  const precreatedChatIdRef = useRef<string | null>(null)
  const precreatedWithPlaceholderRef = useRef(false)
  // Chat utilities
  const checkLimitsAndNotify = useCallback(
    async (uid: string): Promise<boolean> => {
      try {
        const rateData = await checkRateLimits(uid, isAuthenticated)

        if (rateData.remaining === 0 && !isAuthenticated) {
          setHasDialogAuth(true)
          return false
        }

        if (rateData.remaining === REMAINING_QUERY_ALERT_THRESHOLD) {
          toast({
            title: `Only ${rateData.remaining} quer${
              Number(rateData.remaining) === 1 ? "y" : "ies"
            } remaining today.`,
            status: "info",
          })
        }

        if (rateData.remainingPro === REMAINING_QUERY_ALERT_THRESHOLD) {
          toast({
            title: `Only ${rateData.remainingPro} pro quer${
              Number(rateData.remainingPro) === 1 ? "y" : "ies"
            } remaining today.`,
            status: "info",
          })
        }

        return true
      } catch (err) {
        console.error("Rate limit check failed:", err)
        return false
      }
    },
    [isAuthenticated, setHasDialogAuth]
  )

  const ensureChatExists = useCallback(
    async (userId: string, input: string) => {
      if (chatId) return chatId

      if (precreatedChatIdRef.current) {
        const precreatedId = precreatedChatIdRef.current
        if (isAuthenticated) {
          window.history.pushState(null, "", `/c/${precreatedId}`)
        } else {
          localStorage.setItem("guestChatId", precreatedId)
        }

        if (precreatedWithPlaceholderRef.current && input.trim()) {
          precreatedWithPlaceholderRef.current = false
          await updateTitle(precreatedId, input)
        }

        return precreatedId
      }

      if (!isAuthenticated) {
        const storedGuestChatId = localStorage.getItem("guestChatId")
        if (storedGuestChatId) return storedGuestChatId
      }

      try {
        const newChat = await createNewChat(
          userId,
          input,
          selectedModel,
          isAuthenticated,
          systemPrompt
        )

        if (!newChat) return null
        if (isAuthenticated) {
          window.history.pushState(null, "", `/c/${newChat.id}`)
        } else {
          localStorage.setItem("guestChatId", newChat.id)
        }

        return newChat.id
      } catch (err: unknown) {
        let errorMessage = "Something went wrong."
        try {
          const errorObj = err as { message?: string }
          if (errorObj.message) {
            const parsed = JSON.parse(errorObj.message)
            errorMessage = parsed.error || errorMessage
          }
        } catch {
          const errorObj = err as { message?: string }
          errorMessage = errorObj.message || errorMessage
        }
        toast({
          title: errorMessage,
          status: "error",
        })
        return null
      }
    },
    [chatId, isAuthenticated, createNewChat, selectedModel, systemPrompt]
  )

  const precreateChat = useCallback(
    async (userId: string) => {
      if (chatId || precreatedChatIdRef.current) return

      try {
        const newChat = await createNewChat(
          userId,
          "New Chat",
          selectedModel,
          isAuthenticated,
          systemPrompt
        )

        if (!newChat) return
        precreatedChatIdRef.current = newChat.id
        precreatedWithPlaceholderRef.current = true
      } catch (err) {
        console.error("Failed to precreate chat:", err)
      }
    },
    [chatId, createNewChat, selectedModel, isAuthenticated, systemPrompt]
  )

  useEffect(() => {
    if (!userId) return
    precreateChat(userId)
  }, [precreateChat, userId])

  // Message handlers
  const handleDelete = useCallback(
    (id: string) => {
      setMessages((prev) => prev.filter((message) => message.id !== id))
    },
    [setMessages]
  )

  const handleEdit = useCallback(
    (id: string, newText: string) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === id ? { ...message, content: newText } : message
        )
      )
    },
    [setMessages]
  )

  return {
    // Utils
    checkLimitsAndNotify,
    ensureChatExists,
    precreateChat,

    // Handlers
    handleDelete,
    handleEdit,
  }
}
