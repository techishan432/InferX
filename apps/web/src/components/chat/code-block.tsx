"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Check } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface CodeBlockProps {
  language: string
  code: string
  showLineNumbers?: boolean
}

export function CodeBlock({ language, code, showLineNumbers = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-white/10 bg-zinc-800/50 px-4 py-1.5">
        <span className="text-xs font-medium text-zinc-400">{language || "code"}</span>
        <motion.button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200"
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="copied"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1"
              >
                <Check className="h-3 w-3 text-emerald-400" />
                Copied
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                Copy
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        showLineNumbers={showLineNumbers}
        customStyle={{
          margin: 0,
          padding: "1rem",
          background: "transparent",
          fontSize: "0.8125rem",
        }}
        codeTagProps={{
          style: {
            fontFamily: "var(--font-geist-mono), monospace",
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
