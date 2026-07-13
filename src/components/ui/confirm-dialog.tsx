"use client"

import * as React from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "./button"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "warning" | "default"
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  variant = "danger",
}: ConfirmDialogProps) {
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!isOpen) setLoading(false)
  }, [isOpen])

  React.useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  const iconColors = {
    danger: "bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400",
    warning: "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
    default: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
  }

  const confirmColors = {
    danger: "bg-rose-600 hover:bg-rose-500 text-white",
    warning: "bg-amber-600 hover:bg-amber-500 text-white",
    default: "bg-emerald-600 hover:bg-emerald-500 text-white",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-150"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border bg-background shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden">
        {/* Top accent */}
        <div className={`h-1 w-full ${variant === "danger" ? "bg-rose-500" : variant === "warning" ? "bg-amber-500" : "bg-emerald-500"}`} />

        <div className="p-6">
          {/* Icon + Title */}
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full ${iconColors[variant]}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground leading-tight">{title}</h2>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer"
            >
              {cancelLabel}
            </Button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:pointer-events-none ${confirmColors[variant]}`}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
