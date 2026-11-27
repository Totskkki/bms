"use client"

import { PrinterIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/kit/ui-patterns/page-header"
import { Widget } from "@/kit/widgets/widget"

import { EmptyBox, ExportButtons, TablePagination, usePagination } from "../../parts"
import { summarizeRun } from "./engine"
import { phpExact, PrintablePayslipCard, RunStatusBadge } from "./shared"
import { PAYROLL_DEPARTMENTS, usePayroll } from "./store"

export function PayrollRegisterPage() {
  const p = usePayroll()
  const runsWithSlips = p.runs.filter((r) => r.payslips.length > 0)
  const [runId, setRunId] = useState<string>(runsWithSlips[0]?.id ?? "")
  const [dept, setDept] = useState("all")

  const run = runsWithSlips.find((r) => r.id === runId) ?? runsWithSlips[0]
  const filtered = useMemo(() => {
    if (!run) return []
    return run.payslips.filter((s) => dept === "all" || s.department === dept)
  }, [run, dept])
  const pg = usePagination(filtered, 10)
  const totals = useMemo(() => summarizeRun(filtered), [filtered])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payroll Register"
        description="Complete earnings, deductions, employer shares, and net pay per employee."
        actions={
          run ? (
            <ExportButtons
              filename={`payroll-register-${run.periodId}`}
              headers={[
                "Employee",
                "Department",
                "Basic",
                "Allowance",
                "OT/Holiday/ND",
                "Additions",
                "Gross",
                "Abs/Late",
                "SSS (EE)",
                "PhilHealth (EE)",
                "Pag-IBIG (EE)",
                "Tax",
                "Loans/Other",
                "Total Deductions",
                "Net Pay",
                "Employer Shares",
              ]}
              rows={filtered.map((s) => [
                s.employeeName,
                s.department,
                s.basicPay,
                s.allowance,
                s.overtimePay + s.restDayOvertimePay + s.holidayPay + s.nightDiffPay,
                s.additions,
                s.totalEarnings,
                s.absenceDeduction + s.lateDeduction,
                s.sssEmployee,
                s.philHealthEmployee,
                s.pagIbigEmployee,
                s.withholdingTax,
                s.loanDeductions + s.otherDeductions,
                s.totalDeductions,
                s.netPay,
                s.totalEmployerShares,
              ])}
            />
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <NativeSelect value={run?.id ?? ""} onChange={(e) => setRunId(e.target.value)} className="sm:w-64">
          {runsWithSlips.map((r) => (
            <NativeSelectOption key={r.id} value={r.id}>
              {r.periodLabel} ({r.status})
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect value={dept} onChange={(e) => setDept(e.target.value)} className="sm:w-52">
          <NativeSelectOption value="all">All departments</NativeSelectOption>
          {PAYROLL_DEPARTMENTS.map((d) => (
            <NativeSelectOption key={d} value={d}>{d}</NativeSelectOption>
          ))}
        </NativeSelect>
        {run && <RunStatusBadge status={run.status} />}
      </div>

      <Widget>
        <div className="overflow-x-auto px-(--card-spacing)">
          {filtered.length === 0 ? (
            <EmptyBox title="No computed payslips for this run" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Dept</TableHead>
                  <TableHead className="text-right">Basic</TableHead>
                  <TableHead className="text-right">OT/Allow</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Gov. Contrib</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Loans/Other</TableHead>
                  <TableHead className="text-right">Total Ded.</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pg.items.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium whitespace-nowrap">{s.employeeName}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{s.department}</TableCell>
                    <TableCell className="text-right font-sans text-xs tabular-nums">{phpExact(s.basicPay)}</TableCell>
                    <TableCell className="text-right font-sans text-xs tabular-nums">
                      {phpExact(s.allowance + s.overtimePay + s.restDayOvertimePay + s.holidayPay + s.nightDiffPay + s.additions)}
                    </TableCell>
                    <TableCell className="text-right font-sans text-xs font-medium tabular-nums">{phpExact(s.totalEarnings)}</TableCell>
                    <TableCell className="text-right font-sans text-xs tabular-nums">
                      {phpExact(s.sssEmployee + s.philHealthEmployee + s.pagIbigEmployee)}
                    </TableCell>
                    <TableCell className="text-right font-sans text-xs tabular-nums">{phpExact(s.withholdingTax)}</TableCell>
                    <TableCell className="text-right font-sans text-xs tabular-nums">
                      {phpExact(s.loanDeductions + s.otherDeductions + s.absenceDeduction + s.lateDeduction)}
                    </TableCell>
                    <TableCell className="text-right font-sans text-xs text-destructive tabular-nums">
                      -{phpExact(s.totalDeductions)}
                    </TableCell>
                    <TableCell className="text-right font-sans text-xs font-semibold text-success tabular-nums">
                      {phpExact(s.netPay)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell colSpan={4}>Totals ({totals.headcount} employees)</TableCell>
                  <TableCell className="text-right font-sans text-xs tabular-nums">{phpExact(totals.grossPay)}</TableCell>
                  <TableCell colSpan={3} />
                  <TableCell className="text-right font-sans text-xs text-destructive tabular-nums">-{phpExact(totals.totalDeductions)}</TableCell>
                  <TableCell className="text-right font-sans text-xs text-success tabular-nums">{phpExact(totals.netPay)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
          <TablePagination {...pg.pagination} />
        </div>
      </Widget>
    </div>
  )
}

export function PayrollPayslipsPage() {
  const p = usePayroll()
  const runsWithSlips = p.runs.filter((r) => r.payslips.length > 0)
  const [runId, setRunId] = useState<string>(runsWithSlips[0]?.id ?? "")
  const [empId, setEmpId] = useState<string>("all-single")
  const [printAllMode, setPrintAllMode] = useState(false)

  const run = runsWithSlips.find((r) => r.id === runId) ?? runsWithSlips[0]
  const slips = run?.payslips ?? []
  const activeSlip = slips.find((s) => s.employeeId === empId) ?? slips[0]

  function govIdsFor(employeeId: string) {
    const emp = p.employees.find((e) => e.employeeId === employeeId)
    if (!emp) return undefined
    return {
      sss: emp.sssMasked,
      philHealth: emp.philHealthMasked,
      pagIbig: emp.pagIbigMasked,
      tin: emp.tinMasked,
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payslips"
        description="View and print individual payslips or print the full batch with page breaks."
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button
              size="sm"
              variant="outline"
              disabled={!activeSlip}
              onClick={() => {
                setPrintAllMode(false)
                setTimeout(() => window.print(), 60)
              }}
            >
              <PrinterIcon className="size-4" />
              Print or Save as PDF
            </Button>
            <Button
              size="sm"
              disabled={slips.length === 0}
              onClick={() => {
                setPrintAllMode(true)
                setTimeout(() => window.print(), 100)
              }}
            >
              <PrinterIcon className="size-4" />
              Download all payslips ({slips.length})
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <NativeSelect
          value={run?.id ?? ""}
          onChange={(e) => {
            setRunId(e.target.value)
            setPrintAllMode(false)
          }}
          className="sm:w-64"
        >
          {runsWithSlips.map((r) => (
            <NativeSelectOption key={r.id} value={r.id}>
              {r.periodLabel} ({r.status})
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          value={activeSlip?.employeeId ?? ""}
          onChange={(e) => {
            setEmpId(e.target.value)
            setPrintAllMode(false)
          }}
          className="sm:w-64"
        >
          {slips.map((s) => (
            <NativeSelectOption key={s.id} value={s.employeeId}>
              {s.employeeName} — {s.department}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {printAllMode ? (
        <div className="flex flex-col gap-6">
          {slips.map((s) => (
            <PrintablePayslipCard key={s.id} slip={s} govIds={govIdsFor(s.employeeId)} />
          ))}
        </div>
      ) : activeSlip ? (
        <PrintablePayslipCard slip={activeSlip} govIds={govIdsFor(activeSlip.employeeId)} />
      ) : (
        <EmptyBox title="No payslips generated yet" description="Compute a payroll run first." />
      )}
    </div>
  )
}
