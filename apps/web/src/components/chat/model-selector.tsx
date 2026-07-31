"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useMarketplace } from "@/hooks/use-marketplace"

interface ModelSelectorProps {
  value: string
  onValueChange: (id: string) => void
}

export function ModelSelector({ value, onValueChange }: ModelSelectorProps) {
  const [search, setSearch] = useState("")

  const { data, isLoading } = useMarketplace({
    search: search || undefined,
    pageSize: 50,
  })

  const endpoints = useMemo(() => data?.data ?? [], [data])

  const selectedEndpoint = useMemo(
    () => endpoints.find((e) => e.id === value),
    [endpoints, value]
  )

  return (
    <Select value={value} onValueChange={(v) => { if (v) onValueChange(v) }}>
      <SelectTrigger className="w-full min-w-[200px] border-border bg-card/80 backdrop-blur-md">
        <SelectValue
          placeholder="Select a model"
          render={() =>
            selectedEndpoint ? (
              <span className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{selectedEndpoint.displayName}</span>
                <span className="text-muted-foreground text-xs">{selectedEndpoint.provider.name}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Select a model</span>
            )
          }
        />
      </SelectTrigger>
      <SelectContent>
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-7 text-xs bg-muted/40 border-border"
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-2 text-xs text-muted-foreground">Loading models...</div>
          )}
          {!isLoading && endpoints.length === 0 && (
            <div className="px-4 py-2 text-xs text-muted-foreground">No models found</div>
          )}
          {endpoints.map((ep) => (
            <SelectItem key={ep.id} value={ep.id}>
              <div className="flex w-full items-center justify-between gap-2">
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{ep.displayName}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {ep.provider.name} &middot; {ep.pricePerRequest} XLM
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </div>
      </SelectContent>
    </Select>
  )
}
