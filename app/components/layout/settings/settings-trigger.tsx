"use client"

import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { User } from "@phosphor-icons/react"
import { useState } from "react"
import { SettingsContent } from "./settings-content"

type SettingsTriggerProps = {
  onOpenChange: (open: boolean) => void
  isOpen?: boolean
}

export function SettingsTrigger({
  onOpenChange,
  isOpen: externalIsOpen,
}: SettingsTriggerProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isMobile = useBreakpoint(768)

  const isControlled = externalIsOpen !== undefined
  const isOpen = isControlled ? externalIsOpen : internalOpen

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    onOpenChange(newOpen)
  }

  const trigger = (
    <Button variant="ghost" className="w-full justify-start px-2">
      <User className="mr-2 size-4" />
      <span>Settings</span>
    </Button>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <SettingsContent isDrawer />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex h-[80%] min-h-[480px] w-full flex-col gap-0 p-0 sm:max-w-[768px]">
        <DialogHeader className="border-border border-b px-6 py-5">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <SettingsContent />
      </DialogContent>
    </Dialog>
  )
}
