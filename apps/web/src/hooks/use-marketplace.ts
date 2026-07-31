"use client"

import { useQuery } from '@tanstack/react-query'

interface Endpoint {
  id: string
  modelName: string
  displayName: string
  description: string | null
  pricePerRequest: string
  maxInputTokens: number
  maxOutputTokens: number
  contextLength: number
  supportsVision: boolean
  supportsStreaming: boolean
  isActive: boolean
  provider: {
    id: string
    name: string
    averageRating: number
  }
  totalRequests: string
  healthStatus: string
  averageRating: number
  totalReviews: number
}

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface MarketplaceFilters {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  minPrice?: number
  maxPrice?: number
  supportsVision?: boolean
  supportsStreaming?: boolean
}

interface Rating {
  id: string
  reviewer: {
    displayName: string
    walletAddress: string
  }
  rating: number
  comment: string | null
  createdAt: string
}

async function fetchMarketplace(filters: MarketplaceFilters): Promise<PaginatedResult<Endpoint>> {
  const params = new URLSearchParams()

  if (filters.page) params.set('page', filters.page.toString())
  if (filters.pageSize) params.set('pageSize', filters.pageSize.toString())
  if (filters.search) params.set('search', filters.search)
  if (filters.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)
  if (filters.minPrice !== undefined) params.set('minPrice', filters.minPrice.toString())
  if (filters.maxPrice !== undefined) params.set('maxPrice', filters.maxPrice.toString())
  if (filters.supportsVision !== undefined) params.set('supportsVision', filters.supportsVision.toString())
  if (filters.supportsStreaming !== undefined) params.set('supportsStreaming', filters.supportsStreaming.toString())

  const response = await fetch(`/api/marketplace?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch marketplace')
  }
  return response.json()
}

async function fetchEndpoint(id: string): Promise<Endpoint> {
  const response = await fetch(`/api/endpoints/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch endpoint')
  }
  return response.json()
}

async function fetchEndpointRatings(id: string): Promise<Rating[]> {
  const response = await fetch(`/api/endpoints/${id}/ratings`)
  if (!response.ok) {
    throw new Error('Failed to fetch ratings')
  }
  return response.json()
}

export function useMarketplace(filters: MarketplaceFilters = {}) {
  return useQuery({
    queryKey: ['marketplace', filters],
    queryFn: () => fetchMarketplace(filters),
    staleTime: 30 * 1000,
  })
}

export function useEndpoint(id: string) {
  return useQuery({
    queryKey: ['endpoint', id],
    queryFn: () => fetchEndpoint(id),
    enabled: !!id,
  })
}

export function useEndpointRatings(id: string) {
  return useQuery({
    queryKey: ['endpoint-ratings', id],
    queryFn: () => fetchEndpointRatings(id),
    enabled: !!id,
  })
}
