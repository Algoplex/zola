"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GithubLogoIcon } from "@phosphor-icons/react"
import { useState } from "react"
import { SettingsTrigger } from "./settings/settings-trigger"

export function UserMenu() {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [isSettingsOpen, setSettingsOpen] = useState(false)

  const handleSettingsOpenChange = (isOpen: boolean) => {
    setSettingsOpen(isOpen)
    if (!isOpen) {
      setMenuOpen(false)
    }
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setMenuOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button className="hover:bg-accent flex items-center gap-2 rounded-full border p-1 pr-3 transition-colors">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full">
            Z
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleSettingsOpenChange(true)}>
          <SettingsTrigger
            isOpen={isSettingsOpen}
            onOpenChange={handleSettingsOpenChange}
          />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href="https://github.com/zola-chat/zola"
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-center"
          >
            <GithubLogoIcon className="mr-2 size-4" />
            <span>Star on GitHub</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href="https://discord.gg/zola"
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-center"
          >
            <span>Join Discord</span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
