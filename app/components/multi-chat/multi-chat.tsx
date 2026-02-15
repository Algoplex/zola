"use client"

import { MultiModelConversation } from "@/app/components/multi-chat/multi-conversation"
import { toast } from "@/components/ui/toast"
import { getOrCreateGuestUserId } from "@/lib/api"
import { useChats } from "@/lib/chat-store/chats/provider"
import { useMessages } from "@/lib/chat-store/messages/provider"
import { useChatSession } from "@/lib/chat-store/session/provider"
import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { useModel } from "@/lib/model-store/provider"
import { useUser } from "@/lib/user-store/provider"
import { cn } from "@/lib/utils"
import { UIMessage as MessageType } from "@ai-sdk/react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { MultiChatInput } from "./multi-chat-input"
import { useMultiChat } from "./use-multi-chat"

type GroupedMessage = {
  userMessage: MessageType
  responses: {
    model: string
    message: MessageType
    isLoading?: boolean
    provider: string
  }[]
  onDelete: (model: string, id: string) => void
  onEdit: (model: string, id: string, newText: string) => void
  onReload: (model: string) => void
}

// Helper to extract text from UIMessage parts
const getTextContent = (msg: MessageType): string => {
  const textPart = msg.parts?.find((p) => p.type === "text")
  return textPart?.text || ""
}

