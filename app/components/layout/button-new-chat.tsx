"use client"

import { useKeyShortcut } from "@/app/hooks/use-key-shortcut"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { NotePencilIcon } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

export function ButtonNewChat({
  className,
  showLabel,
  showOnHome,
  iconSize = 20,
}: {
  className?: string
  showLabel?: boolean
  showOnHome?: boolean
  iconSize?: number
}) {
  const pathname = usePathname()
  const router = useRouter()

  useKeyShortcut(
    (e) => (e.key === "u" || e.key === "U") && e.metaKey && e.shiftKey,
    () => router.push("/")
  )

  if (pathname === "/" && !showOnHome) return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/"
          className={cn(
            "text-muted-foreground hover:text-foreground hover:bg-muted bg-background rounded-full p-1.5 transition-colors",
            showLabel && "rounded-lg bg-transparent p-0",
            className
          )}
          prefetch
          aria-label="New Chat"
        >
          <span
            className={cn(
              "inline-flex items-center",
              showLabel && "gap-3 px-3 py-2"
            )}
          >
            <NotePencilIcon size={iconSize} />
            {showLabel ? <span className="text-sm">New chat</span> : null}
          </span>
        </Link>
      </TooltipTrigger>
      <TooltipContent>New Chat ⌘⇧U</TooltipContent>
    </Tooltip>
  )
}
