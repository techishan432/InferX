"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Star,
  Zap,
  Radio,
  Eye,
  Clock,
  MessageSquare,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEndpoint, useEndpointRatings } from "@/hooks/use-marketplace"
import { cn } from "@/lib/utils"

function formatContextLength(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(0)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`
  return tokens.toString()
}

function RatingStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            size === "md" ? "h-4 w-4" : "h-3.5 w-3.5",
            i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-zinc-600"
          )}
        />
      ))}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
        <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/5" />
        ))}
      </div>
    </div>
  )
}

function EndpointDetailContent() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const endpointId = params.id

  const { data: endpoint, isLoading, isError } = useEndpoint(endpointId)
  const { data: ratings } = useEndpointRatings(endpointId)

  if (isLoading) return <DetailSkeleton />

  if (isError || !endpoint) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">Endpoint not found</p>
        <Button variant="outline" onClick={() => router.push("/marketplace")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Marketplace
        </Button>
      </div>
    )
  }

  const stats = [
    {
      icon: Zap,
      label: "Context Window",
      value: `${formatContextLength(endpoint.contextLength)} tokens`,
    },
    {
      icon: Clock,
      label: "Avg Latency",
      value: endpoint.totalRequests ? "~200ms" : "N/A",
    },
    {
      icon: Radio,
      label: "Requests Served",
      value: Number(endpoint.totalRequests).toLocaleString(),
    },
    {
      icon: MessageSquare,
      label: "Streaming",
      value: endpoint.supportsStreaming ? "Supported" : "Not supported",
    },
    {
      icon: Eye,
      label: "Vision",
      value: endpoint.supportsVision ? "Supported" : "Not supported",
    },
    {
      icon: Shield,
      label: "Health Status",
      value: endpoint.healthStatus === "healthy" ? "Healthy" : endpoint.healthStatus,
    },
  ]

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 text-zinc-400 hover:text-white"
            onClick={() => router.push("/marketplace")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-400">{endpoint.provider.name}</p>
              <h1 className="mt-1 text-2xl font-bold text-white">{endpoint.displayName}</h1>
              <p className="mt-1 text-sm text-zinc-500">{endpoint.modelName}</p>

              <div className="mt-3 flex items-center gap-3">
                <RatingStars rating={endpoint.averageRating} size="md" />
                <span className="text-sm text-zinc-400">
                  {endpoint.averageRating.toFixed(1)} ({endpoint.totalReviews} reviews)
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {endpoint.supportsStreaming && (
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                    Streaming
                  </Badge>
                )}
                {endpoint.supportsVision && (
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                    <Eye className="mr-1 h-3 w-3" />
                    Vision
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-white">{endpoint.pricePerRequest}</span>
                <Badge variant="secondary">XLM</Badge>
              </div>
              <p className="mt-1 text-xs text-zinc-500">per request</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
            >
              <stat.icon className="h-5 w-5 text-cyan-400" />
              <p className="mt-2 text-sm font-semibold text-white">{stat.value}</p>
              <p className="text-xs text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {endpoint.description && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
          >
            <h2 className="text-lg font-semibold text-white">About this model</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{endpoint.description}</p>
          </motion.div>
        )}

        {ratings && ratings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
          >
            <h2 className="text-lg font-semibold text-white">Recent Reviews</h2>
            <div className="mt-4 space-y-4">
              {ratings.slice(0, 5).map((review) => (
                <div
                  key={review.id}
                  className="border-b border-white/5 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RatingStars rating={review.rating} />
                      <span className="text-sm font-medium text-zinc-300">
                        {review.reviewer.displayName}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-1.5 text-sm text-zinc-400">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex justify-center"
        >
          <Link
            href={`/chat?endpoint=${endpoint.id}`}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-cyan-500 px-8 text-sm font-semibold text-white transition-colors hover:bg-cyan-400"
          >
            <MessageSquare className="h-4 w-4" />
            Start Chatting
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

export default function EndpointDetailPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <EndpointDetailContent />
    </Suspense>
  )
}
