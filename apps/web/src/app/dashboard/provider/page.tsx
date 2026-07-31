"use client"

import { useProviderDashboard, useProviderEndpoints } from "@/hooks/use-provider"
import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"
import * as React from "react"
import { DollarSign, Activity, Zap, Star, BarChart3, Plus, ExternalLink } from "lucide-react"
import { RevenueCard } from "@/components/dashboard/revenue-card"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { EndpointManager } from "@/components/dashboard/endpoint-manager"
import { TransactionsList } from "@/components/dashboard/transactions-list"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export default function ProviderDashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { data: dashboard, isLoading: dashLoading } = useProviderDashboard()
  const { data: endpoints, isLoading: endpointsLoading } = useProviderEndpoints()

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold text-white">Provider Dashboard</h2>
        <p className="max-w-md text-zinc-400">
          Connect your Stellar wallet to access the provider dashboard and manage your AI endpoints.
        </p>
        <Button>
          <Link href="/" className="flex items-center gap-1.5">
            Connect Wallet
          </Link>
        </Button>
      </div>
    )
  }

  if (isAuthenticated && user && !user.isProvider) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold text-white">Not a Provider</h2>
        <p className="max-w-md text-zinc-400">
          Register as a provider to access this dashboard. You can do this from your wallet settings.
        </p>
        <Button>
          <Link href="/marketplace" className="flex items-center gap-1.5">
            Browse Marketplace
          </Link>
        </Button>
      </div>
    )
  }

  const revenueData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: Math.random() * 50 + 10,
    }
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Provider Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Link href="/analytics" className="flex items-center gap-1.5">
              <BarChart3 />
              Analytics
            </Link>
          </Button>
          <Button variant="outline">
            <Link href="/dashboard/provider" className="flex items-center gap-1.5">
              <ExternalLink />
              View All Endpoints
            </Link>
          </Button>
          <Button>
            <Link href="/dashboard/provider?action=add" className="flex items-center gap-1.5">
              <Plus />
              Add Endpoint
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RevenueCard
          icon={<DollarSign className="size-5" />}
          value={dashLoading ? "..." : `${parseFloat(dashboard?.totalEarnings ?? "0").toFixed(4)} XLM`}
          label="Total Revenue"
          trend={12}
          trendLabel="vs last month"
          iconColor="text-green-500 bg-green-500/10"
        />
        <RevenueCard
          icon={<Activity className="size-5" />}
          value={dashLoading ? "..." : String(dashboard?.activeEndpoints ?? 0)}
          label="Active Endpoints"
          trend={3}
          iconColor="text-blue-500 bg-blue-500/10"
        />
        <RevenueCard
          icon={<Zap className="size-5" />}
          value={dashLoading ? "..." : Number(dashboard?.totalRequests ?? 0).toLocaleString()}
          label="Total Requests"
          trend={8}
          iconColor="text-amber-500 bg-amber-500/10"
        />
        <RevenueCard
          icon={<Star className="size-5" />}
          value={dashLoading ? "..." : (dashboard?.averageRating ?? 0).toFixed(1)}
          label="Average Rating"
          trend={2}
          iconColor="text-purple-500 bg-purple-500/10"
        />
      </div>

      <RevenueChart data={revenueData} isLoading={dashLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EndpointManager endpoints={endpoints ?? []} isLoading={endpointsLoading} />
        </div>
        <div>
          <TransactionsList
            transactions={dashboard?.recentTransactions ?? []}
            isLoading={dashLoading}
          />
        </div>
      </div>
    </div>
  )
}
