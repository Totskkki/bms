import { beforeEach, describe, expect, it } from "vitest"

import { can } from "@/lib/rbac"
import { useBiz } from "../../store"
import {
  canTransitionRun,
  computeEmployeePayslip,
  computeProrationFactor,
  fromCents,
  summarizeByDepartment,
  summarizeRun,
  toCents,
  type EmployeePayroll,
  type LoanRecord,
  type PayPeriod,
  type PayrollSettings,
  type TimeInput,
} from "./engine"
import { usePayroll } from "./store"

const CUSTOM_SETTINGS: PayrollSettings = {
  workingDaysFactor: 26,
  overtimeMultiplier: 1.25,
  restDayOvertimeMultiplier: 1.3,
  regularHolidayMultiplier: 2.0,
  nightDiffRate: 0.1,
  deductContributions: "second-half",
  taxMode: "monthly",
  sss: { name: "SSS", employeeRate: 0.05, employerRate: 0.1, minSalaryCredit: 5_000, maxSalaryCredit: 20_000 },
  philHealth: { name: "PhilHealth", employeeRate: 0.02, employerRate: 0.02, minSalaryCredit: 10_000, maxSalaryCredit: 50_000 },
  pagIbig: { name: "Pag-IBIG", employeeRate: 0.02, employerRate: 0.02, minSalaryCredit: 1_000, maxSalaryCredit: 5_000 },
  taxBrackets: [
    { minMonthly: 0, maxMonthly: 20_000, baseTax: 0, rateOnExcess: 0 },
    { minMonthly: 20_000, maxMonthly: null, baseTax: 0, rateOnExcess: 0.1 },
  ],
}

const SAMPLE_EMP: EmployeePayroll = {
  id: "ep-test",
  orgId: "org-1",
  employeeId: "u-test",
  name: "Test Employee",
  department: "Finance",
  position: "Analyst",
  employmentStatus: "regular",
  dateHired: "2024-01-01",
  monthlyBasic: 26_000, // daily = 1,000, hourly = 125
  monthlyAllowance: 2_000, // semi-monthly = 1,000
  payFrequency: "semi-monthly",
  status: "active",
  sssMasked: "••••-0001",
  philHealthMasked: "••••-0002",
  pagIbigMasked: "••••-0003",
  tinMasked: "••••-0004",
}

const PERIOD_SECOND_HALF: PayPeriod = {
  id: "p-test-2",
  orgId: "org-1",
  label: "Nov 16–30, 2026",
  start: "2026-11-16",
  end: "2026-11-30",
  payDate: "2026-11-30",
  type: "second-half",
  monthIndex: 5,
}

const FULL_TIME: TimeInput = {
  employeeId: "u-test",
  daysWorked: 13,
  daysAbsent: 0,
  lateMinutes: 0,
  overtimeHours: 0,
  restDayOvertimeHours: 0,
  holidayDaysWorked: 0,
  nightDiffHours: 0,
}

