"use client"

import * as React from "react"
import { usePlatformAnalytics } from "@/hooks/use-analytics"
import { OverviewCards } from "@/components/analytics/overview-cards"
import { VolumeChart } from "@/components/analytics/volume-chart"
import { PopularModels } from "@/components/analytics/popular-models"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"

const PIE_COLORS = ["hsl(142, 76%, 36%)", "hsl(0, 84%, 60%)", "hsl(40, 96%, 53%)", "hsl(220, 84%, 60%)"]

export default function AnalyticsPage() {
  const { data, isLoading } = usePlatformAnalytics()

  return (
    <div className="space-y-8 p-4 lg:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Platform Analytics</h1>

      <OverviewCards
        stats={data ? {
          totalProviders: data.totalProviders,
          totalEndpoints: data.totalEndpoints,
          totalTransactions: data.totalTransactions,
          totalVolume: data.totalVolume,
          activeUsers: data.activeUsers,
        } : undefined}
        isLoading={isLoading}
      />

      <VolumeChart data={data?.volumeOverTime ?? []} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PopularModels data={data?.topModels ?? []} isLoading={isLoading} />

        <Card>
          <CardHeader>
            <CardTitle>Endpoint Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : (data?.endpointDistribution ?? []).length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={data?.endpointDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={130}
                    dataKey="count"
                    nameKey="status"
                    animationDuration={1000}
                  >
                    {data?.endpointDistribution.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 10 Providers by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (data?.topProviders ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No provider data available.</p>
          ) : (
            <div className="space-y-3">
              {data?.topProviders.slice(0, 10).map((p, i) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.endpoints} endpoints</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">{parseFloat(p.revenue).toFixed(4)} XLM</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
