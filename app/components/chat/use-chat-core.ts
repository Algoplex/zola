import { syncRecentMessages } from "@/app/components/chat/syncRecentMessages"
import { useChatDraft } from "@/app/hooks/use-chat-draft"
import { toast } from "@/components/ui/toast"
import { getOrCreateGuestUserId } from "@/lib/api"
import { useChats } from "@/lib/chat-store/chats/provider"
import { MESSAGE_MAX_LENGTH, SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { API_ROUTE_CHAT } from "@/lib/routes"
import type { UserProfile } from "@/lib/user/types"
import { useChat, type UIMessage } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

// Attachment type - defined locally since it's no longer exported from AI SDK v6
// v6 uses FileUIPart structure with type, mediaType instead of contentType
type Attachment = {
  name: string
  contentType: string
  url: string
  type?: "file"
  mediaType?: string
}

type UseChatCoreProps = {
  initialMessages: UIMessage[]
  draftValue: string
  cacheAndAddMessage: (message: UIMessage) => void
  saveAllMessages?: (messages: UIMessage[]) => Promise<void>
  chatId: string | null
  user: UserProfile | null
  files: File[]
  createOptimisticAttachments: (
    files: File[]
  ) => Array<{ name: string; contentType: string; url: string }>
  setFiles: (files: File[]) => void
  checkLimitsAndNotify: (uid: string) => Promise<boolean>
  cleanupOptimisticAttachments: (attachments?: Array<{ url?: string }>) => void
  ensureChatExists: (uid: string, input: string) => Promise<string | null>
  handleFileUploads: (
    uid: string,
    chatId: string
  ) => Promise<Attachment[] | null>
  selectedModel: string
  clearDraft: () => void
  bumpChat: (chatId: string) => void
  precreateChat?: (userId: string, input: string) => Promise<void>
}

export function useChatCore({
  initialMessages,
  draftValue,
  cacheAndAddMessage,
  saveAllMessages,
  chatId,
  user,
  files,
  createOptimisticAttachments,
  setFiles,
  checkLimitsAndNotify,
  cleanupOptimisticAttachments,
  ensureChatExists,
  handleFileUploads,
  selectedModel,
  clearDraft,
  bumpChat,
  precreateChat,
}: UseChatCoreProps) {
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasDialogAuth, setHasDialogAuth] = useState(false)
  const [enableSearch, setEnableSearch] = useState(false)
  const [input, setInput] = useState(draftValue)

  // Refs and derived state
  const hasSentFirstMessageRef = useRef(false)
  const prevChatIdRef = useRef<string | null>(chatId)
  const precreateInFlightRef = useRef(false)
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isAuthenticated = useMemo(() => Boolean(user?.id), [user?.id])
  const systemPrompt = useMemo(
    () => user?.systemPrompt || SYSTEM_PROMPT_DEFAULT,
    [user?.systemPrompt]
  )

  // Search params handling
  const searchParams = useSearchParams()
  const prompt = searchParams.get("prompt")

  // Chats operations
  const { updateTitle } = useChats()

  // Handle errors directly in onError callback
  const handleError = useCallback((error: Error) => {
    console.error("Chat error:", error)
    console.error("Error message:", error.message)
    let errorMsg = error.message || "Something went wrong."

    if (errorMsg === "An error occurred" || errorMsg === "fetch failed") {
      errorMsg = "Something went wrong. Please try again."
    }

    toast({
      title: errorMsg,
      status: "error",
    })
  }, [])

  // Initialize useChat
  const {
    messages,
    status,
    error,
    regenerate,
    stop,
    setMessages,
    sendMessage,
  } = useChat({
    messages: initialMessages,

    onFinish: async () => {
      // Messages are already managed by useChat - no need to manually cache
    },

    onError: handleError,

    transport: new DefaultChatTransport({
      api: API_ROUTE_CHAT,
    }),
  })

  const lastLoadedChatIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!chatId) return
    if (status === "streaming" || status === "submitted") return

    const chatChanged = lastLoadedChatIdRef.current !== chatId
    const shouldHydrateMessages =
      (chatChanged && messages.length === 0) ||
      (messages.length === 0 && initialMessages.length > 0) ||
      (initialMessages.length > messages.length && status === "ready")

    if (shouldHydrateMessages) {
      setMessages(initialMessages)
      lastLoadedChatIdRef.current = chatId
    }
  }, [chatId, initialMessages, messages.length, setMessages, status])

  useEffect(() => {
    if (!saveAllMessages || !chatId) return
    if (status === "streaming") return
    if (messages.length === 0) return

    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current)
    }

    persistTimeoutRef.current = setTimeout(() => {
      saveAllMessages(messages as UIMessage[]).catch((error) => {
        console.error("Failed to persist messages:", error)
      })
    }, 500)

    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current)
      }
    }
  }, [chatId, messages, saveAllMessages, status])

  // Handle search params on mount
  useEffect(() => {
    if (prompt && typeof window !== "undefined") {
      requestAnimationFrame(() => setInput(prompt))
    }
  }, [prompt, setInput])

  // Reset messages when navigating from a chat to home
  useEffect(() => {
    if (
      prevChatIdRef.current !== null &&
      chatId === null &&
      messages.length > 0
    ) {
      setMessages([])
    }
    prevChatIdRef.current = chatId
  }, [chatId, messages.length, setMessages])

  // Submit action
  const submit = useCallback(async () => {
    setIsSubmitting(true)

    const submittedInput = input
    setInput("")

    const submittedFiles = [...files]
    setFiles([])

    const uid = await getOrCreateGuestUserId(user)
    if (!uid) {
      toast({ title: "Missing session. Please refresh.", status: "error" })
      setIsSubmitting(false)
      return
    }

    try {
      const allowed = await checkLimitsAndNotify(uid)
      if (!allowed) {
        return
      }

      const currentChatId = await ensureChatExists(uid, submittedInput)
      if (!currentChatId) {
        return
      }

      prevChatIdRef.current = currentChatId

      if (submittedInput.length > MESSAGE_MAX_LENGTH) {
        toast({
          title: `The message you submitted was too long, please submit something shorter. (Max ${MESSAGE_MAX_LENGTH} characters)`,
          status: "error",
        })
        return
      }

      let attachments: Attachment[] | null = []
      if (submittedFiles.length > 0) {
        attachments = await handleFileUploads(uid, currentChatId)
        if (attachments === null) {
          return
        }
      }

      hasSentFirstMessageRef.current = true

      const options = {
        body: {
          chatId: currentChatId,
          userId: uid,
          model: selectedModel,
          isAuthenticated,
          systemPrompt: systemPrompt || SYSTEM_PROMPT_DEFAULT,
          enableSearch,
        },
      }

      sendMessage(
        {
          text: submittedInput,
          files: attachments
            ? attachments.map((a) => ({
                type: "file" as const,
                mediaType: a.contentType,
                url: a.url,
              }))
            : undefined,
        },
        { body: options.body }
      )
      clearDraft()

      void cacheAndAddMessage({
        id: `user-${Date.now()}`,
        role: "user",
        parts: [{ type: "text", text: submittedInput }],
        content: submittedInput,
        createdAt: new Date(),
      } as UIMessage)

      if (messages.length > 0) {
        bumpChat(currentChatId)
      }
    } catch {
      toast({ title: "Failed to send message", status: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }, [
    user,
    files,
    checkLimitsAndNotify,
    ensureChatExists,
    handleFileUploads,
    selectedModel,
    isAuthenticated,
    systemPrompt,
    enableSearch,
    sendMessage,
    clearDraft,
    messages.length,
    bumpChat,
    setIsSubmitting,
  ])

  const submitEdit = useCallback(
    async (messageId: string, newContent: string) => {
      // Block edits while sending/streaming
      if (isSubmitting || status === "submitted" || status === "streaming") {
        toast({
          title: "Please wait until the current message finishes sending.",
          status: "error",
        })
        return
      }

      if (!newContent.trim()) return

      if (!chatId) {
        toast({ title: "Missing chat.", status: "error" })
        return
      }

      // Find edited message
      const editIndex = messages.findIndex(
        (m) => String(m.id) === String(messageId)
      )
      if (editIndex === -1) {
        toast({ title: "Message not found", status: "error" })
        return
      }

      const target = messages[editIndex]
      // In AI SDK v6, createdAt may not be directly on UIMessage - use type assertion
      const targetCreatedAt = (target as unknown as { createdAt?: Date })
        ?.createdAt
      const cutoffIso = targetCreatedAt?.toISOString()
      if (!cutoffIso) {
        console.error("Unable to locate message timestamp.")
        return
      }

      if (newContent.length > MESSAGE_MAX_LENGTH) {
        toast({
          title: `The message you submitted was too long, please submit something shorter. (Max ${MESSAGE_MAX_LENGTH} characters)`,
          status: "error",
        })
        return
      }

      // Extract file parts from target message if any
      const targetFileParts =
        target.parts?.filter((p) => p.type === "file") || []

      try {
        // Trim messages up to the edit point
        const trimmedMessages = messages.slice(0, editIndex)
        setMessages(trimmedMessages)

        try {
          const { writeToIndexedDB } = await import("@/lib/chat-store/persist")
          await writeToIndexedDB("messages", {
            id: chatId,
            messages: trimmedMessages,
          })
        } catch {}

        // Get user validation
        const uid = await getOrCreateGuestUserId(user)
        if (!uid) {
          toast({ title: "Please sign in and try again.", status: "error" })
          return
        }

        const allowed = await checkLimitsAndNotify(uid)
        if (!allowed) {
          return
        }

        const currentChatId = await ensureChatExists(uid, newContent)
        if (!currentChatId) {
          return
        }

        prevChatIdRef.current = currentChatId

        const options = {
          body: {
            chatId: currentChatId,
            userId: uid,
            model: selectedModel,
            isAuthenticated,
            systemPrompt: systemPrompt || SYSTEM_PROMPT_DEFAULT,
            enableSearch,
            editCutoffTimestamp: cutoffIso, // Backend will delete messages from this timestamp
          },
        }

        // If this is an edit of the very first user message, update chat title
        if (editIndex === 0 && target.role === "user") {
          try {
            await updateTitle(currentChatId, newContent)
          } catch {}
        }

        sendMessage(
          {
            text: newContent,
            files: targetFileParts.length > 0 ? targetFileParts : undefined,
          },
          options
        )

        bumpChat(currentChatId)
      } catch (error) {
        console.error("Edit failed:", error)
        toast({ title: "Failed to apply edit", status: "error" })
      }
    },
    [
      chatId,
      messages,
      user,
      checkLimitsAndNotify,
      ensureChatExists,
      selectedModel,
      isAuthenticated,
      systemPrompt,
      enableSearch,
      sendMessage,
      setMessages,
      bumpChat,
      updateTitle,
      isSubmitting,
      status,
    ]
  )

  // Handle suggestion
  const handleSuggestion = useCallback(
    async (suggestion: string) => {
      setIsSubmitting(true)

      try {
        const uid = await getOrCreateGuestUserId(user)

        if (!uid) {
          return
        }

        const allowed = await checkLimitsAndNotify(uid)
        if (!allowed) {
          return
        }

        const currentChatId = await ensureChatExists(uid, suggestion)

        if (!currentChatId) {
          return
        }

        prevChatIdRef.current = currentChatId

        const options = {
          body: {
            chatId: currentChatId,
            userId: uid,
            model: selectedModel,
            isAuthenticated,
            systemPrompt: SYSTEM_PROMPT_DEFAULT,
          },
        }

        sendMessage(
          {
            text: suggestion,
          },
          options
        )
      } catch {
        toast({ title: "Failed to send suggestion", status: "error" })
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      ensureChatExists,
      selectedModel,
      user,
      sendMessage,
      checkLimitsAndNotify,
      isAuthenticated,
      setIsSubmitting,
    ]
  )

  // Handle regenerate
  const handleReload = useCallback(async () => {
    const uid = await getOrCreateGuestUserId(user)
    if (!uid) {
      return
    }

    const options = {
      body: {
        chatId,
        userId: uid,
        model: selectedModel,
        isAuthenticated,
        systemPrompt: systemPrompt || SYSTEM_PROMPT_DEFAULT,
      },
    }

    regenerate(options)
  }, [user, chatId, selectedModel, isAuthenticated, systemPrompt, regenerate])

  // Handle input change - now with access to the real setInput function!
  const { setDraftValue } = useChatDraft(chatId)
  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setDraftValue(value)
    },
    [setInput, setDraftValue]
  )

  return {
    // Chat state
    messages,
    input,
    handleSubmit: sendMessage,
    status,
    error,
    regenerate,
    stop,
    setMessages,
    setInput,
    sendMessage,
    isAuthenticated,
    systemPrompt,
    hasSentFirstMessageRef,

    // Component state
    isSubmitting,
    setIsSubmitting,
    hasDialogAuth,
    setHasDialogAuth,
    enableSearch,
    setEnableSearch,

    // Actions
    submit,
    handleSuggestion,
    handleReload,
    handleInputChange,
    submitEdit,
  }
}
