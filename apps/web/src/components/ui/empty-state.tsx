import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Inbox } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
        <Icon className="h-6 w-6 text-zinc-400" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-white">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-zinc-400">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="lg"
          className="mt-6"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
