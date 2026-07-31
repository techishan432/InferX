"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Star, Zap, Radio, Eye, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface EndpointCardProps {
  id: string
  displayName: string
  modelName: string
  providerName: string
  pricePerRequest: string
  averageRating: number
  contextLength: number
  supportsStreaming: boolean
  supportsVision: boolean
  totalRequests: string
  healthStatus: string
  index?: number
}

function formatContextLength(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(0)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`
  return tokens.toString()
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3 w-3",
            i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-zinc-600"
          )}
        />
      ))}
      <span className="ml-1 text-xs text-zinc-400">{rating.toFixed(1)}</span>
    </div>
  )
}

export function EndpointCard({
  id,
  displayName,
  modelName,
  providerName,
  pricePerRequest,
  averageRating,
  contextLength,
  supportsStreaming,
  supportsVision,
  totalRequests,
  healthStatus,
  index = 0,
}: EndpointCardProps) {
  const isOnline = healthStatus === "healthy"

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card/90 p-5 backdrop-blur-md transition-all duration-300 hover:border-cyan-500/40 hover:bg-card hover:shadow-lg hover:shadow-cyan-500/10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground truncate">{providerName}</p>
            <h3 className="mt-1 text-sm font-semibold text-foreground truncate">{displayName}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground/80 truncate">{modelName}</p>
          </div>
          <div className="flex items-center gap-1.5 ml-3">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                isOnline ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-muted-foreground"
              )}
            />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground">{pricePerRequest}</span>
          <Badge variant="cyan" className="text-[10px]">
            XLM
          </Badge>
        </div>

        <div className="mt-3">
          <RatingStars rating={averageRating} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Zap className="h-3 w-3 text-cyan-500" />
            <span>{formatContextLength(contextLength)} tokens</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Radio className="h-3 w-3 text-violet-500" />
            <span>{Number(totalRequests).toLocaleString()} reqs</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {supportsStreaming && (
            <Badge variant="cyan" className="text-[10px]">
              Streaming
            </Badge>
          )}
          {supportsVision && (
            <Badge variant="violet" className="text-[10px]">
              <Eye className="mr-1 h-2.5 w-2.5" />
              Vision
            </Badge>
          )}
        </div>

        <Link
          href={`/chat?endpoint=${id}`}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-accent/30 px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-cyan-500 hover:text-white hover:border-cyan-500 shadow-xs"
        >
          Use Model
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </motion.div>
  )
}

export function EndpointCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-5 space-y-3">
      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      <div className="h-5 w-36 animate-pulse rounded bg-muted" />
      <div className="h-8 w-24 animate-pulse rounded bg-muted" />
      <div className="h-3 w-28 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-4 animate-pulse rounded bg-muted" />
        <div className="h-4 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-9 animate-pulse rounded-lg bg-muted" />
    </div>
  )
}
