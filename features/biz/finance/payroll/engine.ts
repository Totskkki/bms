/**
 * Pure TypeScript Payroll Computation Engine (no React imports).
 * All money math uses integer centavos internally to eliminate floating-point drift.
 */

export type PayrollDepartment =
  | "Sales and Marketing"
  | "AM Reporters"
  | "Finance"
  | "Management"

export type EmploymentStatus = "regular" | "probationary" | "contractual"
export type PayFrequency = "semi-monthly" | "monthly"
export type PayPeriodType = "first-half" | "second-half" | "monthly"
export type ContributionSchedule = "second-half" | "split" | "monthly"
export type TaxMode = "monthly" | "annualized"

export type PayrollRunStatus =
  | "draft"
  | "computed"
  | "submitted"
  | "manager_reviewed"
  | "ceo_approved"
  | "released"

export interface EmployeePayroll {
  id: string
  orgId: string
  employeeId: string
  name: string
  department: PayrollDepartment
  position: string
  employmentStatus: EmploymentStatus
  dateHired: string // YYYY-MM-DD
  dateSeparated?: string // YYYY-MM-DD
  monthlyBasic: number // PHP
  monthlyAllowance: number // PHP
  payFrequency: PayFrequency
  status: "active" | "inactive"
  /** Masked dummy government IDs only (e.g. "••••-1234"). */
  sssMasked: string
  philHealthMasked: string
  pagIbigMasked: string
  tinMasked: string
  extraGovIds?: { label: string; value: string }[]
  photoUrl?: string
}

export interface PayPeriod {
  id: string
  orgId: string
  label: string
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD
  payDate: string // YYYY-MM-DD
  type: PayPeriodType
  monthIndex: number // 0..5 matching MONTHS
}

export interface TimeInput {
  employeeId: string
  daysWorked: number
  daysAbsent: number
  lateMinutes: number
  overtimeHours: number
  restDayOvertimeHours: number
  holidayDaysWorked: number
  nightDiffHours: number
}

export interface PayrollAdjustment {
  id: string
  employeeId: string
  direction: "addition" | "deduction"
  kind:
    | "bonus"
    | "incentive"
    | "reimbursement"
    | "cash_advance"
    | "company_loan"
    | "sss_loan"
    | "pagibig_loan"
    | "other"
  amount: number // PHP
  note: string
}

export interface LoanHistoryEntry {
  date: string
  runId?: string
  amount: number
  remainingAfter: number
  note: string
}

export interface LoanRecord {
  id: string
  orgId: string
  employeeId: string
  employeeName: string
  kind: "cash_advance" | "company_loan" | "sss_loan" | "pagibig_loan"
  principal: number
  remainingBalance: number
  monthlyAmortization: number
  startDate: string
  status: "active" | "paid_off"
  note: string
  history: LoanHistoryEntry[]
}

export interface ContributionRule {
  name: "SSS" | "PhilHealth" | "Pag-IBIG"
  employeeRate: number // e.g. 0.045
  employerRate: number // e.g. 0.095
  minSalaryCredit: number
  maxSalaryCredit: number
}

export interface TaxBracket {
  minMonthly: number
  maxMonthly: number | null
  baseTax: number
  rateOnExcess: number
}

export interface PayrollSettings {
  workingDaysFactor: number // default 26
  overtimeMultiplier: number // default 1.25
  restDayOvertimeMultiplier: number // default 1.3
  regularHolidayMultiplier: number // default 2.0
  nightDiffRate: number // default 0.10
  deductContributions: ContributionSchedule // default "second-half"
  taxMode: TaxMode // default "monthly"
  sss: ContributionRule
  philHealth: ContributionRule
  pagIbig: ContributionRule
  taxBrackets: TaxBracket[]
}

export type PayrollFlagCode =
  | "high_overtime"
  | "negative_net_carryover"
  | "missing_attendance"
  | "prorated"

export interface PayrollFlag {
  code: PayrollFlagCode
  message: string
}

export interface Payslip {
  id: string
  orgId: string
  runId: string
  periodId: string
  periodLabel: string
  payDate: string
  employeeId: string
  employeeName: string
  department: PayrollDepartment
  position: string
  status: "draft" | "released"

  // Earnings (PHP, rounded to centavos)
  basicPay: number
  allowance: number
  overtimePay: number
  restDayOvertimePay: number
  holidayPay: number
  nightDiffPay: number
  additions: number
  totalEarnings: number

  // Deductions (PHP, rounded to centavos)
  absenceDeduction: number
  lateDeduction: number
  sssEmployee: number
  philHealthEmployee: number
  pagIbigEmployee: number
  withholdingTax: number
  loanDeductions: number
  otherDeductions: number
  totalDeductions: number

