"use client"

import { CalculatorIcon, CheckCheckIcon, FileTextIcon, PrinterIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { BRAND } from "@/config/brand"
import { PageHeader } from "@/kit/ui-patterns/page-header"
import { StatusBadge } from "@/kit/ui-patterns/status-badge"
import { Widget } from "@/kit/widgets/widget"

import { peso } from "../metrics"
import { EmptyBox, ExportButtons, Grid, PesoAmount, Stat, TablePagination, usePagination } from "../parts"
import { MONTHS, NOW, useBiz, type PayrollEntry } from "../store"
import { computePayroll, type PayrollInputs } from "./payroll-calc"

const CUTOFF_PRESETS = [
  { id: "monthly", label: "Full Month (22 days)", days: 22 },
  { id: "cutoff-1", label: "1st Cutoff (1–15 · 11 days)", days: 11 },
  { id: "cutoff-2", label: "2nd Cutoff (16–30 · 11 days)", days: 11 },
]

export function FinancePayrollPage() {
  const s = useBiz()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [cutoff, setCutoff] = useState("monthly")
  const [editing, setEditing] = useState<PayrollEntry | null>(null)
  const [draft, setDraft] = useState<PayrollInputs | null>(null)
  const [payslipEntry, setPayslipEntry] = useState<PayrollEntry | null>(null)

  const computed = useMemo(
    () => s.payroll.map((entry) => ({ entry, calc: computePayroll(entry) })),
    [s.payroll]
  )

  const filtered = useMemo(
    () =>
      computed.filter(({ entry }) => {
        if (statusFilter !== "all" && entry.status !== statusFilter) return false
        const q = search.trim().toLowerCase()
        if (q && !entry.employeeName.toLowerCase().includes(q) && !entry.roleLabel.toLowerCase().includes(q)) {
          return false
        }
        return true
      }),
    [computed, statusFilter, search]
  )
  const pg = usePagination(filtered, 10)

  const totals = useMemo(
    () =>
      computed.reduce(
        (acc, { entry, calc }) => ({
          gross: acc.gross + calc.grossPay,
          deductions: acc.deductions + calc.totalDeductions,
          net: acc.net + calc.netPay,
          paidCount: acc.paidCount + (entry.status === "paid" ? 1 : 0),
          pendingCount: acc.pendingCount + (entry.status === "pending" ? 1 : 0),
        }),
        { gross: 0, deductions: 0, net: 0, paidCount: 0, pendingCount: 0 }
      ),
    [computed]
  )

  const liveDraftCalc = draft ? computePayroll(draft) : null

  function openCalculator(entry: PayrollEntry) {
    setEditing(entry)
    setDraft({
      dailyRate: entry.dailyRate,
      daysWorked: entry.daysWorked,
      overtimeHours: entry.overtimeHours,
      lateMinutes: entry.lateMinutes,
      allowance: entry.allowance,
      bonus: entry.bonus,
      otherDeductions: entry.otherDeductions,
    })
  }

  function saveCalculator(e: React.FormEvent) {
    e.preventDefault()
    if (!editing || !draft) return
    const res = s.updatePayrollEntry(editing.id, draft)
    toast.add({ title: res.ok ? `Recalculated payroll for ${editing.employeeName}` : res.error })
    if (res.ok) {
      setEditing(null)
      setDraft(null)
    }
  }

  function handleApplyCutoff(nextCutoff: string) {
    setCutoff(nextCutoff)
    const preset = CUTOFF_PRESETS.find((c) => c.id === nextCutoff)
    if (!preset) return
    const res = s.applyPayrollDays(preset.days)
    toast.add({ title: res.ok ? `Applied ${preset.days} working days to pending payroll` : res.error })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payroll"
        description={`Auto-calculated employee wages, overtime, and PH statutory deductions (SSS, PhilHealth, Pag-IBIG, BIR Tax) — ${MONTHS[NOW]} 2026.`}
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <ExportButtons
              filename="payroll-register"
              headers={[
                "Employee",
                "Title",
                "Daily Rate",
                "Days",
                "OT Hrs",
                "Basic Pay",
                "OT Pay",
                "Allowance",
                "Bonus",
                "Gross Pay",
                "SSS",
                "PhilHealth",
                "Pag-IBIG",
                "BIR Tax",
                "Late",
                "Other Ded.",
                "Total Deductions",
                "Net Pay",
                "Status",
              ]}
              rows={filtered.map(({ entry, calc }) => [
                entry.employeeName,
                entry.roleLabel,
                entry.dailyRate,
                entry.daysWorked,
                entry.overtimeHours,
                calc.basicPay,
                calc.overtimePay,
                entry.allowance,
                entry.bonus,
                calc.grossPay,
                calc.sss,
                calc.philHealth,
                calc.pagIbig,
                calc.withholdingTax,
                calc.lateDeduction,
                calc.otherDeductions,
                calc.totalDeductions,
                calc.netPay,
                entry.status,
              ])}
            />
            <Button
              size="sm"
              disabled={totals.pendingCount === 0}
              onClick={() => {
                const res = s.markAllPayrollPaid()
                toast.add({ title: res.ok ? `Disbursed payroll for ${totals.pendingCount} pending employees` : res.error })
              }}
            >
              <CheckCheckIcon className="size-4" />
              Disburse all pending ({totals.pendingCount})
            </Button>
          </div>
        }
      />

      <Grid>
        <Stat title="Total gross pay" value={<PesoAmount value={totals.gross} compact />} caption="Basic + OT + allowances + bonus" />
        <Stat title="Total deductions" value={<PesoAmount value={totals.deductions} compact />} caption="SSS, PhilHealth, Pag-IBIG, Tax, Late" />
        <Stat title="Total net payroll" value={<PesoAmount value={totals.net} compact className="text-success" />} caption="Take-home disbursement" />
        <Stat title="Disbursement status" value={`${totals.paidCount} / ${s.payroll.length}`} caption={`${totals.pendingCount} pending release`} />
      </Grid>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center print:hidden">
        <Input
          placeholder="Search employee or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <NativeSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-40">
          <NativeSelectOption value="all">All statuses</NativeSelectOption>
          <NativeSelectOption value="pending">Pending</NativeSelectOption>
          <NativeSelectOption value="paid">Paid</NativeSelectOption>
        </NativeSelect>
        <NativeSelect value={cutoff} onChange={(e) => handleApplyCutoff(e.target.value)} className="sm:w-56">
          {CUTOFF_PRESETS.map((c) => (
            <NativeSelectOption key={c.id} value={c.id}>
              {c.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <Widget>
        <div className="overflow-x-auto px-(--card-spacing)">
          {filtered.length === 0 ? (
            <EmptyBox title="No payroll entries match your filter" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Rate &amp; Days</TableHead>
                  <TableHead className="text-right">Gross Pay</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right print:hidden">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pg.items.map(({ entry, calc }) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      <div>{entry.employeeName}</div>
                      <div className="text-xs text-muted-foreground">{entry.roleLabel}</div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      <div className="font-sans tabular-nums">
                        {peso(entry.dailyRate)}/day × {entry.daysWorked}d
                      </div>
                      <div className="text-muted-foreground tabular-nums">
                        {entry.overtimeHours > 0 ? `OT ${entry.overtimeHours}h` : "No OT"}
                        {entry.lateMinutes > 0 ? ` · Late ${entry.lateMinutes}m` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-sans tabular-nums whitespace-nowrap">
                      <div>{peso(calc.grossPay)}</div>
                      <div className="text-[11px] text-muted-foreground">
                        Base {peso(calc.basicPay)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-sans tabular-nums whitespace-nowrap">
                      <div className="text-destructive">-{peso(calc.totalDeductions)}</div>
                      <div className="text-[11px] text-muted-foreground">
                        Tax {peso(calc.withholdingTax)} · Gov {peso(calc.sss + calc.philHealth + calc.pagIbig)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-sans font-semibold tabular-nums whitespace-nowrap text-success">
                      {peso(calc.netPay)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={entry.status === "paid" ? "success" : "warning"} className="capitalize">
                        {entry.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap print:hidden">
                      <div className="inline-flex items-center gap-1.5">
                        <Button size="xs" variant="outline" onClick={() => openCalculator(entry)}>
                          <CalculatorIcon className="size-3.5" />
                          Calculate
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => setPayslipEntry(entry)}>
                          <FileTextIcon className="size-3.5" />
                          Payslip
                        </Button>
                        {entry.status === "pending" && (
                          <Button
                            size="xs"
                            onClick={() => {
                              const res = s.markPayrollPaid(entry.id)
                              toast.add({ title: res.ok ? `Disbursed ${peso(calc.netPay)} to ${entry.employeeName}` : res.error })
                            }}
                          >
                            Mark paid
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <TablePagination {...pg.pagination} />
        </div>
      </Widget>

      {/* Live Wage Auto-Calculator Dialog */}
      <Dialog open={!!editing && !!draft} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-3xl">
          {editing && draft && liveDraftCalc && (
            <>
              <DialogHeader>
                <DialogTitle>Wage calculator — {editing.employeeName}</DialogTitle>
                <DialogDescription>
                  {editing.roleLabel} · Adjust rate, days, OT, or deductions to auto-compute PH statutory withholdings and net pay.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={saveCalculator} className="grid gap-5 md:grid-cols-12">
                <div className="flex flex-col gap-3 md:col-span-7">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="pr-rate">Daily rate (₱)</Label>
                      <Input
                        id="pr-rate"
                        type="number"
                        min={0}
                        value={draft.dailyRate}
                        onChange={(e) => setDraft({ ...draft, dailyRate: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="pr-days">Days worked</Label>
                      <Input
                        id="pr-days"
                        type="number"
                        min={0}
                        max={31}
                        step="0.5"
                        value={draft.daysWorked}
                        onChange={(e) => setDraft({ ...draft, daysWorked: Number(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="pr-ot">Overtime hours (1.25×)</Label>
                      <Input
                        id="pr-ot"
                        type="number"
                        min={0}
                        value={draft.overtimeHours}
                        onChange={(e) => setDraft({ ...draft, overtimeHours: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="pr-late">Late / undertime (mins)</Label>
                      <Input
                        id="pr-late"
                        type="number"
                        min={0}
                        value={draft.lateMinutes}
                        onChange={(e) => setDraft({ ...draft, lateMinutes: Number(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="pr-allow">Non-taxable allowance (₱)</Label>
                      <Input
                        id="pr-allow"
                        type="number"
                        min={0}
                        value={draft.allowance}
                        onChange={(e) => setDraft({ ...draft, allowance: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="pr-bonus">Bonus / commission (₱)</Label>
                      <Input
                        id="pr-bonus"
                        type="number"
                        min={0}
                        value={draft.bonus}
                        onChange={(e) => setDraft({ ...draft, bonus: Number(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="pr-other">Other deductions / cash advance (₱)</Label>
                    <Input
                      id="pr-other"
                      type="number"
                      min={0}
                      value={draft.otherDeductions}
                      onChange={(e) => setDraft({ ...draft, otherDeductions: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* Live computed breakdown */}
                <div className="flex flex-col justify-between gap-3 rounded-xl border bg-muted/25 p-4 text-xs md:col-span-5">
                  <div className="flex flex-col gap-2">
                    <p className="font-semibold tracking-wide text-muted-foreground uppercase">Earnings</p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Basic pay</span>
                      <span className="font-sans tabular-nums">{peso(liveDraftCalc.basicPay)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Overtime pay</span>
                      <span className="font-sans tabular-nums">{peso(liveDraftCalc.overtimePay)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Allowance + Bonus</span>
                      <span className="font-sans tabular-nums">{peso(draft.allowance + draft.bonus)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1.5 font-semibold">
                      <span>Gross pay</span>
                      <span className="font-sans tabular-nums">{peso(liveDraftCalc.grossPay)}</span>
                    </div>

                    <p className="mt-2 font-semibold tracking-wide text-muted-foreground uppercase">Deductions</p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SSS (4.5%)</span>
                      <span className="font-sans tabular-nums">-{peso(liveDraftCalc.sss)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PhilHealth (2.5%)</span>
                      <span className="font-sans tabular-nums">-{peso(liveDraftCalc.philHealth)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pag-IBIG (2%)</span>
                      <span className="font-sans tabular-nums">-{peso(liveDraftCalc.pagIbig)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">BIR Withholding Tax</span>
                      <span className="font-sans tabular-nums">-{peso(liveDraftCalc.withholdingTax)}</span>
                    </div>
                    {liveDraftCalc.lateDeduction > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Late / undertime</span>
                        <span className="font-sans tabular-nums">-{peso(liveDraftCalc.lateDeduction)}</span>
                      </div>
                    )}
                    {liveDraftCalc.otherDeductions > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Other deductions</span>
                        <span className="font-sans tabular-nums">-{peso(liveDraftCalc.otherDeductions)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-1.5 font-semibold text-destructive">
                      <span>Total deductions</span>
                      <span className="font-sans tabular-nums">-{peso(liveDraftCalc.totalDeductions)}</span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between rounded-lg bg-primary/10 px-3 py-2.5">
                    <span className="text-xs font-semibold text-primary">Net Take-Home</span>
                    <span className="font-sans text-lg font-bold text-primary tabular-nums">
                      {peso(liveDraftCalc.netPay)}
                    </span>
                  </div>
                </div>

                <DialogFooter className="md:col-span-12">
                  <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save wage calculation</Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Printable Employee Payslip Dialog */}
      <Dialog open={!!payslipEntry} onOpenChange={(o) => !o && setPayslipEntry(null)}>
        <DialogContent className="max-w-lg">
          {payslipEntry && (() => {
            const calc = computePayroll(payslipEntry)
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{BRAND.name} — Employee Payslip</DialogTitle>
                  <DialogDescription>
                    Pay Period: {MONTHS[payslipEntry.month]} 2026 · {payslipEntry.employeeName} ({payslipEntry.roleLabel})
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 text-sm">
                  <div className="grid grid-cols-2 gap-2 border-b pb-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Daily Rate</p>
                      <p className="font-medium tabular-nums">{peso(payslipEntry.dailyRate)} / day</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Days Worked / OT</p>
                      <p className="font-medium tabular-nums">
                        {payslipEntry.daysWorked} days · {payslipEntry.overtimeHours}h OT
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <p className="font-semibold text-muted-foreground uppercase">Earnings</p>
                      <div className="flex justify-between"><span>Basic Pay</span><span className="tabular-nums">{peso(calc.basicPay)}</span></div>
                      <div className="flex justify-between"><span>Overtime</span><span className="tabular-nums">{peso(calc.overtimePay)}</span></div>
                      <div className="flex justify-between"><span>Allowance</span><span className="tabular-nums">{peso(payslipEntry.allowance)}</span></div>
                      <div className="flex justify-between"><span>Bonus</span><span className="tabular-nums">{peso(payslipEntry.bonus)}</span></div>
                      <div className="flex justify-between border-t pt-1 font-semibold"><span>Gross Pay</span><span className="tabular-nums">{peso(calc.grossPay)}</span></div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <p className="font-semibold text-muted-foreground uppercase">Deductions</p>
                      <div className="flex justify-between"><span>SSS</span><span className="tabular-nums">-{peso(calc.sss)}</span></div>
                      <div className="flex justify-between"><span>PhilHealth</span><span className="tabular-nums">-{peso(calc.philHealth)}</span></div>
                      <div className="flex justify-between"><span>Pag-IBIG</span><span className="tabular-nums">-{peso(calc.pagIbig)}</span></div>
                      <div className="flex justify-between"><span>BIR Tax</span><span className="tabular-nums">-{peso(calc.withholdingTax)}</span></div>
                      {calc.lateDeduction > 0 && (
                        <div className="flex justify-between"><span>Late</span><span className="tabular-nums">-{peso(calc.lateDeduction)}</span></div>
                      )}
                      {calc.otherDeductions > 0 && (
                        <div className="flex justify-between"><span>Other</span><span className="tabular-nums">-{peso(calc.otherDeductions)}</span></div>
                      )}
                      <div className="flex justify-between border-t pt-1 font-semibold text-destructive"><span>Total</span><span className="tabular-nums">-{peso(calc.totalDeductions)}</span></div>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center justify-between rounded-lg bg-success/15 px-3.5 py-2.5">
                    <span className="text-xs font-semibold text-success">NET PAY</span>
                    <span className="font-sans text-lg font-bold text-success tabular-nums">{peso(calc.netPay)}</span>
                  </div>
                </div>
                <DialogFooter className="print:hidden">
                  <Button variant="outline" onClick={() => setPayslipEntry(null)}>Close</Button>
                  <Button onClick={() => window.print()}>
                    <PrinterIcon className="size-4" />
                    Print payslip
                  </Button>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
