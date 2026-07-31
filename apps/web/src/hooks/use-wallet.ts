"use client"

import { useQuery } from '@tanstack/react-query'
import { useWalletStore } from '@/store/wallet-store'
import { getBalance } from '@/lib/stellar'

export function useWallet() {
  return useWalletStore()
}

export function useBalance() {
  const { publicKey } = useWalletStore()

  return useQuery({
    queryKey: ['balance', publicKey],
    queryFn: () => {
      if (!publicKey) return '0'
      return getBalance(publicKey)
    },
    enabled: !!publicKey,
    refetchInterval: 30000,
  })
}

export function shortAddress(address: string | null): string {
  if (!address) return ''
  if (address.length <= 8) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}
