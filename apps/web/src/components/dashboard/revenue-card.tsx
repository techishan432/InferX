"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { GlassCard } from "@/components/ui/glass-card"

interface RevenueCardProps {
  icon: React.ReactNode
  value: string
  label: string
  trend?: number
  trendLabel?: string
  iconColor?: string
}

export function RevenueCard({
  icon,
  value,
  label,
  trend,
  trendLabel,
  iconColor = "text-primary bg-primary/10",
}: RevenueCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <GlassCard className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn("flex size-10 items-center justify-center rounded-full", iconColor)}>
            {icon}
          </div>
          {trend !== undefined && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                trend >= 0
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
              )}
            >
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
        {trendLabel && (
          <p className="mt-1 text-xs text-muted-foreground">{trendLabel}</p>
        )}
      </GlassCard>
    </motion.div>
  )
}
