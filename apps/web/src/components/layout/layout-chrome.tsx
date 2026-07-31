"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"

const FULLSCREEN_ROUTES = ["/dashboard", "/chat"]

export function LayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isFullscreen = FULLSCREEN_ROUTES.some((route) => pathname.startsWith(route))

  if (isFullscreen) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
