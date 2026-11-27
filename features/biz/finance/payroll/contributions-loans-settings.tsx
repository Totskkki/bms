"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircleIcon, EyeIcon, PlusIcon, SaveIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

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
import { PageHeader } from "@/kit/ui-patterns/page-header"
import { StatusBadge } from "@/kit/ui-patterns/status-badge"
import { Widget } from "@/kit/widgets/widget"

import { MONTHS } from "../../store"
import { EmptyBox, ExportButtons, Grid, Panel, PesoAmount, Stat, TablePagination, usePagination } from "../../parts"
import {
  DEMO_RATES_DISCLAIMER,
  fromCents,
  toCents,
  type ContributionSchedule,
  type LoanRecord,
  type PayrollSettings,
  type TaxMode,
} from "./engine"
import { phpExact } from "./shared"
import { usePayroll } from "./store"

export function PayrollContributionsPage() {
  const p = usePayroll()
  const [monthFilter, setMonthFilter] = useState<string>("all")

  const rows = useMemo(() => {
    const released = p.runs.filter((r) => r.status === "released")
    return MONTHS.map((label, idx) => {
      const mSlips = released.filter((r) => r.monthIndex === idx).flatMap((r) => r.payslips)
      const sssEe = fromCents(mSlips.reduce((a, s) => a + toCents(s.sssEmployee), 0))
      const sssEr = fromCents(mSlips.reduce((a, s) => a + toCents(s.sssEmployer), 0))
      const phEe = fromCents(mSlips.reduce((a, s) => a + toCents(s.philHealthEmployee), 0))
      const phEr = fromCents(mSlips.reduce((a, s) => a + toCents(s.philHealthEmployer), 0))
      const piEe = fromCents(mSlips.reduce((a, s) => a + toCents(s.pagIbigEmployee), 0))
      const piEr = fromCents(mSlips.reduce((a, s) => a + toCents(s.pagIbigEmployer), 0))
      const tax = fromCents(mSlips.reduce((a, s) => a + toCents(s.withholdingTax), 0))
      const totalRemittance = fromCents(
        toCents(sssEe) + toCents(sssEr) + toCents(phEe) + toCents(phEr) + toCents(piEe) + toCents(piEr) + toCents(tax)
      )
      return { monthIndex: idx, month: `${label} 2026`, sssEe, sssEr, phEe, phEr, piEe, piEr, tax, totalRemittance }
    }).filter((r) => monthFilter === "all" || String(r.monthIndex) === monthFilter)
  }, [p.runs, monthFilter])

  const pg = usePagination(rows, 10)
  const grandTotal = rows.reduce((a, r) => a + r.totalRemittance, 0)
  const totalTax = rows.reduce((a, r) => a + r.tax, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Government Contributions Summary"
        description="Monthly SSS, PhilHealth, Pag-IBIG, and BIR withholding tax remittance totals."
        actions={
          <ExportButtons
            filename="gov-contributions-summary"
            headers={["Month", "SSS (EE)", "SSS (ER)", "PhilHealth (EE)", "PhilHealth (ER)", "Pag-IBIG (EE)", "Pag-IBIG (ER)", "Withholding Tax", "Total Remittance"]}
            rows={rows.map((r) => [r.month, r.sssEe, r.sssEr, r.phEe, r.phEr, r.piEe, r.piEr, r.tax, r.totalRemittance])}
          />
        }
      />

      <Grid cols={3}>
        <Stat title="Total remittance" value={<PesoAmount value={grandTotal} compact />} caption="Employee + employer shares + tax" />
        <Stat title="BIR withholding tax" value={<PesoAmount value={totalTax} compact />} caption="Estimated monthly tax withheld" />
        <Stat title="Mandatory shares" value={<PesoAmount value={grandTotal - totalTax} compact />} caption="SSS + PhilHealth + Pag-IBIG" />
      </Grid>

      <NativeSelect value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="sm:w-48 print:hidden">
        <NativeSelectOption value="all">All 6 months</NativeSelectOption>
        {MONTHS.map((m, idx) => (
          <NativeSelectOption key={m} value={String(idx)}>{m} 2026</NativeSelectOption>
        ))}
      </NativeSelect>

      <Widget>
        <div className="overflow-x-auto px-(--card-spacing)">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">SSS (EE / ER)</TableHead>
                <TableHead className="text-right">PhilHealth (EE / ER)</TableHead>
                <TableHead className="text-right">Pag-IBIG (EE / ER)</TableHead>
                <TableHead className="text-right">BIR Tax</TableHead>
                <TableHead className="text-right">Total Remittance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pg.items.map((r) => (
                <TableRow key={r.month}>
                  <TableCell className="font-medium whitespace-nowrap">{r.month}</TableCell>
                  <TableCell className="text-right font-sans text-xs tabular-nums whitespace-nowrap">
                    {phpExact(r.sssEe)} / {phpExact(r.sssEr)}
                  </TableCell>
                  <TableCell className="text-right font-sans text-xs tabular-nums whitespace-nowrap">
                    {phpExact(r.phEe)} / {phpExact(r.phEr)}
                  </TableCell>
                  <TableCell className="text-right font-sans text-xs tabular-nums whitespace-nowrap">
                    {phpExact(r.piEe)} / {phpExact(r.piEr)}
                  </TableCell>
                  <TableCell className="text-right font-sans text-xs tabular-nums whitespace-nowrap">{phpExact(r.tax)}</TableCell>
                  <TableCell className="text-right font-sans text-xs font-semibold tabular-nums whitespace-nowrap">
                    {phpExact(r.totalRemittance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination {...pg.pagination} />
        </div>
      </Widget>

      <p className="text-xs text-muted-foreground">{DEMO_RATES_DISCLAIMER}</p>
    </div>
  )
}

const loanSchema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  kind: z.enum(["cash_advance", "company_loan", "sss_loan", "pagibig_loan"]),
  principal: z.coerce.number().min(500, "Principal must be at least ₱500"),
  monthlyAmortization: z.coerce.number().min(100, "Monthly amortization must be at least ₱100"),
  startDate: z.string().min(4, "Start date required"),
  note: z.string().min(2, "Short note required"),
})

export function PayrollLoansPage() {
  const p = usePayroll()
  const [open, setOpen] = useState(false)
  const [viewing, setViewing] = useState<LoanRecord | null>(null)
  const pg = usePagination(p.loans, 10)

  const form = useForm<z.input<typeof loanSchema>, unknown, z.output<typeof loanSchema>>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      employeeId: p.employees[0]?.employeeId ?? "",
      kind: "cash_advance",
      principal: 5_000,
      monthlyAmortization: 1_000,
      startDate: "2026-11-27",
      note: "",
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    const res = p.addLoan(values)
    toast.add({ title: res.ok ? "Loan / cash advance created" : res.error })
    if (res.ok) {
      form.reset()
      setOpen(false)
    }
  })

  const activeBalance = p.loans.filter((l) => l.status === "active").reduce((a, l) => a + l.remainingBalance, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Loans & Cash Advances"
        description="Active employee loans and advances automatically deducted upon payroll release."
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <ExportButtons
              filename="payroll-loans"
              headers={["Employee", "Type", "Principal", "Remaining", "Monthly Amortization", "Status"]}
              rows={p.loans.map((l) => [l.employeeName, l.kind, l.principal, l.remainingBalance, l.monthlyAmortization, l.status])}
            />
            <Button size="sm" onClick={() => setOpen(true)}>
              <PlusIcon className="size-4" />
              New loan / advance
            </Button>
          </div>
        }
      />

      <Grid cols={3}>
        <Stat title="Active loan balance" value={<PesoAmount value={activeBalance} compact />} caption="Total remaining receivable from staff" />
        <Stat title="Active loans" value={String(p.loans.filter((l) => l.status === "active").length)} caption="Auto-deducted each payroll" />
        <Stat title="Paid off" value={String(p.loans.filter((l) => l.status === "paid_off").length)} caption="Completed loans" />
      </Grid>

      <Widget>
        <div className="overflow-x-auto px-(--card-spacing)">
          {p.loans.length === 0 ? (
            <EmptyBox title="No loans or cash advances" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead className="text-right">Monthly Amort.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right print:hidden">History</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pg.items.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      <div>{l.employeeName}</div>
                      <div className="text-xs text-muted-foreground">{l.note}</div>
                    </TableCell>
                    <TableCell className="capitalize whitespace-nowrap">{l.kind.replace("_", " ")}</TableCell>
                    <TableCell className="text-right font-sans tabular-nums">{phpExact(l.principal)}</TableCell>
                    <TableCell className="text-right font-sans font-semibold tabular-nums">{phpExact(l.remainingBalance)}</TableCell>
                    <TableCell className="text-right font-sans tabular-nums">{phpExact(l.monthlyAmortization)}</TableCell>
                    <TableCell>
                      <StatusBadge tone={l.status === "active" ? "warning" : "success"}>
                        {l.status === "active" ? "Active" : "Paid off"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right print:hidden">
                      <Button size="xs" variant="outline" onClick={() => setViewing(l)}>
                        <EyeIcon className="size-3.5" />
                        History ({l.history.length})
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <TablePagination {...pg.pagination} />
        </div>
      </Widget>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create loan or cash advance</DialogTitle>
            <DialogDescription>Scheduled amortization reduces automatically when payroll runs are released.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ln-emp">Employee</Label>
              <NativeSelect id="ln-emp" value={form.watch("employeeId")} onChange={(e) => form.setValue("employeeId", e.target.value)}>
                {p.employees.filter((e) => e.status === "active").map((e) => (
                  <NativeSelectOption key={e.id} value={e.employeeId}>{e.name} ({e.department})</NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ln-kind">Type</Label>
                <NativeSelect id="ln-kind" value={form.watch("kind")} onChange={(e) => form.setValue("kind", e.target.value as LoanRecord["kind"])}>
                  <NativeSelectOption value="cash_advance">Cash advance</NativeSelectOption>
                  <NativeSelectOption value="company_loan">Company loan</NativeSelectOption>
                  <NativeSelectOption value="sss_loan">SSS loan</NativeSelectOption>
                  <NativeSelectOption value="pagibig_loan">Pag-IBIG loan</NativeSelectOption>
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ln-start">Start date</Label>
                <Input id="ln-start" type="date" {...form.register("startDate")} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ln-prin">Principal (₱)</Label>
                <Input id="ln-prin" type="number" inputMode="decimal" min={1} {...form.register("principal")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ln-amort">Monthly amortization (₱)</Label>
                <Input id="ln-amort" type="number" inputMode="decimal" min={1} {...form.register("monthlyAmortization")} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ln-note">Note</Label>
              <Input id="ln-note" {...form.register("note")} placeholder="Purpose or reference" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Create loan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.employeeName} — Loan History</DialogTitle>
                <DialogDescription>
                  Principal {phpExact(viewing.principal)} · Remaining {phpExact(viewing.remainingBalance)}
                </DialogDescription>
              </DialogHeader>
              {viewing.history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No payroll deductions applied yet.</p>
              ) : (
                <ul className="divide-y text-xs">
                  {viewing.history.map((h, i) => (
                    <li key={i} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">{h.note}</p>
                        <p className="text-muted-foreground">{h.date}</p>
                      </div>
                      <div className="text-right font-sans tabular-nums">
                        <p className="font-semibold text-success">-{phpExact(h.amount)}</p>
                        <p className="text-muted-foreground">Bal: {phpExact(h.remainingAfter)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function PayrollSettingsPage() {
  const p = usePayroll()
  const [draft, setDraft] = useState<PayrollSettings>(() => ({
    ...p.settings,
    sss: { ...p.settings.sss },
    philHealth: { ...p.settings.philHealth },
    pagIbig: { ...p.settings.pagIbig },
    taxBrackets: p.settings.taxBrackets.map((b) => ({ ...b })),
  }))

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const res = p.updateSettings(draft)
    toast.add({ title: res.ok ? "Payroll settings saved (applies to draft & future runs)" : res.error })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payroll Settings"
        description="Configure working days factor, multipliers, government contribution tables, and withholding tax brackets."
      />

      <div className="flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning/10 p-3.5 text-xs text-warning-foreground dark:text-warning">
        <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
        <p>{DEMO_RATES_DISCLAIMER} Changes affect only future computations in draft runs.</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <Panel title="Schedule & Multipliers">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ps-factor">Working days / month</Label>
              <Input
                id="ps-factor"
                type="number"
                min={1}
                max={31}
                value={draft.workingDaysFactor}
                onChange={(e) => setDraft({ ...draft, workingDaysFactor: Math.max(1, Number(e.target.value) || 26) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ps-ot">Regular OT multiplier</Label>
              <Input
                id="ps-ot"
                type="number"
                step="0.05"
                min={1}
                value={draft.overtimeMultiplier}
                onChange={(e) => setDraft({ ...draft, overtimeMultiplier: Math.max(1, Number(e.target.value) || 1.25) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ps-rdot">Rest Day OT multiplier</Label>
              <Input
                id="ps-rdot"
                type="number"
                step="0.05"
                min={1}
                value={draft.restDayOvertimeMultiplier}
                onChange={(e) => setDraft({ ...draft, restDayOvertimeMultiplier: Math.max(1, Number(e.target.value) || 1.3) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ps-nd">Night Diff rate (0.10 = 10%)</Label>
              <Input
                id="ps-nd"
                type="number"
                step="0.01"
                min={0}
                value={draft.nightDiffRate}
                onChange={(e) => setDraft({ ...draft, nightDiffRate: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ps-hol">Regular Holiday multiplier</Label>
              <Input
                id="ps-hol"
                type="number"
                step="0.1"
                min={1}
                value={draft.regularHolidayMultiplier}
                onChange={(e) => setDraft({ ...draft, regularHolidayMultiplier: Math.max(1, Number(e.target.value) || 2) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ps-contrib">Deduct contributions</Label>
              <NativeSelect
                id="ps-contrib"
                value={draft.deductContributions}
                onChange={(e) => setDraft({ ...draft, deductContributions: e.target.value as ContributionSchedule })}
              >
                <NativeSelectOption value="second-half">Second half of month</NativeSelectOption>
                <NativeSelectOption value="split">Split (50% / 50%)</NativeSelectOption>
                <NativeSelectOption value="monthly">Monthly (full)</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ps-taxmode">Withholding tax mode</Label>
              <NativeSelect
                id="ps-taxmode"
                value={draft.taxMode}
                onChange={(e) => setDraft({ ...draft, taxMode: e.target.value as TaxMode })}
              >
                <NativeSelectOption value="monthly">Monthly table (prorated)</NativeSelectOption>
                <NativeSelectOption value="annualized">Annualized projection</NativeSelectOption>
              </NativeSelect>
            </div>
          </div>
        </Panel>

        <Panel title="Government Contribution Rate Tables (Editable Demo Rates)">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agency</TableHead>
                  <TableHead>Employee Rate</TableHead>
                  <TableHead>Employer Rate</TableHead>
                  <TableHead>Min Salary Credit (₱)</TableHead>
                  <TableHead>Max Salary Credit (₱)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(["sss", "philHealth", "pagIbig"] as const).map((key) => {
                  const rule = draft[key]
                  return (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.005"
                          min={0}
                          className="h-8 w-24 font-sans text-xs tabular-nums"
                          value={rule.employeeRate}
                          onChange={(e) => setDraft({ ...draft, [key]: { ...rule, employeeRate: Math.max(0, Number(e.target.value) || 0) } })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.005"
                          min={0}
                          className="h-8 w-24 font-sans text-xs tabular-nums"
                          value={rule.employerRate}
                          onChange={(e) => setDraft({ ...draft, [key]: { ...rule, employerRate: Math.max(0, Number(e.target.value) || 0) } })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          className="h-8 w-28 font-sans text-xs tabular-nums"
                          value={rule.minSalaryCredit}
                          onChange={(e) => setDraft({ ...draft, [key]: { ...rule, minSalaryCredit: Math.max(0, Number(e.target.value) || 0) } })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          className="h-8 w-28 font-sans text-xs tabular-nums"
                          value={rule.maxSalaryCredit}
                          onChange={(e) => setDraft({ ...draft, [key]: { ...rule, maxSalaryCredit: Math.max(0, Number(e.target.value) || 0) } })}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Panel>

        <Panel title="Monthly Withholding Tax Table (Estimate)">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Min Monthly (₱)</TableHead>
                  <TableHead>Max Monthly (₱)</TableHead>
                  <TableHead>Base Tax (₱)</TableHead>
                  <TableHead>Rate on Excess</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {draft.taxBrackets.map((b, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="h-8 w-28 font-sans text-xs tabular-nums"
                        value={b.minMonthly}
                        onChange={(e) => {
                          const next = [...draft.taxBrackets]
                          next[idx] = { ...b, minMonthly: Math.max(0, Number(e.target.value) || 0) }
                          setDraft({ ...draft, taxBrackets: next })
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {b.maxMonthly === null ? "No cap" : phpExact(b.maxMonthly)}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="h-8 w-28 font-sans text-xs tabular-nums"
                        value={b.baseTax}
                        onChange={(e) => {
                          const next = [...draft.taxBrackets]
                          next[idx] = { ...b, baseTax: Math.max(0, Number(e.target.value) || 0) }
                          setDraft({ ...draft, taxBrackets: next })
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        max={1}
                        className="h-8 w-24 font-sans text-xs tabular-nums"
                        value={b.rateOnExcess}
                        onChange={(e) => {
                          const next = [...draft.taxBrackets]
                          next[idx] = { ...b, rateOnExcess: Math.max(0, Number(e.target.value) || 0) }
                          setDraft({ ...draft, taxBrackets: next })
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Panel>

        <div className="flex justify-end">
          <Button type="submit">
            <SaveIcon className="size-4" />
            Save payroll settings
          </Button>
        </div>
      </form>
    </div>
  )
}
