"use client"

import { BellIcon, MonitorIcon, MoonIcon, SaveIcon, SunIcon, UserIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useState } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"
import { BRAND } from "@/config/brand"
import { ROLE_LABEL } from "@/config/nav-by-role"
import { PageHeader } from "@/kit/ui-patterns/page-header"

import { Panel } from "../parts"
import { useBiz, type NotificationPrefs } from "../store"

const PREF_ROWS: { key: keyof NotificationPrefs; title: string; description: string }[] = [
  { key: "sales", title: "Sales & pipeline updates", description: "New leads, proposals, and confirmed sales." },
  { key: "payments", title: "Customer payments", description: "Incoming collections and settled receivables." },
  { key: "expenses", title: "Expenses & payables", description: "Recorded expenses and vendor bill updates." },
  { key: "reports", title: "Reports & approvals", description: "Submitted, reviewed, approved, and returned reports." },
  { key: "tasks", title: "Tasks & field assignments", description: "New tasks assigned by the Manager and status changes." },
  { key: "emailDigest", title: "Daily email summary", description: "Simulated daily digest of unread alerts (demo mode)." },
]

export function RoleSettingsPage({ defaultTab = "profile" }: { defaultTab?: "profile" | "notifications" | "appearance" }) {
  const currentUser = useBiz((s) => s.currentUser)
  const updateProfile = useBiz((s) => s.updateProfile)
  const prefs = useBiz((s) => s.notificationPrefs)
  const updatePrefs = useBiz((s) => s.updateNotificationPrefs)
  const { theme, setTheme } = useTheme()

  const [name, setName] = useState(currentUser?.name ?? "")
  const [title, setTitle] = useState(currentUser?.title ?? "")
  const [initials, setInitials] = useState(currentUser?.initials ?? "")

  if (!currentUser) return null

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    const res = updateProfile({ name, title, initials })
    toast.add({ title: res.ok ? "Profile settings saved" : res.error })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, notification preferences, and display appearance."
      />

      <Tabs defaultValue={defaultTab} className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="profile">
            <UserIcon className="size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <BellIcon className="size-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <MoonIcon className="size-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Panel title="Profile details" className="max-w-2xl">
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <div className="flex items-center gap-4 rounded-xl border bg-muted/25 p-3.5">
                <Avatar className="size-12 rounded-xl">
                  <AvatarFallback className="rounded-xl bg-primary/15 text-base font-semibold text-primary">
                    {initials.trim().toUpperCase().slice(0, 2) || currentUser.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{name || currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABEL[currentUser.role]} · {BRAND.name}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="prof-name">Display name</Label>
                  <Input id="prof-name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="prof-initials">Avatar initials</Label>
                  <Input
                    id="prof-initials"
                    maxLength={2}
                    value={initials}
                    onChange={(e) => setInitials(e.target.value.toUpperCase())}
                    placeholder="RD"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="prof-title">Job title</Label>
                  <Input id="prof-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="prof-email">Work email</Label>
                  <Input id="prof-email" value={currentUser.email} disabled />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button type="submit" size="sm">
                  <SaveIcon className="size-4" />
                  Save profile
                </Button>
              </div>
            </form>
          </Panel>
        </TabsContent>

        <TabsContent value="notifications">
          <Panel title="Notification preferences" className="max-w-2xl">
            <div className="flex flex-col divide-y">
              {PREF_ROWS.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{row.title}</p>
                    <p className="text-xs text-muted-foreground">{row.description}</p>
                  </div>
                  <Switch
                    checked={prefs[row.key]}
                    onCheckedChange={(checked) => {
                      updatePrefs({ [row.key]: checked })
                      toast.add({ title: `${row.title} ${checked ? "enabled" : "muted"}` })
                    }}
                    aria-label={row.title}
                  />
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="appearance">
          <Panel title="Color mode" className="max-w-2xl">
            <p className="mb-3 text-xs text-muted-foreground">
              Choose how Business Hub looks. Each role keeps its own accent color in both light and dark modes.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { id: "light", label: "Light", icon: SunIcon },
                { id: "dark", label: "Dark", icon: MoonIcon },
                { id: "system", label: "System", icon: MonitorIcon },
              ].map((opt) => {
                const Icon = opt.icon
                const active = theme === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTheme(opt.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "bg-muted/20 text-muted-foreground hover:bg-muted/45 hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-5" />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  )
}
