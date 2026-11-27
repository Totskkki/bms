export type Role = "admin" | "ceo" | "manager" | "sales" | "reporter" | "finance"

export type Department = "admin" | "executive" | "management" | "sales" | "reporters" | "finance"

export type Scope = "own" | "department" | "all"

export type Permission =
  | "users:read"
  | "users:manage"
  | "system:backup"
  | "deals:read"
  | "deals:create"
  | "deals:update"
  | "deals:confirm"
  | "customers:read"
  | "customers:write"
  | "marketing:read"
  | "marketing:write"
  | "payments:read"
  | "payments:write"
  | "expenses:read"
  | "expenses:write"
  | "payables:read"
  | "payables:write"
  | "payroll:read"
  | "payroll:write"
  | "payroll:manage"
  | "payroll:review"
  | "payroll:approve"
  | "payroll:read-own"
  | "activities:read"
  | "activities:write"
  | "photos:read"
  | "photos:write"
  | "attendance:read"
  | "attendance:write"
  | "tasks:read"
  | "tasks:assign"
  | "tasks:update"
  | "reports:read"
  | "reports:submit"
  | "reports:review"
  | "reports:consolidate"
  | "reports:approve"
  | "reports:return"
  | "audit:read"

export interface UserAccount {
  id: string
  orgId: string
  name: string
  email: string
  role: Role
  department: Department
  title: string
  initials: string
  status?: "active" | "inactive"
  lastLogin?: string
}
