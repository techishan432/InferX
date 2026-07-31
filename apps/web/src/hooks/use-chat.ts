"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Conversation {
  id: string
  title: string
  endpoint: {
    id: string
    displayName: string
  }
  createdAt: string
  updatedAt: string
}

interface Message {
  id: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  content: string
  tokensUsed: number | null
  cost: string | null
  createdAt: string
}

interface CreateConversationInput {
  endpointId: string
  title?: string
}

interface SendMessageInput {
  conversationId: string
  content: string
  endpointId: string
}

interface RateEndpointInput {
  endpointId: string
  rating: number
  comment?: string
}

async function fetchConversations(): Promise<Conversation[]> {
  const response = await fetch('/api/chat/conversations')
  if (response.status === 401) return []
  if (!response.ok) {
    throw new Error('Failed to fetch conversations')
  }
  const data = await response.json()
  return Array.isArray(data) ? data : (data.conversations ?? [])
}

async function fetchConversationMessages(id: string): Promise<Message[]> {
  const response = await fetch(`/api/chat/conversations/${id}/messages`)
  if (!response.ok) {
    throw new Error('Failed to fetch messages')
  }
  return response.json()
}

async function createConversation(input: CreateConversationInput) {
  const response = await fetch('/api/chat/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || errorData.message || 'Failed to create conversation')
  }
  const data = await response.json()
  return data.conversation ?? data
}

async function sendMessage(input: SendMessageInput) {
  const response = await fetch(`/api/chat/conversations/${input.conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: input.content, endpointId: input.endpointId }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to send message')
  }
  return response.json()
}

async function rateEndpoint(input: RateEndpointInput) {
  const response = await fetch(`/api/endpoints/${input.endpointId}/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating: input.rating, comment: input.comment }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to rate endpoint')
  }
  return response.json()
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    retry: false,
  })
}

export function useConversationMessages(id: string | null) {
  return useQuery({
    queryKey: ['conversation-messages', id],
    queryFn: () => fetchConversationMessages(id!),
    enabled: !!id,
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['conversation-messages', variables.conversationId],
      })
    },
  })
}

export function useRateEndpoint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: rateEndpoint,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['endpoint-ratings', variables.endpointId],
      })
    },
  })
}
