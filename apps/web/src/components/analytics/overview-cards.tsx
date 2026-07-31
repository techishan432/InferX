import { Users, Globe, ArrowLeftRight, Coins, Activity } from "lucide-react"
import { RevenueCard } from "@/components/dashboard/revenue-card"
import { Skeleton } from "@/components/ui/skeleton"

interface PlatformStats {
  totalProviders: number
  totalEndpoints: number
  totalTransactions: number
  totalVolume: string
  activeUsers: number
}

interface OverviewCardsProps {
  stats: PlatformStats | undefined
  isLoading?: boolean
}

export function OverviewCards({ stats, isLoading }: OverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-border p-5">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <RevenueCard
        icon={<Users className="size-5" />}
        value={stats?.totalProviders.toLocaleString() ?? "0"}
        label="Total Providers"
        iconColor="text-blue-500 bg-blue-500/10"
      />
      <RevenueCard
        icon={<Globe className="size-5" />}
        value={stats?.totalEndpoints.toLocaleString() ?? "0"}
        label="Total Endpoints"
        iconColor="text-green-500 bg-green-500/10"
      />
      <RevenueCard
        icon={<ArrowLeftRight className="size-5" />}
        value={stats?.totalTransactions.toLocaleString() ?? "0"}
        label="Total Transactions"
        iconColor="text-amber-500 bg-amber-500/10"
      />
      <RevenueCard
        icon={<Coins className="size-5" />}
        value={`${parseFloat(stats?.totalVolume ?? "0").toFixed(4)} XLM`}
        label="Total Volume"
        iconColor="text-purple-500 bg-purple-500/10"
      />
      <RevenueCard
        icon={<Activity className="size-5" />}
        value={stats?.activeUsers.toLocaleString() ?? "0"}
        label="Active Users"
        iconColor="text-emerald-500 bg-emerald-500/10"
      />
    </div>
  )
}