  // Employer shares (not deducted from employee net pay)
  sssEmployer: number
  philHealthEmployer: number
  pagIbigEmployer: number
  totalEmployerShares: number

  // Net & carry-over
  netPay: number
  loanCarryOver: number

  // Running YTD totals (PHP)
  ytdGross: number
  ytdDeductions: number
  ytdNet: number
  ytdBasic: number

  flags: PayrollFlag[]
  loanPaymentsApplied: { loanId: string; amount: number }[]
}

export interface PayrollRunHistory {
  by: string
  role: string
  action: string
  comment?: string
  at: string
}

export interface PayrollRun {
  id: string
  orgId: string
  periodId: string
  periodLabel: string
  payDate: string
  monthIndex: number
  status: PayrollRunStatus
  createdBy: string
  timeInputs: Record<string, TimeInput>
  adjustments: PayrollAdjustment[]
  payslips: Payslip[]
  history: PayrollRunHistory[]
  totals: {
    headcount: number
    grossPay: number
    totalDeductions: number
    netPay: number
    employerContributions: number
    totalCost: number
  }
}

export const DEMO_RATES_DISCLAIMER =
  "Demo rates. Verify against the current official SSS, PhilHealth, Pag-IBIG and BIR tables before real use."

export const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  workingDaysFactor: 26,
  overtimeMultiplier: 1.25,
  restDayOvertimeMultiplier: 1.3,
  regularHolidayMultiplier: 2.0,
  nightDiffRate: 0.1,
  deductContributions: "second-half",
  taxMode: "monthly",
  sss: {
    name: "SSS",
    employeeRate: 0.045,
    employerRate: 0.095,
    minSalaryCredit: 4_000,
    maxSalaryCredit: 30_000,
  },
  philHealth: {
    name: "PhilHealth",
    employeeRate: 0.025,
    employerRate: 0.025,
    minSalaryCredit: 10_000,
    maxSalaryCredit: 100_000,
  },
  pagIbig: {
    name: "Pag-IBIG",
    employeeRate: 0.02,
    employerRate: 0.02,
    minSalaryCredit: 1_500,
    maxSalaryCredit: 10_000,
  },
  taxBrackets: [
    { minMonthly: 0, maxMonthly: 20_833, baseTax: 0, rateOnExcess: 0 },
    { minMonthly: 20_833, maxMonthly: 33_332, baseTax: 0, rateOnExcess: 0.15 },
    { minMonthly: 33_332, maxMonthly: 66_666, baseTax: 1_875, rateOnExcess: 0.2 },
    { minMonthly: 66_666, maxMonthly: 166_666, baseTax: 8_541.8, rateOnExcess: 0.25 },
    { minMonthly: 166_666, maxMonthly: 666_666, baseTax: 33_541.8, rateOnExcess: 0.3 },
    { minMonthly: 666_666, maxMonthly: null, baseTax: 183_541.8, rateOnExcess: 0.35 },
  ],
}

/** Convert PHP to integer centavos safely. */
export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0
  return Math.round(amount * 100)
}

/** Convert integer centavos back to PHP rounded to 2 decimals. */
export function fromCents(cents: number): number {
  if (!Number.isFinite(cents)) return 0
  return Math.round(cents) / 100
}

function clampNonNegative(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0
}

function parseIsoDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number)
  return Date.UTC(y || 2026, (m || 1) - 1, d || 1) / 86_400_000
}

/**
 * Returns proration ratio in (0..1] when an employee was hired or separated mid-period.
 */
export function computeProrationFactor(
  period: Pick<PayPeriod, "start" | "end">,
  dateHired: string,
  dateSeparated?: string
): number {
  const pStart = parseIsoDay(period.start)
  const pEnd = parseIsoDay(period.end)
  const totalDays = Math.max(1, pEnd - pStart + 1)

  const effStart = Math.max(pStart, parseIsoDay(dateHired))
  const effEnd = dateSeparated ? Math.min(pEnd, parseIsoDay(dateSeparated)) : pEnd
  if (effEnd < effStart) return 0
  const activeDays = effEnd - effStart + 1
  return Math.min(1, activeDays / totalDays)
}

export function computeContributionCents(
  monthlyBasic: number,
  rule: ContributionRule,
  multiplier: number
): { employeeCents: number; employerCents: number } {
  const base = clampNonNegative(monthlyBasic)
  if (base <= 0 || multiplier <= 0) return { employeeCents: 0, employerCents: 0 }
  const credit = Math.min(rule.maxSalaryCredit, Math.max(rule.minSalaryCredit, base))
  const employeeCents = Math.round(credit * rule.employeeRate * multiplier * 100)
  const employerCents = Math.round(credit * rule.employerRate * multiplier * 100)
  return { employeeCents, employerCents }
}

