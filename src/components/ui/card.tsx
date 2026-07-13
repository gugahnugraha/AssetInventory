import * as React from "react"
import { cn } from "@/lib/utils"

// Colorful border gradients cycling palette
const CARD_BORDER_COLORS = [
  "before:from-violet-500 before:to-purple-400",
  "before:from-emerald-500 before:to-teal-400",
  "before:from-sky-500 before:to-blue-400",
  "before:from-rose-500 before:to-pink-400",
  "before:from-amber-500 before:to-yellow-400",
  "before:from-fuchsia-500 before:to-pink-400",
]

export type CardAccent = "violet" | "emerald" | "sky" | "rose" | "amber" | "pink" | "indigo" | "cyan" | "auto" | "none"

const accentMap: Record<string, string> = {
  violet:  "border-t-[3px] border-t-violet-500",
  emerald: "border-t-[3px] border-t-emerald-500",
  sky:     "border-t-[3px] border-t-sky-500",
  rose:    "border-t-[3px] border-t-rose-500",
  amber:   "border-t-[3px] border-t-amber-500",
  pink:    "border-t-[3px] border-t-pink-500",
  indigo:  "border-t-[3px] border-t-indigo-500",
  cyan:    "border-t-[3px] border-t-cyan-500",
  none:    "",
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: CardAccent
}

let _cardCounter = 0
const AUTO_ACCENTS: CardAccent[] = ["violet", "emerald", "sky", "rose", "amber", "pink", "indigo", "cyan"]

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, accent = "none", ...props }, ref) => {
    const resolvedAccent = React.useMemo(() => {
      if (accent === "auto") {
        const idx = _cardCounter % AUTO_ACCENTS.length
        _cardCounter++
        return AUTO_ACCENTS[idx]
      }
      return accent
    }, [accent])

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:shadow-md transition-shadow duration-200",
          accentMap[resolvedAccent] ?? "",
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "font-semibold leading-none tracking-tight text-lg text-zinc-950",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-zinc-800 font-normal", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
