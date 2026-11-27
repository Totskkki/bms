"use client"

import { AlertTriangleIcon, CalculatorIcon, CheckIcon, PlusIcon, SendIcon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { PageHeader } from "@/kit/ui-patterns/page-header"
import { Widget } from "@/kit/widgets/widget"

import { EmptyBox, Panel } from "../../parts"
import type { PayrollAdjustment } from "./engine"
import { ConfirmActionDialog, phpExact, RunStatusBadge } from "./shared"
import { usePayroll } from "./store"

const STEPS = [
  { id: 1, label: "1. Select Period" },
  { id: 2, label: "2. Time & Adjustments" },
  { id: 3, label: "3. Preview & Flags" },
  { id: 4, label: "4. Submit for Review" },
]

export function RunPayrollWizardPage() {
  const router = useRouter()
  const p = usePayroll()
  const defaultRun = p.runs.find((r) => r.status === "draft" || r.status === "computed") ?? p.runs[0]
  const [selectedRunId, setSelectedRunId] = useState<string>(defaultRun?.id ?? "")
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(p.periods[p.periods.length - 1]?.id ?? "")
  const [step, setStep] = useState<number>(1)
  const [confirmSubmit, setConfirmSubmit] = useState(false)

  // Quick adjustment state
  const [adjEmpId, setAdjEmpId] = useState<string>(p.employees[0]?.employeeId ?? "")
  const [adjDir, setAdjDir] = useState<"addition" | "deduction">("addition")
  const [adjKind, setAdjKind] = useState<PayrollAdjustment["kind"]>("bonus")
  const [adjAmount, setAdjAmount] = useState<string>("")
  const [adjNote, setAdjNote] = useState<string>("")

  const run = p.runs.find((r) => r.id === selectedRunId) ?? defaultRun
  const activeEmployees = useMemo(
    () => p.employees.filter((e) => e.status === "active"),
    [p.employees]
  )
  const editable = run ? run.status === "draft" || run.status === "computed" : false

  function handleSelectOrCreatePeriod() {
    const res = p.createRun(selectedPeriodId)
    if (!res.ok) {
      toast.add({ title: res.error })
      return
    }
    setSelectedRunId(res.runId)
    setStep(2)
  }

  function handleComputeAndPreview() {
    if (!run) return
    const res = p.computeRun(run.id)
    if (!res.ok) {
      toast.add({ title: res.error })
      return
    }
    toast.add({ title: "Payroll computed successfully" })
    setStep(3)
  }

  function handleAddAdj(e: React.FormEvent) {
    e.preventDefault()
    if (!run) return
    const amt = Number(adjAmount)
    if (!amt || amt <= 0) {
      toast.add({ title: "Adjustment amount must be greater than ₱0" })
      return
    }
    const res = p.addAdjustment(run.id, {
      employeeId: adjEmpId,
      direction: adjDir,
      kind: adjKind,
      amount: amt,
      note: adjNote.trim() || adjKind,
    })
    toast.add({ title: res.ok ? "Adjustment added" : res.error })
    if (res.ok) {
      setAdjAmount("")
      setAdjNote("")
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      <PageHeader
        title="Run Payroll"
        description="4-step payroll wizard: select period, review time inputs & adjustments, inspect warnings, and submit to Manager."
        actions={run ? <RunStatusBadge status={run.status} /> : undefined}
      />

      {/* Stepper */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STEPS.map((st) => {
          const active = step === st.id
          const done = step > st.id
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => setStep(st.id)}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : done
                    ? "border-success/40 bg-success/10 text-success"
                    : "bg-card text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {done && <CheckIcon className="size-3.5" />}
              {st.label}
            </button>
          )
        })}
      </div>

      {/* Step 1: Select Period */}
      {step === 1 && (
        <Panel title="Step 1 — Select pay period">
          <div className="flex max-w-lg flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wiz-period">Pay period</Label>
              <NativeSelect
                id="wiz-period"
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
              >
                {p.periods.slice().reverse().map((per) => {
                  const existing = p.runs.find((r) => r.periodId === per.id)
                  return (
                    <NativeSelectOption key={per.id} value={per.id}>
                      {per.label} (Pay date {per.payDate}){existing ? ` — ${existing.status}` : " — New"}
                    </NativeSelectOption>
                  )
                })}
              </NativeSelect>
            </div>
            <p className="text-xs text-muted-foreground">
              AM Reporters&apos; days worked and late minutes are pre-filled from their Attendance logs. Other departments can be edited in Step 2.
            </p>
            <div className="flex justify-end">
              <Button onClick={handleSelectOrCreatePeriod}>Continue to Time &amp; Adjustments</Button>
            </div>
          </div>
        </Panel>
      )}

      {/* Step 2: Time Inputs & Adjustments */}
      {step === 2 && run && (
        <div className="flex flex-col gap-6">
          <Panel
            title={`Step 2 — Time inputs (${run.periodLabel})`}
            action={
              <Button size="sm" disabled={!editable} onClick={handleComputeAndPreview}>
                <CalculatorIcon className="size-4" />
                Compute &amp; Preview
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Days Worked</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Late (m)</TableHead>
                    <TableHead>OT (h)</TableHead>
                    <TableHead>Rest Day OT</TableHead>
                    <TableHead>Holiday (d)</TableHead>
                    <TableHead>Night Diff (h)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeEmployees.map((emp) => {
                    const ti = run.timeInputs[emp.employeeId] ?? {
                      employeeId: emp.employeeId,
                      daysWorked: 13,
                      daysAbsent: 0,
                      lateMinutes: 0,
                      overtimeHours: 0,
                      restDayOvertimeHours: 0,
                      holidayDaysWorked: 0,
                      nightDiffHours: 0,
                    }
                    const patchField = (field: keyof typeof ti, raw: string) => {
                      const val = Math.max(0, Number(raw) || 0)
                      p.updateTimeInput(run.id, emp.employeeId, { [field]: val })
                    }
                    return (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          <div>{emp.name}</div>
                          <div className="text-[11px] text-muted-foreground">{emp.department}</div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={31}
                            step="0.5"
                            disabled={!editable}
                            className="h-8 w-16 font-sans text-xs tabular-nums"
                            value={ti.daysWorked}
                            onChange={(e) => patchField("daysWorked", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={31}
                            disabled={!editable}
                            className="h-8 w-14 font-sans text-xs tabular-nums"
                            value={ti.daysAbsent}
                            onChange={(e) => patchField("daysAbsent", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            disabled={!editable}
                            className="h-8 w-16 font-sans text-xs tabular-nums"
                            value={ti.lateMinutes}
                            onChange={(e) => patchField("lateMinutes", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            disabled={!editable}
                            className="h-8 w-16 font-sans text-xs tabular-nums"
                            value={ti.overtimeHours}
                            onChange={(e) => patchField("overtimeHours", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            disabled={!editable}
                            className="h-8 w-16 font-sans text-xs tabular-nums"
                            value={ti.restDayOvertimeHours}
                            onChange={(e) => patchField("restDayOvertimeHours", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            disabled={!editable}
                            className="h-8 w-14 font-sans text-xs tabular-nums"
                            value={ti.holidayDaysWorked}
                            onChange={(e) => patchField("holidayDaysWorked", e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            disabled={!editable}
                            className="h-8 w-16 font-sans text-xs tabular-nums"
                            value={ti.nightDiffHours}
                            onChange={(e) => patchField("nightDiffHours", e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Panel>

          <Panel title="Period adjustments (bonuses, incentives, reimbursements, one-off deductions)">
            {editable && (
              <form onSubmit={handleAddAdj} className="mb-4 grid gap-2 sm:grid-cols-6">
                <NativeSelect value={adjEmpId} onChange={(e) => setAdjEmpId(e.target.value)}>
                  {activeEmployees.map((e) => (
                    <NativeSelectOption key={e.id} value={e.employeeId}>{e.name}</NativeSelectOption>
                  ))}
                </NativeSelect>
                <NativeSelect value={adjDir} onChange={(e) => setAdjDir(e.target.value as "addition" | "deduction")}>
                  <NativeSelectOption value="addition">Addition (+)</NativeSelectOption>
                  <NativeSelectOption value="deduction">Deduction (-)</NativeSelectOption>
                </NativeSelect>
                <NativeSelect value={adjKind} onChange={(e) => setAdjKind(e.target.value as PayrollAdjustment["kind"])}>
                  <NativeSelectOption value="bonus">Bonus</NativeSelectOption>
                  <NativeSelectOption value="incentive">Incentive</NativeSelectOption>
                  <NativeSelectOption value="reimbursement">Reimbursement</NativeSelectOption>
                  <NativeSelectOption value="cash_advance">Cash advance</NativeSelectOption>
                  <NativeSelectOption value="other">Other</NativeSelectOption>
                </NativeSelect>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  placeholder="Amount (₱)"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                />
                <Input placeholder="Note" value={adjNote} onChange={(e) => setAdjNote(e.target.value)} />
                <Button type="submit" size="sm">
                  <PlusIcon className="size-4" />
                  Add
                </Button>
              </form>
            )}
            {run.adjustments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No manual adjustments for this period. Active loans are deducted automatically.</p>
            ) : (
              <ul className="divide-y text-xs">
                {run.adjustments.map((a) => {
                  const emp = p.employees.find((e) => e.employeeId === a.employeeId)
                  return (
                    <li key={a.id} className="flex items-center justify-between py-2">
                      <span>
                        <strong>{emp?.name}</strong> · {a.direction === "addition" ? "+" : "-"}
                        {phpExact(a.amount)} ({a.kind}: {a.note})
                      </span>
                      {editable && (
                        <Button size="icon-xs" variant="ghost" onClick={() => p.removeAdjustment(run.id, a.id)}>
                          <Trash2Icon className="size-3.5 text-destructive" />
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>
        </div>
      )}

      {/* Step 3: Preview Computed Results & Warning Flags */}
      {step === 3 && run && (
        <Panel
          title={`Step 3 — Preview computed payroll (${run.periodLabel})`}
          action={
            <div className="flex items-center gap-2">
              {editable && (
                <Button size="sm" variant="outline" onClick={handleComputeAndPreview}>
                  <CalculatorIcon className="size-4" />
                  Recompute
                </Button>
              )}
              <Button size="sm" disabled={run.payslips.length === 0} onClick={() => setStep(4)}>
                Continue to Submit
              </Button>
            </div>
          }
        >
          {run.payslips.length === 0 ? (
            <EmptyBox title="Run not computed yet" description="Click Compute & Preview in Step 2 first." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Gross Pay</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                    <TableHead>Flags / Warnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {run.payslips.map((slip) => (
                    <TableRow key={slip.id}>
                      <TableCell className="font-medium whitespace-nowrap">{slip.employeeName}</TableCell>
                      <TableCell className="whitespace-nowrap">{slip.department}</TableCell>
                      <TableCell className="text-right font-sans tabular-nums">{phpExact(slip.totalEarnings)}</TableCell>
                      <TableCell className="text-right font-sans tabular-nums text-destructive">-{phpExact(slip.totalDeductions)}</TableCell>
                      <TableCell className="text-right font-sans font-semibold tabular-nums text-success">{phpExact(slip.netPay)}</TableCell>
                      <TableCell>
                        {slip.flags.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Clean</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {slip.flags.map((f, i) => (
                              <Badge key={i} variant="outline" className="gap-1 border-warning/40 bg-warning/15 text-[11px] text-warning-foreground dark:text-warning">
                                <AlertTriangleIcon className="size-3" />
                                {f.message}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Panel>
      )}

      {/* Step 4: Submit for Review */}
      {step === 4 && run && (
        <Widget>
          <div className="flex flex-col gap-4 px-(--card-spacing)">
            <h3 className="text-base font-semibold">Step 4 — Submit payroll run for approval</h3>
            <p className="text-sm text-muted-foreground">
              Once submitted, the Manager reviews department totals (without seeing individual salaries), then the CEO approves, and Finance releases payment.
            </p>
            <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 text-sm sm:grid-cols-4">
              <div><p className="text-xs text-muted-foreground">Period</p><p className="font-semibold">{run.periodLabel}</p></div>
              <div><p className="text-xs text-muted-foreground">Gross Pay</p><p className="font-sans font-semibold tabular-nums">{phpExact(run.totals.grossPay)}</p></div>
              <div><p className="text-xs text-muted-foreground">Employer Shares</p><p className="font-sans font-semibold tabular-nums">{phpExact(run.totals.employerContributions)}</p></div>
              <div><p className="text-xs text-muted-foreground">Net Pay</p><p className="font-sans font-semibold text-success tabular-nums">{phpExact(run.totals.netPay)}</p></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>Back to Preview</Button>
              <Button disabled={run.status !== "computed"} onClick={() => setConfirmSubmit(true)}>
                <SendIcon className="size-4" />
                Submit to Manager
              </Button>
            </div>
          </div>
        </Widget>
      )}

      {/* Sticky totals bar */}
      {run && (
        <div className="fixed right-4 bottom-4 left-4 z-20 mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/95 px-5 py-3 text-xs shadow-lg backdrop-blur md:left-72 print:hidden">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold">{run.periodLabel}</span>
            <span>Headcount: <strong>{run.totals.headcount}</strong></span>
            <span>Gross: <strong className="font-sans tabular-nums">{phpExact(run.totals.grossPay)}</strong></span>
            <span>Deductions: <strong className="font-sans text-destructive tabular-nums">-{phpExact(run.totals.totalDeductions)}</strong></span>
            <span>Net: <strong className="font-sans text-success tabular-nums">{phpExact(run.totals.netPay)}</strong></span>
          </div>
          <RunStatusBadge status={run.status} />
        </div>
      )}

      <ConfirmActionDialog
        open={confirmSubmit}
        onOpenChange={setConfirmSubmit}
        title="Submit payroll run for review?"
        description="This locks the draft, registers an unpaid payroll payable, and sends department totals to the Manager for review."
        confirmLabel="Submit to Manager"
        onConfirm={() => {
          if (!run) return
          const res = p.submitRun(run.id)
          toast.add({ title: res.ok ? "Payroll submitted to Manager for review" : res.error })
          if (res.ok) router.push("/finance/payroll")
        }}
      />
    </div>
  )
}
