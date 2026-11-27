"use client"

import { ArrowRightIcon, KeyRoundIcon, ShieldCheckIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BRAND } from "@/config/brand"
import { ROLE_HOME, ROLE_LABEL } from "@/config/nav-by-role"
import { useBiz } from "@/features/biz/store"
import type { Role } from "@/lib/rbac"

const ROLE_ACCENT_BADGE: Record<Role, string> = {
  admin: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  ceo: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  manager: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  sales: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  reporter: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  finance: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
}

const PRIMARY_DEMO_IDS = ["u-ramon", "u-liza", "u-carlo", "u-joy", "u-anna", "u-admin"]

export default function LoginPage() {
  const router = useRouter()
  const users = useBiz((s) => s.users)
  const login = useBiz((s) => s.login)
  const loginAs = useBiz((s) => s.loginAs)

  const [email, setEmail] = useState("ramon@businesshub.ph")
  const [password, setPassword] = useState("demo1234")
  const [error, setError] = useState<string | null>(null)

  const BrandLogo = BRAND.mark
  const primaryAccounts = PRIMARY_DEMO_IDS.map((id) => users.find((a) => a.id === id)).filter((a): a is NonNullable<typeof a> => Boolean(a))
  const staffAccounts = users.filter((a) => !PRIMARY_DEMO_IDS.includes(a.id))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = login(email)
    if (!res.ok) {
      setError(res.error)
      return
    }
    const user = useBiz.getState().currentUser
    if (user) router.push(ROLE_HOME[user.role])
  }

  function handleQuickSignIn(userId: string) {
    setError(null)
    const res = loginAs(userId)
    if (!res.ok) {
      setError(res.error)
      return
    }
    const user = useBiz.getState().currentUser
    if (user) router.push(ROLE_HOME[user.role])
  }

  return (
    <div className="flex min-h-svh flex-col justify-center bg-page px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-12">
        {/* Left: Email/password sign-in */}
        <Card className="rounded-2xl shadow-(--surface-shadow) lg:col-span-5">
          <CardHeader className="gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <BrandLogo className="size-5" />
              </span>
              <div>
                <p className="font-heading text-base font-semibold leading-tight">{BRAND.name}</p>
                <p className="text-xs text-muted-foreground">Business Management Dashboard</p>
              </div>
            </div>
            <CardTitle className="mt-2 font-heading text-2xl">Sign in</CardTitle>
            <CardDescription>
              Each employee signs in to their own role-scoped workspace. Any password works in demo mode.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="login-email">Work email</Label>
                <Input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@businesshub.ph"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter any password"
                />
              </div>
              {error && <p className="text-xs font-medium text-destructive">{error}</p>}
              <Button type="submit" className="mt-1 w-full">
                <KeyRoundIcon className="size-4" />
                Sign in
              </Button>
            </form>

            <div className="mt-6 flex items-start gap-2 rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
              <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>
                Demo mode: all data lives in memory and updates live across dashboards. Refreshing resets to the 6-month seed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right: Demo accounts */}
        <Card className="rounded-2xl shadow-(--surface-shadow) lg:col-span-7">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Demo accounts</CardTitle>
            <CardDescription>Click any account to sign in immediately with its own sidebar, permissions, and accent theme.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div>
              <p className="mb-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Department Leads & Executives
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {primaryAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleQuickSignIn(acc.id)}
                    className="group flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <Avatar className="size-10 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                        {acc.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold">{acc.name}</span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{acc.email}</p>
                      <Badge
                        variant="outline"
                        className={`mt-1 border-transparent px-1.5 py-0 text-[10px] font-medium ${ROLE_ACCENT_BADGE[acc.role]}`}
                      >
                        {ROLE_LABEL[acc.role]}
                      </Badge>
                    </div>
                    <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Additional Staff Accounts
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {staffAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleQuickSignIn(acc.id)}
                    className="group flex items-center gap-2.5 rounded-xl border bg-muted/20 px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-muted text-xs font-medium">
                        {acc.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{acc.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {ROLE_LABEL[acc.role]} · {acc.email}
                      </p>
                    </div>
                    <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
