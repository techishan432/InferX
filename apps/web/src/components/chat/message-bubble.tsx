"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { User, Bot, Copy, Check } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { CodeBlock } from "@/components/chat/code-block"

interface MessageBubbleProps {
  role: "user" | "assistant" | "system"
  content: string
  createdAt: string
  tokenCount?: number
  cost?: string
  images?: string[]
}

export function MessageBubble({
  role,
  content,
  createdAt,
  tokenCount,
  cost,
  images,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = role === "user"

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [content])

  const formattedTime = new Date(createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex gap-3 px-4 py-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-cyan-500/20" : "bg-zinc-700/50"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-cyan-400" />
        ) : (
          <Bot className="h-4 w-4 text-zinc-300" />
        )}
      </div>

      <div className={cn("flex max-w-[80%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser
              ? "rounded-tr-sm bg-cyan-500/20 text-zinc-100"
              : "rounded-tl-sm bg-zinc-800/50 text-zinc-200"
          )}
        >
          {images && images.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {images.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`Upload ${i + 1}`}
                  className="h-24 w-24 rounded-lg border border-white/10 object-cover"
                />
              ))}
            </div>
          )}
          <div className="prose prose-invert prose-sm max-w-none break-words prose-p:leading-relaxed prose-pre:p-0 prose-headings:text-zinc-100 prose-a:text-cyan-400">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "")
                  const codeString = String(children).replace(/\n$/, "")
                  if (match) {
                    return <CodeBlock language={match[1]} code={codeString} />
                  }
                  return (
                    <code className="rounded bg-zinc-700/50 px-1.5 py-0.5 text-xs text-cyan-300" {...props}>
                      {children}
                    </code>
                  )
                },
                pre({ children }) {
                  return <>{children}</>
                },
                table({ children }) {
                  return (
                    <div className="my-2 overflow-x-auto">
                      <table className="min-w-full border-collapse border border-white/10 text-xs">
                        {children}
                      </table>
                    </div>
                  )
                },
                th({ children }) {
                  return (
                    <th className="border border-white/10 bg-white/5 px-3 py-1.5 text-left font-medium">
                      {children}
                    </th>
                  )
                },
                td({ children }) {
                  return <td className="border border-white/10 px-3 py-1.5">{children}</td>
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>

        <div className="flex items-center gap-2 px-1 text-[10px] text-zinc-500">
          <span>{formattedTime}</span>
          {tokenCount !== undefined && <span>{tokenCount} tokens</span>}
          {cost && <span>{cost} XLM</span>}
          {!isUser && content && (
            <motion.button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded px-1 py-0.5 text-zinc-500 opacity-0 transition-opacity hover:bg-white/5 hover:text-zinc-300 group-hover:opacity-100"
              whileTap={{ scale: 0.9 }}
            >
              {copied ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
