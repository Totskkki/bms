import type { Department, Permission, Role, Scope, UserAccount } from "./types"

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: [
    "users:read",
    "users:manage",
    "audit:read",
    "system:backup",
  ],
  ceo: [
    "deals:read",
    "customers:read",
    "marketing:read",
    "payments:read",
    "expenses:read",
    "payables:read",
    "payroll:read",
    "payroll:approve",
    "payroll:read-own",
    "activities:read",
    "photos:read",
    "attendance:read",
    "tasks:read",
    "reports:read",
    "reports:approve",
    "reports:return",
    "audit:read",
  ],
  manager: [
    "deals:read",
    "customers:read",
    "marketing:read",
    "payments:read",
    "expenses:read",
    "payroll:review",
    "payroll:read-own",
    "activities:read",
    "photos:read",
    "attendance:read",
    "tasks:read",
    "tasks:assign",
    "tasks:update",
    "reports:read",
    "reports:review",
    "reports:consolidate",
    "reports:return",
  ],
  sales: [
    "deals:read",
    "deals:create",
    "deals:update",
    "deals:confirm",
    "customers:read",
    "customers:write",
    "marketing:read",
    "marketing:write",
    "payroll:read-own",
    "tasks:read",
    "tasks:update",
    "reports:read",
    "reports:submit",
  ],
  reporter: [
    "activities:read",
    "activities:write",
    "photos:read",
    "photos:write",
    "attendance:read",
    "attendance:write",
    "payroll:read-own",
    "tasks:read",
    "tasks:update",
    "reports:read",
    "reports:submit",
  ],
  finance: [
    "deals:read",
    "payments:read",
    "payments:write",
    "expenses:read",
    "expenses:write",
    "payables:read",
    "payables:write",
    "payroll:read",
    "payroll:write",
    "payroll:manage",
    "payroll:read-own",
    "tasks:read",
    "tasks:update",
    "reports:read",
    "reports:submit",
  ],
}

export const ROLE_SCOPE: Record<Role, Scope> = {
  admin: "all",
  ceo: "all",
  manager: "all",
  sales: "department",
  reporter: "own",
  finance: "department",
}

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function scopeOf(role: Role): Scope {
  return ROLE_SCOPE[role]
}

export interface ScopedRecord {
  ownerId?: string
  authorId?: string
  toId?: string
  department?: Department
}

export function filterByScope<T extends ScopedRecord>(
  items: T[],
  user: Pick<UserAccount, "id" | "role" | "department"> | null | undefined
): T[] {
  if (!user) return []
  const scope = scopeOf(user.role)
  if (scope === "all") return items
  if (scope === "own") {
    return items.filter((item) => {
      const owner = item.authorId ?? item.ownerId ?? item.toId
      return owner === user.id
    })
  }
  return items.filter((item) => !item.department || item.department === user.department)
}
