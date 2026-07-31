"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface ModelData {
  model: string
  requests: number
  revenue: string
}

interface PopularModelsProps {
  data: ModelData[]
  isLoading?: boolean
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ModelData }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="text-sm font-semibold">{d.model}</p>
      <p className="text-xs text-muted-foreground">{d.requests.toLocaleString()} requests</p>
      <p className="text-xs text-muted-foreground">{parseFloat(d.revenue).toFixed(4)} XLM revenue</p>
    </div>
  )
}

export function PopularModels({ data, isLoading }: PopularModelsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Models by Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Models by Usage</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No usage data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="model"
                type="category"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="requests" radius={[0, 4, 4, 0]} animationDuration={1000}>
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
