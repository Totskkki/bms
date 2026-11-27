import {
  AwardIcon,
  BanknoteIcon,
  BarChart3Icon,
  BellIcon,
  CameraIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  ClockIcon,
  DatabaseBackupIcon,
  FileBarChart2Icon,
  FileCheck2Icon,
  FileSpreadsheetIcon,
  FileTextIcon,
  InboxIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  MapPinIcon,
  MegaphoneIcon,
  MessageSquarePlusIcon,
  RadioIcon,
  ReceiptTextIcon,
  ScrollTextIcon,
  SendIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShieldIcon,
  TargetIcon,
  TrendingUpIcon,
  UserCheckIcon,
  UserCogIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"

import type { NavGroup, NavLink } from "@/kit/shell/types"
import type { Role } from "@/lib/rbac"

export const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  ceo: "/ceo",
  manager: "/manager",
  sales: "/sales",
  reporter: "/reporters",
  finance: "/finance",
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: "System Admin",
  ceo: "CEO",
  manager: "Manager",
  sales: "Sales & Marketing",
  reporter: "AM Reporters",
  finance: "Finance",
}

export const ROLE_PRESET: Record<Role, string> = {
  admin: "role-admin",
  ceo: "default",
  manager: "role-manager",
  sales: "role-sales",
  reporter: "role-reporter",
  finance: "role-finance",
}

export const ROLE_NOTIFICATIONS_PATH: Record<Role, string> = {
  admin: "/admin/notifications",
  ceo: "/ceo/notifications",
  manager: "/manager/notifications",
  sales: "/sales/notifications",
  reporter: "/reporters/notifications",
  finance: "/finance/notifications",
}

export const ROLE_SETTINGS_PATH: Record<Role, string> = {
  admin: "/admin/settings",
  ceo: "/ceo/settings",
  manager: "/manager/settings",
  sales: "/sales/settings",
  reporter: "/reporters/settings",
  finance: "/finance/settings",
}

