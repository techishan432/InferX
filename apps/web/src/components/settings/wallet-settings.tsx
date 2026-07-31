"use client"

import * as React from "react"
import { useWalletStore } from "@/store/wallet-store"
import { useAuthStore } from "@/store/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Wallet, RefreshCw, CheckCircle, AlertCircle, Copy, ExternalLink } from "lucide-react"

export function WalletSettings() {
  const { user } = useAuthStore()
  const { isConnected, publicKey, balance, network, refreshBalance, connect } = useWalletStore()
  const [copied, setCopied] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await refreshBalance()
    } catch {
    } finally {
      setRefreshing(false)
    }
  }

  function handleCopy() {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isConnected && publicKey ? (
          <>
            <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 p-4">
              <CheckCircle className="size-5 shrink-0 text-green-500" />
              <p className="text-sm text-green-700 dark:text-green-400">Wallet connected</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Network</label>
                <p className="mt-1 text-sm font-medium capitalize">{network}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Wallet Address</label>
                <div className="mt-1 flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 text-xs">{publicKey}</code>
                  <Button variant="ghost" size="icon-xs" onClick={handleCopy}>
                    {copied ? <CheckCircle className="size-3 text-green-500" /> : <Copy className="size-3" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Balance</label>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-lg font-bold">{parseFloat(balance).toFixed(4)} XLM</p>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`size-3 ${refreshing ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Auth Wallet</label>
                <p className="mt-1 text-xs text-muted-foreground">{user?.walletAddress}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 p-4">
              <p className="text-xs text-muted-foreground">
                Your wallet is connected to InferX. All transactions are executed through your Stellar wallet. Disconnecting your wallet will log you out.
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="size-10 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">No wallet connected</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Connect your Freighter wallet to view balance and transaction info.
            </p>
            <Button className="mt-4" onClick={connect}>
              <Wallet />
              Connect Wallet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
