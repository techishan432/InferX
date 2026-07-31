"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, X } from "lucide-react"

interface Filters {
  status: string
  dateFrom: string
  dateTo: string
  type: string
  search: string
}

interface TransactionFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
}

export function TransactionFilters({ filters, onChange }: TransactionFiltersProps) {
  const [showFilters, setShowFilters] = React.useState(false)

  function updateFilter(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value })
  }

  function clearAll() {
    onChange({ status: "", dateFrom: "", dateTo: "", type: "all", search: "" })
  }

  const hasFilters = filters.status || filters.dateFrom || filters.dateTo || filters.search

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          variant="outline"
          size="default"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter />
          Filters
          {hasFilters && (
            <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              !
            </span>
          )}
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X />
            Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            >
              <option value="">All</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <select
              value={filters.type}
              onChange={(e) => updateFilter("type", e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            >
              <option value="all">All</option>
              <option value="sent">Sent</option>
              <option value="received">Received</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter("dateFrom", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter("dateTo", e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
