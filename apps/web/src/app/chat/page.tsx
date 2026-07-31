"use client"

import { useState, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PanelLeftClose, PanelLeft, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useChatStream } from "@/hooks/use-chat-stream"
import { useCreateConversation } from "@/hooks/use-chat"
import { useEndpoint } from "@/hooks/use-marketplace"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ChatInput } from "@/components/chat/chat-input"
import { ModelSelector } from "@/components/chat/model-selector"

import Link from "next/link"
import { GradientText } from "@/components/ui/gradient-text"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Badge } from "@/components/ui/badge"

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
          conversationId = (conv?.id || conv?.conversation?.id) as string
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
    <div className="flex h-screen w-full overflow-hidden bg-theme-pattern text-foreground">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block overflow-hidden h-full"
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

      <div className="flex flex-1 flex-col overflow-hidden h-full">
        <div className="flex items-center gap-3 border-b border-border bg-card/60 backdrop-blur-md px-4 py-2.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen((v) => !v)}
            className="hidden md:flex text-muted-foreground hover:text-foreground"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>

          <Link
            href="/marketplace"
            className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-cyan-500" />
            Back
          </Link>

          <Link href="/" className="text-lg font-bold mr-2">
            <GradientText>InferX</GradientText>
          </Link>

          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <ModelSelector
              value={selectedEndpoint}
              onValueChange={handleEndpointChange}
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {endpoint && (
              <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                <Badge variant="cyan" className="text-[10px]">
                  {endpoint.pricePerRequest} XLM/req
                </Badge>
                {endpoint.supportsStreaming && (
                  <Badge variant="violet" className="text-[10px]">
                    Streaming
                  </Badge>
                )}
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>

        <ChatMessages
          messages={messages}
          isStreaming={isStreaming}
          onRegenerate={handleRegenerate}
          hasModel={!!selectedEndpoint}
        />

        {error && (
          <div className="mx-4 mb-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
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
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-theme-pattern">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-cyan-500" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  )
}
