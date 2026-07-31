"use client"

import { useState } from "react"
import {
  Wallet,
  Copy,
  ExternalLink,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ConnectDialog } from "@/components/wallet/connect-dialog"
import { useWalletStore } from "@/store/wallet-store"

export function WalletButton() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { isConnected, publicKey, balance, disconnect } = useWalletStore()

  const shortenedAddress = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : ""

  if (!isConnected) {
    return (
      <>
        <Button
          variant="outline"
          size="lg"
          className="gap-2 border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300"
          onClick={() => setDialogOpen(true)}
        >
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
        <ConnectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    )
  }

  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey)
    }
  }

  const handleViewExplorer = () => {
    if (publicKey) {
      window.open(
        `https://stellar.expert/explorer/testnet/account/${publicKey}`,
        "_blank"
      )
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/10 outline-none"
      >
        <div className="h-2 w-2 rounded-full bg-emerald-400" />
        <span>{shortenedAddress}</span>
        <span className="text-zinc-400">
          {parseFloat(balance).toFixed(2)} XLM
        </span>
        <ChevronDown className="h-4 w-4 text-zinc-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuItem onClick={handleCopyAddress}>
          <Copy className="h-4 w-4" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleViewExplorer}>
          <ExternalLink className="h-4 w-4" />
          View on Explorer
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={disconnect}>
          <LogOut className="h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
