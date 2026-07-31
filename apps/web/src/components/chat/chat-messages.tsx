"use client"

import { useEffect, useRef, useCallback } from "react"
import { RefreshCcw, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { MessageBubble } from "@/components/chat/message-bubble"
import { EmptyState } from "@/components/ui/empty-state"
import { MessageSquare } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  endpointId: string
  createdAt: string
  tokenCount?: number
  cost?: string
  images?: string[]
}

interface ChatMessagesProps {
  messages: Message[]
  isStreaming: boolean
  onRegenerate: () => void
  hasModel: boolean
}

export function ChatMessages({ messages, isStreaming, onRegenerate, hasModel }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(scrollToBottom, 100)
      return () => clearInterval(interval)
    }
  }, [isStreaming, scrollToBottom])

  if (!hasModel) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={MessageSquare}
          title="Select a model to start chatting"
          description="Choose a model from the dropdown above to begin a conversation with any AI model on the InferX marketplace."
        />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={MessageSquare}
          title="Start a conversation"
          description="Type a message below to begin chatting with this model."
        />
      </div>
    )
  }

  const lastAssistantIndex = messages.reduce(
    (acc, msg, idx) => (msg.role === "assistant" ? idx : acc),
    -1
  )

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl divide-y divide-white/5">
        <AnimatePresence initial={false}>
          {messages
            .filter((m) => m.role !== "system")
            .map((message, index) => (
              <div key={message.id} className="group">
                <MessageBubble
                  role={message.role}
                  content={message.content}
                  createdAt={message.createdAt}
                  tokenCount={message.tokenCount}
                  cost={message.cost}
                  images={message.images}
                />
                {message.role === "assistant" &&
                  index === lastAssistantIndex &&
                  !isStreaming &&
                  message.content && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-end px-16 pb-2"
                    >
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={onRegenerate}
                        className="text-zinc-500 hover:text-zinc-300"
                      >
                        <RefreshCcw className="mr-1 h-3 w-3" />
                        Regenerate
                      </Button>
                    </motion.div>
                  )}
              </div>
            ))}
        </AnimatePresence>

        {isStreaming && (
          <div className="flex items-center gap-2 px-4 py-3 pl-16">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
            <span className="text-sm text-zinc-400">Generating response...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
