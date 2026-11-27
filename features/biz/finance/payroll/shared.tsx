"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BRAND } from "@/config/brand"
import { StatusBadge, type Tone } from "@/kit/ui-patterns/status-badge"

import { DEMO_RATES_DISCLAIMER, type PayrollRunStatus, type Payslip } from "./engine"

export function phpExact(n: number): string {
  const safe = Number.isFinite(n) ? n : 0
  const sign = safe < 0 ? "-" : ""
  return `${sign}₱${Math.abs(safe).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const RUN_STATUS_META: Record<PayrollRunStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "muted" },
  computed: { label: "Computed", tone: "info" },
  submitted: { label: "Pending Manager", tone: "warning" },
  manager_reviewed: { label: "Pending CEO", tone: "info" },
  ceo_approved: { label: "CEO Approved", tone: "success" },
  released: { label: "Released (Paid)", tone: "success" },
}

export function RunStatusBadge({ status }: { status: PayrollRunStatus }) {
  const meta = RUN_STATUS_META[status]
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PrintablePayslipCard({
  slip,
  govIds,
}: {
  slip: Payslip
  govIds?: { sss: string; philHealth: string; pagIbig: string; tin: string }
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 text-sm shadow-(--surface-shadow) print:break-after-page print:rounded-none print:border print:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
        <div>
          <p className="font-heading text-lg font-semibold">{BRAND.name}</p>
          <p className="text-xs text-muted-foreground">Employee Payslip · {slip.periodLabel}</p>
        </div>
        <div className="text-right text-xs">
          <p className="font-medium">Pay Date: {slip.payDate}</p>
          <p className="text-muted-foreground uppercase">Status: {slip.status}</p>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border bg-muted/20 p-3.5 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Employee</p>
          <p className="font-semibold text-foreground">{slip.employeeName}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Department</p>
          <p className="font-medium">{slip.department}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Position</p>
          <p className="font-medium">{slip.position}</p>
        </div>
        {govIds && (
          <div>
            <p className="text-muted-foreground">Masked Gov IDs</p>
            <p className="font-mono text-[11px]">
              SSS {govIds.sss} · TIN {govIds.tin}
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-1.5 text-xs">
          <p className="mb-1 font-semibold tracking-wide text-muted-foreground uppercase">Earnings</p>
          <div className="flex justify-between"><span>Basic Pay</span><span className="font-sans tabular-nums">{phpExact(slip.basicPay)}</span></div>
          <div className="flex justify-between"><span>Allowance</span><span className="font-sans tabular-nums">{phpExact(slip.allowance)}</span></div>
          {slip.overtimePay > 0 && <div className="flex justify-between"><span>Regular Overtime</span><span className="font-sans tabular-nums">{phpExact(slip.overtimePay)}</span></div>}
          {slip.restDayOvertimePay > 0 && <div className="flex justify-between"><span>Rest Day Overtime</span><span className="font-sans tabular-nums">{phpExact(slip.restDayOvertimePay)}</span></div>}
          {slip.holidayPay > 0 && <div className="flex justify-between"><span>Holiday Pay</span><span className="font-sans tabular-nums">{phpExact(slip.holidayPay)}</span></div>}
          {slip.nightDiffPay > 0 && <div className="flex justify-between"><span>Night Differential</span><span className="font-sans tabular-nums">{phpExact(slip.nightDiffPay)}</span></div>}
          {slip.additions > 0 && <div className="flex justify-between"><span>Additions / Bonus</span><span className="font-sans tabular-nums">{phpExact(slip.additions)}</span></div>}
          <div className="mt-1 flex justify-between border-t pt-2 text-sm font-semibold">
            <span>Total Earnings</span>
            <span className="font-sans tabular-nums">{phpExact(slip.totalEarnings)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-xs">
          <p className="mb-1 font-semibold tracking-wide text-muted-foreground uppercase">Deductions</p>
          {slip.absenceDeduction > 0 && <div className="flex justify-between"><span>Absences</span><span className="font-sans tabular-nums">-{phpExact(slip.absenceDeduction)}</span></div>}
          {slip.lateDeduction > 0 && <div className="flex justify-between"><span>Late / Undertime</span><span className="font-sans tabular-nums">-{phpExact(slip.lateDeduction)}</span></div>}
          <div className="flex justify-between"><span>SSS (Employee)</span><span className="font-sans tabular-nums">-{phpExact(slip.sssEmployee)}</span></div>
          <div className="flex justify-between"><span>PhilHealth (Employee)</span><span className="font-sans tabular-nums">-{phpExact(slip.philHealthEmployee)}</span></div>
          <div className="flex justify-between"><span>Pag-IBIG (Employee)</span><span className="font-sans tabular-nums">-{phpExact(slip.pagIbigEmployee)}</span></div>
          <div className="flex justify-between"><span>Withholding Tax (Est.)</span><span className="font-sans tabular-nums">-{phpExact(slip.withholdingTax)}</span></div>
          {slip.loanDeductions > 0 && <div className="flex justify-between"><span>Loans / Cash Advance</span><span className="font-sans tabular-nums">-{phpExact(slip.loanDeductions)}</span></div>}
          {slip.otherDeductions > 0 && <div className="flex justify-between"><span>Other Deductions</span><span className="font-sans tabular-nums">-{phpExact(slip.otherDeductions)}</span></div>}
          <div className="mt-1 flex justify-between border-t pt-2 text-sm font-semibold text-destructive">
            <span>Total Deductions</span>
            <span className="font-sans tabular-nums">-{phpExact(slip.totalDeductions)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-success/15 px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-success uppercase">Net Pay</p>
          {slip.loanCarryOver > 0 && (
            <p className="text-[11px] text-warning-foreground dark:text-warning">
              Carry-over to next period: {phpExact(slip.loanCarryOver)}
            </p>
          )}
        </div>
        <p className="font-sans text-2xl font-bold text-success tabular-nums">{phpExact(slip.netPay)}</p>
      </div>

      <div className="grid gap-3 rounded-xl border bg-muted/15 p-3.5 text-xs sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-muted-foreground uppercase">Employer Shares (Company Paid)</p>
          <p className="font-sans tabular-nums">
            SSS {phpExact(slip.sssEmployer)} · PhilHealth {phpExact(slip.philHealthEmployer)} · Pag-IBIG {phpExact(slip.pagIbigEmployer)} (Total {phpExact(slip.totalEmployerShares)})
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-muted-foreground uppercase">Year-to-Date Totals</p>
          <p className="font-sans tabular-nums">
            Gross {phpExact(slip.ytdGross)} · Deductions {phpExact(slip.ytdDeductions)} · Net {phpExact(slip.ytdNet)}
          </p>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-8 pt-6 text-xs text-muted-foreground">
        <div className="border-t pt-1.5 text-center">Prepared by (Finance)</div>
        <div className="border-t pt-1.5 text-center">Received by ({slip.employeeName})</div>
      </div>

      <p className="border-t pt-2.5 text-[11px] text-muted-foreground">{DEMO_RATES_DISCLAIMER}</p>
    </div>
  )
}
