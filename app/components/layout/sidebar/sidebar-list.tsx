import { Chat } from "@/lib/chat-store/types"
import { ReactNode } from "react"
import { SidebarItem } from "./sidebar-item"

type SidebarListProps = {
  title: string
  icon?: ReactNode
  items: Chat[]
  currentChatId: string
}

export function SidebarList({
  title,
  icon,
  items,
  currentChatId,
}: SidebarListProps) {
  return (
    <div>
      <h3 className="text-sidebar-foreground/60 flex items-center gap-1 overflow-hidden px-2 pt-3 pb-2 text-[11px] font-semibold tracking-wide break-all text-ellipsis uppercase">
        {icon && <span>{icon}</span>}
        {title}
      </h3>
      <div className="space-y-0.5">
        {items.map((chat) => (
          <SidebarItem
            key={chat.id}
            chat={chat}
            currentChatId={currentChatId}
          />
        ))}
      </div>
    </div>
  )
}
