"use client"

import {
  BanknoteIcon,
  CalculatorIcon,
  FileTextIcon,
  HandCoinsIcon,
  LandmarkIcon,
  PlayCircleIcon,
  SlidersHorizontalIcon,
  UsersIcon,
} from "lucide-react"

import { SettingsLayout, type SettingsGroup } from "@/kit/settings/settings-layout"

const PAYROLL_NAV: SettingsGroup[] = [
  {
    label: "Operations",
    items: [
      { title: "Overview", href: "/finance/payroll", icon: BanknoteIcon },
      { title: "Employees", href: "/finance/payroll/employees", icon: UsersIcon },
      { title: "Run Payroll", href: "/finance/payroll/run", icon: PlayCircleIcon },
    ],
  },
  {
    label: "Output & Compliance",
    items: [
      { title: "Payroll Register", href: "/finance/payroll/register", icon: CalculatorIcon },
      { title: "Payslips", href: "/finance/payroll/payslips", icon: FileTextIcon },
      { title: "Gov. Contributions", href: "/finance/payroll/contributions", icon: LandmarkIcon },
    ],
  },
  {
    label: "Loans & Config",
    items: [
      { title: "Loans & Advances", href: "/finance/payroll/loans", icon: HandCoinsIcon },
      { title: "Payroll Settings", href: "/finance/payroll/settings", icon: SlidersHorizontalIcon },
    ],
  },
]

export function PayrollFrame({ children }: { children: React.ReactNode }) {
  return (
    <SettingsLayout
      title="Payroll"
      description="Employee salaries, semi-monthly runs, payslips, contributions, loans, and rates."
      groups={PAYROLL_NAV}
    >
      {children}
    </SettingsLayout>
  )
}