function contributionMultiplier(periodType: PayPeriodType, schedule: ContributionSchedule): number {
  if (periodType === "monthly") return 1
  if (schedule === "split") return 0.5
  if (schedule === "monthly") return 1
  // default "second-half"
  return periodType === "second-half" ? 1 : 0
}

export function computeMonthlyTaxCents(monthlyTaxablePhp: number, brackets: TaxBracket[]): number {
  const taxable = clampNonNegative(monthlyTaxablePhp)
  if (taxable <= 0 || brackets.length === 0) return 0
  const sorted = [...brackets].sort((a, b) => a.minMonthly - b.minMonthly)
  let matched = sorted[0]
  for (const b of sorted) {
    if (taxable >= b.minMonthly && (b.maxMonthly === null || taxable <= b.maxMonthly)) {
      matched = b
      break
    }
    if (taxable > b.minMonthly) matched = b
  }
  const excess = Math.max(0, taxable - matched.minMonthly)
  const taxPhp = matched.baseTax + excess * matched.rateOnExcess
  return Math.max(0, toCents(taxPhp))
}

export function computePeriodTaxCents(
  periodTaxableCents: number,
  periodType: PayPeriodType,
  settings: PayrollSettings
): number {
  if (periodTaxableCents <= 0) return 0
  const isSemi = periodType !== "monthly"
  if (!isSemi) {
    return computeMonthlyTaxCents(fromCents(periodTaxableCents), settings.taxBrackets)
  }
  if (settings.taxMode === "annualized") {
    // Project semi-monthly taxable income to monthly (x2), compute monthly tax, divide by 2
    const monthlyEquivalent = fromCents(periodTaxableCents * 2)
    const monthlyTax = computeMonthlyTaxCents(monthlyEquivalent, settings.taxBrackets)
    return Math.round(monthlyTax / 2)
  }
  // Direct monthly table prorated to half-month brackets
  const halfBrackets: TaxBracket[] = settings.taxBrackets.map((b) => ({
    minMonthly: b.minMonthly / 2,
    maxMonthly: b.maxMonthly === null ? null : b.maxMonthly / 2,
    baseTax: b.baseTax / 2,
    rateOnExcess: b.rateOnExcess,
  }))
  return computeMonthlyTaxCents(fromCents(periodTaxableCents), halfBrackets)
}

