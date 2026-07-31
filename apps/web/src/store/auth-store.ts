"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  walletAddress: string
  displayName: string | null
  role: 'USER' | 'PROVIDER' | 'CONSUMER' | 'ADMIN'
  isProvider: boolean
  isConsumer: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  login: (walletAddress: string, signedMessage: string, signature: string) => Promise<void>
  loginDemoUser: (isProvider?: boolean) => void
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      loginDemoUser: (isProvider = true) => {
        set({
          user: {
            id: 'demo-user-id',
            walletAddress: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335WF2CCAJ3FSTZAKZDXFYS6POV',
            displayName: isProvider ? 'Demo Provider' : 'Demo Consumer',
            role: isProvider ? 'PROVIDER' : 'CONSUMER',
            isProvider,
            isConsumer: !isProvider,
          },
          isAuthenticated: true,
          isLoading: false,
        })
      },

      login: async (walletAddress: string, signedMessage: string, signature: string) => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/auth/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress, signedMessage, signature }),
          })

          if (!response.ok) {
            throw new Error('Login failed')
          }

          const data = await response.json()
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          console.error('Login failed:', error)
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await fetch('/api/auth/disconnect', { method: 'POST' })
        } catch (error) {
          console.error('Logout failed:', error)
        } finally {
          set(initialState)
        }
      },

      fetchUser: async () => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/auth/me')
          if (!response.ok) {
            set(initialState)
            return
          }

          const data = await response.json()
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          console.error('Failed to fetch user:', error)
          set(initialState)
        }
      },
    }),
    {
      name: 'inferx-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
