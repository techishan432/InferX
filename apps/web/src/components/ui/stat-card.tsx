import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  value: string
  label: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  className?: string
}

export function StatCard({
  icon: Icon,
  value,
  label,
  trend,
  trendValue,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
          <Icon className="h-5 w-5 text-cyan-400" />
        </div>
        {trend && trendValue && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend === "up" && "text-emerald-400",
              trend === "down" && "text-red-400",
              trend === "neutral" && "text-zinc-400"
            )}
          >
            {trend === "up" && <TrendingUp className="h-3 w-3" />}
            {trend === "down" && <TrendingDown className="h-3 w-3" />}
            {trend === "neutral" && <Minus className="h-3 w-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="mt-1 text-sm text-zinc-400">{label}</p>
      </div>
    </div>
  )
}
