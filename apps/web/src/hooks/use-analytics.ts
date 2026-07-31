"use client"

import { useQuery } from '@tanstack/react-query'

interface PlatformAnalytics {
  totalProviders: number
  totalEndpoints: number
  totalTransactions: number
  totalVolume: string
  activeUsers: number
  volumeOverTime: Array<{
    date: string
    volume: number
    transactions: number
  }>
  topModels: Array<{
    model: string
    requests: number
    revenue: string
  }>
  topProviders: Array<{
    id: string
    name: string
    revenue: string
    endpoints: number
  }>
  endpointDistribution: Array<{
    status: string
    count: number
  }>
}

async function fetchPlatformAnalytics(): Promise<PlatformAnalytics> {
  const response = await fetch('/api/analytics')
  if (!response.ok) {
    throw new Error('Failed to fetch platform analytics')
  }
  return response.json()
}

export function usePlatformAnalytics() {
  return useQuery({
    queryKey: ['platform-analytics'],
    queryFn: fetchPlatformAnalytics,
    staleTime: 120 * 1000,
  })
}
