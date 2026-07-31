"use client"

import { useState, useMemo } from "react"
import { Plus, Search, Trash2, MessageSquare } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useConversations } from "@/hooks/use-chat"

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

interface ChatSidebarProps {
  activeConversationId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

export function ChatSidebar({
  activeConversationId,
  onSelect,
  onNew,
  onDelete,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("")
  const { data: conversations, isLoading } = useConversations()

  const filtered = useMemo(() => {
    if (!conversations) return []
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter(
      (c: Conversation) =>
        c.title.toLowerCase().includes(q) ||
        c.endpoint.displayName.toLowerCase().includes(q)
    )
  }, [conversations, search])

  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-white/10 bg-zinc-950/50">
      <div className="p-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          onClick={onNew}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>
      </div>

      <Separator className="bg-white/5" />

      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading && (
            <div className="space-y-2 p-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <MessageSquare className="h-6 w-6 text-zinc-600" />
              <p className="text-xs text-zinc-500">
                {search ? "No matching conversations" : "No conversations yet"}
              </p>
            </div>
          )}

          <AnimatePresence>
            {filtered.map((conv: Conversation) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                <button
                  onClick={() => onSelect(conv.id)}
                  className={cn(
                    "group flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                    conv.id === activeConversationId
                      ? "bg-cyan-500/10 text-white"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium">{conv.title || "New Chat"}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(conv.id)
                      }}
                      className="shrink-0 rounded p-1 text-zinc-600 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="truncate text-zinc-500">{conv.endpoint.displayName}</span>
                    <span className="text-zinc-700">&middot;</span>
                    <span className="shrink-0 text-zinc-600">{formatDate(conv.updatedAt)}</span>
                  </div>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  )
}