export function computeEmployeePayslip(params: {
  runId: string
  employee: EmployeePayroll
  period: PayPeriod
  timeInput: TimeInput
  adjustments: PayrollAdjustment[]
  activeLoans: LoanRecord[]
  settings: PayrollSettings
  priorYtd?: { gross: number; deductions: number; net: number; basic: number }
}): Payslip {
  const { runId, employee, period, timeInput, adjustments, activeLoans, settings } = params
  const prior = params.priorYtd ?? { gross: 0, deductions: 0, net: 0, basic: 0 }

  const factor = Math.max(1, clampNonNegative(settings.workingDaysFactor) || 26)
  const isSemi = period.type !== "monthly"
  const periodDivisor = isSemi ? 2 : 1

  const monthlyBasic = clampNonNegative(employee.monthlyBasic)
  const monthlyAllowance = clampNonNegative(employee.monthlyAllowance)

  const dailyRateCents = Math.round((monthlyBasic / factor) * 100)
  const hourlyRateCents = Math.round(dailyRateCents / 8)

  const proration = computeProrationFactor(period, employee.dateHired, employee.dateSeparated)
  const flags: PayrollFlag[] = []
  if (proration > 0 && proration < 1) {
    flags.push({
      code: "prorated",
      message: `Prorated (${Math.round(proration * 100)}% of period)`,
    })
  }

  const daysWorked = clampNonNegative(timeInput.daysWorked)
  const daysAbsent = clampNonNegative(timeInput.daysAbsent)
  const lateMinutes = clampNonNegative(timeInput.lateMinutes)
  const otHours = clampNonNegative(timeInput.overtimeHours)
  const restDayOtHours = clampNonNegative(timeInput.restDayOvertimeHours)
  const holidayDays = clampNonNegative(timeInput.holidayDaysWorked)
  const nightDiffHours = clampNonNegative(timeInput.nightDiffHours)

  if (daysWorked === 0 && daysAbsent === 0) {
    flags.push({ code: "missing_attendance", message: "Missing attendance (0 days worked)" })
  }
  if (otHours + restDayOtHours > 20) {
    flags.push({ code: "high_overtime", message: `High overtime (${otHours + restDayOtHours}h)` })
  }

  // Earnings in integer centavos
  const basicPayCents = Math.round((monthlyBasic / periodDivisor) * proration * 100)
  const allowanceCents = Math.round((monthlyAllowance / periodDivisor) * proration * 100)
  const overtimePayCents = Math.round(hourlyRateCents * settings.overtimeMultiplier * otHours)
  const restDayOvertimePayCents = Math.round(
    hourlyRateCents * settings.restDayOvertimeMultiplier * restDayOtHours
  )
  // Regular holiday worked adds 100% premium on top of basic (total 200% for that day)
  const holidayPremiumMultiplier = Math.max(0, settings.regularHolidayMultiplier - 1)
  const holidayPayCents = Math.round(dailyRateCents * holidayPremiumMultiplier * holidayDays)
  const nightDiffPayCents = Math.round(hourlyRateCents * settings.nightDiffRate * nightDiffHours)

  const additionsCents = adjustments
    .filter((a) => a.direction === "addition")
    .reduce((sum, a) => sum + toCents(clampNonNegative(a.amount)), 0)

  const totalEarningsCents =
    basicPayCents +
    allowanceCents +
    overtimePayCents +
    restDayOvertimePayCents +
    holidayPayCents +
    nightDiffPayCents +
    additionsCents

  // Mandatory deductions in integer centavos
  const absenceDeductionCents = Math.round(dailyRateCents * daysAbsent)
  const lateDeductionCents = Math.round((hourlyRateCents / 60) * lateMinutes)

  const contribMult = contributionMultiplier(period.type, settings.deductContributions)
  const sss = computeContributionCents(monthlyBasic, settings.sss, contribMult)
  const philHealth = computeContributionCents(monthlyBasic, settings.philHealth, contribMult)
  const pagIbig = computeContributionCents(monthlyBasic, settings.pagIbig, contribMult)

  const mandatoryContribCents = sss.employeeCents + philHealth.employeeCents + pagIbig.employeeCents
  const grossForTaxCents = Math.max(
    0,
    totalEarningsCents - allowanceCents - absenceDeductionCents - lateDeductionCents - mandatoryContribCents
  )
  const withholdingTaxCents = computePeriodTaxCents(grossForTaxCents, period.type, settings)

  const manualOtherDeductionsCents = adjustments
    .filter((a) => a.direction === "deduction")
    .reduce((sum, a) => sum + toCents(clampNonNegative(a.amount)), 0)

  const mandatoryAndOtherCents =
    absenceDeductionCents +
    lateDeductionCents +
    mandatoryContribCents +
    withholdingTaxCents +
    manualOtherDeductionsCents

  // Scheduled loan amortizations (halved on semi-monthly, capped by remaining balance)
  let availableForLoansCents = Math.max(0, totalEarningsCents - mandatoryAndOtherCents)
  let appliedLoansCents = 0
  let carryOverLoansCents = 0
  const loanPaymentsApplied: { loanId: string; amount: number }[] = []

  for (const loan of activeLoans) {
    if (loan.status !== "active" || loan.remainingBalance <= 0) continue
    const scheduledPhp = Math.min(
      loan.remainingBalance,
      isSemi ? loan.monthlyAmortization / 2 : loan.monthlyAmortization
    )
    const scheduledCents = toCents(scheduledPhp)
    if (scheduledCents <= 0) continue

    const canDeductCents = Math.min(scheduledCents, availableForLoansCents)
    const unpaidCents = scheduledCents - canDeductCents
    if (canDeductCents > 0) {
      appliedLoansCents += canDeductCents
      availableForLoansCents -= canDeductCents
      loanPaymentsApplied.push({ loanId: loan.id, amount: fromCents(canDeductCents) })
    }
    if (unpaidCents > 0) {
      carryOverLoansCents += unpaidCents
    }
  }

  let totalDeductionsCents = mandatoryAndOtherCents + appliedLoansCents
  let netPayCents = totalEarningsCents - totalDeductionsCents
  if (netPayCents < 0) {
    // Never allow negative net pay
    carryOverLoansCents += Math.abs(netPayCents)
    totalDeductionsCents = totalEarningsCents
    netPayCents = 0
  }

  if (carryOverLoansCents > 0) {
    flags.push({
      code: "negative_net_carryover",
      message: `Unpaid deduction carried over: ₱${fromCents(carryOverLoansCents).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
    })
  }

  const totalEmployerSharesCents = sss.employerCents + philHealth.employerCents + pagIbig.employerCents

  const totalEarnings = fromCents(totalEarningsCents)
  const totalDeductions = fromCents(totalDeductionsCents)
  const netPay = fromCents(netPayCents)
  const basicPay = fromCents(basicPayCents)

  return {
    id: `ps-${runId}-${employee.employeeId}`,
    orgId: employee.orgId,
    runId,
    periodId: period.id,
    periodLabel: period.label,
    payDate: period.payDate,
    employeeId: employee.employeeId,
    employeeName: employee.name,
    department: employee.department,
    position: employee.position,
    status: "draft",

    basicPay,
    allowance: fromCents(allowanceCents),
    overtimePay: fromCents(overtimePayCents),
    restDayOvertimePay: fromCents(restDayOvertimePayCents),
    holidayPay: fromCents(holidayPayCents),
    nightDiffPay: fromCents(nightDiffPayCents),
    additions: fromCents(additionsCents),
    totalEarnings,

    absenceDeduction: fromCents(absenceDeductionCents),
    lateDeduction: fromCents(lateDeductionCents),
    sssEmployee: fromCents(sss.employeeCents),
    philHealthEmployee: fromCents(philHealth.employeeCents),
    pagIbigEmployee: fromCents(pagIbig.employeeCents),
    withholdingTax: fromCents(withholdingTaxCents),
    loanDeductions: fromCents(appliedLoansCents),
    otherDeductions: fromCents(manualOtherDeductionsCents),
    totalDeductions,

    sssEmployer: fromCents(sss.employerCents),
    philHealthEmployer: fromCents(philHealth.employerCents),
    pagIbigEmployer: fromCents(pagIbig.employerCents),
    totalEmployerShares: fromCents(totalEmployerSharesCents),

    netPay,
    loanCarryOver: fromCents(carryOverLoansCents),

    ytdGross: fromCents(toCents(prior.gross) + totalEarningsCents),
    ytdDeductions: fromCents(toCents(prior.deductions) + totalDeductionsCents),
    ytdNet: fromCents(toCents(prior.net) + netPayCents),
    ytdBasic: fromCents(toCents(prior.basic) + basicPayCents),

    flags,
    loanPaymentsApplied,
  }
}

export function summarizeRun(payslips: Payslip[]): PayrollRun["totals"] {
  const grossCents = payslips.reduce((s, p) => s + toCents(p.totalEarnings), 0)
  const dedCents = payslips.reduce((s, p) => s + toCents(p.totalDeductions), 0)
  const netCents = payslips.reduce((s, p) => s + toCents(p.netPay), 0)
  const empShareCents = payslips.reduce((s, p) => s + toCents(p.totalEmployerShares), 0)
  return {
    headcount: payslips.length,
    grossPay: fromCents(grossCents),
    totalDeductions: fromCents(dedCents),
    netPay: fromCents(netCents),
    employerContributions: fromCents(empShareCents),
    totalCost: fromCents(grossCents + empShareCents),
  }
}

/** Running 13th month pay estimate: sum of basic pay earned YTD / 12. */
export function estimate13thMonth(ytdBasicPay: number): number {
  return fromCents(Math.round((toCents(clampNonNegative(ytdBasicPay))) / 12))
}

const ALLOWED_TRANSITIONS: Record<PayrollRunStatus, PayrollRunStatus[]> = {
  draft: ["computed"],
  computed: ["computed", "submitted", "draft"],
  submitted: ["manager_reviewed", "draft"],
  manager_reviewed: ["ceo_approved", "draft"],
  ceo_approved: ["released", "draft"],
  released: [],
}

export function canTransitionRun(from: PayrollRunStatus, to: PayrollRunStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to)
}

export interface DepartmentPayrollSummary {
  department: PayrollDepartment
  headcount: number
  grossPay: number
  totalDeductions: number
  netPay: number
  employerContributions: number
}

/** Aggregated department totals only (used for Manager review so no individual salaries are exposed). */
export function summarizeByDepartment(payslips: Payslip[]): DepartmentPayrollSummary[] {
  const map = new Map<PayrollDepartment, Payslip[]>()
  for (const p of payslips) {
    const arr = map.get(p.department) ?? []
    arr.push(p)
    map.set(p.department, arr)
  }
  return Array.from(map.entries()).map(([department, list]) => {
    const totals = summarizeRun(list)
    return {
      department,
      headcount: list.length,
      grossPay: totals.grossPay,
      totalDeductions: totals.totalDeductions,
      netPay: totals.netPay,
      employerContributions: totals.employerContributions,
    }
  })
}
