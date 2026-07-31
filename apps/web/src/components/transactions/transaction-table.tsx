"use client"

import * as React from "react"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ExternalLink, ArrowUpDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Transaction {
  id: string
  amount: string
  fee: string
  status: "COMPLETED" | "FAILED" | "PENDING"
  stellarTxHash: string | null
  createdAt: string
  consumer: {
    displayName: string
    walletAddress: string
  }
  provider: {
    displayName: string
    walletAddress: string
  }
  endpoint: {
    id: string
    displayName: string
    modelName: string
  }
}

interface TransactionTableProps {
  transactions: Transaction[]
  isLoading?: boolean
  onViewType?: "provider" | "consumer" | "all"
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    COMPLETED: "bg-green-500/10 text-green-500",
    FAILED: "bg-red-500/10 text-red-500",
    PENDING: "bg-yellow-500/10 text-yellow-500",
  }
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", variants[status] ?? "bg-muted text-muted-foreground")}>
      <span className={cn("mr-1.5 size-1.5 rounded-full", status === "COMPLETED" ? "bg-green-500" : status === "FAILED" ? "bg-red-500" : "bg-yellow-500")} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function shortenHash(hash?: string | null) {
  if (!hash) return "—"
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`
}

export function TransactionTable({ transactions, isLoading, onViewType = "all" }: TransactionTableProps) {
  const [sortKey, setSortKey] = React.useState<"date" | "amount">("date")
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc")

  const sorted = [...transactions].sort((a, b) => {
    let cmp = 0
    if (sortKey === "date") {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    } else {
      cmp = parseFloat(a.amount) - parseFloat(b.amount)
    }
    return sortDir === "desc" ? -cmp : cmp
  })

  function toggleSort(key: "date" | "amount") {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc")
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium">No transactions found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Transactions will appear here as they occur.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <button onClick={() => toggleSort("date")} className="flex items-center gap-1 hover:text-foreground">
              Date <ArrowUpDown className="size-3" />
            </button>
          </TableHead>
          <TableHead>Other Party</TableHead>
          <TableHead>Endpoint</TableHead>
          <TableHead>
            <button onClick={() => toggleSort("amount")} className="flex items-center gap-1 hover:text-foreground">
              Amount <ArrowUpDown className="size-3" />
            </button>
          </TableHead>
          <TableHead>Fee</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Stellar Tx</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((tx) => {
          const otherParty = onViewType === "provider" ? tx.consumer : tx.provider
          return (
            <TableRow key={tx.id}>
              <TableCell className="text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
              <TableCell>
                <div>
                  <p className="text-sm font-medium">{otherParty.displayName || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">
                    {otherParty.walletAddress.slice(0, 8)}...
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Link
                  href={`/marketplace/${tx.endpoint.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {tx.endpoint.displayName}
                </Link>
              </TableCell>
              <TableCell className="font-medium">{parseFloat(tx.amount).toFixed(4)} XLM</TableCell>
              <TableCell className="text-muted-foreground">{parseFloat(tx.fee).toFixed(4)} XLM</TableCell>
              <TableCell><StatusBadge status={tx.status} /></TableCell>
              <TableCell>
                {tx.stellarTxHash ? (
                  <Link
                    href={`https://stellar.expert/explorer/testnet/tx/${tx.stellarTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {shortenHash(tx.stellarTxHash)}
                    <ExternalLink className="size-3" />
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
