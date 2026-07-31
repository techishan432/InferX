"use client"

import { useState, useCallback } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { MODEL_CATEGORIES } from "@/lib/constants"

interface FilterState {
  search: string
  model: string
  minPrice: string
  maxPrice: string
  contextLength: number
  streaming: boolean
  vision: boolean
}

interface FilterPanelProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  resultCount?: number
}

export function FilterPanel({ filters, onFilterChange, resultCount }: FilterPanelProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const updateFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      onFilterChange({ ...filters, [key]: value })
    },
    [filters, onFilterChange]
  )

  const clearFilters = useCallback(() => {
    onFilterChange({
      search: "",
      model: "",
      minPrice: "",
      maxPrice: "",
      contextLength: 0,
      streaming: false,
      vision: false,
    })
  }, [onFilterChange])

  const hasActiveFilters =
    filters.model !== "" ||
    filters.minPrice !== "" ||
    filters.maxPrice !== "" ||
    filters.contextLength > 0 ||
    filters.streaming ||
    filters.vision

  const FilterContent = (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Model Category
        </label>
        <Select
          value={filters.model || "all"}
          onValueChange={(v: string | null) => updateFilter("model", v === "all" || v === null ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Models" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            {MODEL_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Price Range (XLM)
        </label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
            className="flex-1"
            min={0}
            step={0.001}
          />
          <span className="text-zinc-500">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
            className="flex-1"
            min={0}
            step={0.001}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Min Context Length
        </label>
        <input
          type="range"
          min={0}
          max={200000}
          step={8000}
          value={filters.contextLength}
          onChange={(e) => updateFilter("contextLength", Number(e.target.value))}
          className="w-full accent-cyan-500"
        />
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Any</span>
          <span>
            {filters.contextLength >= 1000
              ? `${(filters.contextLength / 1000).toFixed(0)}K`
              : filters.contextLength}
          </span>
          <span>200K+</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm text-zinc-300">Streaming</label>
          <Switch
            checked={filters.streaming}
            onCheckedChange={(v) => updateFilter("streaming", v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-zinc-300">Vision</label>
          <Switch
            checked={filters.vision}
            onCheckedChange={(v) => updateFilter("vision", v)}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" className="w-full text-zinc-400" onClick={clearFilters}>
          <X className="mr-2 h-3.5 w-3.5" />
          Clear Filters
        </Button>
      )}

      {resultCount !== undefined && (
        <p className="text-center text-xs text-zinc-500">
          {resultCount.toLocaleString()} result{resultCount !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  )

  return (
    <>
      <div className="hidden lg:block w-64 shrink-0">
        <aside className="sticky top-24 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <h3 className="mb-4 text-sm font-semibold text-white">Filters</h3>
          {FilterContent}
        </aside>
      </div>

      <div className="lg:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" className="w-full">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-medium text-cyan-400">
                    !
                  </span>
                )}
              </Button>
            }
          />
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="px-5">{FilterContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
