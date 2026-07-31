"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { connectToFreighter, getBalance } from '@/lib/stellar'

interface WalletState {
  isConnected: boolean
  publicKey: string | null
  balance: string
  network: string
}

interface WalletActions {
  connect: () => Promise<void>
  disconnect: () => void
  refreshBalance: () => Promise<void>
}

type WalletStore = WalletState & WalletActions

const initialState: WalletState = {
  isConnected: false,
  publicKey: null,
  balance: '0',
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? 'testnet',
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      connect: async () => {
        try {
          const publicKey = await connectToFreighter()
          
          // Try to fetch balance, but don't fail connection if it doesn't work
          let balance = '0'
          try {
            balance = await getBalance(publicKey)
          } catch (balanceError) {
            console.warn('Failed to fetch balance during connection:', balanceError)
            // Continue with 0 balance, user can refresh later
          }
          
          set({
            isConnected: true,
            publicKey,
            balance,
          })
        } catch (error) {
          console.error('Wallet connection failed:', error)
          throw error
        }
      },

      disconnect: () => {
        set(initialState)
      },

      refreshBalance: async () => {
        const { publicKey } = get()
        if (!publicKey) return

        try {
          const balance = await getBalance(publicKey)
          set({ balance })
        } catch (error) {
          console.error('Failed to refresh balance:', error)
          throw error
        }
      },
    }),
    {
      name: 'inferx-wallet-storage',
      partialize: (state) => ({
        isConnected: state.isConnected,
        publicKey: state.publicKey,
        balance: state.balance,
        network: state.network,
      }),
    }
  )
)
