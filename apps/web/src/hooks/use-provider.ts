"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface DashboardData {
  totalEndpoints: number
  activeEndpoints: number
  totalRequests: string
  totalEarnings: string
  averageRating: number
  totalTransactions: number
  recentTransactions: Array<{
    id: string
    amount: string
    consumer: { displayName: string }
    endpoint: { displayName: string }
    createdAt: string
  }>
}

interface ProviderEndpoint {
  id: string
  modelName: string
  displayName: string
  description: string | null
  pricePerRequest: string
  isActive: boolean
  totalRequests: string
  healthStatus: string
  averageRating: number
  totalReviews: number
  createdAt: string
}

interface CreateEndpointInput {
  modelName: string
  displayName: string
  description?: string
  pricePerRequest: string
  maxInputTokens: number
  maxOutputTokens: number
  contextLength: number
  supportsVision: boolean
  supportsStreaming: boolean
  rateLimit: number
  apiKey: string
  baseUrl: string
}

interface UpdateEndpointInput {
  id: string
  data: Partial<CreateEndpointInput>
}

async function fetchProviderDashboard(): Promise<DashboardData> {
  const response = await fetch('/api/providers/analytics')
  if (response.status === 401) {
    return { totalEndpoints: 0, activeEndpoints: 0, totalRequests: '0', totalEarnings: '0', averageRating: 0, totalTransactions: 0, recentTransactions: [] }
  }
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard')
  }
  return response.json()
}

async function fetchProviderEndpoints(): Promise<ProviderEndpoint[]> {
  const response = await fetch('/api/providers/endpoints')
  if (response.status === 401) return []
  if (!response.ok) {
    throw new Error('Failed to fetch endpoints')
  }
  return response.json()
}

async function createEndpoint(input: CreateEndpointInput) {
  const response = await fetch('/api/providers/endpoints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create endpoint')
  }
  return response.json()
}

async function updateEndpoint(input: UpdateEndpointInput) {
  const response = await fetch(`/api/providers/endpoints/${input.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input.data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update endpoint')
  }
  return response.json()
}

async function deleteEndpoint(id: string) {
  const response = await fetch(`/api/providers/endpoints/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete endpoint')
  }
  return response.json()
}

async function toggleEndpoint(id: string) {
  const response = await fetch(`/api/providers/endpoints/${id}/toggle`, {
    method: 'POST',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to toggle endpoint')
  }
  return response.json()
}

export function useProviderDashboard() {
  return useQuery({
    queryKey: ['provider-dashboard'],
    queryFn: fetchProviderDashboard,
    staleTime: 60 * 1000,
    retry: false,
  })
}

export function useProviderEndpoints() {
  return useQuery({
    queryKey: ['provider-endpoints'],
    queryFn: fetchProviderEndpoints,
    retry: false,
  })
}

export function useCreateEndpoint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createEndpoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-endpoints'] })
      queryClient.invalidateQueries({ queryKey: ['provider-dashboard'] })
    },
  })
}

export function useUpdateEndpoint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateEndpoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-endpoints'] })
    },
  })
}

export function useDeleteEndpoint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteEndpoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-endpoints'] })
      queryClient.invalidateQueries({ queryKey: ['provider-dashboard'] })
    },
  })
}

export function useToggleEndpoint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleEndpoint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-endpoints'] })
    },
  })
}
