"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { ROLE_HOME } from "@/config/nav-by-role"
import { useBiz } from "@/features/biz/store"

export default function RootRedirectPage() {
  const router = useRouter()
  const currentUser = useBiz((s) => s.currentUser)
  const authHydrated = useBiz((s) => s.authHydrated)
  const hydrateAuth = useBiz((s) => s.hydrateAuth)

  useEffect(() => {
    hydrateAuth()
  }, [hydrateAuth])

  useEffect(() => {
    if (!authHydrated) return
    router.replace(currentUser ? ROLE_HOME[currentUser.role] : "/login")
  }, [authHydrated, currentUser, router])

  return (
    <div className="flex min-h-svh items-center justify-center bg-page p-6">
      <p className="text-sm text-muted-foreground">Redirecting…</p>
    </div>
  )
}
