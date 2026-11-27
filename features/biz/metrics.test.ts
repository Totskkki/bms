import { beforeEach, describe, expect, it } from "vitest"

import { can, filterByScope, scopeOf } from "@/lib/rbac"

import {
  ceoSummary,
  comparisonLabel,
  departmentScores,
  employeePerformance,
  monthly,
  peso,
  pesoShort,
  previousPeriodRange,
  totals,
} from "./metrics"
import { DEMO_ACCOUNTS, useBiz } from "./store"

describe("RBAC permissions and scope rules", () => {
  it("enforces permissions and data scope per role", () => {
    expect(can("ceo", "reports:approve")).toBe(true)
    expect(can("ceo", "deals:confirm")).toBe(false)
    expect(can("manager", "tasks:assign")).toBe(true)
    expect(can("manager", "reports:approve")).toBe(false)
    expect(can("sales", "deals:confirm")).toBe(true)
    expect(can("sales", "payments:write")).toBe(false)
    expect(can("reporter", "activities:write")).toBe(true)
    expect(can("reporter", "deals:create")).toBe(false)
    expect(can("finance", "payments:write")).toBe(true)
    expect(can("finance", "reports:consolidate")).toBe(false)

    expect(scopeOf("ceo")).toBe("all")
    expect(scopeOf("manager")).toBe("all")
    expect(scopeOf("sales")).toBe("department")
    expect(scopeOf("reporter")).toBe("own")
    expect(scopeOf("finance")).toBe("department")
  })

  it("filters reporter records to own only, while manager/CEO see all", () => {
    const joy = DEMO_ACCOUNTS.find((a) => a.id === "u-joy")!
    const liza = DEMO_ACCOUNTS.find((a) => a.id === "u-liza")!
    const records = [
      { id: 1, authorId: "u-joy", department: "reporters" as const },
      { id: 2, authorId: "u-ben", department: "reporters" as const },
    ]
    expect(filterByScope(records, joy)).toHaveLength(1)
    expect(filterByScope(records, joy)[0].id).toBe(1)
    expect(filterByScope(records, liza)).toHaveLength(2)
  })

  it("refuses unauthorized store actions", () => {
    useBiz.getState().reset()
    useBiz.getState().loginAs("u-reporter-invalid")
    expect(useBiz.getState().currentUser).toBeNull()

    // Logged in as reporter -> cannot confirm sales, record payments, or approve reports
    useBiz.getState().loginAs("u-joy")
    expect(useBiz.getState().addDeal({ customer: "Test", amount: 50_000, stage: "confirmed" }).ok).toBe(false)
    expect(useBiz.getState().recordPayment(1, 10_000).ok).toBe(false)
    expect(useBiz.getState().approveReport(5).ok).toBe(false)

    // Logged in as CEO (read-only on operations) -> cannot add expenses or confirm sales
    useBiz.getState().loginAs("u-ramon")
    expect(useBiz.getState().addExpense("Marketing", 5_000, "Ad").ok).toBe(false)
    expect(useBiz.getState().advanceDeal(1).ok).toBe(false)
  })
})

describe("Comparison period logic", () => {
  it("uses equal-length previous periods and hides delta when no prior history exists", () => {
    expect(previousPeriodRange("1m")).toEqual({ start: 4, end: 4 })
    expect(previousPeriodRange("3m")).toEqual({ start: 0, end: 2 })
    expect(previousPeriodRange("6m")).toBeNull()
    expect(comparisonLabel("6m")).toBeNull()

    useBiz.getState().reset()
    const m6 = ceoSummary(useBiz.getState(), "6m")
    expect(m6.revenue.delta).toBeNull()
    expect(m6.expenses.delta).toBeNull()
    expect(m6.profit.delta).toBeNull()
    expect(m6.collections.delta).toBeNull()
    expect(m6.receivables.delta).toBeNull()
    // Total Sales always compares this month vs last month
    expect(m6.sales.delta).not.toBeNull()

    const m3 = ceoSummary(useBiz.getState(), "3m")
    expect(m3.revenue.delta).not.toBeNull()
    expect(monthly(useBiz.getState(), "3m")).toHaveLength(3)
  })

  it("handles empty data safely without NaN or division by zero", () => {
    const empty = { deals: [], payments: [], expenses: [], reports: [], activities: [] }
    const t = totals(empty)
    const summary = ceoSummary(empty, "3m")
    const depts = departmentScores(empty, "6m")

    expect(t.revenue).toBe(0)
    expect(t.profitMargin).toBe(0)
    expect(t.collectionRate).toBe(0)
    expect(Number.isNaN(summary.profit.margin)).toBe(false)
    expect(depts.every((d) => Number.isFinite(d.score))).toBe(true)
    expect(peso(Number.NaN)).toBe("₱0")
    expect(pesoShort(-1_250_000)).toBe("-₱1.25M")
    expect(pesoShort(500)).toBe("₱500")
  })
})

