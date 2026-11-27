export interface PayrollInputs {
  dailyRate: number
  daysWorked: number
  overtimeHours: number
  lateMinutes: number
  allowance: number
  bonus: number
  otherDeductions: number
}

export interface PayrollBreakdown {
  basicPay: number
  overtimePay: number
  grossPay: number
  sss: number
  philHealth: number
  pagIbig: number
  withholdingTax: number
  lateDeduction: number
  otherDeductions: number
  totalDeductions: number
  netPay: number
}

/**
 * Philippine payroll auto-calculator:
 * - Basic Pay = dailyRate * daysWorked
 * - Regular OT = (dailyRate / 8) * 1.25 * overtimeHours (Labor Code 125%)
 * - Late Deduction = (dailyRate / 480) * lateMinutes
 * - Statutory deductions: SSS (4.5% cap ₱1,350), PhilHealth (2.5% min ₱250 / max ₱2,500), Pag-IBIG (2% cap ₱200)
 * - BIR TRAIN monthly withholding tax on taxable income (gross - allowance - statutory)
 */
export function computePayroll(input: PayrollInputs): PayrollBreakdown {
  const rate = Math.max(0, Number.isFinite(input.dailyRate) ? input.dailyRate : 0)
  const days = Math.max(0, Number.isFinite(input.daysWorked) ? input.daysWorked : 0)
  const otHours = Math.max(0, Number.isFinite(input.overtimeHours) ? input.overtimeHours : 0)
  const lateMins = Math.max(0, Number.isFinite(input.lateMinutes) ? input.lateMinutes : 0)
  const allowance = Math.max(0, Number.isFinite(input.allowance) ? input.allowance : 0)
  const bonus = Math.max(0, Number.isFinite(input.bonus) ? input.bonus : 0)
  const otherDeductions = Math.max(0, Math.round(Number.isFinite(input.otherDeductions) ? input.otherDeductions : 0))

  const basicPay = Math.round(rate * days)
  const overtimePay = Math.round((rate / 8) * 1.25 * otHours)
  const grossPay = basicPay + overtimePay + Math.round(allowance) + Math.round(bonus)

  const sss = basicPay > 0 ? Math.min(1350, Math.round(basicPay * 0.045)) : 0
  const philHealth = basicPay > 0 ? Math.min(2500, Math.max(250, Math.round(basicPay * 0.025))) : 0
  const pagIbig = basicPay > 0 ? Math.min(200, Math.round(basicPay * 0.02)) : 0
  const lateDeduction = Math.round((rate / 480) * lateMins)

  const taxable = Math.max(0, basicPay + overtimePay + Math.round(bonus) - (sss + philHealth + pagIbig) - lateDeduction)
  let withholdingTax = 0
  if (taxable > 66_667) {
    withholdingTax = Math.round(8_541.8 + (taxable - 66_667) * 0.25)
  } else if (taxable > 33_333) {
    withholdingTax = Math.round(1_875 + (taxable - 33_333) * 0.2)
  } else if (taxable > 20_833) {
    withholdingTax = Math.round((taxable - 20_833) * 0.15)
  }

  const totalDeductions = sss + philHealth + pagIbig + withholdingTax + lateDeduction + otherDeductions
  const netPay = Math.max(0, grossPay - totalDeductions)

  return {
    basicPay,
    overtimePay,
    grossPay,
    sss,
    philHealth,
    pagIbig,
    withholdingTax,
    lateDeduction,
    otherDeductions,
    totalDeductions,
    netPay,
  }
}
