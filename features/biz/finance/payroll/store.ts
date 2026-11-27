import { create } from "zustand"

import { can, type Permission, type Role, type UserAccount } from "@/lib/rbac"
import { DEMO_ACCOUNTS, ORG_ID, useBiz, type ActionResult, type AuditLog, type NotificationItem } from "../../store"
import {
  canTransitionRun,
  computeEmployeePayslip,
  DEFAULT_PAYROLL_SETTINGS,
  fromCents,
  summarizeRun,
  toCents,
  type EmployeePayroll,
  type LoanRecord,
  type PayPeriod,
  type PayrollAdjustment,
  type PayrollDepartment,
  type PayrollRun,
  type PayrollSettings,
  type Payslip,
  type TimeInput,
} from "./engine"

const fmtPeso = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function pushBizAudit(actor: UserAccount, action: string, target: string, detail: string) {
  useBiz.setState((s) => ({
    auditLogs: [
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        orgId: ORG_ID,
        actorName: actor.name,
        actorRole: actor.role,
        action,
        target,
        detail,
        at: "Just now",
      } satisfies AuditLog,
      ...s.auditLogs,
    ].slice(0, 80),
  }))
}

function pushBizNotif(entry: Omit<NotificationItem, "id" | "orgId" | "at" | "readBy">) {
  useBiz.setState((s) => ({
    notifications: [
      {
        id: `n-pr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        orgId: ORG_ID,
        at: "Just now",
        readBy: [],
        ...entry,
      },
      ...s.notifications,
    ].slice(0, 50),
  }))
}

function rolePayslipsHref(role: Role): string {
  if (role === "reporter") return "/reporters/my-payslips"
  return `/${role}/my-payslips`
}

function buildPeriods(): PayPeriod[] {
  const specs: [string, string, string, string, string, "first-half" | "second-half", number][] = [
    ["p-jun-1", "Jun 1–15, 2026", "2026-06-01", "2026-06-15", "2026-06-15", "first-half", 0],
    ["p-jun-2", "Jun 16–30, 2026", "2026-06-16", "2026-06-30", "2026-06-30", "second-half", 0],
    ["p-jul-1", "Jul 1–15, 2026", "2026-07-01", "2026-07-15", "2026-07-15", "first-half", 1],
    ["p-jul-2", "Jul 16–31, 2026", "2026-07-16", "2026-07-31", "2026-07-31", "second-half", 1],
    ["p-aug-1", "Aug 1–15, 2026", "2026-08-01", "2026-08-15", "2026-08-15", "first-half", 2],
    ["p-aug-2", "Aug 16–31, 2026", "2026-08-16", "2026-08-31", "2026-08-31", "second-half", 2],
    ["p-sep-1", "Sep 1–15, 2026", "2026-09-01", "2026-09-15", "2026-09-15", "first-half", 3],
    ["p-sep-2", "Sep 16–30, 2026", "2026-09-16", "2026-09-30", "2026-09-30", "second-half", 3],
    ["p-oct-1", "Oct 1–15, 2026", "2026-10-01", "2026-10-15", "2026-10-15", "first-half", 4],
    ["p-oct-2", "Oct 16–31, 2026", "2026-10-16", "2026-10-31", "2026-10-31", "second-half", 4],
    ["p-nov-1", "Nov 1–15, 2026", "2026-11-01", "2026-11-15", "2026-11-15", "first-half", 5],
    ["p-nov-2", "Nov 16–30, 2026", "2026-11-16", "2026-11-30", "2026-11-30", "second-half", 5],
  ]
  return specs.map(([id, label, start, end, payDate, type, monthIndex]) => ({
    id,
    orgId: ORG_ID,
    label,
    start,
    end,
    payDate,
    type,
    monthIndex,
  }))
}

function buildEmployees(): EmployeePayroll[] {
  const base: Omit<EmployeePayroll, "orgId">[] = [
    { id: "ep-1", employeeId: "u-ramon", name: "Ramon Dela Cruz", department: "Management", position: "Chief Executive Officer", employmentStatus: "regular", dateHired: "2022-01-10", monthlyBasic: 85_000, monthlyAllowance: 10_000, payFrequency: "semi-monthly", status: "active", sssMasked: "••••-1001", philHealthMasked: "••••-2001", pagIbigMasked: "••••-3001", tinMasked: "••••-4001" },
    { id: "ep-2", employeeId: "u-liza", name: "Liza Santos", department: "Management", position: "Operations Manager", employmentStatus: "regular", dateHired: "2022-06-01", monthlyBasic: 48_000, monthlyAllowance: 5_000, payFrequency: "semi-monthly", status: "active", sssMasked: "••••-1002", philHealthMasked: "••••-2002", pagIbigMasked: "••••-3002", tinMasked: "••••-4002" },
    { id: "ep-3", employeeId: "u-carlo", name: "Carlo Reyes", department: "Sales and Marketing", position: "Senior Sales Executive", employmentStatus: "regular", dateHired: "2023-02-15", monthlyBasic: 32_000, monthlyAllowance: 3_500, payFrequency: "semi-monthly", status: "active", sssMasked: "••••-1003", philHealthMasked: "••••-2003", pagIbigMasked: "••••-3003", tinMasked: "••••-4003" },
    { id: "ep-4", employeeId: "u-mika", name: "Mika Ong", department: "Sales and Marketing", position: "Account Executive", employmentStatus: "regular", dateHired: "2023-08-01", monthlyBasic: 28_000, monthlyAllowance: 3_000, payFrequency: "semi-monthly", status: "active", sssMasked: "••••-1004", philHealthMasked: "••••-2004", pagIbigMasked: "••••-3004", tinMasked: "••••-4004" },
    { id: "ep-5", employeeId: "u-joy", name: "Joy Mendoza", department: "AM Reporters", position: "Field AM Reporter", employmentStatus: "regular", dateHired: "2023-05-12", monthlyBasic: 24_000, monthlyAllowance: 2_500, payFrequency: "semi-monthly", status: "active", sssMasked: "••••-1005", philHealthMasked: "••••-2005", pagIbigMasked: "••••-3005", tinMasked: "••••-4005" },
    { id: "ep-6", employeeId: "u-ben", name: "Ben Aquino", department: "AM Reporters", position: "Field AM Reporter", employmentStatus: "regular", dateHired: "2024-01-08", monthlyBasic: 23_000, monthlyAllowance: 2_500, payFrequency: "semi-monthly", status: "active", sssMasked: "••••-1006", philHealthMasked: "••••-2006", pagIbigMasked: "••••-3006", tinMasked: "••••-4006" },
    { id: "ep-7", employeeId: "u-nina", name: "Nina Cruz", department: "AM Reporters", position: "Field AM Reporter", employmentStatus: "probationary", dateHired: "2026-08-15", monthlyBasic: 22_000, monthlyAllowance: 2_000, payFrequency: "semi-monthly", status: "active", sssMasked: "••••-1007", philHealthMasked: "••••-2007", pagIbigMasked: "••••-3007", tinMasked: "••••-4007" },
    { id: "ep-8", employeeId: "u-anna", name: "Anna Villanueva", department: "Finance", position: "Finance Officer", employmentStatus: "regular", dateHired: "2022-09-01", monthlyBasic: 38_000, monthlyAllowance: 4_000, payFrequency: "semi-monthly", status: "active", sssMasked: "••••-1008", philHealthMasked: "••••-2008", pagIbigMasked: "••••-3008", tinMasked: "••••-4008" },
    { id: "ep-9", employeeId: "u-paolo", name: "Paolo Diaz", department: "Finance", position: "Accounting Specialist", employmentStatus: "regular", dateHired: "2024-03-18", monthlyBasic: 27_000, monthlyAllowance: 2_500, payFrequency: "semi-monthly", status: "active", sssMasked: "••••-1009", philHealthMasked: "••••-2009", pagIbigMasked: "••••-3009", tinMasked: "••••-4009" },
    { id: "ep-10", employeeId: "u-rico", name: "Rico Mendoza", department: "Sales and Marketing", position: "Digital Marketing Associate", employmentStatus: "probationary", dateHired: "2026-07-01", monthlyBasic: 24_500, monthlyAllowance: 2_000, payFrequency: "semi-monthly", status: "active", sssMasked: "••••-1010", philHealthMasked: "••••-2010", pagIbigMasked: "••••-3010", tinMasked: "••••-4010" },
    { id: "ep-11", employeeId: "u-lea", name: "Lea Villanueva", department: "AM Reporters", position: "Broadcast Producer", employmentStatus: "regular", dateHired: "2023-11-04", monthlyBasic: 26_500, monthlyAllowance: 2_500, payFrequency: "semi-monthly", status: "active", sssMasked: "••••-1011", philHealthMasked: "••••-2011", pagIbigMasked: "••••-3011", tinMasked: "••••-4011" },
    { id: "ep-12", employeeId: "u-mark", name: "Mark Bautista", department: "Finance", position: "Billing & Collections Clerk", employmentStatus: "contractual", dateHired: "2026-11-18", monthlyBasic: 21_000, monthlyAllowance: 1_500, payFrequency: "semi-monthly", status: "active", sssMasked: "••••-1012", philHealthMasked: "••••-2012", pagIbigMasked: "••••-3012", tinMasked: "••••-4012" },
  ]
  return base.map((e) => ({ ...e, orgId: ORG_ID }))
}

function buildLoans(): LoanRecord[] {
  return [
    {
      id: "loan-1",
      orgId: ORG_ID,
      employeeId: "u-carlo",
      employeeName: "Carlo Reyes",
      kind: "company_loan",
      principal: 24_000,
      remainingBalance: 15_000,
      monthlyAmortization: 3_000,
      startDate: "2026-08-01",
      status: "active",
      note: "Laptop & field gear loan",
      history: [
        { date: "2026-08-31", runId: "run-p-aug-2", amount: 3_000, remainingAfter: 21_000, note: "Payroll deduction" },
        { date: "2026-09-30", runId: "run-p-sep-2", amount: 3_000, remainingAfter: 18_000, note: "Payroll deduction" },
        { date: "2026-10-31", runId: "run-p-oct-2", amount: 3_000, remainingAfter: 15_000, note: "Payroll deduction" },
      ],
    },
    {
      id: "loan-2",
      orgId: ORG_ID,
      employeeId: "u-joy",
      employeeName: "Joy Mendoza",
      kind: "cash_advance",
      principal: 8_000,
      remainingBalance: 6_000,
      monthlyAmortization: 2_000,
      startDate: "2026-10-15",
      status: "active",
      note: "Emergency medical cash advance",
      history: [
        { date: "2026-10-31", runId: "run-p-oct-2", amount: 2_000, remainingAfter: 6_000, note: "Payroll deduction" },
      ],
    },
  ]
}

function defaultTimeInputsFor(employees: EmployeePayroll[], period: PayPeriod): Record<string, TimeInput> {
  const attendance = useBiz.getState().attendance
  const baseDays = period.type === "monthly" ? 26 : 13
  const map: Record<string, TimeInput> = {}
  for (const emp of employees) {
    if (emp.status !== "active") continue
    if (emp.department === "AM Reporters") {
      // Pre-fill from Attendance records in store when present
      const recs = attendance.filter((a) => a.authorId === emp.employeeId && a.month === period.monthIndex)
      map[emp.employeeId] = {
        employeeId: emp.employeeId,
        daysWorked: recs.length > 0 ? Math.min(baseDays, Math.max(baseDays - 1, recs.length + 11)) : baseDays,
        daysAbsent: 0,
        lateMinutes: recs.some((r) => r.timeIn.startsWith("08:")) ? 15 : 0,
        overtimeHours: emp.employeeId === "u-joy" ? 4 : 2,
        restDayOvertimeHours: 0,
        holidayDaysWorked: 0,
        nightDiffHours: emp.employeeId === "u-lea" ? 3 : 0,
      }
    } else {
      map[emp.employeeId] = {
        employeeId: emp.employeeId,
        daysWorked: baseDays,
        daysAbsent: 0,
        lateMinutes: 0,
        overtimeHours: emp.department === "Sales and Marketing" ? 2 : 0,
        restDayOvertimeHours: 0,
        holidayDaysWorked: 0,
        nightDiffHours: 0,
      }
    }
  }
  return map
}

function buildPayrollSeed() {
  const settings: PayrollSettings = {
    ...DEFAULT_PAYROLL_SETTINGS,
    sss: { ...DEFAULT_PAYROLL_SETTINGS.sss },
    philHealth: { ...DEFAULT_PAYROLL_SETTINGS.philHealth },
    pagIbig: { ...DEFAULT_PAYROLL_SETTINGS.pagIbig },
    taxBrackets: DEFAULT_PAYROLL_SETTINGS.taxBrackets.map((b) => ({ ...b })),
  }
  const employees = buildEmployees()
  const periods = buildPeriods()
  const loans = buildLoans()
  const runs: PayrollRun[] = []

  const ytd = new Map<string, { gross: number; deductions: number; net: number; basic: number }>()

  // Generate 11 released runs (Jun 1–15 through Nov 1–15) + 1 draft run (Nov 16–30)
  for (let i = 0; i < periods.length; i++) {
    const period = periods[i]
    const isDraft = i === periods.length - 1
    const runId = `run-${period.id}`
    const activeAtPeriod = employees.filter((e) => e.status === "active" && e.dateHired <= period.end)
    const timeInputs = defaultTimeInputsFor(activeAtPeriod, period)
    const adjustments: PayrollAdjustment[] = []

    const payslips: Payslip[] = activeAtPeriod.map((emp) => {
      const prior = ytd.get(emp.employeeId) ?? { gross: 0, deductions: 0, net: 0, basic: 0 }
      const empLoans = isDraft ? loans.filter((l) => l.employeeId === emp.employeeId && l.status === "active") : []
      const slip = computeEmployeePayslip({
        runId,
        employee: emp,
        period,
        timeInput: timeInputs[emp.employeeId],
        adjustments: adjustments.filter((a) => a.employeeId === emp.employeeId),
        activeLoans: empLoans,
        settings,
        priorYtd: prior,
      })
      if (!isDraft) {
        slip.status = "released"
        ytd.set(emp.employeeId, {
          gross: slip.ytdGross,
          deductions: slip.ytdDeductions,
          net: slip.ytdNet,
          basic: slip.ytdBasic,
        })
      }
      return slip
    })

    runs.push({
      id: runId,
      orgId: ORG_ID,
      periodId: period.id,
      periodLabel: period.label,
      payDate: period.payDate,
      monthIndex: period.monthIndex,
      status: isDraft ? "draft" : "released",
      createdBy: "Anna Villanueva",
      timeInputs,
      adjustments,
      payslips: isDraft ? [] : payslips,
      totals: isDraft
        ? { headcount: activeAtPeriod.length, grossPay: 0, totalDeductions: 0, netPay: 0, employerContributions: 0, totalCost: 0 }
        : summarizeRun(payslips),
      history: isDraft
        ? [{ by: "Anna Villanueva", role: "finance", action: "Created draft payroll run", at: "Today" }]
        : [
            { by: "Anna Villanueva", role: "finance", action: "Submitted payroll run", at: period.payDate },
            { by: "Liza Santos", role: "manager", action: "Reviewed department totals", at: period.payDate },
            { by: "Ramon Dela Cruz", role: "ceo", action: "Approved payroll run", at: period.payDate },
            { by: "Anna Villanueva", role: "finance", action: "Released payroll and issued payslips", at: period.payDate },
          ],
    })
  }

  return {
    settings,
    employees,
    periods,
    loans,
    runs: runs.reverse(), // newest first
  }
}

type PayrollSeed = ReturnType<typeof buildPayrollSeed>

export interface PayrollState extends PayrollSeed {
  // Employees
  addEmployee: (input: Omit<EmployeePayroll, "id" | "orgId" | "employeeId">) => ActionResult
  updateEmployee: (id: string, patch: Partial<Omit<EmployeePayroll, "id" | "orgId" | "employeeId">>) => ActionResult
  toggleEmployeeStatus: (id: string) => ActionResult

  // Runs & Wizard
  createRun: (periodId: string) => { ok: true; runId: string } | { ok: false; error: string }
  updateTimeInput: (runId: string, employeeId: string, patch: Partial<TimeInput>) => ActionResult
  addAdjustment: (runId: string, adj: Omit<PayrollAdjustment, "id">) => ActionResult
  removeAdjustment: (runId: string, adjId: string) => ActionResult
  computeRun: (runId: string) => ActionResult
  submitRun: (runId: string) => ActionResult
  managerReviewRun: (runId: string) => ActionResult
  ceoApproveRun: (runId: string) => ActionResult
  returnRun: (runId: string, comment: string) => ActionResult
  releaseRun: (runId: string) => ActionResult

  // Loans
  addLoan: (input: {
    employeeId: string
    kind: LoanRecord["kind"]
    principal: number
    monthlyAmortization: number
    startDate: string
    note: string
  }) => ActionResult

  // Settings
  updateSettings: (patch: Partial<PayrollSettings>) => ActionResult

  // Helpers & Reset
  resetDemo: () => void
}

function computePriorYtd(runs: PayrollRun[], employeeId: string, excludeRunId: string) {
  let grossC = 0
  let dedC = 0
  let netC = 0
  let basicC = 0
  for (const r of runs) {
    if (r.id === excludeRunId || r.status !== "released") continue
    const slip = r.payslips.find((p) => p.employeeId === employeeId)
    if (!slip) continue
    grossC += toCents(slip.totalEarnings)
    dedC += toCents(slip.totalDeductions)
    netC += toCents(slip.netPay)
    basicC += toCents(slip.basicPay)
  }
  return {
    gross: fromCents(grossC),
    deductions: fromCents(dedC),
    net: fromCents(netC),
    basic: fromCents(basicC),
  }
}

export const usePayroll = create<PayrollState>((set, get) => {
  const guard = (permission: Permission): UserAccount | null => {
    const user = useBiz.getState().currentUser
    if (!user || !can(user.role, permission)) return null
    return user
  }

  return {
    ...buildPayrollSeed(),

    addEmployee: (input) => {
      const user = guard("payroll:manage")
      if (!user) return { ok: false, error: "Only Finance can manage payroll employees." }
      const id = `ep-${Date.now()}`
      const employeeId = `u-emp-${Date.now()}`
      set((s) => ({
        employees: [{ ...input, id, orgId: ORG_ID, employeeId }, ...s.employees],
      }))
      pushBizAudit(user, "Payroll employee added", input.name, `${input.department} · ${fmtPeso(input.monthlyBasic)}/mo`)
      return { ok: true }
    },

    updateEmployee: (id, patch) => {
      const user = guard("payroll:manage")
      if (!user) return { ok: false, error: "Only Finance can edit employee payroll profiles." }
      const prev = get().employees.find((e) => e.id === id)
      if (!prev) return { ok: false, error: "Employee profile not found." }
      set((s) => ({
        employees: s.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }))
      if (patch.monthlyBasic !== undefined && patch.monthlyBasic !== prev.monthlyBasic) {
        pushBizAudit(
          user,
          "Employee salary edited",
          prev.name,
          `${fmtPeso(prev.monthlyBasic)} → ${fmtPeso(patch.monthlyBasic)}`
        )
      }
      return { ok: true }
    },

    toggleEmployeeStatus: (id) => {
      const user = guard("payroll:manage")
      if (!user) return { ok: false, error: "Only Finance can change employee status." }
      const prev = get().employees.find((e) => e.id === id)
      if (!prev) return { ok: false, error: "Employee not found." }
      const nextStatus = prev.status === "active" ? "inactive" : "active"
      set((s) => ({
        employees: s.employees.map((e) => (e.id === id ? { ...e, status: nextStatus } : e)),
      }))
      pushBizAudit(user, "Employee status updated", prev.name, `Set to ${nextStatus}`)
      return { ok: true }
    },

    createRun: (periodId) => {
      const user = guard("payroll:manage")
      if (!user) return { ok: false, error: "Only Finance can create payroll runs." }
      const period = get().periods.find((p) => p.id === periodId)
      if (!period) return { ok: false, error: "Pay period not found." }
      const existing = get().runs.find((r) => r.periodId === periodId)
      if (existing) return { ok: true, runId: existing.id }

      const active = get().employees.filter((e) => e.status === "active" && e.dateHired <= period.end)
      const runId = `run-${period.id}-${Date.now()}`
      const newRun: PayrollRun = {
        id: runId,
        orgId: ORG_ID,
        periodId: period.id,
        periodLabel: period.label,
        payDate: period.payDate,
        monthIndex: period.monthIndex,
        status: "draft",
        createdBy: user.name,
        timeInputs: defaultTimeInputsFor(active, period),
        adjustments: [],
        payslips: [],
        totals: { headcount: active.length, grossPay: 0, totalDeductions: 0, netPay: 0, employerContributions: 0, totalCost: 0 },
        history: [{ by: user.name, role: user.role, action: "Created draft payroll run", at: "Just now" }],
      }
      set((s) => ({ runs: [newRun, ...s.runs] }))
      pushBizAudit(user, "Payroll run created", period.label, `${active.length} active employees`)
      return { ok: true, runId }
    },

    updateTimeInput: (runId, employeeId, patch) => {
      const user = guard("payroll:manage")
      if (!user) return { ok: false, error: "Only Finance can edit time inputs." }
      const run = get().runs.find((r) => r.id === runId)
      if (!run) return { ok: false, error: "Payroll run not found." }
      if (run.status !== "draft" && run.status !== "computed") {
        return { ok: false, error: "Time inputs can only be edited while in draft or computed status." }
      }
      set((s) => ({
        runs: s.runs.map((r) => {
          if (r.id !== runId) return r
          const cur = r.timeInputs[employeeId] ?? {
            employeeId,
            daysWorked: 13,
            daysAbsent: 0,
            lateMinutes: 0,
            overtimeHours: 0,
            restDayOvertimeHours: 0,
            holidayDaysWorked: 0,
            nightDiffHours: 0,
          }
          return {
            ...r,
            status: "draft",
            timeInputs: { ...r.timeInputs, [employeeId]: { ...cur, ...patch } },
          }
        }),
      }))
      return { ok: true }
    },

    addAdjustment: (runId, adj) => {
      const user = guard("payroll:manage")
      if (!user) return { ok: false, error: "Only Finance can add payroll adjustments." }
      const run = get().runs.find((r) => r.id === runId)
      if (!run || (run.status !== "draft" && run.status !== "computed")) {
        return { ok: false, error: "Adjustments can only be added while run is in draft." }
      }
      set((s) => ({
        runs: s.runs.map((r) =>
          r.id === runId
            ? { ...r, status: "draft", adjustments: [...r.adjustments, { ...adj, id: `adj-${Date.now()}` }] }
            : r
        ),
      }))
      return { ok: true }
    },

    removeAdjustment: (runId, adjId) => {
      const user = guard("payroll:manage")
      if (!user) return { ok: false, error: "Only Finance can remove payroll adjustments." }
      set((s) => ({
        runs: s.runs.map((r) =>
          r.id === runId
            ? { ...r, status: "draft", adjustments: r.adjustments.filter((a) => a.id !== adjId) }
            : r
        ),
      }))
      return { ok: true }
    },

    computeRun: (runId) => {
      const user = guard("payroll:manage")
      if (!user) return { ok: false, error: "Only Finance can compute payroll." }
      const state = get()
      const run = state.runs.find((r) => r.id === runId)
      if (!run) return { ok: false, error: "Payroll run not found." }
      if (!canTransitionRun(run.status, "computed")) {
        return { ok: false, error: `Cannot compute run in "${run.status}" status.` }
      }
      const period = state.periods.find((p) => p.id === run.periodId)
      if (!period) return { ok: false, error: "Pay period not found." }

      const active = state.employees.filter((e) => e.status === "active" && e.dateHired <= period.end)
      const payslips = active.map((emp) => {
        const ti = run.timeInputs[emp.employeeId] ?? {
          employeeId: emp.employeeId,
          daysWorked: period.type === "monthly" ? 26 : 13,
          daysAbsent: 0,
          lateMinutes: 0,
          overtimeHours: 0,
          restDayOvertimeHours: 0,
          holidayDaysWorked: 0,
          nightDiffHours: 0,
        }
        const empAdj = run.adjustments.filter((a) => a.employeeId === emp.employeeId)
        const empLoans = state.loans.filter((l) => l.employeeId === emp.employeeId && l.status === "active")
        return computeEmployeePayslip({
          runId: run.id,
          employee: emp,
          period,
          timeInput: ti,
          adjustments: empAdj,
          activeLoans: empLoans,
          settings: state.settings,
          priorYtd: computePriorYtd(state.runs, emp.employeeId, run.id),
        })
      })

      const totals = summarizeRun(payslips)
      set((s) => ({
        runs: s.runs.map((r) =>
          r.id === runId
            ? {
                ...r,
                status: "computed",
                payslips,
                totals,
                history: [...r.history, { by: user.name, role: user.role, action: "Computed payroll run", at: "Just now" }],
              }
            : r
        ),
      }))
      return { ok: true }
    },

    submitRun: (runId) => {
      const user = guard("payroll:manage")
      if (!user) return { ok: false, error: "Only Finance can submit payroll runs." }
      const run = get().runs.find((r) => r.id === runId)
      if (!run) return { ok: false, error: "Payroll run not found." }
      if (!canTransitionRun(run.status, "submitted")) {
        return { ok: false, error: `Compute the run before submitting (current: ${run.status}).` }
      }
      set((s) => ({
        runs: s.runs.map((r) =>
          r.id === runId
            ? {
                ...r,
                status: "submitted",
                history: [...r.history, { by: user.name, role: user.role, action: "Submitted to Manager for review", at: "Just now" }],
              }
            : r
        ),
      }))

      // Register unpaid payroll in Accounts Payable until released
      const vendorLabel = `Payroll — ${run.periodLabel}`
      useBiz.setState((s) => {
        const exists = s.payables.some((p) => p.vendor === vendorLabel && p.status === "unpaid")
        if (exists) return s
        return {
          payables: [
            {
              id: Date.now(),
              orgId: ORG_ID,
              vendor: vendorLabel,
              category: "Salaries",
              amount: Math.round(run.totals.totalCost),
              dueDate: run.payDate,
              status: "unpaid",
              month: run.monthIndex,
              department: "finance",
            },
            ...s.payables,
          ],
        }
      })

      pushBizNotif({
        text: `Payroll run for ${run.periodLabel} submitted for Manager review (${fmtPeso(run.totals.netPay)} net)`,
        kind: "report",
        targetRoles: ["manager"],
        href: "/manager/payroll-approvals",
      })
      pushBizAudit(user, "Payroll run submitted", run.periodLabel, `Net ${fmtPeso(run.totals.netPay)} · ${run.totals.headcount} employees`)
      return { ok: true }
    },

    managerReviewRun: (runId) => {
      const user = guard("payroll:review")
      if (!user) return { ok: false, error: "Only the Manager can review submitted payroll runs." }
      const run = get().runs.find((r) => r.id === runId)
      if (!run) return { ok: false, error: "Payroll run not found." }
      if (!canTransitionRun(run.status, "manager_reviewed")) {
        return { ok: false, error: `Cannot review run in "${run.status}" status.` }
      }
      set((s) => ({
        runs: s.runs.map((r) =>
          r.id === runId
            ? {
                ...r,
                status: "manager_reviewed",
                history: [...r.history, { by: user.name, role: user.role, action: "Manager reviewed department totals", at: "Just now" }],
              }
            : r
        ),
      }))
      pushBizNotif({
        text: `Manager reviewed payroll for ${run.periodLabel}. Ready for CEO approval.`,
        kind: "report",
        targetRoles: ["ceo"],
        href: "/ceo/approvals",
      })
      pushBizAudit(user, "Payroll run reviewed", run.periodLabel, `Reviewed by ${user.name}`)
      return { ok: true }
    },

    ceoApproveRun: (runId) => {
      const user = guard("payroll:approve")
      if (!user) return { ok: false, error: "Only the CEO can approve payroll runs." }
      const run = get().runs.find((r) => r.id === runId)
      if (!run) return { ok: false, error: "Payroll run not found." }
      if (!canTransitionRun(run.status, "ceo_approved")) {
        return { ok: false, error: `Run must be reviewed by Manager before CEO approval (current: ${run.status}).` }
      }
      set((s) => ({
        runs: s.runs.map((r) =>
          r.id === runId
            ? {
                ...r,
                status: "ceo_approved",
                history: [...r.history, { by: user.name, role: user.role, action: "Approved by CEO", at: "Just now" }],
              }
            : r
        ),
      }))
      pushBizNotif({
        text: `CEO approved payroll for ${run.periodLabel}. Ready for Finance release.`,
        kind: "payment",
        targetRoles: ["finance"],
        href: "/finance/payroll",
      })
      pushBizAudit(user, "Payroll run approved", run.periodLabel, `Approved by ${user.name}`)
      return { ok: true }
    },

    returnRun: (runId, comment) => {
      const user = useBiz.getState().currentUser
      if (!user || (!can(user.role, "payroll:review") && !can(user.role, "payroll:approve"))) {
        return { ok: false, error: "You do not have permission to return payroll runs." }
      }
      const cleanComment = comment.trim()
      if (!cleanComment) return { ok: false, error: "Please provide a return comment." }
      const run = get().runs.find((r) => r.id === runId)
      if (!run) return { ok: false, error: "Payroll run not found." }
      const valid =
        (user.role === "manager" && run.status === "submitted") ||
        (user.role === "ceo" && run.status === "manager_reviewed")
      if (!valid) return { ok: false, error: `Cannot return run in "${run.status}" status as ${user.role}.` }

      set((s) => ({
        runs: s.runs.map((r) =>
          r.id === runId
            ? {
                ...r,
                status: "draft",
                history: [
                  ...r.history,
                  { by: user.name, role: user.role, action: "Returned to draft", comment: cleanComment, at: "Just now" },
                ],
              }
            : r
        ),
      }))
      pushBizNotif({
        text: `${user.name} returned payroll (${run.periodLabel}) to draft: ${cleanComment}`,
        kind: "report",
        targetRoles: ["finance"],
        href: "/finance/payroll/run",
      })
      pushBizAudit(user, "Payroll run returned", run.periodLabel, cleanComment)
      return { ok: true }
    },

    releaseRun: (runId) => {
      const user = guard("payroll:manage")
      if (!user) return { ok: false, error: "Only Finance can release approved payroll runs." }
      const run = get().runs.find((r) => r.id === runId)
      if (!run) return { ok: false, error: "Payroll run not found." }
      if (!canTransitionRun(run.status, "released")) {
        return { ok: false, error: `Payroll must be approved by CEO before release (current: ${run.status}).` }
      }

      // 1. Update run & mark payslips released + reduce loan balances
      const loanDeductionsMap = new Map<string, number>()
      for (const slip of run.payslips) {
        for (const lp of slip.loanPaymentsApplied) {
          loanDeductionsMap.set(lp.loanId, (loanDeductionsMap.get(lp.loanId) ?? 0) + lp.amount)
        }
      }

      set((s) => ({
        runs: s.runs.map((r) =>
          r.id === runId
            ? {
                ...r,
                status: "released",
                payslips: r.payslips.map((p) => ({ ...p, status: "released" })),
                history: [...r.history, { by: user.name, role: user.role, action: "Released payroll and issued payslips", at: "Just now" }],
              }
            : r
        ),
        loans: s.loans.map((loan) => {
          const paid = loanDeductionsMap.get(loan.id)
          if (!paid || paid <= 0) return loan
          const nextRem = fromCents(Math.max(0, toCents(loan.remainingBalance) - toCents(paid)))
          return {
            ...loan,
            remainingBalance: nextRem,
            status: nextRem <= 0 ? "paid_off" : "active",
            history: [
              ...loan.history,
              { date: run.payDate, runId: run.id, amount: paid, remainingAfter: nextRem, note: `Payroll deduction (${run.periodLabel})` },
            ],
          }
        }),
      }))

      // 2. Create 2 Expense records in useBiz ("Salaries" for Gross Pay + "Salaries" for Employer Contributions)
      //    and mark unpaid payroll payable as paid!
      const vendorLabel = `Payroll — ${run.periodLabel}`
      useBiz.setState((s) => ({
        expenses: [
          {
            id: Date.now() + 1,
            orgId: ORG_ID,
            category: "Salaries",
            amount: Math.round(run.totals.grossPay),
            totalAmount: Math.round(run.totals.grossPay),
            month: run.monthIndex,
            date: run.payDate,
            note: `Gross payroll — ${run.periodLabel}`,
            recordedBy: user.name,
            department: "finance",
          },
          {
            id: Date.now() + 2,
            orgId: ORG_ID,
            category: "Salaries",
            amount: Math.round(run.totals.employerContributions),
            totalAmount: Math.round(run.totals.employerContributions),
            month: run.monthIndex,
            date: run.payDate,
            note: `Employer gov. contributions (SSS/PHIC/HDMF) — ${run.periodLabel}`,
            recordedBy: user.name,
            department: "finance",
          },
          ...s.expenses,
        ],
        payables: s.payables.map((p) =>
          p.vendor === vendorLabel && p.status === "unpaid" ? { ...p, status: "paid", paidAt: run.payDate } : p
        ),
      }))

      // 3. Notify each employee with a Demo account that their payslip is ready
      for (const slip of run.payslips) {
        const account = DEMO_ACCOUNTS.find((a) => a.id === slip.employeeId)
        if (account) {
          pushBizNotif({
            text: `Your payslip for ${run.periodLabel} is now available.`,
            kind: "payment",
            targetRoles: [account.role],
            targetUserId: account.id,
            href: rolePayslipsHref(account.role),
          })
        }
      }

      pushBizAudit(
        user,
        "Payroll run released",
        run.periodLabel,
        `Gross ${fmtPeso(run.totals.grossPay)}, Employer shares ${fmtPeso(run.totals.employerContributions)}, Net ${fmtPeso(run.totals.netPay)}`
      )
      return { ok: true }
    },

    addLoan: (input) => {
      const user = guard("payroll:manage")
      if (!user) return { ok: false, error: "Only Finance can create loans or cash advances." }
      const emp = get().employees.find((e) => e.employeeId === input.employeeId)
      if (!emp) return { ok: false, error: "Employee not found." }
      if (input.principal <= 0 || input.monthlyAmortization <= 0) {
        return { ok: false, error: "Principal and monthly amortization must be greater than zero." }
      }
      const record: LoanRecord = {
        id: `loan-${Date.now()}`,
        orgId: ORG_ID,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        kind: input.kind,
        principal: Math.round(input.principal),
        remainingBalance: Math.round(input.principal),
        monthlyAmortization: Math.round(input.monthlyAmortization),
        startDate: input.startDate,
        status: "active",
        note: input.note.trim() || input.kind,
        history: [],
      }
      set((s) => ({ loans: [record, ...s.loans] }))
      pushBizAudit(user, "Loan / advance created", emp.name, `${fmtPeso(record.principal)} (${record.kind})`)
      return { ok: true }
    },

    updateSettings: (patch) => {
      const user = guard("payroll:manage")
      if (!user) return { ok: false, error: "Only Finance can edit payroll settings." }
      set((s) => ({ settings: { ...s.settings, ...patch } }))
      pushBizAudit(user, "Payroll settings updated", "Payroll Engine", "Updated rates, multipliers, or schedule")
      return { ok: true }
    },

    resetDemo: () => set({ ...buildPayrollSeed() }),
  }
})

/** Computes total payroll for the current month from released and CEO-approved runs. */
export function payrollThisMonth(runs: PayrollRun[], monthIndex: number): { total: number; count: number } {
  const matching = runs.filter(
    (r) => r.monthIndex === monthIndex && (r.status === "released" || r.status === "ceo_approved")
  )
  const totalCents = matching.reduce((s, r) => s + toCents(r.totals.totalCost), 0)
  return { total: fromCents(totalCents), count: matching.length }
}

export const PAYROLL_DEPARTMENTS: PayrollDepartment[] = [
  "Sales and Marketing",
  "AM Reporters",
  "Finance",
  "Management",
]