describe("Connected data across departments", () => {
  beforeEach(() => {
    useBiz.getState().reset()
  })

  it("updates receivables, collections, expenses, and net profit live across roles", () => {
    const before = ceoSummary(useBiz.getState(), "6m")

    // Sales confirms a proposal
    useBiz.getState().loginAs("u-carlo")
    const proposal = useBiz.getState().deals.find((d) => d.stage === "proposal")!
    expect(useBiz.getState().advanceDeal(proposal.id).ok).toBe(true)
    const afterSale = ceoSummary(useBiz.getState(), "6m")
    expect(afterSale.revenue.value).toBe(before.revenue.value + proposal.amount)
    expect(afterSale.receivables.value).toBe(before.receivables.value + proposal.amount)

    // Finance records payment & expense
    useBiz.getState().loginAs("u-anna")
    expect(useBiz.getState().recordPayment(proposal.id, proposal.amount, "Bank Transfer").ok).toBe(true)
    const afterPay = ceoSummary(useBiz.getState(), "6m")
    expect(afterPay.collections.value).toBe(afterSale.collections.value + proposal.amount)
    expect(afterPay.receivables.value).toBe(afterSale.receivables.value - proposal.amount)

    expect(useBiz.getState().addExpense("Marketing", 40_000, "Radio spot").ok).toBe(true)
    const afterExp = ceoSummary(useBiz.getState(), "6m")
    expect(afterExp.expenses.value).toBe(afterPay.expenses.value + 40_000)
    expect(afterExp.profit.value).toBe(afterPay.profit.value - 40_000)

    // Totals equal sum of rows
    const state = useBiz.getState()
    const sumConfirmed = state.deals.filter((d) => d.stage === "confirmed").reduce((a, b) => a + b.amount, 0)
    const sumPayments = state.payments.reduce((a, b) => a + b.amount, 0)
    const sumExpenses = state.expenses.reduce((a, b) => a + b.amount, 0)
    expect(afterExp.revenue.value).toBe(sumConfirmed)
    expect(afterExp.collections.value).toBe(sumPayments)
    expect(afterExp.expenses.value).toBe(sumExpenses)
  })

  it("sorts employee performance best to worst", () => {
    const rows = employeePerformance(useBiz.getState())
    expect(rows.some((r) => r.department === "Sales")).toBe(true)
    expect(rows.some((r) => r.department === "AM Reporters")).toBe(true)
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].pct).toBeGreaterThanOrEqual(rows[i].pct)
    }
  })
})

describe("Report workflow transitions", () => {
  beforeEach(() => {
    useBiz.getState().reset()
  })

  it("supports full employee -> manager -> CEO workflow and rejects invalid transitions", () => {
    // 1. Reporter submits daily report
    useBiz.getState().loginAs("u-joy")
    const subRes = useBiz.getState().submitReport({
      kind: "daily",
      title: "Tupi market coverage",
      period: "Nov 26, 2026",
      content: "Interviewed 4 vendors and uploaded field photos.",
    })
    expect(subRes.ok).toBe(true)
    const rep = useBiz.getState().reports.find((r) => r.title === "Tupi market coverage")!
    expect(rep.status).toBe("submitted")
    expect(rep.history).toHaveLength(1)

    // CEO cannot approve a report that hasn't been consolidated & sent_to_ceo
    useBiz.getState().loginAs("u-ramon")
    expect(useBiz.getState().approveReport(rep.id).ok).toBe(false)

    // 2. Manager returns with comment -> status becomes returned
    useBiz.getState().loginAs("u-liza")
    expect(useBiz.getState().returnReport(rep.id, "").ok).toBe(false) // comment required
    expect(useBiz.getState().returnReport(rep.id, "Add vendor count").ok).toBe(true)
    const returned = useBiz.getState().reports.find((r) => r.id === rep.id)!
    expect(returned.status).toBe("returned")
    expect(returned.comments).toHaveLength(1)

    // 3. Reporter resubmits -> Manager reviews -> Manager consolidates -> CEO approves
    useBiz.getState().loginAs("u-joy")
    expect(
      useBiz.getState().submitReport({
        id: rep.id,
        kind: "daily",
        title: "Tupi market coverage",
        period: "Nov 26, 2026",
        content: "Interviewed 4 vendors across 12 stalls.",
      }).ok
    ).toBe(true)

    useBiz.getState().loginAs("u-liza")
    expect(useBiz.getState().reviewReport(rep.id).ok).toBe(true)
    expect(
      useBiz.getState().submitConsolidatedReport({
        title: "Consolidated Nov 26",
        period: "Nov 26, 2026",
        content: "Bundled reviewed reports.",
        bundledReportIds: [rep.id],
      }).ok
    ).toBe(true)

    const consolidated = useBiz.getState().reports.find((r) => r.title === "Consolidated Nov 26")!
    expect(consolidated.status).toBe("sent_to_ceo")

    useBiz.getState().loginAs("u-ramon")
    expect(useBiz.getState().approveReport(consolidated.id).ok).toBe(true)
    expect(useBiz.getState().reports.find((r) => r.id === consolidated.id)?.status).toBe("approved")
    expect(useBiz.getState().reports.find((r) => r.id === rep.id)?.status).toBe("approved")
    expect(useBiz.getState().reports.find((r) => r.id === rep.id)!.history.length).toBeGreaterThanOrEqual(5)
  })
})
