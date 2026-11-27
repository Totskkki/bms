import { change } from "@/kit/data/format"
import type { UserAccount } from "@/lib/rbac"

import {
  DEMO_ACCOUNTS,
  EXPENSE_CATEGORIES,
  MONTHS,
  NOW,
  type Activity,
  type Deal,
  type Expense,
  type NotificationItem,
  type Payment,
  type Report,
} from "./store"

export type Period = "1m" | "3m" | "6m"

export interface MonthRange {
  start: number
  end: number
}

export interface Slice {
  deals: Deal[]
  payments: Payment[]
  expenses: Expense[]
  reports?: Report[]
  activities?: Activity[]
}

export const TARGET = 600_000
export const SALES_REP_TARGET = 300_000
export const REPORTER_TARGET = 4

const sum = (n: number[]) => n.reduce((a, b) => a + b, 0)
const safe = (n: number) => (Number.isFinite(n) ? n : 0)

export function periodRange(period: Period): MonthRange {
  if (period === "1m") return { start: NOW, end: NOW }
  if (period === "3m") return { start: Math.max(0, NOW - 2), end: NOW }
  return { start: 0, end: NOW }
}

/**
 * Previous period of the EXACT same length as `period`.
 * Returns `null` when there is not enough earlier history in the 6-month dataset
 * (e.g. "Last 6 months" has no prior 6-month window).
 */
export function previousPeriodRange(period: Period): MonthRange | null {
  const cur = periodRange(period)
  const length = cur.end - cur.start + 1
  const prevEnd = cur.start - 1
  const prevStart = prevEnd - length + 1
  if (prevStart < 0 || prevEnd < 0) return null
  return { start: prevStart, end: prevEnd }
}

export function periodLabel(period: Period): string {
  const { start, end } = periodRange(period)
  return start === end ? `${MONTHS[end]} 2026` : `${MONTHS[start]} – ${MONTHS[end]} 2026`
}

export function comparisonLabel(period: Period): string | null {
  const prev = previousPeriodRange(period)
  if (!prev) return null
  return prev.start === prev.end ? `vs ${MONTHS[prev.end]}` : `vs ${MONTHS[prev.start]}–${MONTHS[prev.end]}`
}

function normalizeRange(range?: number | MonthRange): MonthRange {
  if (range === undefined) return { start: 0, end: NOW }
  if (typeof range === "number") return { start: range, end: range }
  return range
}

/** Revenue is confirmed sales. Collections are payments. Receivables are unpaid confirmed sales. */
export function totals(s: Slice, range?: number | MonthRange) {
  const { start, end } = normalizeRange(range)
  const inRange = (m: number) => m >= start && m <= end

  const confirmedInRange = s.deals.filter((d) => d.stage === "confirmed" && inRange(d.month))
  const sales = sum(confirmedInRange.map((d) => d.amount))
  const collections = sum(s.payments.filter((p) => inRange(p.month)).map((p) => p.amount))
  const expenses = sum(s.expenses.filter((e) => inRange(e.month)).map((e) => e.totalAmount ?? e.amount))
  const profit = sales - expenses
  const profitMargin = sales > 0 ? profit / sales : 0
  const collectionRate = sales > 0 ? collections / sales : 0

  let receivables = 0
  let unpaidInvoices = 0
  for (const deal of confirmedInRange) {
    const paid = sum(s.payments.filter((p) => p.dealId === deal.id && p.month <= end).map((p) => p.amount))
    const balance = Math.max(0, deal.amount - paid)
    if (balance > 0) {
      receivables += balance
      unpaidInvoices += 1
    }
  }

  return {
    sales,
    revenue: sales,
    expenses,
    profit,
    profitMargin,
    collections,
    receivables,
    unpaidInvoices,
    collectionRate,
  }
}

export function monthly(s: Slice, period?: Period) {
  const { start, end } = period ? periodRange(period) : { start: 0, end: NOW }
  return MONTHS.slice(start, end + 1).map((month, offset) => {
    const index = start + offset
    return { month, index, ...totals(s, index) }
  })
}

export function ceoSummary(s: Slice, period: Period) {
  const range = periodRange(period)
  const current = totals(s, range)
  const prevRange = previousPeriodRange(period)
  const previous = prevRange ? totals(s, prevRange) : null

  const thisMonth = totals(s, NOW)
  const lastMonth = NOW > 0 ? totals(s, NOW - 1) : null

  return {
    period,
    periodLabel: periodLabel(period),
    comparisonLabel: comparisonLabel(period),
    revenue: {
      value: current.revenue,
      delta: previous ? change(current.revenue, previous.revenue) : null,
    },
    sales: {
      value: thisMonth.sales,
      previous: lastMonth?.sales ?? 0,
      delta: lastMonth ? change(thisMonth.sales, lastMonth.sales) : null,
    },
    expenses: {
      value: current.expenses,
      delta: previous ? change(current.expenses, previous.expenses) : null,
    },
    profit: {
      value: current.profit,
      margin: current.profitMargin,
      delta: previous ? change(current.profit, previous.profit) : null,
    },
    collections: {
      value: current.collections,
      delta: previous ? change(current.collections, previous.collections) : null,
    },
    receivables: {
      value: current.receivables,
      unpaidInvoices: current.unpaidInvoices,
      collectionRate: current.collectionRate,
      delta: previous ? change(current.receivables, previous.receivables) : null,
    },
  }
}

