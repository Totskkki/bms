"use client"

import {
  CheckIcon,
  CopyIcon,
  DatabaseBackupIcon,
  DownloadIcon,
  KeyRoundIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { PillBars } from "@/components/chronicle/charts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { ROLE_LABEL } from "@/config/nav-by-role"
import { PageHeader } from "@/kit/ui-patterns/page-header"
import { StatusBadge } from "@/kit/ui-patterns/status-badge"
import { Widget } from "@/kit/widgets/widget"
import { ROLE_PERMISSIONS, ROLE_SCOPE, type Department, type Permission, type Role, type UserAccount } from "@/lib/rbac"

import { usePayroll } from "../finance/payroll/store"
import { DashboardGreetingHeader, EmptyBox, ExportButtons, Grid, Panel, Stat, TablePagination, usePagination } from "../parts"
import { useBiz } from "../store"

const ALL_ROLES: Role[] = ["admin", "ceo", "manager", "sales", "reporter", "finance"]

const ROLE_DEFAULT_DEPT: Record<Role, Department> = {
  admin: "admin",
  ceo: "executive",
  manager: "management",
  sales: "sales",
  reporter: "reporters",
  finance: "finance",
}

const DEPT_LABEL: Record<Department, string> = {
  admin: "IT / Administration",
  executive: "Executive",
  management: "Management",
  sales: "Sales & Marketing",
  reporters: "AM Reporters",
  finance: "Finance",
}

const ROLE_BADGE_TONE: Record<Role, string> = {
  admin: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  ceo: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  manager: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  sales: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  reporter: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  finance: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
}

const PERMISSION_GROUPS: { label: string; perms: { key: Permission; label: string }[] }[] = [
  {
    label: "User & System Administration",
    perms: [
      { key: "users:read", label: "View user directory" },
      { key: "users:manage", label: "Create, edit, deactivate & reset users" },
      { key: "audit:read", label: "View system audit logs" },
      { key: "system:backup", label: "Export backups & reset demo data" },
    ],
  },
  {
    label: "Sales & Marketing",
    perms: [
      { key: "customers:read", label: "View customers" },
      { key: "customers:write", label: "Add / edit customers" },
      { key: "deals:read", label: "View inquiries, leads & proposals" },
      { key: "deals:create", label: "Create deals & proposals" },
      { key: "deals:confirm", label: "Confirm sales" },
      { key: "marketing:write", label: "Log marketing activities" },
    ],
  },
  {
    label: "Finance & Payroll",
    perms: [
      { key: "payments:write", label: "Record customer payments" },
      { key: "expenses:write", label: "Record expenses & BIR tax" },
      { key: "payables:write", label: "Manage accounts payable" },
      { key: "payroll:manage", label: "Manage payroll runs, employees & settings" },
      { key: "payroll:review", label: "Review payroll (department totals only)" },
      { key: "payroll:approve", label: "Approve payroll runs (CEO)" },
      { key: "payroll:read-own", label: "View own payslips" },
    ],
  },
  {
    label: "Field Operations, Tasks & Reporting",
    perms: [
      { key: "activities:write", label: "Log daily field activities & photos" },
      { key: "attendance:write", label: "Time in / time out attendance" },
      { key: "tasks:assign", label: "Assign tasks to staff" },
      { key: "reports:submit", label: "Submit daily / weekly / monthly reports" },
      { key: "reports:review", label: "Review & consolidate reports (Manager)" },
      { key: "reports:approve", label: "Approve consolidated reports (CEO)" },
    ],
  },
]

export function AdminOverviewPage() {
  const s = useBiz()
  const activeCount = s.users.filter((u) => u.status !== "inactive").length
  const inactiveCount = s.users.length - activeCount

  const roleChartData = useMemo(
    () =>
      ALL_ROLES.map((role) => ({
        label: ROLE_LABEL[role].replace(" & Marketing", ""),
        value: s.users.filter((u) => u.role === role).length,
      })),
    [s.users]
  )

  return (
    <div className="flex flex-col gap-6">
      <DashboardGreetingHeader
        summary={`${activeCount} active accounts · ${inactiveCount} deactivated · ${s.auditLogs.length} audit events`}
        actions={
          <Button size="sm" render={<Link href="/admin/users" />}>
            <PlusIcon className="size-4" />
            Manage users
          </Button>
        }
      />

      <Grid cols={4}>
        <Stat title="Total Accounts" value={String(s.users.length)} caption="Across 6 system roles" />
        <Stat title="Active Logins" value={String(activeCount)} caption="Can sign in now" />
        <Stat title="Deactivated" value={String(inactiveCount)} caption="Blocked from sign-in" />
        <Stat title="Audit Events" value={String(s.auditLogs.length)} caption="Tracked security & ops actions" />
      </Grid>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel
          title="Accounts by role"
          action={
            <Link href="/admin/roles" className="text-xs font-medium text-primary hover:underline">
              Permissions matrix →
            </Link>
          }
          className="lg:col-span-7"
        >
          <PillBars data={roleChartData} className="h-52" />
        </Panel>

        <Panel title="Role coverage" className="lg:col-span-5">
          <div className="flex flex-col gap-2.5">
            {ALL_ROLES.map((role) => {
              const total = s.users.filter((u) => u.role === role).length
              const active = s.users.filter((u) => u.role === role && u.status !== "inactive").length
              return (
                <div key={role} className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`border-transparent ${ROLE_BADGE_TONE[role]}`}>
                      {ROLE_LABEL[role]}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">Scope: {ROLE_SCOPE[role]}</span>
                  </div>
                  <span className="font-sans text-xs font-medium tabular-nums">
                    {active}/{total} active
                  </span>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      <Panel
        title="Recent audit activity"
        action={
          <Link href="/admin/audit" className="text-xs font-medium text-primary hover:underline">
            View full log →
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.auditLogs.slice(0, 6).map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{log.at}</TableCell>
                  <TableCell className="whitespace-nowrap font-medium">
                    {log.actorName}{" "}
                    <span className="text-xs font-normal text-muted-foreground">({ROLE_LABEL[log.actorRole]})</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{log.action}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{log.target}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </div>
  )
}

export function AdminUsersPage() {
  const s = useBiz()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<UserAccount | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("sales")
  const [department, setDepartment] = useState<Department>("sales")
  const [title, setTitle] = useState("")

  const [resetResult, setResetResult] = useState<{ name: string; email: string; tempPassword: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return s.users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false
      const st = u.status ?? "active"
      if (statusFilter !== "all" && st !== statusFilter) return false
      if (
        q &&
        !u.name.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q) &&
        !u.title.toLowerCase().includes(q)
      ) {
        return false
      }
      return true
    })
  }, [s.users, search, roleFilter, statusFilter])

  const pg = usePagination(filtered, 10)

  function openNew() {
    setEditing(null)
    setName("")
    setEmail("")
    setRole("sales")
    setDepartment("sales")
    setTitle("")
    setFormOpen(true)
  }

  function openEdit(user: UserAccount) {
    setEditing(user)
    setName(user.name)
    setEmail(user.email)
    setRole(user.role)
    setDepartment(user.department)
    setTitle(user.title)
    setFormOpen(true)
  }

  function handleRoleChange(next: Role) {
    setRole(next)
    setDepartment(ROLE_DEFAULT_DEPT[next])
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const res = editing
      ? s.updateUser(editing.id, { name, email, role, department, title })
      : s.createUser({ name, email, role, department, title })
    if (!res.ok) {
      toast.add({ title: res.error })
      return
    }
    toast.add({ title: editing ? `Updated ${name}` : `Created account for ${name}` })
    setFormOpen(false)
  }

  function handleResetPassword(user: UserAccount) {
    const res = s.resetUserPassword(user.id)
    if (!res.ok) {
      toast.add({ title: res.error })
      return
    }
    setResetResult({ name: user.name, email: user.email, tempPassword: res.tempPassword ?? "BH-TEMP-123" })
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    const res = s.deleteUser(deleteTarget.id)
    toast.add({ title: res.ok ? `Removed ${deleteTarget.name}` : res.error })
    setDeleteTarget(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="User Accounts"
        description="Create employee login accounts, assign roles, reset passwords, or deactivate access."
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <ExportButtons
              filename="user-accounts"
              headers={["Name", "Email", "Role", "Department", "Title", "Status", "Last Login"]}
              rows={filtered.map((u) => [
                u.name,
                u.email,
                ROLE_LABEL[u.role],
                DEPT_LABEL[u.department],
                u.title,
                u.status ?? "active",
                u.lastLogin ?? "—",
              ])}
            />
            <Button size="sm" onClick={openNew}>
              <PlusIcon className="size-4" />
              Add user
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row print:hidden">
        <Input
          placeholder="Search name, email, or title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <NativeSelect value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="sm:w-48">
          <NativeSelectOption value="all">All roles</NativeSelectOption>
          {ALL_ROLES.map((r) => (
            <NativeSelectOption key={r} value={r}>
              {ROLE_LABEL[r]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-40">
          <NativeSelectOption value="all">All statuses</NativeSelectOption>
          <NativeSelectOption value="active">Active</NativeSelectOption>
          <NativeSelectOption value="inactive">Deactivated</NativeSelectOption>
        </NativeSelect>
      </div>

      <Widget>
        <div className="overflow-x-auto px-(--card-spacing)">
          {filtered.length === 0 ? (
            <EmptyBox title="No matching user accounts" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right print:hidden">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pg.items.map((user) => {
                  const isSelf = s.currentUser?.id === user.id
                  const isActive = user.status !== "inactive"
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-primary/10 text-xs font-semibold text-primary">
                            {user.initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-medium">
                              {user.name}
                              {isSelf && (
                                <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.email} · {user.title}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className={`border-transparent ${ROLE_BADGE_TONE[user.role]}`}>
                          {ROLE_LABEL[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{DEPT_LABEL[user.department]}</TableCell>
                      <TableCell>
                        <StatusBadge tone={isActive ? "success" : "muted"}>{isActive ? "Active" : "Deactivated"}</StatusBadge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {user.lastLogin ?? "Never"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap print:hidden">
                        <div className="inline-flex items-center gap-1">
                          <Button size="xs" variant="outline" onClick={() => openEdit(user)}>
                            <PencilIcon className="size-3.5" />
                            Edit
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => handleResetPassword(user)} title="Reset password">
                            <KeyRoundIcon className="size-3.5" />
                            Reset PW
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            disabled={isSelf}
                            onClick={() => {
                              const res = s.toggleUserStatus(user.id)
                              toast.add({
                                title: res.ok
                                  ? `${user.name} is now ${isActive ? "deactivated" : "active"}`
                                  : res.error,
                              })
                            }}
                          >
                            {isActive ? <UserXIcon className="size-3.5" /> : <UserCheckIcon className="size-3.5" />}
                            {isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            disabled={isSelf}
                            aria-label={`Delete ${user.name}`}
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(user)}
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          <TablePagination {...pg.pagination} />
        </div>
      </Widget>

      {/* Create / Edit User Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Create user account"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update account details or reassign role permissions. Changes take effect immediately."
                : "New users can sign in right away on the login page using their work email."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="au-name">Full name</Label>
                <Input
                  id="au-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marco Santos"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="au-title">Job title</Label>
                <Input
                  id="au-title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sales Executive"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="au-email">Work email</Label>
              <Input
                id="au-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@businesshub.ph"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="au-role">Assigned role</Label>
                <NativeSelect
                  id="au-role"
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value as Role)}
                >
                  {ALL_ROLES.map((r) => (
                    <NativeSelectOption key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="au-dept">Department</Label>
                <NativeSelect
                  id="au-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                >
                  {(Object.keys(DEPT_LABEL) as Department[]).map((d) => (
                    <NativeSelectOption key={d} value={d}>
                      {DEPT_LABEL[d]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editing ? "Save changes" : "Create account"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={!!resetResult} onOpenChange={(o) => !o && setResetResult(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Temporary password issued</DialogTitle>
            <DialogDescription>
              Share this temporary demo password with <strong>{resetResult?.name}</strong> ({resetResult?.email}). This action was recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2.5 font-mono text-sm font-semibold">
            <span>{resetResult?.tempPassword}</span>
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                if (resetResult?.tempPassword) {
                  navigator.clipboard?.writeText(resetResult.tempPassword)
                  toast.add({ title: "Temporary password copied" })
                }
              }}
            >
              <CopyIcon className="size-3.5" />
              Copy
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setResetResult(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove user account?</DialogTitle>
            <DialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}) from login access. Historical records they created remain intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Remove account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function AdminRolesPage() {
  const users = useBiz((s) => s.users)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roles & Permissions"
        description="Read-only RBAC matrix enforced across every dashboard route and store action."
      />

      <Grid cols={3}>
        {ALL_ROLES.map((role) => {
          const count = users.filter((u) => u.role === role).length
          return (
            <Widget key={role}>
              <div className="flex flex-col gap-2 px-(--card-spacing) py-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`border-transparent ${ROLE_BADGE_TONE[role]}`}>
                    {ROLE_LABEL[role]}
                  </Badge>
                  <span className="text-xs text-muted-foreground capitalize">Scope: {ROLE_SCOPE[role]}</span>
                </div>
                <div className="font-sans text-2xl font-semibold tabular-nums">{count}</div>
                <p className="text-xs text-muted-foreground">
                  {ROLE_PERMISSIONS[role].length} permissions assigned
                </p>
              </div>
            </Widget>
          )
        })}
      </Grid>

      <Widget>
        <div className="overflow-x-auto px-(--card-spacing) py-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-56">Capability</TableHead>
                {ALL_ROLES.map((role) => (
                  <TableHead key={role} className="text-center whitespace-nowrap">
                    {ROLE_LABEL[role]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSION_GROUPS.map((group) => (
                <>
                  <TableRow key={group.label} className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={ALL_ROLES.length + 1} className="py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {group.label}
                    </TableCell>
                  </TableRow>
                  {group.perms.map((perm) => (
                    <TableRow key={perm.key}>
                      <TableCell className="text-sm">{perm.label}</TableCell>
                      {ALL_ROLES.map((role) => {
                        const allowed = ROLE_PERMISSIONS[role].includes(perm.key)
                        return (
                          <TableCell key={role} className="text-center">
                            {allowed ? (
                              <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                                <CheckIcon className="size-3.5" />
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/40">—</span>
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </Widget>
    </div>
  )
}

export function AdminAuditPage() {
  const auditLogs = useBiz((s) => s.auditLogs)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return auditLogs.filter((l) => {
      if (roleFilter !== "all" && l.actorRole !== roleFilter) return false
      if (
        q &&
        !l.actorName.toLowerCase().includes(q) &&
        !l.action.toLowerCase().includes(q) &&
        !l.target.toLowerCase().includes(q) &&
        !l.detail.toLowerCase().includes(q)
      ) {
        return false
      }
      return true
    })
  }, [auditLogs, search, roleFilter])

  const pg = usePagination(filtered, 15)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="System Audit Log"
        description="Chronological trail of account changes, approvals, payments, and payroll releases."
        actions={
          <ExportButtons
            filename="system-audit-log"
            headers={["When", "Actor", "Role", "Action", "Target", "Detail"]}
            rows={filtered.map((l) => [l.at, l.actorName, ROLE_LABEL[l.actorRole], l.action, l.target, l.detail])}
          />
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row print:hidden">
        <Input
          placeholder="Search actor, action, target, or detail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <NativeSelect value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="sm:w-48">
          <NativeSelectOption value="all">All roles</NativeSelectOption>
          {ALL_ROLES.map((r) => (
            <NativeSelectOption key={r} value={r}>
              {ROLE_LABEL[r]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <Widget>
        <div className="overflow-x-auto px-(--card-spacing)">
          {filtered.length === 0 ? (
            <EmptyBox title="No matching audit events" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pg.items.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{l.at}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium">{l.actorName}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className={`border-transparent ${ROLE_BADGE_TONE[l.actorRole]}`}>
                        {ROLE_LABEL[l.actorRole]}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{l.action}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{l.target}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.detail}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <TablePagination {...pg.pagination} />
        </div>
      </Widget>
    </div>
  )
}

export function AdminBackupPage() {
  const biz = useBiz()
  const payroll = usePayroll()
  const [confirmReset, setConfirmReset] = useState(false)

  function exportJsonBackup() {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      orgId: "org-1",
      users: biz.users,
      customers: biz.customers,
      deals: biz.deals,
      payments: biz.payments,
      expenses: biz.expenses,
      payables: biz.payables,
      reports: biz.reports,
      tasks: biz.tasks,
      auditLogs: biz.auditLogs,
      payrollEmployees: payroll.employees,
      payrollRuns: payroll.runs,
    }
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `businesshub-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.add({ title: "Workspace JSON backup downloaded" })
  }

  function handleResetAll() {
    biz.reset()
    payroll.resetDemo()
    setConfirmReset(false)
    toast.add({ title: "All demo data restored to initial 6-month seed" })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Backup & Demo Data"
        description="Export a JSON snapshot of all workspace records or reset demo data back to the initial seed."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Export workspace backup">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
              <DatabaseBackupIcon className="mt-0.5 size-5 shrink-0 text-primary" />
              <p>
                Downloads a complete JSON snapshot of users, sales, payments, expenses, payables, reports, payroll runs, and audit logs.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="rounded-md border px-2.5 py-2">Users: <strong className="text-foreground">{biz.users.length}</strong></div>
              <div className="rounded-md border px-2.5 py-2">Deals: <strong className="text-foreground">{biz.deals.length}</strong></div>
              <div className="rounded-md border px-2.5 py-2">Expenses: <strong className="text-foreground">{biz.expenses.length}</strong></div>
              <div className="rounded-md border px-2.5 py-2">Payroll runs: <strong className="text-foreground">{payroll.runs.length}</strong></div>
            </div>
            <div>
              <Button size="sm" onClick={exportJsonBackup}>
                <DownloadIcon className="size-4" />
                Download JSON backup
              </Button>
            </div>
          </div>
        </Panel>

        <Panel title="Reset demo workspace">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
              <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-primary" />
              <p>
                Restores all accounts, sales, finance entries, reports, and payroll runs to the default 6-month demo seed.
              </p>
            </div>
            <div>
              <Button size="sm" variant="destructive" onClick={() => setConfirmReset(true)}>
                <RotateCcwIcon className="size-4" />
                Reset all demo data
              </Button>
            </div>
          </div>
        </Panel>
      </div>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset all demo data?</DialogTitle>
            <DialogDescription>
              Any accounts, transactions, reports, or payroll runs created during this session will be replaced with the original demo seed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResetAll}>
              Yes, reset demo data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
