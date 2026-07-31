"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  CreditCard,
  Settings,
  History,
  Server,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { GradientText } from "@/components/ui/gradient-text"
import { useAuthStore } from "@/store/auth-store"
import { useState } from "react"

const providerNavItems = [
  { href: "/dashboard/provider", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/provider/endpoints", label: "Endpoints", icon: Server },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/provider/transactions", label: "Transactions", icon: CreditCard },
  { href: "/dashboard/provider/settings", label: "Settings", icon: Settings },
]

const consumerNavItems = [
  { href: "/dashboard/consumer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/consumer/history", label: "History", icon: History },
  { href: "/dashboard/consumer/settings", label: "Settings", icon: Settings },
]

interface SidebarProps {
  variant?: "provider" | "consumer"
}

export function Sidebar({ variant = "provider" }: SidebarProps) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const [collapsed, setCollapsed] = useState(false)

  const navItems =
    variant === "provider" || user?.isProvider
      ? providerNavItems
      : consumerNavItems

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-4 left-4 z-50 md:hidden"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <PanelLeft className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </Button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 bg-zinc-950 transition-all duration-300",
          collapsed ? "w-0 overflow-hidden md:w-16" : "w-64",
          "md:relative"
        )}
      >
        <div className="flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            {!collapsed && (
              <span className="text-lg font-bold">
                <GradientText>InferX</GradientText>
              </span>
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          {!collapsed && (
            <p className="text-xs text-zinc-500">
              {variant === "provider" ? "Provider Dashboard" : "Consumer Dashboard"}
            </p>
          )}
        </div>
      </aside>
    </>
  )
}