describe("Payroll computation engine (pure TypeScript)", () => {
  it("computes semi-monthly basic pay, overtime (125%), rest-day OT (130%), holiday (200%), and night diff (10%)", () => {
    const slip = computeEmployeePayslip({
      runId: "r-1",
      employee: SAMPLE_EMP,
      period: { ...PERIOD_SECOND_HALF, type: "first-half" }, // no gov contrib on first-half
      timeInput: {
        ...FULL_TIME,
        overtimeHours: 4, // 125 * 1.25 * 4 = 625
        restDayOvertimeHours: 2, // 125 * 1.3 * 2 = 325
        holidayDaysWorked: 1, // daily 1000 * (2.0 - 1) = 1000
        nightDiffHours: 8, // 125 * 0.1 * 8 = 100
      },
      adjustments: [],
      activeLoans: [],
      settings: CUSTOM_SETTINGS,
    })

    expect(slip.basicPay).toBe(13_000)
    expect(slip.allowance).toBe(1_000)
    expect(slip.overtimePay).toBe(625)
    expect(slip.restDayOvertimePay).toBe(325)
    expect(slip.holidayPay).toBe(1_000)
    expect(slip.nightDiffPay).toBe(100)
    expect(slip.totalEarnings).toBe(16_050)
    // First-half with "second-half" schedule => 0 mandatory gov contributions
    expect(slip.sssEmployee).toBe(0)
    expect(slip.philHealthEmployee).toBe(0)
    expect(slip.pagIbigEmployee).toBe(0)
  })

  it("computes absence and late deductions and prorates mid-period hires", () => {
    const factor = computeProrationFactor(PERIOD_SECOND_HALF, "2026-11-23") // 8 of 15 days
    expect(factor).toBeCloseTo(8 / 15, 4)

    const slip = computeEmployeePayslip({
      runId: "r-2",
      employee: { ...SAMPLE_EMP, dateHired: "2026-11-23" },
      period: { ...PERIOD_SECOND_HALF, type: "first-half" },
      timeInput: { ...FULL_TIME, daysWorked: 6, daysAbsent: 1, lateMinutes: 60 },
      adjustments: [],
      activeLoans: [],
      settings: CUSTOM_SETTINGS,
    })

    expect(slip.absenceDeduction).toBe(1_000) // 1 day * 1000
    expect(slip.lateDeduction).toBe(125) // 60 mins = 1 hour * 125
    expect(slip.flags.some((f) => f.code === "prorated")).toBe(true)
    expect(slip.basicPay).toBe(fromCents(Math.round((26_000 / 2) * (8 / 15) * 100)))
  })

  it("computes contributions and withholding tax from custom configurable tables", () => {
    const slip = computeEmployeePayslip({
      runId: "r-3",
      employee: SAMPLE_EMP,
      period: PERIOD_SECOND_HALF,
      timeInput: FULL_TIME,
      adjustments: [],
      activeLoans: [],
      settings: CUSTOM_SETTINGS,
    })

    // SSS credit capped at 20,000 -> EE 5% = 1,000, ER 10% = 2,000
    expect(slip.sssEmployee).toBe(1_000)
    expect(slip.sssEmployer).toBe(2_000)
    // PhilHealth on 26,000 -> EE 2% = 520, ER 2% = 520
    expect(slip.philHealthEmployee).toBe(520)
    expect(slip.philHealthEmployer).toBe(520)
    // Pag-IBIG capped at 5,000 -> EE 2% = 100, ER 2% = 100
    expect(slip.pagIbigEmployee).toBe(100)
    expect(slip.pagIbigEmployer).toBe(100)
    expect(slip.totalEmployerShares).toBe(2_620)

    // Taxable = 13,000 - (1,000 + 520 + 100) = 11,380; half-month bracket threshold = 10,000 -> 10% of 1,380 = 138
    expect(slip.withholdingTax).toBe(138)
  })

  it("never produces negative net pay and carries over unpaid loan amounts with a warning flag", () => {
    const hugeLoan: LoanRecord = {
      id: "loan-huge",
      orgId: "org-1",
      employeeId: "u-test",
      employeeName: "Test Employee",
      kind: "company_loan",
      principal: 50_000,
      remainingBalance: 50_000,
      monthlyAmortization: 40_000, // semi-monthly scheduled = 20,000 (> net earnings)
      startDate: "2026-11-01",
      status: "active",
      note: "Test loan",
      history: [],
    }

    const slip = computeEmployeePayslip({
      runId: "r-4",
      employee: SAMPLE_EMP,
      period: PERIOD_SECOND_HALF,
      timeInput: FULL_TIME,
      adjustments: [],
      activeLoans: [hugeLoan],
      settings: CUSTOM_SETTINGS,
    })

    expect(slip.netPay).toBe(0)
    expect(slip.loanCarryOver).toBeGreaterThan(0)
    expect(slip.flags.some((f) => f.code === "negative_net_carryover")).toBe(true)
    expect(toCents(slip.loanDeductions) + toCents(slip.loanCarryOver)).toBe(toCents(20_000))
  })

  it("rounds to centavos and run totals equal exact sum of payslip lines", () => {
    const s1 = computeEmployeePayslip({
      runId: "r-5",
      employee: { ...SAMPLE_EMP, monthlyBasic: 25_333.33 },
      period: PERIOD_SECOND_HALF,
      timeInput: { ...FULL_TIME, overtimeHours: 1.5 },
      adjustments: [],
      activeLoans: [],
      settings: CUSTOM_SETTINGS,
    })
    const s2 = computeEmployeePayslip({
      runId: "r-5",
      employee: { ...SAMPLE_EMP, employeeId: "u-test-2", monthlyBasic: 31_777.77 },
      period: PERIOD_SECOND_HALF,
      timeInput: { ...FULL_TIME, lateMinutes: 17 },
      adjustments: [],
      activeLoans: [],
      settings: CUSTOM_SETTINGS,
    })
    const totals = summarizeRun([s1, s2])
    expect(toCents(totals.grossPay)).toBe(toCents(s1.totalEarnings) + toCents(s2.totalEarnings))
    expect(toCents(totals.totalDeductions)).toBe(toCents(s1.totalDeductions) + toCents(s2.totalDeductions))
    expect(toCents(totals.netPay)).toBe(toCents(s1.netPay) + toCents(s2.netPay))
    expect(toCents(totals.employerContributions)).toBe(toCents(s1.totalEmployerShares) + toCents(s2.totalEmployerShares))

    const deptSummary = summarizeByDepartment([s1, s2])
    expect(deptSummary).toHaveLength(1)
    expect(deptSummary[0].netPay).toBe(totals.netPay)
  })
})

