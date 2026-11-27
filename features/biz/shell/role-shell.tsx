"use client"

import {
  ArrowRightIcon,
  BellIcon,
  ChevronsUpDownIcon,
  LogOutIcon,
  MoonIcon,
  SearchIcon,
  SettingsIcon,
  ShieldAlertIcon,
  UserIcon,
  UsersRoundIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { BRAND } from "@/config/brand"
import {
  NAV_BY_ROLE,
  ROLE_HOME,
  ROLE_LABEL,
  ROLE_NOTIFICATIONS_PATH,
  ROLE_PRESET,
  ROLE_SETTINGS_PATH,
} from "@/config/nav-by-role"
import { CommandMenuProvider, useCommandMenu, type CommandAction } from "@/kit/command/command-menu"
import { useCustomizer } from "@/kit/customizer/customizer-provider"
import { BreadcrumbLabelProvider, Breadcrumbs } from "@/kit/shell/breadcrumbs"
import { ModeToggle } from "@/kit/shell/mode-toggle"
import { isActive } from "@/kit/shell/nav-active"
import { NavMain } from "@/kit/shell/nav-main"
import { ShortcutsProvider } from "@/kit/shortcuts/shortcuts"
import type { Role } from "@/lib/rbac"

import { balances, notificationsForUser } from "../metrics"
import { useBiz } from "../store"

function SearchButton() {
  const { setOpen } = useCommandMenu()
  return (
    <Button
      variant="outline"
      className="w-9 justify-center px-0 text-muted-foreground sm:w-52 sm:justify-between sm:px-2.5"
      onClick={() => setOpen(true)}
      aria-keyshortcuts="Meta+K Control+K"
    >
      <span className="flex items-center gap-2">
        <SearchIcon className="size-4" />
        <span className="sr-only sm:not-sr-only">Search…</span>
      </span>
      <KbdGroup aria-hidden className="hidden sm:inline-flex">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </Button>
  )
}

function RoleNotificationBell({ role }: { role: Role }) {
  const currentUser = useBiz((s) => s.currentUser)
  const notifications = useBiz((s) => s.notifications)
  const markRead = useBiz((s) => s.markNotificationRead)
  const markAllRead = useBiz((s) => s.markAllNotificationsRead)
  const [open, setOpen] = useState(false)

  const mine = useMemo(() => notificationsForUser(notifications, currentUser), [notifications, currentUser])
  const unread = useMemo(
    () => mine.filter((n) => currentUser && !n.readBy.includes(currentUser.id)),
    [mine, currentUser]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications" />
        }
      >
        <BellIcon className="size-4" />
        {unread.length > 0 && (
          <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground tabular-nums">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3.5 py-2.5">
          <span className="text-sm font-medium">Notifications</span>
          <div className="flex items-center gap-2">
            {unread.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
            <Link
              href={`${ROLE_SETTINGS_PATH[role]}/notifications`}
              onClick={() => setOpen(false)}
              aria-label="Notification settings"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <SettingsIcon className="size-3.5" />
            </Link>
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y">
          {mine.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">No notifications yet.</p>
          ) : (
            mine.slice(0, 6).map((item) => {
              const isUnread = currentUser ? !item.readBy.includes(currentUser.id) : false
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    markRead(item.id)
                    setOpen(false)
                  }}
                  className="flex items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-muted/50"
                >
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${isUnread ? "bg-primary" : "bg-transparent"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-snug">{item.text}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{item.at}</p>
                  </div>
                </Link>
              )
            })
          )}
        </div>
        <div className="border-t p-2">
          <Link
            href={ROLE_NOTIFICATIONS_PATH[role]}
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium text-primary hover:bg-muted/60"
          >
            View all notifications
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function RoleSidebar({ role, badges }: { role: Role; badges: Record<string, number> }) {
  const pathname = usePathname()
  const router = useRouter()
  const { setOpenMobile, isMobile } = useSidebar()
  const currentUser = useBiz((s) => s.currentUser)
  const logout = useBiz((s) => s.logout)
  const [profileOpen, setProfileOpen] = useState(false)

  const roleNav = NAV_BY_ROLE[role]
  const BrandLogo = BRAND.mark

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<Link href={ROLE_HOME[role]} onClick={() => setOpenMobile(false)} />}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <BrandLogo className="size-4" />
                </div>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-semibold">{BRAND.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{ROLE_LABEL[role]}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <nav aria-label={`${ROLE_LABEL[role]} navigation`} className="flex min-h-0 flex-1 flex-col">
            <NavMain groups={roleNav.nav} badges={badges} />
            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {roleNav.secondary.map((link) => {
                    const Icon = link.icon
                    const count = link.badge ? badges[link.badge] : 0
                    return (
                      <SidebarMenuItem key={link.href}>
                        <SidebarMenuButton
                          size="sm"
                          tooltip={link.title}
                          isActive={isActive(pathname, link.href)}
                          render={<Link href={link.href} onClick={() => setOpenMobile(false)} />}
                        >
                          {Icon && <Icon />}
                          <span>{link.title}</span>
                        </SidebarMenuButton>
                        {count > 0 && <SidebarMenuBadge>{count}</SidebarMenuBadge>}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </nav>
        </SidebarContent>

        {currentUser && (
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <SidebarMenuButton
                        size="lg"
                        className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
                      />
                    }
                  >
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary/15 text-xs font-semibold text-primary">
                        {currentUser.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-start text-sm leading-tight">
                      <span className="truncate font-medium">{currentUser.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{currentUser.email}</span>
                    </div>
                    <ChevronsUpDownIcon className="ms-auto size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="min-w-56"
                    side={isMobile ? "bottom" : "right"}
                    align="end"
                    sideOffset={4}
                  >
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="p-0 font-normal">
                        <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
                          <Avatar className="size-8 rounded-lg">
                            <AvatarFallback className="rounded-lg bg-primary/15 text-xs font-semibold text-primary">
                              {currentUser.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="grid flex-1 leading-tight">
                            <span className="truncate font-medium">{currentUser.name}</span>
                            <span className="truncate text-xs text-muted-foreground">{currentUser.title}</span>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => router.push(ROLE_SETTINGS_PATH[role])}>
                        <UserIcon />
                        Profile & settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(ROLE_NOTIFICATIONS_PATH[role])}>
                        <BellIcon />
                        Notifications
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push("/login")}>
                        <UsersRoundIcon />
                        Switch demo account
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={() => {
                          logout()
                          router.replace("/login")
                        }}
                      >
                        <LogOutIcon />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        )}
        <SidebarRail />
      </Sidebar>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account profile</DialogTitle>
            <DialogDescription>Signed-in demo account details (session only).</DialogDescription>
          </DialogHeader>
          {currentUser && (
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-3">
                <Avatar className="size-12 rounded-xl">
                  <AvatarFallback className="rounded-xl bg-primary/15 text-base font-semibold text-primary">
                    {currentUser.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">{currentUser.title}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{currentUser.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Role</p>
                  <p className="font-medium">{ROLE_LABEL[currentUser.role]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium capitalize">{currentUser.department}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Organization</p>
                  <p className="font-medium">{BRAND.name}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export function RoleShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const setCustomizer = useCustomizer((s) => s.set)
  const currentPreset = useCustomizer((s) => s.preset)

  const currentUser = useBiz((s) => s.currentUser)
  const authHydrated = useBiz((s) => s.authHydrated)
  const hydrateAuth = useBiz((s) => s.hydrateAuth)
  const reports = useBiz((s) => s.reports)
  const tasks = useBiz((s) => s.tasks)
  const deals = useBiz((s) => s.deals)
  const payments = useBiz((s) => s.payments)
  const expenses = useBiz((s) => s.expenses)
  const notifications = useBiz((s) => s.notifications)

  useEffect(() => {
    hydrateAuth()
  }, [hydrateAuth])

  useEffect(() => {
    if (authHydrated && !currentUser) {
      router.replace("/login")
    }
  }, [authHydrated, currentUser, router])

  // Apply this role's distinct accent theme preset.
  useEffect(() => {
    if (!currentUser || currentUser.role !== role) return
    const targetPreset = ROLE_PRESET[role]
    if (currentPreset !== targetPreset) {
      setCustomizer({ preset: targetPreset, custom: null })
    }
  }, [currentUser, role, currentPreset, setCustomizer])

  const roleNav = NAV_BY_ROLE[role]
  const links = useMemo(
    () => [...roleNav.nav.flatMap((g) => g.items), ...roleNav.secondary],
    [roleNav]
  )

  const badges = useMemo(() => {
    const unreadNotifs = notificationsForUser(notifications, currentUser).filter(
      (n) => currentUser && !n.readBy.includes(currentUser.id)
    ).length
    const pendingApprovals = reports.filter((r) => r.status === "sent_to_ceo" && r.department === "management").length
    const inboxReports = reports.filter((r) => r.status === "submitted").length
    const openTasks = tasks.filter((t) => t.status !== "done").length
    const myAssignments = currentUser
      ? tasks.filter((t) => t.toId === currentUser.id && t.status !== "done").length
      : 0
    const unpaidReceivables = balances({ deals, payments, expenses }).filter((b) => b.balance > 0).length
    return {
      notifications: unreadNotifs,
      approvals: pendingApprovals,
      inbox: inboxReports,
      tasks: openTasks,
      assignments: myAssignments,
      receivables: unpaidReceivables,
    }
  }, [notifications, currentUser, reports, tasks, deals, payments, expenses])

  const commands = useMemo<CommandAction[]>(
    () => [
      {
        id: "theme",
        title: resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode",
        icon: MoonIcon,
        shortcut: "D",
        group: "Preferences",
        run: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      },
      {
        id: "switch-account",
        title: "Switch demo account",
        icon: UsersRoundIcon,
        group: "Account",
        run: () => router.push("/login"),
      },
    ],
    [resolvedTheme, setTheme, router]
  )

  if (!authHydrated || !currentUser) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-page p-6">
        <p className="text-sm text-muted-foreground">Loading workspace…</p>
      </div>
    )
  }

  if (currentUser.role !== role) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-page p-6">
        <div className="flex max-w-md flex-col items-center rounded-2xl border bg-card p-8 text-center shadow-(--surface-shadow)">
          <span className="mb-3 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <ShieldAlertIcon className="size-6" />
          </span>
          <h1 className="font-heading text-xl font-semibold">No access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You are signed in as <span className="font-medium text-foreground">{currentUser.name}</span> ({ROLE_LABEL[currentUser.role]}). This section belongs to {ROLE_LABEL[role]}.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button render={<Link href={ROLE_HOME[currentUser.role]} />}>
              Go to {ROLE_LABEL[currentUser.role]} dashboard
            </Button>
            <Button variant="outline" render={<Link href="/login" />}>
              Switch account
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ShortcutsProvider
      links={links}
      extra={[
        { keys: ["⌘", "K"], label: "Search pages" },
        { keys: ["⌘", "B"], label: "Toggle sidebar" },
      ]}
    >
      <CommandMenuProvider
        links={links}
        actions={commands}
        description={`Jump to any ${ROLE_LABEL[role]} page or action.`}
      >
        <BreadcrumbLabelProvider>
          <SidebarProvider>
            <RoleSidebar role={role} badges={badges} />
            <SidebarInset className="min-w-0">
              <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:rounded-t-xl print:hidden">
                <SidebarTrigger className="-ms-1" />
                <Separator orientation="vertical" className="me-1 data-vertical:h-4 data-vertical:self-center" />
                <Badge variant="secondary" className="hidden text-xs font-medium sm:inline-flex">
                  {ROLE_LABEL[role]}
                </Badge>
                <Breadcrumbs links={links} home={{ title: ROLE_LABEL[role], href: ROLE_HOME[role] }} />
                <div className="ms-auto flex items-center gap-1">
                  <SearchButton />
                  <RoleNotificationBell role={role} />
                  <ModeToggle />
                </div>
              </header>
              <main className="flex w-full min-w-0 flex-1 flex-col gap-6 bg-page p-4 md:p-6">
                <div className="hidden items-center justify-between border-b pb-3 print:flex">
                  <div>
                    <p className="text-base font-semibold">{BRAND.name}</p>
                    <p className="text-xs text-muted-foreground">{ROLE_LABEL[role]} Report · {currentUser.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Generated Nov 26, 2026</p>
                </div>
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </BreadcrumbLabelProvider>
      </CommandMenuProvider>
    </ShortcutsProvider>
  )
}
