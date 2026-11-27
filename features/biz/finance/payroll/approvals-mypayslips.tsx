"use client"

import { CheckIcon, PrinterIcon, RotateCcwIcon, ShieldCheckIcon } from "lucide-react"
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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { PageHeader } from "@/kit/ui-patterns/page-header"
import { Widget } from "@/kit/widgets/widget"

import { useBiz } from "../../store"
import { EmptyBox } from "../../parts"
import { summarizeByDepartment, type PayrollRun } from "./engine"
import { ConfirmActionDialog, phpExact, PrintablePayslipCard, RunStatusBadge } from "./shared"
import { usePayroll } from "./store"

/**
 * Manager Payroll Review: shows ONLY aggregated department totals.
 * Individual employee salaries and payslips are strictly hidden for privacy.
 */
export function ManagerPayrollApprovalsPage() {
  const p = usePayroll()
  const submitted = p.runs.filter((r) => r.status === "submitted")
  const [returning, setReturning] = useState<PayrollRun | null>(null)
  const [comment, setComment] = useState("")
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payroll Review"
        description="Review submitted payroll runs by department totals before forwarding to the CEO. Individual salaries are hidden."
      />

      {submitted.length === 0 ? (
        <Widget>
          <div className="px-(--card-spacing)">
            <EmptyBox title="No payroll runs waiting for review" description="When Finance submits a payroll run, department totals appear here." />
          </div>
        </Widget>
      ) : (
        <div className="flex flex-col gap-4">
          {submitted.map((run) => {
            const deptRows = summarizeByDepartment(run.payslips)
            return (
              <Widget key={run.id}>
                <div className="flex flex-col gap-4 px-(--card-spacing)">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold">Payroll — {run.periodLabel}</h3>
                        <RunStatusBadge status={run.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Pay date {run.payDate} · {run.totals.headcount} employees · Submitted by {run.createdBy}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => setReviewingId(run.id)}>
                        <CheckIcon className="size-4" />
                        Mark reviewed &amp; send to CEO
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReturning(run)
                          setComment("")
                        }}
                      >
                        <RotateCcwIcon className="size-4" />
                        Return
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
                    <ShieldCheckIcon className="size-4 shrink-0 text-primary" />
                    Privacy scope: aggregated department totals only. Individual employee salaries are restricted to Finance &amp; CEO.
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Department</TableHead>
                          <TableHead className="text-right">Headcount</TableHead>
                          <TableHead className="text-right">Gross Pay</TableHead>
                          <TableHead className="text-right">Deductions</TableHead>
                          <TableHead className="text-right">Employer Shares</TableHead>
                          <TableHead className="text-right">Net Pay</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deptRows.map((d) => (
                          <TableRow key={d.department}>
                            <TableCell className="font-medium">{d.department}</TableCell>
                            <TableCell className="text-right font-sans tabular-nums">{d.headcount}</TableCell>
                            <TableCell className="text-right font-sans tabular-nums">{phpExact(d.grossPay)}</TableCell>
                            <TableCell className="text-right font-sans tabular-nums text-destructive">-{phpExact(d.totalDeductions)}</TableCell>
                            <TableCell className="text-right font-sans tabular-nums">{phpExact(d.employerContributions)}</TableCell>
                            <TableCell className="text-right font-sans font-semibold tabular-nums text-success">{phpExact(d.netPay)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </Widget>
            )
          })}
        </div>
      )}

      <ConfirmActionDialog
        open={reviewingId !== null}
        onOpenChange={(o) => !o && setReviewingId(null)}
        title="Forward payroll to CEO?"
        description="Marks this payroll run as Manager Reviewed and notifies the CEO for final approval."
        confirmLabel="Forward to CEO"
        onConfirm={() => {
          if (!reviewingId) return
          const res = p.managerReviewRun(reviewingId)
          toast.add({ title: res.ok ? "Payroll reviewed and forwarded to CEO" : res.error })
        }}
      />

      <Dialog open={!!returning} onOpenChange={(o) => !o && setReturning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return payroll run to draft</DialogTitle>
            <DialogDescription>Explain what Finance needs to fix before resubmitting.</DialogDescription>
          </DialogHeader>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Enter return reason…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturning(null)}>Cancel</Button>
            <Button
              disabled={!comment.trim()}
              onClick={() => {
                if (!returning) return
                const res = p.returnRun(returning.id, comment)
                toast.add({ title: res.ok ? "Payroll returned to Finance draft" : res.error })
                if (res.ok) setReturning(null)
              }}
            >
              Return to draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * CEO Payroll Approval Section: embedded inside /ceo/approvals.
 * CEO sees both totals and the per-employee breakdown, and can Approve or Return with comment.
 */
export function CeoPayrollApprovalsSection() {
  const p = usePayroll()
  const pending = p.runs.filter((r) => r.status === "manager_reviewed")
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [returning, setReturning] = useState<PayrollRun | null>(null)
  const [comment, setComment] = useState("")

  if (pending.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-lg font-semibold">Payroll Runs Awaiting CEO Approval ({pending.length})</h2>
      {pending.map((run) => (
        <Widget key={run.id}>
          <div className="flex flex-col gap-4 px-(--card-spacing)">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">Payroll — {run.periodLabel}</h3>
                  <RunStatusBadge status={run.status} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Pay date {run.payDate} · Gross {phpExact(run.totals.grossPay)} · Employer Shares {phpExact(run.totals.employerContributions)} · Net {phpExact(run.totals.netPay)}
                </p>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <Button size="sm" onClick={() => setApprovingId(run.id)}>
                  <CheckIcon className="size-4" />
                  Approve payroll
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReturning(run)
                    setComment("")
                  }}
                >
                  <RotateCcwIcon className="size-4" />
                  Return
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {run.payslips.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium whitespace-nowrap">{s.employeeName}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{s.department}</TableCell>
                      <TableCell className="text-right font-sans text-xs tabular-nums">{phpExact(s.totalEarnings)}</TableCell>
                      <TableCell className="text-right font-sans text-xs text-destructive tabular-nums">-{phpExact(s.totalDeductions)}</TableCell>
                      <TableCell className="text-right font-sans text-xs font-semibold text-success tabular-nums">{phpExact(s.netPay)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Widget>
      ))}

      <ConfirmActionDialog
        open={approvingId !== null}
        onOpenChange={(o) => !o && setApprovingId(null)}
        title="Approve payroll run?"
        description="Approving authorizes Finance to release payment and issue employee payslips."
        confirmLabel="Approve payroll"
        onConfirm={() => {
          if (!approvingId) return
          const res = p.ceoApproveRun(approvingId)
          toast.add({ title: res.ok ? "Payroll approved. Finance has been notified." : res.error })
        }}
      />

      <Dialog open={!!returning} onOpenChange={(o) => !o && setReturning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return payroll run</DialogTitle>
            <DialogDescription>Send back to Finance draft with your comment.</DialogDescription>
          </DialogHeader>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Explain what needs revision…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturning(null)}>Cancel</Button>
            <Button
              disabled={!comment.trim()}
              onClick={() => {
                if (!returning) return
                const res = p.returnRun(returning.id, comment)
                toast.add({ title: res.ok ? "Payroll returned to Finance draft" : res.error })
                if (res.ok) setReturning(null)
              }}
            >
              Return run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Employee "My Payslips" page (available to ALL roles via payroll:read-own).
 * Strictly filters to ONLY the signed-in employee's released payslips.
 */
export function MyPayslipsPage() {
  const currentUser = useBiz((s) => s.currentUser)
  const p = usePayroll()

  const mySlips = useMemo(() => {
    if (!currentUser) return []
    return p.runs
      .filter((r) => r.status === "released")
      .flatMap((r) => r.payslips)
      .filter((s) => s.employeeId === currentUser.id && s.status === "released")
  }, [p.runs, currentUser])

  const [selectedId, setSelectedId] = useState<string>(mySlips[0]?.id ?? "")
  const active = mySlips.find((s) => s.id === selectedId) ?? mySlips[0]

  const emp = p.employees.find((e) => e.employeeId === currentUser?.id)
  const govIds = emp
    ? { sss: emp.sssMasked, philHealth: emp.philHealthMasked, pagIbig: emp.pagIbigMasked, tin: emp.tinMasked }
    : undefined

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Payslips"
        description="Read-only view of your released payslips."
        actions={
          active ? (
            <Button size="sm" variant="outline" onClick={() => window.print()} className="print:hidden">
              <PrinterIcon className="size-4" />
              Print / Save PDF
            </Button>
          ) : undefined
        }
      />

      {mySlips.length === 0 ? (
        <Widget>
          <div className="px-(--card-spacing)">
            <EmptyBox title="No released payslips yet" description="Your payslips will appear here as soon as Finance releases payroll." />
          </div>
        </Widget>
      ) : (
        <>
          <NativeSelect
            value={active?.id ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            className="sm:w-64 print:hidden"
          >
            {mySlips.map((s) => (
              <NativeSelectOption key={s.id} value={s.id}>
                {s.periodLabel} (Pay date {s.payDate})
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {active && <PrintablePayslipCard slip={active} govIds={govIds} />}
        </>
      )}
    </div>
  )
}
