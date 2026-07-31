"use client"

import { useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PanelLeftClose, PanelLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useChatStream } from "@/hooks/use-chat-stream"
import { useCreateConversation } from "@/hooks/use-chat"
import { useEndpoint } from "@/hooks/use-marketplace"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ChatInput } from "@/components/chat/chat-input"
import { ModelSelector } from "@/components/chat/model-selector"

function ChatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const endpointId = searchParams.get("endpoint") || ""

  const [selectedEndpoint, setSelectedEndpoint] = useState(endpointId)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  const { data: endpoint } = useEndpoint(selectedEndpoint)
  const createConversation = useCreateConversation()
  const {
    messages,
    isStreaming,
    error,
    streamChat,
    cancelStream,
  } = useChatStream()

  const handleSend = useCallback(
    async (content: string, images?: string[]) => {
      if (!selectedEndpoint || !content.trim()) return

      let conversationId = activeConversationId

      if (!conversationId) {
        try {
          const conv = await createConversation.mutateAsync({
            endpointId: selectedEndpoint,
            title: content.slice(0, 50),
          })
          conversationId = conv.id as string
          setActiveConversationId(conversationId)
        } catch (err) {
          console.error("Failed to create conversation:", err)
          return
        }
      }

      if (!conversationId) return

      try {
        await streamChat({
          conversationId,
          content,
          endpointId: selectedEndpoint,
          images,
        })
      } catch (err) {
        console.error("Failed to send message:", err)
      }
    },
    [selectedEndpoint, activeConversationId, createConversation, streamChat]
  )

  const handleCancel = useCallback(() => {
    cancelStream()
  }, [cancelStream])

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null)
    if (window.history.length > 1) {
      router.push("/chat")
    }
    setSelectedEndpoint("")
  }, [router])

  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveConversationId(id)
    },
    []
  )

  const handleDeleteConversation = useCallback(
    (id: string) => {
      if (activeConversationId === id) {
        setActiveConversationId(null)
      }
    },
    [activeConversationId]
  )

  const handleEndpointChange = useCallback(
    (id: string) => {
      setSelectedEndpoint(id)
      setActiveConversationId(null)
      router.replace(`/chat?endpoint=${id}`, { scroll: false })
    },
    [router]
  )

  const handleRegenerate = useCallback(() => {
    if (messages.length < 2) return
    const lastUserMsg = [...messages]
      .reverse()
      .find((m) => m.role === "user")
    if (lastUserMsg) {
      handleSend(lastUserMsg.content)
    }
  }, [messages, handleSend])

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block overflow-hidden"
          >
            <ChatSidebar
              activeConversationId={activeConversationId}
              onSelect={handleSelectConversation}
              onNew={handleNewChat}
              onDelete={handleDeleteConversation}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen((v) => !v)}
            className="hidden md:flex text-zinc-400"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>

          <div className="flex items-center gap-2 flex-1">
            <ModelSelector
              value={selectedEndpoint}
              onValueChange={handleEndpointChange}
            />
          </div>

          {endpoint && (
            <div className="hidden items-center gap-3 text-xs text-zinc-400 sm:flex">
              <span>{endpoint.pricePerRequest} XLM/req</span>
              {endpoint.supportsStreaming && (
                <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-400">
                  Streaming
                </span>
              )}
            </div>
          )}
        </div>

        <ChatMessages
          messages={messages}
          isStreaming={isStreaming}
          onRegenerate={handleRegenerate}
          hasModel={!!selectedEndpoint}
        />

        {error && (
          <div className="mx-4 mb-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <ChatInput
          onSend={handleSend}
          onCancel={handleCancel}
          isStreaming={isStreaming}
          supportsVision={endpoint?.supportsVision}
          estimatedCost={endpoint?.pricePerRequest}
        />
      </div>
    </>
  )
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-zinc-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-cyan-400" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  )
}
