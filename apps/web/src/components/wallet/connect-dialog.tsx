"use client"

import { useState } from "react"
import { Loader2, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useWalletStore } from "@/store/wallet-store"

interface ConnectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConnectDialog({ open, onOpenChange }: ConnectDialogProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { connect, network } = useWalletStore()

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)
    try {
      await connect()
      onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect wallet"
      )
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Connect your Stellar wallet to use InferX
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-orange-400"
                fill="currentColor"
              >
                <path d="M3.5 12.5l5-10h2l-5 10h-2zm7 0l5-10h2l-5 10h-2zm-3.5 5l5-10h2l-5 10h-2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Freighter</p>
              <p className="text-xs text-zinc-400">
                Stellar browser wallet
              </p>
            </div>
            <ExternalLink className="h-4 w-4 text-zinc-400" />
          </button>

          <div className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <span className="text-xs text-zinc-400">
              Network:{" "}
              <span className="font-medium capitalize text-cyan-400">
                {network}
              </span>
            </span>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-400 hover:to-purple-500"
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect with Freighter"
            )}
          </Button>

          <p className="text-center text-xs text-zinc-500">
            Don&apos;t have Freighter?{" "}
            <a
              href="https://www.freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 underline-offset-2 hover:underline"
            >
              Install here
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
