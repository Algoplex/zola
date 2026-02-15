"use client"

import { HistoryTrigger } from "@/app/components/history/history-trigger"
import { groupChatsByDate } from "@/app/components/history/utils"
import { ButtonNewChat } from "@/app/components/layout/button-new-chat"
import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { OpenAIIcon } from "@/components/icons/openai"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { useChats } from "@/lib/chat-store/chats/provider"
import {
  ChatTeardropText,
  MagnifyingGlass,
  SidebarSimple,
  X,
} from "@phosphor-icons/react"
import { Pin } from "lucide-react"
import { useParams } from "next/navigation"
import { useMemo } from "react"
import { SidebarList } from "./sidebar-list"

export function AppSidebar() {
  const isMobile = useBreakpoint(768)
  const { setOpenMobile, toggleSidebar, state } = useSidebar()
  const { chats, pinnedChats, isLoading } = useChats()
  const params = useParams<{ chatId: string }>()
  const currentChatId = params.chatId

  const groupedChats = useMemo(() => {
    const result = groupChatsByDate(chats, "")
    return result
  }, [chats])
  const hasChats = chats.length > 0

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="bg-sidebar text-sidebar-foreground border-none"
    >
      {!isMobile && (
        <SidebarHeader className="px-2 pt-2 pb-1">
          <div
            className={
              state === "collapsed"
                ? "flex items-center justify-center"
                : "flex items-center justify-between"
            }
          >
            {state === "collapsed" ? (
              <button
                type="button"
                onClick={toggleSidebar}
                className="group/toggle text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent inline-flex size-9 items-center justify-center rounded-lg transition-colors"
                title="Expand sidebar"
              >
                <span className="relative size-5">
                  <OpenAIIcon className="absolute inset-0 size-5 text-black opacity-100 transition-opacity group-hover/toggle:opacity-0 dark:text-white" />
                  <SidebarSimple className="absolute inset-0 size-5 opacity-0 transition-opacity group-hover/toggle:opacity-100" />
                </span>
              </button>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <OpenAIIcon className="size-5 text-black dark:text-white" />
                </div>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent inline-flex size-9 items-center justify-center rounded-lg transition-colors"
                  title="Collapse sidebar"
                >
                  <SidebarSimple className="size-5" />
                </button>
              </>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {state === "collapsed" ? (
              <>
                <ButtonNewChat
                  showOnHome
                  iconSize={20}
                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent inline-flex size-9 items-center justify-center rounded-lg bg-transparent"
                />
                <HistoryTrigger
                  hasSidebar={false}
                  classNameTrigger="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent inline-flex size-9 items-center justify-center rounded-lg bg-transparent"
                  icon={<MagnifyingGlass size={18} />}
                />
              </>
            ) : (
              <ButtonNewChat
                showLabel
                showOnHome
                iconSize={20}
                className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent inline-flex w-full items-center rounded-lg"
              />
            )}
          </div>
        </SidebarHeader>
      )}
      {isMobile && (
        <SidebarHeader className="h-14 px-3">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setOpenMobile(false)}
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent inline-flex size-10 items-center justify-center rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </SidebarHeader>
      )}
      <SidebarContent
        className={
          isMobile
            ? ""
            : "pt-2 transition-[opacity,transform] duration-200 ease-linear group-data-[state=collapsed]:pointer-events-none group-data-[state=collapsed]:-translate-x-2 group-data-[state=collapsed]:opacity-0"
        }
      >
        <ScrollArea className="flex h-full px-2 pb-4 [&>div>div]:!block">
          <div className="mb-4">
            <HistoryTrigger
              hasSidebar={false}
              classNameTrigger="bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/80 relative inline-flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors"
              icon={<MagnifyingGlass size={16} className="mr-2.5 opacity-70" />}
              label={<span className="opacity-80">Search</span>}
              hasPopover={false}
            />
          </div>
          {isLoading ? (
            <div className="h-full" />
          ) : hasChats ? (
            <div className="space-y-4">
              {pinnedChats.length > 0 && (
                <SidebarList
                  key="pinned"
                  title="Pinned"
                  icon={<Pin className="size-3" />}
                  items={pinnedChats}
                  currentChatId={currentChatId}
                />
              )}
              {groupedChats?.map((group) => (
                <SidebarList
                  key={group.name}
                  title={group.name}
                  items={group.chats}
                  currentChatId={currentChatId}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-[calc(100vh-160px)] flex-col items-center justify-center">
              <ChatTeardropText
                size={24}
                className="text-sidebar-foreground/50 mb-1"
              />
              <div className="text-sidebar-foreground/70 text-center">
                <p className="mb-1 text-base font-medium">No chats yet</p>
                <p className="text-sm opacity-70">Start a new conversation</p>
              </div>
            </div>
          )}
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  )
}