export function MultiChat() {
  const [prompt, setPrompt] = useState("")
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [multiChatId, setMultiChatId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { user } = useUser()
  const { models } = useModel()
  const { chatId } = useChatSession()
  const { messages: persistedMessages, isLoading: messagesLoading } =
    useMessages()
  const { createNewChat } = useChats()

  const availableModels = useMemo(() => {
    return models.map((model) => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
    }))
  }, [models])

  const modelProviderMap = useMemo(() => {
    return new Map(models.map((model) => [model.id, model.provider]))
  }, [models])

  const { modelsFromPersisted, modelsFromLastGroup } = useMemo(() => {
    const persistedModels: string[] = []
    const lastGroupModels: string[] = []
    let lastUserIndex = -1

    for (let i = 0; i < persistedMessages.length; i++) {
      const msg = persistedMessages[i]
      if ((msg as any).model) {
        persistedModels.push((msg as any).model)
      }
      if (msg.role === "user") {
        lastUserIndex = i
      }
    }

    if (lastUserIndex >= 0) {
      for (let i = lastUserIndex + 1; i < persistedMessages.length; i++) {
        const msg = persistedMessages[i]
        if (msg.role === "user") break
        if (msg.role === "assistant" && (msg as any).model) {
          lastGroupModels.push((msg as any).model)
        }
      }
    }

    return {
      modelsFromPersisted: persistedModels,
      modelsFromLastGroup: lastGroupModels,
    }
  }, [persistedMessages])

  const allModelsToMaintain = useMemo(() => {
    const combined = new Set([...selectedModelIds, ...modelsFromPersisted])
    return availableModels.filter((model) => combined.has(model.id))
  }, [availableModels, selectedModelIds, modelsFromPersisted])

  useEffect(() => {
    if (selectedModelIds.length === 0 && modelsFromLastGroup.length > 0) {
      setSelectedModelIds(modelsFromLastGroup)
    }
  }, [modelsFromLastGroup, selectedModelIds.length])

  const modelChats = useMultiChat(allModelsToMaintain)
  const systemPrompt = useMemo(
    () => user?.systemPrompt || SYSTEM_PROMPT_DEFAULT,
    [user?.systemPrompt]
  )
  const isAuthenticated = useMemo(() => Boolean(user?.id), [user?.id])

  const createPersistedGroups = useCallback(() => {
    const persistedGroups: { [key: string]: GroupedMessage } = {}

    if (persistedMessages.length === 0) return persistedGroups

    const groups: {
      [key: string]: {
        userMessage: MessageType
        assistantMessages: MessageType[]
      }
    } = {}

    let currentUserMessage: MessageType | null = null

    for (const message of persistedMessages) {
      if (message.role === "user") {
        currentUserMessage = message
        const groupKey = getTextContent(message)
        if (!groups[groupKey]) {
          groups[groupKey] = {
            userMessage: message,
            assistantMessages: [],
          }
        }
        continue
      }

      if (message.role === "assistant" && currentUserMessage) {
        const groupKey = getTextContent(currentUserMessage)
        if (!groups[groupKey]) {
          groups[groupKey] = {
            userMessage: currentUserMessage,
            assistantMessages: [],
          }
        }
        groups[groupKey].assistantMessages.push(message)
      }
    }

    Object.entries(groups).forEach(([groupKey, group]) => {
      if (group.userMessage) {
        persistedGroups[groupKey] = {
          userMessage: group.userMessage,
          responses: group.assistantMessages.map((msg, index) => {
            const model =
              (msg as any).model || selectedModelIds[index] || `model-${index}`
            const provider = modelProviderMap.get(model) || "unknown"

            return {
              model,
              message: msg,
              isLoading: false,
              provider,
            }
          }),
          onDelete: () => {},
          onEdit: () => {},
          onReload: () => {},
        }
      }
    })

    return persistedGroups
  }, [persistedMessages, selectedModelIds, modelProviderMap])

  const messageGroups = useMemo(() => {
    const persistedGroups = createPersistedGroups()
    const liveGroups = { ...persistedGroups }

    modelChats.forEach((chat) => {
      for (let i = 0; i < chat.messages.length; i += 2) {
        const userMsg = chat.messages[i]
        const assistantMsg = chat.messages[i + 1]

        if (userMsg?.role === "user") {
          const groupKey = getTextContent(userMsg)

          if (!liveGroups[groupKey]) {
            liveGroups[groupKey] = {
              userMessage: userMsg,
              responses: [],
              onDelete: () => {},
              onEdit: () => {},
              onReload: () => {},
            }
          }

          if (assistantMsg?.role === "assistant") {
            const existingResponse = liveGroups[groupKey].responses.find(
              (r) => r.model === chat.model.id
            )

            if (!existingResponse) {
              liveGroups[groupKey].responses.push({
                model: chat.model.id,
                message: assistantMsg,
                isLoading: false,
                provider: chat.model.provider,
              })
            }
          } else if (
            chat.isLoading &&
            getTextContent(userMsg) === prompt &&
            selectedModelIds.includes(chat.model.id)
          ) {
            const placeholderMessage: MessageType = {
              id: `loading-${chat.model.id}`,
              role: "assistant",
              parts: [{ type: "text", text: "" }],
            }
            liveGroups[groupKey].responses.push({
              model: chat.model.id,
              message: placeholderMessage,
              isLoading: true,
              provider: chat.model.provider,
            })
          }
        }
      }
    })

    return Object.values(liveGroups)
  }, [createPersistedGroups, modelChats, prompt, selectedModelIds])

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) return

    if (selectedModelIds.length === 0) {
      toast({
        title: "No models selected",
        description: "Please select at least one model to chat with.",
        status: "error",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const uid = await getOrCreateGuestUserId(user)
      if (!uid) return

      const message_group_id = crypto.randomUUID()

      let chatIdToUse = multiChatId || chatId
      if (!chatIdToUse) {
        const createdChat = await createNewChat(
          uid,
          prompt,
          selectedModelIds[0],
          Boolean(user?.id)
        )
        if (!createdChat) {
          throw new Error("Failed to create chat")
        }
        chatIdToUse = createdChat.id
        setMultiChatId(chatIdToUse)
        window.history.pushState(null, "", `/c/${chatIdToUse}`)
      }

      const selectedChats = modelChats.filter((chat) =>
        selectedModelIds.includes(chat.model.id)
      )

      await Promise.all(
        selectedChats.map(async (chat) => {
          const options = {
            body: {
              chatId: chatIdToUse,
              userId: uid,
              model: chat.model.id,
              isAuthenticated: Boolean(user?.id),
              systemPrompt: systemPrompt,
              enableSearch: false,
              message_group_id,
            },
          }

          chat.sendMessage({ text: prompt }, options)
        })
      )

      setPrompt("")
      setFiles([])
    } catch (error) {
      console.error("Failed to send message:", error)
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        status: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [
    prompt,
    selectedModelIds,
    user,
    modelChats,
    systemPrompt,
    multiChatId,
    chatId,
    createNewChat,
  ])

  const handleFileUpload = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const handleFileRemove = useCallback((fileToRemove: File) => {
    setFiles((prev) => prev.filter((file) => file !== fileToRemove))
  }, [])

  const handleStop = useCallback(() => {
    modelChats.forEach((chat) => {
      if (chat.isLoading && selectedModelIds.includes(chat.model.id)) {
        chat.stop()
      }
    })
  }, [modelChats, selectedModelIds])

  const anyLoading = useMemo(
    () =>
      modelChats.some(
        (chat) => chat.isLoading && selectedModelIds.includes(chat.model.id)
      ),
    [modelChats, selectedModelIds]
  )

  const conversationProps = useMemo(() => ({ messageGroups }), [messageGroups])

  const inputProps = useMemo(
    () => ({
      value: prompt,
      onValueChange: setPrompt,
      onSend: handleSubmit,
      isSubmitting,
      files,
      onFileUpload: handleFileUpload,
      onFileRemove: handleFileRemove,
      selectedModelIds,
      onSelectedModelIdsChange: setSelectedModelIds,
      isUserAuthenticated: isAuthenticated,
      stop: handleStop,
      status: anyLoading ? ("streaming" as const) : ("ready" as const),
      anyLoading,
    }),
    [
      prompt,
      handleSubmit,
      isSubmitting,
      files,
      handleFileUpload,
      handleFileRemove,
      selectedModelIds,
      isAuthenticated,
      handleStop,
      anyLoading,
    ]
  )

  const showOnboarding = messageGroups.length === 0 && !messagesLoading

  return (
    <div
      className={cn(
        "@container/main relative flex h-full flex-col items-center",
        showOnboarding ? "justify-end md:justify-center" : "justify-end"
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {showOnboarding ? (
          <motion.div
            key="onboarding"
            className="absolute bottom-[60%] mx-auto max-w-[50rem] md:relative md:bottom-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            layout="position"
            layoutId="onboarding"
            transition={{ layout: { duration: 0 } }}
          >
            <h1 className="mb-6 text-3xl font-medium tracking-tight">
              What can I help you with?
            </h1>
          </motion.div>
        ) : (
          <motion.div
            key="conversation"
            className="w-full flex-1 overflow-hidden"
            layout="position"
            layoutId="conversation"
            transition={{
              layout: { duration: messageGroups.length === 1 ? 0.3 : 0 },
            }}
          >
            <MultiModelConversation {...conversationProps} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className={cn(
          "z-50 mx-auto w-full max-w-3xl",
          showOnboarding ? "relative" : "absolute right-0 bottom-0 left-0"
        )}
        layout="position"
        layoutId="multi-chat-input-container"
        transition={{
          layout: { duration: messageGroups.length === 1 ? 0.3 : 0 },
        }}
      >
        <MultiChatInput {...inputProps} />
      </motion.div>
    </div>
  )
}
