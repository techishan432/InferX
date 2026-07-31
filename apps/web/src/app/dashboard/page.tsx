"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"

export default function DashboardIndexPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user?.isProvider) {
      router.replace("/dashboard/provider")
    } else {
      router.replace("/dashboard/consumer")
    }
  }, [user, router])

  return (
    <div className="flex h-screen items-center justify-center bg-theme-pattern">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-500" />
    </div>
  )
}
