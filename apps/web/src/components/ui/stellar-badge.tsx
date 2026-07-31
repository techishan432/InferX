import { cn } from "@/lib/utils"
import { Sparkles } from "lucide-react"

interface StellarBadgeProps extends React.ComponentProps<"div"> {
  label?: string
}

export function StellarBadge({ className, label = "Built on Stellar", ...props }: StellarBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300",
        className
      )}
      {...props}
    >
      <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
      {label}
    </div>
  )
}
