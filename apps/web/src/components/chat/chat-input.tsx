"use client"

import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from "react"
import { ArrowUp, Square, Image as ImageIcon, X, Thermometer, Hash } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (content: string, images?: string[]) => void
  onCancel: () => void
  isStreaming: boolean
  supportsVision?: boolean
  estimatedCost?: string
}

export function ChatInput({
  onSend,
  onCancel,
  isStreaming,
  supportsVision = false,
  estimatedCost,
}: ChatInputProps) {
  const [content, setContent] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(4096)
  const [showSettings, setShowSettings] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    const maxHeight = 144
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [content, adjustTextareaHeight])

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newImages: string[] = []
    for (const file of Array.from(files)) {
      const reader = new FileReader()
      const result = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      newImages.push(result)
    }
    setImages((prev) => [...prev, ...newImages])
    e.target.value = ""
  }, [])

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        if (content.trim() && !isStreaming) {
          onSend(content.trim(), images.length > 0 ? images : undefined)
          setContent("")
          setImages([])
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
          }
        }
      }
    },
    [content, images, isStreaming, onSend]
  )

  const handleSubmit = useCallback(() => {
    if (content.trim() && !isStreaming) {
      onSend(content.trim(), images.length > 0 ? images : undefined)
      setContent("")
      setImages([])
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }, [content, images, isStreaming, onSend])

  const charCount = content.length

  return (
    <div className="border-t border-white/10 bg-zinc-950/80 px-4 py-3">
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 flex flex-wrap gap-2"
          >
            {images.map((img, i) => (
              <div key={i} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`Upload ${i + 1}`}
                  className="h-16 w-16 rounded-lg border border-white/10 object-cover"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-red-500 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 space-y-3 rounded-lg border border-white/10 bg-white/5 p-3"
          >
            <div className="flex items-center gap-3">
              <Thermometer className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <label className="text-xs text-zinc-400 w-20 shrink-0">Temperature</label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="flex-1 accent-cyan-500"
              />
              <span className="w-8 text-right text-xs text-zinc-300 tabular-nums">
                {temperature.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Hash className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <label className="text-xs text-zinc-400 w-20 shrink-0">Max Tokens</label>
              <input
                type="range"
                min={256}
                max={32768}
                step={256}
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                className="flex-1 accent-cyan-500"
              />
              <span className="w-12 text-right text-xs text-zinc-300 tabular-nums">
                {maxTokens.toLocaleString()}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition-colors focus-within:border-cyan-500/40">
        {supportsVision && (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-zinc-400 hover:text-zinc-200"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </>
        )}

        <button
          onClick={() => setShowSettings((v) => !v)}
          className={cn(
            "shrink-0 rounded p-1 text-xs font-medium transition-colors",
            showSettings ? "text-cyan-400 bg-cyan-500/10" : "text-zinc-500 hover:text-zinc-300"
          )}
          title="Generation settings"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
        </button>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="max-h-36 flex-1 resize-none bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
        />

        <div className="flex shrink-0 items-center gap-2">
          {charCount > 0 && (
            <span className="text-[10px] tabular-nums text-zinc-500">{charCount}</span>
          )}
          {isStreaming ? (
            <Button
              variant="destructive"
              size="icon-sm"
              onClick={onCancel}
              className="rounded-full"
            >
              <Square className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              size="icon-sm"
              onClick={handleSubmit}
              disabled={!content.trim()}
              className="rounded-full bg-cyan-500 text-white hover:bg-cyan-400 disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {estimatedCost && (
        <p className="mt-1.5 text-center text-[10px] text-zinc-600">
          Estimated cost: ~{estimatedCost} XLM
        </p>
      )}
    </div>
  )
}
