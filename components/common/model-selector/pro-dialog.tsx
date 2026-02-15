"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ProModelDialogProps = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  currentModel: string
}

export function ProModelDialog({
  isOpen,
  setIsOpen,
  currentModel,
}: ProModelDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pro Model</DialogTitle>
          <DialogDescription>
            This is a Pro model that requires a subscription. Current model:{" "}
            {currentModel}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
