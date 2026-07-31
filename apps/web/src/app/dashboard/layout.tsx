"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BarChart3,
  ArrowLeftRight,
  Settings,
  Zap,
  Wallet,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth-store"

const providerNav = [
  { href: "/dashboard/provider", label: "Overview", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/settings", label: "Settings", icon: Settings },
]

const consumerNav = [
  { href: "/dashboard/consumer", label: "Overview", icon: LayoutDashboard },
  { href: "/marketplace", label: "Marketplace", icon: Zap },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/settings", label: "Settings", icon: Settings },
]

import { GradientText } from "@/components/ui/gradient-text"
import { ThemeToggle } from "@/components/ui/theme-toggle"

import { ConnectDialog } from "@/components/wallet/connect-dialog"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isAuthenticated, loginDemoUser } = useAuthStore()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [connectOpen, setConnectOpen] = React.useState(false)

  // Show connect wallet or demo mode screen if not authenticated
  if (!isAuthenticated || !user) {
    const isProviderPath = pathname.includes("provider")
    return (
      <div className="flex h-screen items-center justify-center bg-theme-pattern p-4">
        <div className="text-center space-y-4 rounded-2xl border border-border bg-card/90 p-8 backdrop-blur-md shadow-xl max-w-md w-full">
          <Wallet className="h-14 w-14 mx-auto text-cyan-500 animate-pulse" />
          <h2 className="text-2xl font-bold text-foreground">Access Dashboard</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Connect your Stellar wallet or explore with Demo Mode to manage AI inference endpoints and metrics.
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Button size="lg" variant="gradient" onClick={() => setConnectOpen(true)} className="w-full text-white font-semibold">
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
            <Button size="lg" variant="outline" onClick={() => loginDemoUser(isProviderPath)} className="w-full border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10">
              <Zap className="mr-2 h-4 w-4 text-cyan-500" />
              Explore Demo Dashboard
            </Button>
            <div className="pt-2 flex justify-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
        <ConnectDialog open={connectOpen} onOpenChange={setConnectOpen} />
      </div>
    )
  }

  const nav = user?.isProvider ? providerNav : consumerNav

  return (
    <div className="flex h-screen overflow-hidden bg-theme-pattern text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card/90 backdrop-blur-md transition-transform duration-300 lg:relative lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="size-6 text-cyan-500" />
            <span className="text-lg font-bold">
              <GradientText>InferX</GradientText>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon-xs"
            className="ml-auto lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold border border-cyan-500/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4 text-cyan-500" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <Wallet className="size-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user?.displayName ?? "Anonymous"}
              </p>
              <p className="truncate text-xs text-muted-foreground font-mono">
                {user?.walletAddress?.slice(0, 8)}...{user?.walletAddress?.slice(-4)}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-card/60 backdrop-blur-md px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu />
            </Button>
            <span className="text-sm font-semibold text-muted-foreground">
              {user?.isProvider ? "Provider Dashboard" : "Consumer Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/chat">
              <Button size="sm" variant="gradient" className="text-white text-xs">
                Open Chat
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
