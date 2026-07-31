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
  MessageSquare,
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuthStore()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // Show connect wallet screen if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Wallet className="h-16 w-16 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Connect Your Wallet</h2>
          <p className="text-muted-foreground max-w-md">
            Connect your Stellar wallet to access the dashboard and manage your AI inference endpoints.
          </p>
          <div className="pt-4">
            <Link href="/">
              <Button size="lg">
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const nav = user?.isProvider ? providerNav : consumerNav

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 lg:relative lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Zap className="size-6 text-primary" />
          <span className="text-lg font-bold">InferX</span>
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
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
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
              <p className="truncate text-xs text-muted-foreground">
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
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border px-4 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
          </Button>
          <div className="flex-1" />
        </header>
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
