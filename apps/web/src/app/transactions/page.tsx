"use client"

import * as React from "react"
import { useTransactions } from "@/hooks/use-transactions"
import { useAuthStore } from "@/store/auth-store"
import { TransactionTable } from "@/components/transactions/transaction-table"
import { TransactionFilters } from "@/components/transactions/transaction-filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function TransactionsPage() {
  const { user } = useAuthStore()
  const [page, setPage] = React.useState(1)
  const [filters, setFilters] = React.useState({
    status: "",
    dateFrom: "",
    dateTo: "",
    type: "all",
    search: "",
  })

  const viewType = user?.isProvider ? "provider" : user?.isConsumer ? "consumer" : "all"

  const { data, isLoading } = useTransactions({
    page,
    pageSize: 20,
    status: filters.status || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    type: filters.type as "all" | "sent" | "received" | undefined,
  })

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TransactionFilters filters={filters} onChange={setFilters} />
          <TransactionTable
            transactions={data?.data ?? []}
            isLoading={isLoading}
            onViewType={viewType}
          />

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                Page {data.page} of {data.totalPages} ({data.total} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
