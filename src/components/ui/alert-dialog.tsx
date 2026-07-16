"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react"

interface AlertDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  variant?: "success" | "danger" | "warning" | "info"
  okLabel?: string
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  description,
  variant = "info",
  okLabel = "OK",
}: AlertDialogProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
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

  const ringColors = {
    success: "bg-emerald-100 dark:bg-emerald-950/40",
    danger: "bg-rose-100 dark:bg-rose-950/40",
    warning: "bg-amber-100 dark:bg-amber-950/40",
    info: "bg-blue-100 dark:bg-blue-950/40",
  }

  const innerColors = {
    success: "bg-emerald-600 dark:bg-emerald-500",
    danger: "bg-rose-600 dark:bg-rose-500",
    warning: "bg-amber-600 dark:bg-amber-500",
    info: "bg-blue-600 dark:bg-blue-500",
  }

  const shadowColors = {
    success: "shadow-emerald-600/20",
    danger: "shadow-rose-600/20",
    warning: "shadow-amber-600/20",
    info: "shadow-blue-600/20",
  }

  const okButtonColors = {
    success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 hover:scale-[1.02]",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20 hover:scale-[1.02]",
    warning: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20 hover:scale-[1.02]",
    info: "bg-zinc-900 hover:bg-zinc-850 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 hover:scale-[1.02]",
  }

  const IconComponent = () => {
    switch (variant) {
      case "success":
        return <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
      case "danger":
        return <X className="h-6 w-6 stroke-[3]" />
      case "warning":
        return <AlertTriangle className="h-6 w-6 stroke-[2.5]" />
      default:
        return <Info className="h-6 w-6 stroke-[2.5]" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in-0 duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-[360px] rounded-3xl border bg-background p-7 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden">
        <div className="flex flex-col items-center text-center">
          {/* Circular Icon Container */}
          <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
            {/* Pulsing rings */}
            <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${ringColors[variant]}`} />
            <div className={`absolute inset-2 rounded-full border opacity-50 ${ringColors[variant]}`} />
            <div className={`relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg ${innerColors[variant]} ${shadowColors[variant]}`}>
              <IconComponent />
            </div>
          </div>

          <h3 className="text-xl font-black tracking-tight text-foreground">
            {title}
          </h3>

          <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed font-medium max-w-[285px]">
            {description}
          </p>

          <button
            type="button"
            onClick={onClose}
            className={`w-full mt-7 py-3 px-5 rounded-2xl font-extrabold text-sm tracking-wide shadow-lg active:scale-95 transition-all duration-200 cursor-pointer ${okButtonColors[variant]}`}
          >
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
