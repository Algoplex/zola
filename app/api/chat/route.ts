import {
  createChatInDb,
  getChatById,
  logUserMessage,
  storeAssistantMessage,
  updateChatInDb,
} from "@/lib/db/chat"
import { getAllModels } from "@/lib/models"
import { sanitizeUserInput } from "@/lib/sanitize"
import { convertToModelMessages, streamText, ToolSet } from "ai"
import { NextRequest, NextResponse } from "next/server"

type MessageAI = {
  role: "user" | "assistant" | "system"
  content?: string | Array<{ type: string; text?: string }>
  /* FIXME(@ai-sdk-upgrade-v5): The `experimental_attachments` property has been replaced with the parts array. Please manually migrate following https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0#attachments--file-parts */
  experimental_attachments?: unknown[]
  parts?: Array<{ type: string; text?: string }>
}

export const maxDuration = 60

type ChatRequest = {
  messages: MessageAI[]
  chatId: string
  model: string
  systemPrompt?: string
  enableSearch?: boolean
  message_group_id?: string
  editCutoffTimestamp?: string
}

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      chatId,
      model,
      systemPrompt,
      enableSearch,
      message_group_id,
    } = (await req.json()) as ChatRequest

    if (!messages || !chatId || !model) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      )
    }

    const normalizedMessages = messages.map((message) => {
      if (message.content !== undefined) return message
      if (message.parts && message.parts.length > 0) {
        return { ...message, content: message.parts }
      }
      return { ...message, content: "" }
    })

    // Verify chat belongs to this session
    const chat = await getChatById(chatId)
    if (!chat) {
      return new Response(JSON.stringify({ error: "Chat not found" }), {
        status: 404,
      })
    }

    const userMessage = normalizedMessages[normalizedMessages.length - 1]

    // Save user message
    if (userMessage?.role === "user") {
      /* FIXME(@ai-sdk-upgrade-v5): The `experimental_attachments` property has been replaced with the parts array. Please manually migrate following https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0#attachments--file-parts */
      await logUserMessage({
        chatId,
        content: sanitizeUserInput(
          typeof userMessage.content === "string"
            ? userMessage.content
            : (userMessage.content || [])
                .map((part) => part.text || "")
                .join("")
        ),
        role: "user",
        model,
        experimentalAttachments: userMessage.experimental_attachments,
        messageGroupId: message_group_id,
      })
    }

    const allModels = await getAllModels()
    const modelConfig = allModels.find((m) => m.id === model)

    if (!modelConfig || !modelConfig.apiSdk) {
      throw new Error(`Model ${model} not found`)
    }

    // For now, allow all models without API key requirements
    // TODO: Add API key support if needed
    const SYSTEM_PROMPT_DEFAULT = `You are Zola, an AI assistant.`

    const result = streamText({
      model: modelConfig.apiSdk?.() ?? model,
      system: systemPrompt || SYSTEM_PROMPT_DEFAULT,
      messages: await convertToModelMessages(normalizedMessages as any),
      tools: {} as ToolSet,
      onError: (err: unknown) => {
        console.error("Streaming error occurred:", err)
      },
      onFinish: async ({ response }) => {
        await storeAssistantMessage({
          chatId,
          messages: response.messages as unknown as Array<{
            role: string
            content: string
            parts?: any
          }>,
          messageGroupId: message_group_id,
          model,
        })
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (err: unknown) {
    console.error("Error in /api/chat:", err)
    const error = err as { message?: string; statusCode?: number }

    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: error.statusCode || 500 }
    )
  }
}