describe("Payroll workflow transitions, RBAC, and connected release", () => {
  beforeEach(() => {
    useBiz.getState().reset()
    usePayroll.getState().resetDemo()
  })

  it("validates allowed and disallowed status transitions", () => {
    expect(canTransitionRun("draft", "computed")).toBe(true)
    expect(canTransitionRun("draft", "released")).toBe(false)
    expect(canTransitionRun("computed", "submitted")).toBe(true)
    expect(canTransitionRun("submitted", "ceo_approved")).toBe(false)
    expect(canTransitionRun("submitted", "manager_reviewed")).toBe(true)
    expect(canTransitionRun("manager_reviewed", "ceo_approved")).toBe(true)
    expect(canTransitionRun("ceo_approved", "released")).toBe(true)
    expect(canTransitionRun("released", "draft")).toBe(false)
  })

  it("enforces RBAC permissions and runs the full Finance -> Manager -> CEO -> Release connected flow", () => {
    expect(can("finance", "payroll:manage")).toBe(true)
    expect(can("manager", "payroll:review")).toBe(true)
    expect(can("manager", "payroll:manage")).toBe(false)
    expect(can("ceo", "payroll:approve")).toBe(true)
    expect(can("sales", "payroll:manage")).toBe(false)
    expect(can("reporter", "payroll:read-own")).toBe(true)

    const draftRun = usePayroll.getState().runs.find((r) => r.status === "draft")!
    expect(draftRun).toBeDefined()

    // Sales cannot compute or submit payroll
    useBiz.getState().loginAs("u-carlo")
    expect(usePayroll.getState().computeRun(draftRun.id).ok).toBe(false)

    // Finance computes and submits
    useBiz.getState().loginAs("u-anna")
    expect(usePayroll.getState().computeRun(draftRun.id).ok).toBe(true)
    expect(usePayroll.getState().submitRun(draftRun.id).ok).toBe(true)
    expect(usePayroll.getState().runs.find((r) => r.id === draftRun.id)?.status).toBe("submitted")

    // CEO cannot approve before Manager reviews
    useBiz.getState().loginAs("u-ramon")
    expect(usePayroll.getState().ceoApproveRun(draftRun.id).ok).toBe(false)

    // Manager returns with comment -> back to draft
    useBiz.getState().loginAs("u-liza")
    expect(usePayroll.getState().returnRun(draftRun.id, "Check OT hours").ok).toBe(true)
    expect(usePayroll.getState().runs.find((r) => r.id === draftRun.id)?.status).toBe("draft")

    // Finance recomputes & resubmits -> Manager reviews -> CEO approves -> Finance releases
    useBiz.getState().loginAs("u-anna")
    expect(usePayroll.getState().computeRun(draftRun.id).ok).toBe(true)
    expect(usePayroll.getState().submitRun(draftRun.id).ok).toBe(true)

    useBiz.getState().loginAs("u-liza")
    expect(usePayroll.getState().managerReviewRun(draftRun.id).ok).toBe(true)

    useBiz.getState().loginAs("u-ramon")
    expect(usePayroll.getState().ceoApproveRun(draftRun.id).ok).toBe(true)

    const expensesBefore = useBiz.getState().expenses.length
    const carloLoanBefore = usePayroll.getState().loans.find((l) => l.employeeId === "u-carlo")!.remainingBalance

    useBiz.getState().loginAs("u-anna")
    expect(usePayroll.getState().releaseRun(draftRun.id).ok).toBe(true)

    const released = usePayroll.getState().runs.find((r) => r.id === draftRun.id)!
    expect(released.status).toBe("released")
    expect(released.payslips.every((s) => s.status === "released")).toBe(true)
    // 2 Salary expenses added (Gross + Employer shares)
    expect(useBiz.getState().expenses.length).toBe(expensesBefore + 2)
    // Carlo's active loan balance reduced automatically
    const carloLoanAfter = usePayroll.getState().loans.find((l) => l.employeeId === "u-carlo")!.remainingBalance
    expect(carloLoanAfter).toBeLessThan(carloLoanBefore)
  })
})