export function balances(s: Slice) {
  return s.deals
    .filter((d) => d.stage === "confirmed")
    .map((d) => {
      const paid = sum(s.payments.filter((p) => p.dealId === d.id).map((p) => p.amount))
      const balance = Math.max(0, d.amount - paid)
      const ageMonths = Math.max(0, NOW - d.month)
      const agingBucket: "0-30" | "31-60" | "61+" = ageMonths === 0 ? "0-30" : ageMonths === 1 ? "31-60" : "61+"
      return { ...d, paid, balance, agingBucket }
    })
}

export interface EmployeePerformanceRow {
  id: string
  name: string
  department: "Sales" | "AM Reporters" | "Finance"
  result: string
  target: string
  pct: number
  barValue: number
}

export function employeePerformance(s: Slice): EmployeePerformanceRow[] {
  const salesStaff = DEMO_ACCOUNTS.filter((u) => u.role === "sales")
  const reporterStaff = DEMO_ACCOUNTS.filter((u) => u.role === "reporter")

  const salesRows: EmployeePerformanceRow[] = salesStaff.map((u) => {
    const amount = sum(
      s.deals.filter((d) => d.ownerId === u.id && d.stage === "confirmed" && d.month === NOW).map((d) => d.amount)
    )
    const pct = SALES_REP_TARGET > 0 ? Math.round((amount / SALES_REP_TARGET) * 100) : 0
    return {
      id: u.id,
      name: u.name,
      department: "Sales",
      result: peso(amount),
      target: peso(SALES_REP_TARGET),
      pct,
      barValue: Math.min(100, Math.max(0, pct)),
    }
  })

  const reporterRows: EmployeePerformanceRow[] = reporterStaff.map((u) => {
    const activitiesCount = (s.activities ?? []).filter((a) => a.authorId === u.id && a.month === NOW).length
    const reportsCount = (s.reports ?? []).filter((r) => r.authorId === u.id && r.month === NOW).length
    const total = activitiesCount + reportsCount
    const pct = REPORTER_TARGET > 0 ? Math.round((total / REPORTER_TARGET) * 100) : 0
    const actLabel = `${activitiesCount} ${activitiesCount === 1 ? "activity" : "activities"}`
    const repLabel = `${reportsCount} ${reportsCount === 1 ? "report" : "reports"}`
    return {
      id: u.id,
      name: u.name,
      department: "AM Reporters",
      result: `${actLabel} · ${repLabel}`,
      target: `${REPORTER_TARGET} outputs`,
      pct,
      barValue: Math.min(100, Math.max(0, pct)),
    }
  })

  return [...salesRows, ...reporterRows].sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name))
}

export const departmentScores = (s: Slice, period?: Period) => {
  const range = period ? periodRange(period) : { start: NOW, end: NOW }
  const monthsCount = Math.max(1, range.end - range.start + 1)
  const t = totals(s, range)
  const inRange = (m: number) => m >= range.start && m <= range.end

  const periodReports = (s.reports ?? []).filter((r) => inRange(r.month) && r.department !== "management")
  const periodActivities = (s.activities ?? []).filter((a) => inRange(a.month))
  const done = periodReports.filter((r) => r.status === "reviewed" || r.status === "sent_to_ceo" || r.status === "approved").length

  const salesGoal = TARGET * monthsCount
  const salesScore = salesGoal > 0 ? Math.min(100, Math.round((t.sales / salesGoal) * 100)) : 0

  const reporterOutputs =
    periodReports.filter((r) => r.department === "reporters").length + periodActivities.length
  const reporterGoal = Math.max(1, DEMO_ACCOUNTS.filter((u) => u.role === "reporter").length * 2)
  const reporterScore = Math.min(100, Math.round((reporterOutputs / reporterGoal) * 100))

  const financeScore = t.sales > 0 ? Math.min(100, Math.round((t.collections / t.sales) * 100)) : 0
  const reportsOnTimeScore =
    periodReports.length > 0 ? Math.min(100, Math.round((done / periodReports.length) * 100)) : 0

  return [
    { dept: "Sales", score: salesScore },
    { dept: "AM Reporters", score: reporterScore },
    { dept: "Finance", score: financeScore },
    { dept: "Reports on time", score: reportsOnTimeScore },
  ]
}

export const expenseByCategory = (s: Slice) =>
  EXPENSE_CATEGORIES.map((category) => ({
    category,
    amount: sum(s.expenses.filter((e) => e.category === category && e.month === NOW).map((e) => e.totalAmount ?? e.amount)),
  }))

export function notificationsForUser(
  notifications: NotificationItem[],
  user: UserAccount | null
): NotificationItem[] {
  if (!user) return []
  return notifications.filter((n) => {
    if (n.targetUserId) return n.targetUserId === user.id
    return n.targetRoles.includes(user.role)
  })
}

export const peso = (n: number) => {
  const v = Math.round(safe(n))
  const sign = v < 0 ? "-" : ""
  return `${sign}₱${Math.abs(v).toLocaleString("en-PH")}`
}

export const pesoShort = (n: number) => {
  const v = safe(n)
  const sign = v < 0 ? "-" : ""
  const abs = Math.abs(v)
  if (abs >= 1e6) return `${sign}₱${(abs / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${sign}₱${Math.round(abs / 1e3)}K`
  return `${sign}₱${Math.round(abs)}`
}
