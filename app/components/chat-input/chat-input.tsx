"use client"

import {
  PromptInput,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input"
import { Button } from "@/components/ui/button"
import { ArrowUpIcon, StopIcon } from "@phosphor-icons/react"
import { useCallback, useEffect, useRef } from "react"
import { PromptSystem } from "../suggestions/prompt-system"
import { FileList } from "./file-list"

type ChatInputProps = {
  value: string
  onValueChange: (value: string) => void
  onSend: () => void
  isSubmitting?: boolean
  hasMessages?: boolean
  files: File[]
  onFileUpload: (files: File[]) => void
  onFileRemove: (file: File) => void
  onSuggestion: (suggestion: string) => void
  hasSuggestions?: boolean
  isUserAuthenticated: boolean
  stop: () => void
  status?: "submitted" | "streaming" | "ready" | "error"
  setEnableSearch: (enabled: boolean) => void
  enableSearch: boolean
  quotedText?: { text: string; messageId: string } | null
}

export function ChatInput({
  value,
  onValueChange,
  onSend,
  isSubmitting,
  hasMessages,
  files,
  onFileUpload,
  onFileRemove,
  onSuggestion,
  hasSuggestions,
  isUserAuthenticated,
  stop,
  status,
  setEnableSearch,
  enableSearch,
  quotedText,
}: ChatInputProps) {
  const isOnlyWhitespace = (text: string) => !/[^\s]/.test(text)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const allowAutoFocus = !hasMessages

  const handleSend = useCallback(() => {
    if (isSubmitting) {
      return
    }

    if (status === "streaming") {
      stop()
      return
    }

    onSend()
  }, [isSubmitting, onSend, status, stop])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isSubmitting) {
        e.preventDefault()
        return
      }

      if (e.key === "Enter" && status === "streaming") {
        e.preventDefault()
        return
      }

      if (e.key === "Enter" && !e.shiftKey) {
        if (isOnlyWhitespace(value)) {
          return
        }

        e.preventDefault()
        onSend()
      }
    },
    [isSubmitting, onSend, status, value]
  )

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const hasImageContent = Array.from(items).some((item) =>
        item.type.startsWith("image/")
      )

      if (!isUserAuthenticated && hasImageContent) {
        e.preventDefault()
        return
      }

      if (isUserAuthenticated && hasImageContent) {
        const imageFiles: File[] = []

        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile()
            if (file) {
              const newFile = new File(
                [file],
                `pasted-image-${Date.now()}.${file.type.split("/")[1]}`,
                { type: file.type }
              )
              imageFiles.push(newFile)
            }
          }
        }

        if (imageFiles.length > 0) {
          onFileUpload(imageFiles)
        }
      }
      // Text pasting will work by default for everyone
    },
    [isUserAuthenticated, onFileUpload]
  )

  useEffect(() => {
    if (quotedText) {
      const quoted = quotedText.text
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n")
      onValueChange(value ? `${value}\n\n${quoted}\n\n` : `${quoted}\n\n`)

      requestAnimationFrame(() => {
        textareaRef.current?.focus()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotedText, onValueChange])

  return (
    <div className="relative flex w-full flex-col gap-4">
      {hasSuggestions && (
        <PromptSystem
          onValueChange={onValueChange}
          onSuggestion={onSuggestion}
          value={value}
        />
      )}
      <div
        className="relative order-2 px-2 pb-3 sm:pb-4 md:order-1"
        onClick={() => textareaRef.current?.focus()}
      >
        <PromptInput
          className="bg-popover relative z-10 p-0 pt-1 shadow-xs backdrop-blur-xl"
          maxHeight={200}
          value={value}
          onValueChange={onValueChange}
        >
          <FileList files={files} onFileRemove={onFileRemove} />
          <PromptInputTextarea
            ref={textareaRef}
            autoFocus={allowAutoFocus}
            placeholder="Ask Anything"
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="min-h-10 py-2 pr-10 pl-4 text-base leading-[1.3] sm:text-base md:text-base"
          />
          <Button
            size="sm"
            className="absolute right-2 bottom-2 size-8 rounded-full transition-all duration-300 ease-out"
            disabled={Boolean(
              !value || isSubmitting || isOnlyWhitespace(value)
            )}
            type="button"
            onClick={handleSend}
            aria-label={status === "streaming" ? "Stop" : "Send message"}
          >
            {status === "streaming" ? (
              <StopIcon className="size-4" />
            ) : (
              <ArrowUpIcon className="size-4" />
            )}
          </Button>
        </PromptInput>
      </div>
    </div>
  )
}
