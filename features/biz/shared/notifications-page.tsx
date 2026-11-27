"use client"

import {
  BellIcon,
  CheckCheckIcon,
  ClipboardCheckIcon,
  FileCheck2Icon,
  ReceiptTextIcon,
  SettingsIcon,
  ShoppingBagIcon,
  WalletIcon,
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { ROLE_SETTINGS_PATH } from "@/config/nav-by-role"
import { PageHeader } from "@/kit/ui-patterns/page-header"
import { Widget } from "@/kit/widgets/widget"
import { cn } from "@/lib/utils"

import { notificationsForUser } from "../metrics"
import { EmptyBox } from "../parts"
import { useBiz, type NotificationKind, type NotificationPrefs } from "../store"

const ICONS: Record<NotificationKind, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  sale: { icon: ShoppingBagIcon, tone: "bg-info/15 text-info" },
  payment: { icon: WalletIcon, tone: "bg-success/15 text-success" },
  expense: { icon: ReceiptTextIcon, tone: "bg-warning/20 text-warning-foreground dark:text-warning" },
  report: { icon: FileCheck2Icon, tone: "bg-primary/15 text-primary" },
  task: { icon: ClipboardCheckIcon, tone: "bg-muted text-muted-foreground" },
  info: { icon: BellIcon, tone: "bg-muted text-muted-foreground" },
}

const PREF_ITEMS: { key: keyof NotificationPrefs; label: string }[] = [
  { key: "sales", label: "Sales & pipeline" },
  { key: "payments", label: "Customer payments" },
  { key: "expenses", label: "Expenses & bills" },
  { key: "reports", label: "Reports & approvals" },
  { key: "tasks", label: "Tasks & assignments" },
  { key: "emailDigest", label: "Daily email digest" },
]

export function RoleNotificationsPage() {
  const currentUser = useBiz((s) => s.currentUser)
  const notifications = useBiz((s) => s.notifications)
  const markRead = useBiz((s) => s.markNotificationRead)
  const markAllRead = useBiz((s) => s.markAllNotificationsRead)
  const prefs = useBiz((s) => s.notificationPrefs)
  const updatePrefs = useBiz((s) => s.updateNotificationPrefs)

  const [query, setQuery] = useState("")
  const [kind, setKind] = useState<string>("all")
  const [prefsOpen, setPrefsOpen] = useState(false)

  const filtered = useMemo(() => {
    const mine = notificationsForUser(notifications, currentUser)
    return mine.filter((n) => {
      if (kind !== "all" && n.kind !== kind) return false
      if (query.trim() && !n.text.toLowerCase().includes(query.trim().toLowerCase())) return false
      return true
    })
  }, [notifications, currentUser, kind, query])

  const settingsHref = currentUser ? ROLE_SETTINGS_PATH[currentUser.role] : "/login"

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description="Updates relevant to your role and assignments."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" render={<Link href={`${settingsHref}/notifications`} />}>
              <SettingsIcon className="size-4" />
              Notification settings
            </Button>
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheckIcon className="size-4" />
              Mark all read
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Search notifications…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <NativeSelect value={kind} onChange={(e) => setKind(e.target.value)} className="sm:w-44">
          <NativeSelectOption value="all">All types</NativeSelectOption>
          <NativeSelectOption value="sale">Sales</NativeSelectOption>
          <NativeSelectOption value="payment">Payments</NativeSelectOption>
          <NativeSelectOption value="expense">Expenses</NativeSelectOption>
          <NativeSelectOption value="report">Reports</NativeSelectOption>
          <NativeSelectOption value="task">Tasks</NativeSelectOption>
        </NativeSelect>
      </div>

      <Widget>
        <div className="px-(--card-spacing)">
          {filtered.length === 0 ? (
            <EmptyBox title="No notifications found" description="Try clearing your search or filter." />
          ) : (
            <ul className="divide-y">
              {filtered.map((item) => {
                const unread = currentUser ? !item.readBy.includes(currentUser.id) : false
                const { icon: Icon, tone } = ICONS[item.kind]
                return (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <Link
                      href={item.href}
                      onClick={() => markRead(item.id)}
                      className="flex min-w-0 flex-1 items-start gap-3"
                    >
                      <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", tone)}>
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm leading-snug", unread && "font-semibold")}>{item.text}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.at}</p>
                      </div>
                    </Link>
                    {unread && (
                      <Button size="xs" variant="ghost" onClick={() => markRead(item.id)}>
                        Mark read
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Widget>

      <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification settings</DialogTitle>
            <DialogDescription>Choose which alerts you want to receive for your role.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col divide-y">
            {PREF_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2.5">
                <span className="text-sm">{item.label}</span>
                <Switch
                  checked={prefs[item.key]}
                  onCheckedChange={(checked) => {
                    updatePrefs({ [item.key]: checked })
                    toast.add({ title: `${item.label} ${checked ? "enabled" : "muted"}` })
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" render={<Link href={settingsHref} onClick={() => setPrefsOpen(false)} />}>
              Open full settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
