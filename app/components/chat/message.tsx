import { type UIMessage } from "@ai-sdk/react"
import React, { useState } from "react"
import { MessageAssistant } from "./message-assistant"
import { MessageUser } from "./message-user"

type MessageProps = {
  variant: UIMessage["role"]
  children: string
  id: string
  attachments?: any
  isLast?: boolean
  onDelete: (id: string) => void
  onEdit: (id: string, newText: string) => Promise<void> | void
  onReload: () => void
  hasScrollAnchor?: boolean
  parts?: UIMessage["parts"]
  status?: "streaming" | "ready" | "submitted" | "error"
  className?: string
  onQuote?: (text: string, messageId: string) => void
  messageGroupId?: string | null
  isUserAuthenticated?: boolean
}

function MessageComponent({
  variant,
  children,
  id,
  attachments,
  isLast,
  onEdit,
  onReload,
  hasScrollAnchor,
  parts,
  status,
  className,
  onQuote,
  messageGroupId,
  isUserAuthenticated,
}: MessageProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 500)
  }

  if (variant === "user") {
    return (
      <MessageUser
        copied={copied}
        copyToClipboard={copyToClipboard}
        onReload={onReload}
        onEdit={onEdit}
        id={id}
        hasScrollAnchor={hasScrollAnchor}
        attachments={attachments}
        className={className}
        messageGroupId={messageGroupId}
        isUserAuthenticated={isUserAuthenticated}
      >
        {children}
      </MessageUser>
    )
  }

  if (variant === "assistant") {
    return (
      <MessageAssistant
        copied={copied}
        copyToClipboard={copyToClipboard}
        onReload={onReload}
        isLast={isLast}
        hasScrollAnchor={hasScrollAnchor}
        parts={parts}
        status={status}
        className={className}
        messageId={id}
        onQuote={onQuote}
      >
        {children}
      </MessageAssistant>
    )
  }

  return null
}

export const Message = React.memo(MessageComponent, (prevProps, nextProps) => {
  return (
    prevProps.variant === nextProps.variant &&
    prevProps.children === nextProps.children &&
    prevProps.id === nextProps.id &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.hasScrollAnchor === nextProps.hasScrollAnchor &&
    prevProps.status === nextProps.status &&
    prevProps.className === nextProps.className &&
    prevProps.messageGroupId === nextProps.messageGroupId &&
    prevProps.isUserAuthenticated === nextProps.isUserAuthenticated &&
    prevProps.attachments === nextProps.attachments &&
    prevProps.parts === nextProps.parts &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onReload === nextProps.onReload &&
    prevProps.onQuote === nextProps.onQuote
  )
})
