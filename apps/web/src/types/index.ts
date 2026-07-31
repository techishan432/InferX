export interface EndpointWithProvider {
  id: string
  name: string
  description: string
  model: string
  contextLength: number
  inputPrice: number
  outputPrice: number
  supportsStreaming: boolean
  supportsVision: boolean
  avgLatency: number
  rating: number
  totalRequests: number
  provider: {
    id: string
    name: string
    walletAddress: string
    verified: boolean
  }
}

export interface ChatMessageInput {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
}

export interface ChatStreamChunk {
  id: string
  choices: Array<{
    delta: {
      role?: string
      content?: string
    }
    finish_reason?: string | null
    index: number
  }>
  model: string
  created: number
}

export interface MarketplaceFilters {
  search?: string
  model?: string
  minPrice?: number
  maxPrice?: number
  contextLength?: number
  streaming?: boolean
  vision?: boolean
  sortBy: 'price-asc' | 'price-desc' | 'rating-desc' | 'popularity-desc' | 'recent' | 'context-desc'
  sortDir: 'asc' | 'desc'
}

export interface AnalyticsData {
  totalRevenue: number
  totalTransactions: number
  averageRating: number
  dailyUsage: Array<{
    date: string
    requests: number
    revenue: number
    tokens: number
  }>
  topModels: Array<{
    model: string
    requests: number
    revenue: number
  }>
}

export interface WalletInfo {
  publicKey: string
  isConnected: boolean
  balance: string
  network: 'testnet' | 'mainnet'
}

export interface ProviderDashboard {
  revenue: {
    total: number
    last24h: number
    last7d: number
    last30d: number
  }
  endpoints: {
    total: number
    active: number
    totalRequests: number
    avgLatency: number
  }
  transactions: {
    total: number
    pending: number
    completed: number
    failed: number
  }
  ratings: {
    average: number
    totalReviews: number
    recent: Array<{
      rating: number
      comment: string
      createdAt: string
    }>
  }
}

export interface ConsumerDashboard {
  spending: {
    total: number
    last24h: number
    last7d: number
    last30d: number
  }
  transactions: {
    total: number
    pending: number
    completed: number
    failed: number
  }
  conversations: {
    total: number
    active: number
    totalMessages: number
    totalTokens: number
  }
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
