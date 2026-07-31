"use client"

import { create } from 'zustand'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  endpointId: string
  createdAt: string
}

interface ChatState {
  currentConversationId: string | null
  isStreaming: boolean
  messages: Message[]
}

interface ChatActions {
  setCurrentConversation: (id: string | null) => void
  addMessage: (message: Message) => void
  setStreaming: (isStreaming: boolean) => void
  clearMessages: () => void
  updateLastMessage: (content: string) => void
}

type ChatStore = ChatState & ChatActions

const initialState: ChatState = {
  currentConversationId: null,
  isStreaming: false,
  messages: [],
}

export const useChatStore = create<ChatStore>()((set) => ({
  ...initialState,

  setCurrentConversation: (id: string | null) => {
    set({ currentConversationId: id })
  },

  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }))
  },

  setStreaming: (isStreaming: boolean) => {
    set({ isStreaming })
  },

  clearMessages: () => {
    set({ messages: [] })
  },

  updateLastMessage: (content: string) => {
    set((state) => {
      if (state.messages.length === 0) return state
      const messages = [...state.messages]
      const lastMessage = messages[messages.length - 1]
      messages[messages.length - 1] = { ...lastMessage, content }
      return { messages }
    })
  },
}))
