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
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-xs",
          isUser ? "bg-cyan-500 text-white" : "bg-violet-600/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      <div className={cn("flex max-w-[85%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 shadow-xs transition-colors",
            isUser
              ? "rounded-tr-sm bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-cyan-500/10"
              : "rounded-tl-sm bg-card/90 border border-border/80 text-foreground backdrop-blur-md"
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
                  className="h-24 w-24 rounded-lg border border-border object-cover"
                />
              ))}
            </div>
          )}
          <div className={cn(
            "prose prose-sm max-w-none break-words prose-p:leading-relaxed prose-pre:p-0",
            isUser ? "text-white prose-headings:text-white prose-a:text-white/90" : "dark:prose-invert prose-headings:text-foreground prose-a:text-cyan-500"
          )}>
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
                    <code className={cn("rounded px-1.5 py-0.5 text-xs font-mono", isUser ? "bg-white/20 text-white" : "bg-muted text-cyan-600 dark:text-cyan-400")} {...props}>
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