export const NAV_BY_ROLE: Record<Role, { nav: NavGroup[]; secondary: NavLink[] }> = {
  admin: {
    nav: [
      {
        label: "Administration",
        items: [
          { title: "Overview", href: "/admin", icon: LayoutDashboardIcon, shortcut: "o" },
          { title: "User Accounts", href: "/admin/users", icon: UserCogIcon, shortcut: "u" },
          { title: "Roles & Permissions", href: "/admin/roles", icon: ShieldCheckIcon, shortcut: "r" },
        ],
      },
      {
        label: "Security & Data",
        items: [
          { title: "Audit Log", href: "/admin/audit", icon: ShieldIcon, shortcut: "a" },
          { title: "Backup & Reset", href: "/admin/backup", icon: DatabaseBackupIcon, shortcut: "b" },
        ],
      },
    ],
    secondary: [
      { title: "Notifications", href: "/admin/notifications", icon: BellIcon, badge: "notifications", shortcut: "n" },
      { title: "Settings", href: "/admin/settings", icon: SettingsIcon },
    ],
  },

  ceo: {
    nav: [
      {
        label: "Executive",
        items: [
          { title: "Overview", href: "/ceo", icon: LayoutDashboardIcon, shortcut: "o" },
          { title: "Sales and Marketing", href: "/ceo/sales", icon: TrendingUpIcon, shortcut: "s" },
          { title: "AM Reporters", href: "/ceo/reporters", icon: RadioIcon, shortcut: "r" },
          { title: "Finance", href: "/ceo/finance", icon: LandmarkIcon, shortcut: "f" },
        ],
      },
      {
        label: "Governance",
        items: [
          { title: "Employee Performance", href: "/ceo/employees", icon: UsersIcon, shortcut: "e" },
          { title: "Approvals", href: "/ceo/approvals", icon: ClipboardCheckIcon, badge: "approvals", shortcut: "a" },
          { title: "Reports", href: "/ceo/reports", icon: FileSpreadsheetIcon, shortcut: "p" },
        ],
      },
    ],
    secondary: [
      { title: "Notifications", href: "/ceo/notifications", icon: BellIcon, badge: "notifications", shortcut: "n" },
      { title: "Settings", href: "/ceo/settings", icon: SettingsIcon },
    ],
  },

  manager: {
    nav: [
      {
        label: "Operations",
        items: [
          { title: "Overview", href: "/manager", icon: LayoutDashboardIcon, shortcut: "o" },
          { title: "Assign Tasks", href: "/manager/tasks", icon: ListChecksIcon, badge: "tasks", shortcut: "t" },
          { title: "Daily Reports", href: "/manager/daily-reports", icon: InboxIcon, badge: "inbox", shortcut: "d" },
        ],
      },
      {
        label: "Performance & Reporting",
        items: [
          { title: "Employee Performance", href: "/manager/employees", icon: UsersIcon, shortcut: "e" },
          { title: "Department Accomplishments", href: "/manager/accomplishments", icon: AwardIcon, shortcut: "a" },
          { title: "Consolidated Report", href: "/manager/consolidated", icon: SendIcon, shortcut: "c" },
          { title: "Payroll Review", href: "/manager/payroll-approvals", icon: ClipboardCheckIcon },
          { title: "My Payslips", href: "/manager/my-payslips", icon: BanknoteIcon },
        ],
      },
    ],
    secondary: [
      { title: "Notifications", href: "/manager/notifications", icon: BellIcon, badge: "notifications", shortcut: "n" },
      { title: "Settings", href: "/manager/settings", icon: SettingsIcon },
    ],
  },

  sales: {
    nav: [
      {
        label: "Pipeline",
        items: [
          { title: "Overview", href: "/sales", icon: LayoutDashboardIcon, shortcut: "o" },
          { title: "Customers", href: "/sales/customers", icon: UsersIcon, shortcut: "c" },
          { title: "Inquiries", href: "/sales/inquiries", icon: MessageSquarePlusIcon, shortcut: "i" },
          { title: "Leads", href: "/sales/leads", icon: TrendingUpIcon, shortcut: "l" },
          { title: "Proposals", href: "/sales/proposals", icon: FileTextIcon, shortcut: "p" },
          { title: "Confirmed Sales", href: "/sales/confirmed", icon: CheckCircle2Icon, shortcut: "s" },
        ],
      },
      {
        label: "Growth & Reports",
        items: [
          { title: "Targets", href: "/sales/targets", icon: TargetIcon, shortcut: "t" },
          { title: "Marketing Activities", href: "/sales/marketing", icon: MegaphoneIcon, shortcut: "m" },
          { title: "Reports", href: "/sales/reports", icon: FileBarChart2Icon, shortcut: "r" },
          { title: "My Payslips", href: "/sales/my-payslips", icon: BanknoteIcon },
        ],
      },
    ],
    secondary: [
      { title: "Notifications", href: "/sales/notifications", icon: BellIcon, badge: "notifications", shortcut: "n" },
      { title: "Settings", href: "/sales/settings", icon: SettingsIcon },
    ],
  },

  reporter: {
    nav: [
      {
        label: "Field Work",
        items: [
          { title: "Overview", href: "/reporters", icon: LayoutDashboardIcon, shortcut: "o" },
          { title: "Daily Activity Reports", href: "/reporters/activities", icon: ClipboardListIcon, shortcut: "d" },
          { title: "Field Assignments", href: "/reporters/assignments", icon: MapPinIcon, badge: "assignments", shortcut: "f" },
          { title: "Accomplishments", href: "/reporters/accomplishments", icon: AwardIcon, shortcut: "a" },
        ],
      },
      {
        label: "Documentation",
        items: [
          { title: "Photos & Documentation", href: "/reporters/photos", icon: CameraIcon, shortcut: "p" },
          { title: "Attendance", href: "/reporters/attendance", icon: UserCheckIcon, shortcut: "t" },
          { title: "Reports", href: "/reporters/reports", icon: FileCheck2Icon, shortcut: "r" },
          { title: "My Payslips", href: "/reporters/my-payslips", icon: BanknoteIcon },
        ],
      },
    ],
    secondary: [
      { title: "Notifications", href: "/reporters/notifications", icon: BellIcon, badge: "notifications", shortcut: "n" },
      { title: "Settings", href: "/reporters/settings", icon: SettingsIcon },
    ],
  },

  finance: {
    nav: [
      {
        label: "Accounting",
        items: [
          { title: "Overview", href: "/finance", icon: LayoutDashboardIcon, shortcut: "o" },
          { title: "Income & Payments", href: "/finance/payments", icon: WalletIcon, shortcut: "i" },
          { title: "Expenses", href: "/finance/expenses", icon: ReceiptTextIcon, shortcut: "e" },
          { title: "Accounts Receivable", href: "/finance/receivables", icon: ClockIcon, badge: "receivables", shortcut: "r" },
          { title: "Accounts Payable", href: "/finance/payables", icon: ScrollTextIcon, shortcut: "p" },
        ],
      },
      {
        label: "Treasury & Reports",
        items: [
          { title: "Cash Flow", href: "/finance/cash-flow", icon: BarChart3Icon, shortcut: "c" },
          { title: "Payroll", href: "/finance/payroll", icon: BanknoteIcon, shortcut: "y" },
          { title: "Financial Reports", href: "/finance/reports", icon: FileSpreadsheetIcon, shortcut: "f" },
          { title: "My Payslips", href: "/finance/my-payslips", icon: WalletIcon },
        ],
      },
    ],
    secondary: [
      { title: "Notifications", href: "/finance/notifications", icon: BellIcon, badge: "notifications", shortcut: "n" },
      { title: "Settings", href: "/finance/settings", icon: SettingsIcon },
    ],
  },
}
