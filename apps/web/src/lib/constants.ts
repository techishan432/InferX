export const PLATFORM_FEE_BPS = 500

export const XLM_DECIMALS = 7
export const STROOP_MULTIPLIER = 10_000_000

export const NETWORKS = {
  testnet: {
    passphrase: 'Test SDF Network ; September 2015',
    rpcUrl: 'https://soroban-testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
  },
  mainnet: {
    passphrase: 'Public Global Stellar Network ; September 2015',
    rpcUrl: 'https://mainnet.sorobanrpc.com',
    horizonUrl: 'https://horizon.stellar.org',
  },
} as const

export const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Highest Rated' },
  { value: 'popularity-desc', label: 'Most Popular' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'context-desc', label: 'Largest Context' },
] as const

export const RATE_LIMITS = {
  default: 60,
  premium: 600,
  windowSeconds: 60,
} as const

export const MODEL_CATEGORIES = [
  'general',
  'code',
  'reasoning',
  'creative',
  'vision',
  'embedding',
] as const
