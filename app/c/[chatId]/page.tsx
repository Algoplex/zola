import { ChatContainer } from "@/app/components/chat/chat-container"
import { LayoutApp } from "@/app/components/layout/layout-app"
import { MessagesProvider } from "@/lib/chat-store/messages/provider"
import { getChatById } from "@/lib/db/chat"
import { redirect } from "next/navigation"

export default async function Page({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  const { chatId } = await params

  // Verify the chat exists
  const chat = await getChatById(chatId)
  if (!chat) {
    redirect("/")
  }

  return (
    <MessagesProvider>
      <LayoutApp>
        <ChatContainer />
      </LayoutApp>
    </MessagesProvider>
  )
}
