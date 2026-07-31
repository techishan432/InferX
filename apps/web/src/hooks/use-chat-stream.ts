"use client"

import { useState, useRef, useCallback } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  endpointId: string
  createdAt: string
}

interface StreamChatInput {
  conversationId: string
  content: string
  endpointId: string
  images?: string[]
}

export function useChatStream() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const streamChat = useCallback(async (input: StreamChatInput) => {
    setIsStreaming(true)
    setError(null)

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.content,
      endpointId: input.endpointId,
      createdAt: new Date().toISOString(),
    }

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      endpointId: input.endpointId,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: input.conversationId,
          content: input.content,
          endpointId: input.endpointId,
          images: input.images,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to stream chat')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }

      const decoder = new TextDecoder()
      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                accumulatedContent += parsed.content
                setMessages((prev) => {
                  const newMessages = [...prev]
                  const lastMessage = newMessages[newMessages.length - 1]
                  if (lastMessage.role === 'assistant') {
                    newMessages[newMessages.length - 1] = {
                      ...lastMessage,
                      content: accumulatedContent,
                    }
                  }
                  return newMessages
                })
              }
            } catch (e) {
              console.error('Failed to parse SSE chunk:', e)
            }
          }
        }
      }

      return accumulatedContent
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Stream cancelled')
        } else {
          setError(err.message)
        }
      }
      throw err
    } finally {
      setIsStreaming(false)
    }
  }, [])

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsStreaming(false)
    }
  }, [])

  return {
    messages,
    isStreaming,
    error,
    streamChat,
    cancelStream,
  }
}
