"use client"

import { ChatInput } from "@/app/components/chat-input/chat-input"
import { Conversation } from "@/app/components/chat/conversation"
import { useModel } from "@/app/components/chat/use-model"
import { useChatDraft } from "@/app/hooks/use-chat-draft"
import { useChats } from "@/lib/chat-store/chats/provider"
import { useMessages } from "@/lib/chat-store/messages/provider"
import { useChatSession } from "@/lib/chat-store/session/provider"
import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { useUser } from "@/lib/user-store/provider"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "motion/react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { useChatCore } from "./use-chat-core"
import { useChatOperations } from "./use-chat-operations"

// Temporary stub for file upload - can be re-added later
const useFileUpload = () => {
  const [files, setFiles] = useState<File[]>([])
  const handleFileUpload = (newFiles: File[]) =>
    setFiles((prev) => [...prev, ...newFiles])
  const handleFileRemove = (file: File) =>
    setFiles((prev) => prev.filter((f) => f !== file))
  const handleFileUploads = async () => {
    files.length = 0
    return []
  }
  const createOptimisticAttachments = (files: File[]) =>
    files.map((file) => ({ name: file.name, contentType: file.type, url: "" }))
  const cleanupOptimisticAttachments = () => {}
  return {
    files,
    setFiles,
    handleFileUpload,
    handleFileRemove,
    handleFileUploads,
    createOptimisticAttachments,
    cleanupOptimisticAttachments,
  }
}

export function Chat() {
  const router = useRouter()
  const { chatId } = useChatSession()
  const {
    createNewChat,
    getChatById,
    updateChatModel,
    bumpChat,
    updateTitle,
    isLoading: isChatsLoading,
  } = useChats()

  const currentChat = useMemo(
    () => (chatId ? getChatById(chatId) : null),
    [chatId, getChatById]
  )

  const {
    messages: initialMessages,
    cacheAndAddMessage,
    saveAllMessages,
  } = useMessages()
  const { user } = useUser()
  const { preferences } = useUserPreferences()
  const { draftValue, clearDraft } = useChatDraft(chatId)
  const {
    files,
    setFiles,
    handleFileUpload,
    handleFileRemove,
    handleFileUploads,
    createOptimisticAttachments,
    cleanupOptimisticAttachments,
  } = useFileUpload()

  // Model selection
  const { selectedModel, handleModelChange } = useModel({
    currentChat: currentChat || null,
    user: null,
    updateChatModel,
    chatId,
  })

  // No auth - always authenticated in the sense that we have a session
  const isAuthenticated = true
  const systemPrompt = SYSTEM_PROMPT_DEFAULT

  // New state for quoted text
  const [quotedText, setQuotedText] = useState<{
    text: string
    messageId: string
  }>()
  const handleQuotedSelected = useCallback(
    (text: string, messageId: string) => {
      setQuotedText({ text, messageId })
    },
    []
  )

  // Chat operations (utils + handlers) - created first
  const {
    checkLimitsAndNotify,
    ensureChatExists,
    handleDelete,
    precreateChat,
  } = useChatOperations({
    isAuthenticated,
    chatId,
    messages: initialMessages,
    selectedModel,
    systemPrompt,
    userId: user?.id,
    updateTitle,
    createNewChat,
    setHasDialogAuth: () => {},
    setMessages: () => {},
    setInput: () => {},
  })

  // Core chat functionality (initialization + state + actions)
  const {
    messages,
    input,
    status,
    stop,
    hasSentFirstMessageRef,
    isSubmitting,
    enableSearch,
    setEnableSearch,
    submit,
    handleSuggestion,
    handleReload,
    handleInputChange,
    submitEdit,
  } = useChatCore({
    initialMessages,
    draftValue,
    cacheAndAddMessage: cacheAndAddMessage as any,
    saveAllMessages: saveAllMessages as any,
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
  })

  // Memoize the conversation props to prevent unnecessary rerenders
  const conversationProps = useMemo(
    () => ({
      messages,
      status,
      onDelete: handleDelete,
      onEdit: submitEdit,
      onReload: handleReload,
      onQuote: handleQuotedSelected,
      isUserAuthenticated: isAuthenticated,
    }),
    [
      messages,
      status,
      handleDelete,
      submitEdit,
      handleReload,
      handleQuotedSelected,
      isAuthenticated,
    ]
  )

  // Memoize the chat input props
  const chatInputProps = useMemo(
    () => ({
      value: input,
      onSuggestion: handleSuggestion,
      onValueChange: handleInputChange,
      onSend: submit,
      isSubmitting,
      hasMessages: messages.length > 0,
      files,
      onFileUpload: handleFileUpload,
      onFileRemove: handleFileRemove,
      hasSuggestions:
        preferences.promptSuggestions && !chatId && messages.length === 0,
      onSelectModel: handleModelChange,
      selectedModel,
      isUserAuthenticated: isAuthenticated,
      stop,
      status,
      setEnableSearch,
      enableSearch,
      quotedText,
    }),
    [
      input,
      handleSuggestion,
      handleInputChange,
      submit,
      isSubmitting,
      messages.length,
      files,
      handleFileUpload,
      handleFileRemove,
      preferences.promptSuggestions,
      chatId,
      messages.length,
      handleModelChange,
      selectedModel,
      isAuthenticated,
      stop,
      status,
      setEnableSearch,
      enableSearch,
      quotedText,
    ]
  )

  // Handle redirect for invalid chatId - only redirect if we're certain the chat doesn't exist
  // and we're not in a transient state during chat creation
  if (
    chatId &&
    !isChatsLoading &&
    !currentChat &&
    !isSubmitting &&
    status === "ready" &&
    messages.length === 0 &&
    !hasSentFirstMessageRef.current // Don't redirect if we've already sent a message in this session
  ) {
    router.replace("/")
    return null
  }

  const showOnboarding = !chatId && messages.length === 0

  return (
    <div
      className={cn(
        "@container/main relative flex h-full flex-col items-center justify-end md:justify-center"
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
            transition={{
              layout: {
                duration: 0,
              },
            }}
          >
            <h1 className="mb-6 text-3xl font-medium tracking-tight">
              What can I help you with?
            </h1>
          </motion.div>
        ) : (
          <Conversation key="conversation" {...conversationProps} />
        )}
      </AnimatePresence>

      <motion.div
        className={cn(
          "relative inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl"
        )}
        layout="position"
        layoutId="chat-input-container"
        transition={{
          layout: {
            duration: messages.length === 1 ? 0.3 : 0,
          },
        }}
      >
        <ChatInput {...chatInputProps} />
      </motion.div>
    </div>
  )
}
