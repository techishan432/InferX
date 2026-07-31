"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DollarSign, Zap, MessageSquare, ArrowRight } from "lucide-react"
import { useConsumerDashboard } from "@/hooks/use-consumer"
import { useAuthStore } from "@/store/auth-store"
import { RevenueCard } from "@/components/dashboard/revenue-card"
import { SpendingChart } from "@/components/dashboard/spending-chart"
import { ConversationsList } from "@/components/dashboard/conversations-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function ConsumerDashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { data: dashboard, isLoading } = useConsumerDashboard()

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold text-white">Consumer Dashboard</h2>
        <p className="max-w-md text-zinc-400">
          Connect your Stellar wallet to access your dashboard, track spending, and manage conversations.
        </p>
        <Button>
          <Link href="/" className="flex items-center gap-1.5">
            Connect Wallet
          </Link>
        </Button>
      </div>
    )
  }

  const spendingData = dashboard?.spendingOverTime?.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    amount: item.amount,
  })) ?? Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      amount: Math.random() * 5 + 0.5,
    }
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Consumer Dashboard</h1>
        <Button>
          <Link href="/marketplace" className="flex items-center gap-1.5">
            <MessageSquare />
            Start New Chat
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RevenueCard
          icon={<DollarSign className="size-5" />}
          value={isLoading ? "..." : `${parseFloat(dashboard?.totalSpent ?? "0").toFixed(4)} XLM`}
          label="Total Spent"
          trend={-5}
          trendLabel="vs last month"
          iconColor="text-blue-500 bg-blue-500/10"
        />
        <RevenueCard
          icon={<Zap className="size-5" />}
          value={isLoading ? "..." : (dashboard?.totalRequests ?? 0).toLocaleString()}
          label="Total Requests"
          trend={15}
          iconColor="text-amber-500 bg-amber-500/10"
        />
        <RevenueCard
          icon={<MessageSquare className="size-5" />}
          value={isLoading ? "..." : String(dashboard?.activeConversations ?? 0)}
          label="Active Conversations"
          iconColor="text-green-500 bg-green-500/10"
        />
      </div>

      <SpendingChart data={spendingData} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ConversationsList
          conversations={dashboard?.recentConversations ?? []}
          isLoading={isLoading}
        />

        <Card>
          <CardHeader>
            <CardTitle>Favorite Models</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (dashboard?.favoriteModels ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No models used yet. Browse the marketplace to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {dashboard?.favoriteModels?.slice(0, 5).map((model, i) => (
                  <Link
                    key={model.endpointId}
                    href={`/marketplace/${model.endpointId}`}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium">{model.modelName}</p>
                        <p className="text-xs text-muted-foreground">{model.endpointName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {model.requestCount} requests
                      <ArrowRight className="size-3" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
