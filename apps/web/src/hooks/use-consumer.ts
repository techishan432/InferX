"use client"

import { useQuery } from '@tanstack/react-query'

interface ConsumerDashboardData {
  totalSpent: string
  last24hSpent: string
  last7dSpent: string
  last30dSpent: string
  totalRequests: number
  activeConversations: number
  spendingOverTime: Array<{
    date: string
    amount: number
    requests: number
  }>
  recentConversations: Array<{
    id: string
    endpointName: string
    lastMessage: string
    messageCount: number
    createdAt: string
    updatedAt: string
  }>
  favoriteModels: Array<{
    modelName: string
    endpointName: string
    endpointId: string
    requestCount: number
  }>
}

async function fetchConsumerDashboard(): Promise<ConsumerDashboardData> {
  const response = await fetch('/api/consumers/dashboard')
  if (response.status === 401) {
    return { totalSpent: '0', last24hSpent: '0', last7dSpent: '0', last30dSpent: '0', totalRequests: 0, activeConversations: 0, spendingOverTime: [], recentConversations: [], favoriteModels: [] }
  }
  if (!response.ok) {
    throw new Error('Failed to fetch consumer dashboard')
  }
  return response.json()
}

export function useConsumerDashboard() {
  return useQuery({
    queryKey: ['consumer-dashboard'],
    queryFn: fetchConsumerDashboard,
    staleTime: 60 * 1000,
    retry: false,
  })
}
