"use client"

import { useQuery } from '@tanstack/react-query'

interface Transaction {
  id: string
  amount: string
  fee: string
  status: 'COMPLETED' | 'FAILED' | 'PENDING'
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

interface TransactionFilters {
  page?: number
  pageSize?: number
  status?: string
  dateFrom?: string
  dateTo?: string
  type?: 'all' | 'sent' | 'received'
}

interface PaginatedTransactions {
  data: Transaction[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

async function fetchTransactions(filters: TransactionFilters): Promise<PaginatedTransactions> {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', filters.page.toString())
  if (filters.pageSize) params.set('pageSize', filters.pageSize.toString())
  if (filters.status) params.set('status', filters.status)
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  if (filters.type) params.set('type', filters.type)

  const response = await fetch(`/api/transactions?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch transactions')
  }
  return response.json()
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => fetchTransactions(filters),
    staleTime: 30 * 1000,
  })
}
