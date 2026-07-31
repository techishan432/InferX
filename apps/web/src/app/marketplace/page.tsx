"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Search, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { useMarketplace } from "@/hooks/use-marketplace"
import { EndpointCard, EndpointCardSkeleton } from "@/components/marketplace/endpoint-card"
import { FilterPanel } from "@/components/marketplace/filter-panel"
import { SortDropdown } from "@/components/marketplace/sort-dropdown"
import { SORT_OPTIONS } from "@/lib/constants"

const DEFAULT_SORT = "popularity-desc"

interface Filters {
  search: string
  model: string
  minPrice: string
  maxPrice: string
  contextLength: number
  streaming: boolean
  vision: boolean
}

const defaultFilters: Filters = {
  search: "",
  model: "",
  minPrice: "",
  maxPrice: "",
  contextLength: 0,
  streaming: false,
  vision: false,
}

function buildUrl(filters: Filters, sortBy: string, page: number): string {
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  if (filters.model) params.set("model", filters.model)
  if (filters.minPrice) params.set("minPrice", filters.minPrice)
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice)
  if (filters.contextLength) params.set("contextLength", String(filters.contextLength))
  if (filters.streaming) params.set("streaming", "true")
  if (filters.vision) params.set("vision", "true")
  if (sortBy && sortBy !== DEFAULT_SORT) params.set("sortBy", sortBy)
  if (page > 1) params.set("page", String(page))
  const qs = params.toString()
  return qs ? `/marketplace?${qs}` : "/marketplace"
}

function MarketplaceContent() {
  const router = useRouter()

  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [sortBy, setSortBy] = useState(DEFAULT_SORT)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const effectiveFilters: Filters = { ...filters, search: debouncedSearch }

  const sortOption = SORT_OPTIONS.find((o) => o.value === sortBy)
  const sortField = sortOption?.value.split("-")[0] || "popularity"
  const sortOrder = sortOption?.value.includes("asc") ? "asc" : "desc"

  const { data, isLoading, isError } = useMarketplace({
    page,
    pageSize: 12,
    search: debouncedSearch || undefined,
    sortBy: sortField,
    sortOrder: sortOrder as "asc" | "desc",
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    supportsVision: filters.vision || undefined,
    supportsStreaming: filters.streaming || undefined,
  })

  const syncUrl = useCallback(
    (f: Filters, s: string, p: number) => {
      router.replace(buildUrl(f, s, p), { scroll: false })
    },
    [router]
  )

  useEffect(() => {
    syncUrl(effectiveFilters, sortBy, page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.model, filters.minPrice, filters.maxPrice, filters.contextLength, filters.streaming, filters.vision, sortBy, page, syncUrl])

  const handleFilterChange = useCallback(
    (newFilters: Filters) => {
      setFilters(newFilters)
      setPage(1)
      setSearchInput(newFilters.search)
      setDebouncedSearch(newFilters.search)
      syncUrl(newFilters, sortBy, 1)
    },
    [sortBy, syncUrl]
  )

  const handleSortChange = useCallback(
    (value: string) => {
      setSortBy(value)
      setPage(1)
      syncUrl(effectiveFilters, value, 1)
    },
    [effectiveFilters, syncUrl]
  )

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage)
      syncUrl(effectiveFilters, sortBy, newPage)
    },
    [effectiveFilters, sortBy, syncUrl]
  )

  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0
  const endpoints = data?.data ?? []

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
            <Sparkles className="h-3 w-3" />
            AI Model Marketplace
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Discover AI Models
          </h1>
          <p className="mt-2 text-zinc-400">
            Browse and connect with AI models powered by Stellar blockchain payments
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative mx-auto max-w-xl">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Search models, providers..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-11 rounded-xl border-white/10 bg-white/5 pl-10 text-base backdrop-blur-md focus-visible:border-cyan-500/50"
            />
          </div>
        </motion.div>

        <div className="flex gap-6">
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            resultCount={total}
          />

          <div className="flex-1 min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                {isLoading
                  ? "Loading..."
                  : `${total.toLocaleString()} model${total !== 1 ? "s" : ""} found`}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 hidden sm:inline">Sort:</span>
                <SortDropdown value={sortBy} onValueChange={handleSortChange} />
              </div>
            </div>

            {isLoading && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <EndpointCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!isLoading && isError && (
              <EmptyState
                title="Failed to load models"
                description="There was an error fetching the marketplace. Please try again."
                actionLabel="Retry"
                onAction={() => window.location.reload()}
              />
            )}

            {!isLoading && !isError && endpoints.length === 0 && (
              <EmptyState
                title="No models found"
                description="Try adjusting your filters or search terms to find what you're looking for."
                actionLabel="Clear Filters"
                onAction={() => {
                  handleFilterChange(defaultFilters)
                  setSearchInput("")
                  setDebouncedSearch("")
                }}
              />
            )}

            {!isLoading && !isError && endpoints.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {endpoints.map((endpoint, index) => (
                    <EndpointCard
                      key={endpoint.id}
                      id={endpoint.id}
                      displayName={endpoint.displayName}
                      modelName={endpoint.modelName}
                      providerName={endpoint.provider?.name ?? "Unknown"}
                      pricePerRequest={endpoint.pricePerRequest}
                      averageRating={endpoint.averageRating}
                      contextLength={endpoint.contextLength}
                      supportsStreaming={endpoint.supportsStreaming}
                      supportsVision={endpoint.supportsVision}
                      totalRequests={endpoint.totalRequests}
                      healthStatus={endpoint.healthStatus}
                      index={index}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 flex items-center justify-center gap-2"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => handlePageChange(Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                        let pageNum: number
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (page <= 3) {
                          pageNum = i + 1
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = page - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === page ? "default" : "outline"}
                            size="icon-sm"
                            onClick={() => handlePageChange(pageNum)}
                            className={
                              pageNum === page
                                ? "bg-cyan-500 text-white hover:bg-cyan-400"
                                : ""
                            }
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                    >
                      Next
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-cyan-400" />
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  )
}
