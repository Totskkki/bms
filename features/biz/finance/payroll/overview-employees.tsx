"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  BanknoteIcon,
  CameraIcon,
  CheckCircle2Icon,
  IdCardIcon,
  PencilIcon,
  PlayCircleIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { PillBars } from "@/components/chronicle/charts"
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
import { peso, pesoShort } from "../../metrics"
import { EmptyBox, ExportButtons, Grid, Panel, PesoAmount, Stat, TablePagination, usePagination } from "../../parts"
import { estimate13thMonth, summarizeByDepartment, type EmployeePayroll, type EmploymentStatus, type PayFrequency, type PayrollDepartment } from "./engine"
import { ConfirmActionDialog, phpExact, RunStatusBadge } from "./shared"
import { PAYROLL_DEPARTMENTS, usePayroll } from "./store"

export function PayrollOverviewPage() {
  const router = useRouter()
  const p = usePayroll()
  const [releaseRunId, setReleaseRunId] = useState<string | null>(null)
  const [resetOpen, setResetOpen] = useState(false)

  const latestCompleted = p.runs.find((r) => r.payslips.length > 0) ?? p.runs[0]
  const activeHeadcount = p.employees.filter((e) => e.status === "active").length
  const nextPayDate = p.runs.find((r) => r.status !== "released")?.payDate ?? p.periods[p.periods.length - 1]?.payDate ?? "—"

  const monthlyCost = useMemo(() => {
    return MONTHS.map((month, idx) => {
      const monthRuns = p.runs.filter((r) => r.monthIndex === idx && r.status === "released")
      const total = monthRuns.reduce((a, r) => a + r.totals.totalCost, 0)
      return { label: month, title: `${month} 2026`, value: Math.round(total) }
    })
  }, [p.runs])

  const deptCost = useMemo(() => {
    if (!latestCompleted || latestCompleted.payslips.length === 0) return []
    return summarizeByDepartment(latestCompleted.payslips).map((d) => ({
      label: d.department.replace(" and Marketing", ""),
      title: d.department,
      value: Math.round(d.grossPay + d.employerContributions),
    }))
  }, [latestCompleted])

  const runsPg = usePagination(p.runs, 10)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payroll Overview"
        description="Semi-monthly payroll runs, departmental cost breakdown, and approval status."
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
              <RotateCcwIcon className="size-4" />
              Reset demo data
            </Button>
            <Button size="sm" onClick={() => router.push("/finance/payroll/run")}>
              <PlayCircleIcon className="size-4" />
              Create payroll run
            </Button>
          </div>
        }
      />

      <Grid cols={3}>
        <Stat
          title="Gross payroll this period"
          value={<PesoAmount value={latestCompleted?.totals.grossPay ?? 0} compact />}
          caption={latestCompleted?.periodLabel ?? "No computed run"}
        />
        <Stat
          title="Total deductions"
          value={<PesoAmount value={latestCompleted?.totals.totalDeductions ?? 0} compact />}
          caption="Contributions, tax, loans, absences"
        />
        <Stat
          title="Net payroll"
          value={<PesoAmount value={latestCompleted?.totals.netPay ?? 0} compact className="text-success" />}
          caption="Take-home disbursement"
        />
        <Stat
          title="Employer contributions"
          value={<PesoAmount value={latestCompleted?.totals.employerContributions ?? 0} compact />}
          caption="Company SSS, PhilHealth, Pag-IBIG"
        />
        <Stat title="Active headcount" value={String(activeHeadcount)} caption={`${p.employees.length} total profiles`} />
        <Stat title="Next pay date" value={nextPayDate} caption="Scheduled release" />
      </Grid>

      <Grid cols={2}>
        <Panel title="Monthly payroll cost (last 6 months)">
          <div className="h-64">
            <PillBars data={monthlyCost} highlight="last" format={peso} barSize={26} className="h-full" />
          </div>
        </Panel>
        <Panel title="Payroll cost by department">
          {deptCost.length === 0 ? (
            <EmptyBox title="No computed run yet" />
          ) : (
            <div className="h-64">
              <PillBars data={deptCost} highlight="max" format={peso} barSize={28} className="h-full" />
            </div>
          )}
        </Panel>
      </Grid>

      <Panel title={`Payroll runs (${p.runs.length})`}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Pay Date</TableHead>
                <TableHead className="text-right">Headcount</TableHead>
                <TableHead className="text-right">Gross Pay</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right print:hidden">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runsPg.items.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium whitespace-nowrap">{run.periodLabel}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{run.payDate}</TableCell>
                  <TableCell className="text-right font-sans tabular-nums">{run.totals.headcount}</TableCell>
                  <TableCell className="text-right font-sans tabular-nums whitespace-nowrap">{phpExact(run.totals.grossPay)}</TableCell>
                  <TableCell className="text-right font-sans font-semibold tabular-nums whitespace-nowrap">{phpExact(run.totals.netPay)}</TableCell>
                  <TableCell><RunStatusBadge status={run.status} /></TableCell>
                  <TableCell className="text-right whitespace-nowrap print:hidden">
                    <div className="inline-flex items-center gap-1.5">
                      {(run.status === "draft" || run.status === "computed") && (
                        <Button size="xs" variant="outline" render={<Link href={`/finance/payroll/run?runId=${run.id}`} />}>
                          Open wizard
                        </Button>
                      )}
                      {run.status === "ceo_approved" && (
                        <Button size="xs" onClick={() => setReleaseRunId(run.id)}>
                          <CheckCircle2Icon className="size-3.5" />
                          Release (Pay)
                        </Button>
                      )}
                      {run.payslips.length > 0 && (
                        <Button size="xs" variant="ghost" render={<Link href={`/finance/payroll/register?runId=${run.id}`} />}>
                          Register
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination {...runsPg.pagination} />
        </div>
      </Panel>

      <ConfirmActionDialog
        open={releaseRunId !== null}
        onOpenChange={(o) => !o && setReleaseRunId(null)}
        title="Release payroll run?"
        description="Releasing marks this run as Paid, creates Salary expense entries for CEO & Finance dashboards, reduces employee loan balances, and notifies employees that their payslips are ready."
        confirmLabel="Release payroll"
        onConfirm={() => {
          if (!releaseRunId) return
          const res = p.releaseRun(releaseRunId)
          toast.add({ title: res.ok ? "Payroll released! Expenses, loans, and payslips updated." : res.error })
        }}
      />

      <ConfirmActionDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset payroll demo data?"
        description="Restores the 12 employees, 6 months of released runs, draft run, and sample loans."
        confirmLabel="Reset demo data"
        onConfirm={() => {
          p.resetDemo()
          toast.add({ title: "Payroll demo data restored" })
        }}
      />
    </div>
  )
}

const employeeSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  department: z.enum(["Sales and Marketing", "AM Reporters", "Finance", "Management"]),
  position: z.string().min(2, "Position is required"),
  employmentStatus: z.enum(["regular", "probationary", "contractual"]),
  dateHired: z.string().min(4, "Date hired is required"),
  monthlyBasic: z.coerce.number().min(1000, "Monthly basic must be at least ₱1,000"),
  monthlyAllowance: z.coerce.number().min(0, "Allowance cannot be negative"),
  payFrequency: z.enum(["semi-monthly", "monthly"]),
  sssMasked: z.string().min(4),
  philHealthMasked: z.string().min(4),
  pagIbigMasked: z.string().min(4),
  tinMasked: z.string().min(4),
})

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function PayrollEmployeesPage() {
  const p = usePayroll()
  const [search, setSearch] = useState("")
  const [dept, setDept] = useState("all")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EmployeePayroll | null>(null)
  const [extraGovIds, setExtraGovIds] = useState<{ label: string; value: string }[]>([])
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined)
  const photoInputRef = useRef<HTMLInputElement | null>(null)

  const form = useForm<z.input<typeof employeeSchema>, unknown, z.output<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      department: "Sales and Marketing",
      position: "",
      employmentStatus: "regular",
      dateHired: "2026-11-01",
      monthlyBasic: 25_000,
      monthlyAllowance: 2_000,
      payFrequency: "semi-monthly",
      sssMasked: "••••-1099",
      philHealthMasked: "••••-2099",
      pagIbigMasked: "••••-3099",
      tinMasked: "••••-4099",
    },
  })

  const filtered = useMemo(() => {
    return p.employees.filter((e) => {
      if (dept !== "all" && e.department !== dept) return false
      const q = search.trim().toLowerCase()
      if (q && !e.name.toLowerCase().includes(q) && !e.position.toLowerCase().includes(q)) return false
      return true
    })
  }, [p.employees, dept, search])
  const empPg = usePagination(filtered, 10)

  const ytdBasicMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const run of p.runs) {
      if (run.status !== "released") continue
      for (const slip of run.payslips) {
        map.set(slip.employeeId, (map.get(slip.employeeId) ?? 0) + slip.basicPay)
      }
    }
    return map
  }, [p.runs])

  const loanBalanceMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const l of p.loans) {
      if (l.status === "active") {
        map.set(l.employeeId, (map.get(l.employeeId) ?? 0) + l.remainingBalance)
      }
    }
    return map
  }, [p.loans])

  function openNew() {
    setEditing(null)
    setExtraGovIds([])
    setPhotoUrl(undefined)
    form.reset({
      name: "",
      department: "Sales and Marketing",
      position: "",
      employmentStatus: "regular",
      dateHired: "2026-11-01",
      monthlyBasic: 25_000,
      monthlyAllowance: 2_000,
      payFrequency: "semi-monthly",
      sssMasked: "••••-1099",
      philHealthMasked: "••••-2099",
      pagIbigMasked: "••••-3099",
      tinMasked: "••••-4099",
    })
    setOpen(true)
  }

  function openEdit(emp: EmployeePayroll) {
    setEditing(emp)
    setExtraGovIds(emp.extraGovIds ? emp.extraGovIds.map((x) => ({ ...x })) : [])
    setPhotoUrl(emp.photoUrl)
    form.reset({
      name: emp.name,
      department: emp.department,
      position: emp.position,
      employmentStatus: emp.employmentStatus,
      dateHired: emp.dateHired,
      monthlyBasic: emp.monthlyBasic,
      monthlyAllowance: emp.monthlyAllowance,
      payFrequency: emp.payFrequency,
      sssMasked: emp.sssMasked,
      philHealthMasked: emp.philHealthMasked,
      pagIbigMasked: emp.pagIbigMasked,
      tinMasked: emp.tinMasked,
    })
    setOpen(true)
  }

  function handlePhotoFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.add({ title: "Please choose an image file (JPG, PNG, or WebP)." })
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.add({ title: "Photo must be 3 MB or smaller." })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") setPhotoUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = form.handleSubmit((values) => {
    const cleanExtras = extraGovIds.filter((g) => g.label.trim() && g.value.trim())
    const payload = { ...values, extraGovIds: cleanExtras, photoUrl }
    const res = editing
      ? p.updateEmployee(editing.id, payload)
      : p.addEmployee({ ...payload, status: "active" })
    toast.add({ title: res.ok ? (editing ? "Employee payroll profile updated" : "Employee added to payroll") : res.error })
    if (res.ok) setOpen(false)
  })

  const watchedBasic = Number(form.watch("monthlyBasic")) || 0
  const watchedDaily = watchedBasic / Math.max(1, p.settings.workingDaysFactor)
  const watchedName = form.watch("name") || editing?.name || ""

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payroll Employees"
        description="Salary profiles, monthly allowances, loan balances, and running 13th month pay estimates."
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <ExportButtons
              filename="payroll-employees"
              headers={["Name", "Department", "Position", "Status", "Monthly Basic", "Allowance", "Loan Balance", "13th Month Est."]}
              rows={filtered.map((e) => [
                e.name,
                e.department,
                e.position,
                e.status,
                e.monthlyBasic,
                e.monthlyAllowance,
                loanBalanceMap.get(e.employeeId) ?? 0,
                estimate13thMonth(ytdBasicMap.get(e.employeeId) ?? 0),
              ])}
            />
            <Button size="sm" onClick={openNew}>
              <PlusIcon className="size-4" />
              Add employee
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row print:hidden">
        <Input placeholder="Search name or position…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        <NativeSelect value={dept} onChange={(e) => setDept(e.target.value)} className="sm:w-52">
          <NativeSelectOption value="all">All departments</NativeSelectOption>
          {PAYROLL_DEPARTMENTS.map((d) => (
            <NativeSelectOption key={d} value={d}>{d}</NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <Widget>
        <div className="overflow-x-auto px-(--card-spacing)">
          {filtered.length === 0 ? (
            <EmptyBox title="No matching employees" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Monthly Basic</TableHead>
                  <TableHead className="text-right">Allowance</TableHead>
                  <TableHead className="text-right">Loan Balance</TableHead>
                  <TableHead className="text-right">13th Mo. Est.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right print:hidden">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empPg.items.map((emp) => {
                  const loanBal = loanBalanceMap.get(emp.employeeId) ?? 0
                  const thirteenth = estimate13thMonth(ytdBasicMap.get(emp.employeeId) ?? 0)
                  return (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {emp.photoUrl ? (
                            <img
                              src={emp.photoUrl}
                              alt={emp.name}
                              className="size-8 shrink-0 rounded-full border object-cover"
                            />
                          ) : (
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-primary/10 text-xs font-semibold text-primary">
                              {initialsOf(emp.name)}
                            </div>
                          )}
                          <div>
                            <div>{emp.name}</div>
                            <div className="text-xs text-muted-foreground">{emp.position} · Hired {emp.dateHired}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{emp.department}</TableCell>
                      <TableCell className="text-right font-sans tabular-nums whitespace-nowrap">{phpExact(emp.monthlyBasic)}</TableCell>
                      <TableCell className="text-right font-sans tabular-nums whitespace-nowrap">{phpExact(emp.monthlyAllowance)}</TableCell>
                      <TableCell className="text-right font-sans tabular-nums whitespace-nowrap">
                        {loanBal > 0 ? <span className="text-warning-foreground dark:text-warning">{phpExact(loanBal)}</span> : "—"}
                      </TableCell>
                      <TableCell className="text-right font-sans tabular-nums whitespace-nowrap text-muted-foreground">
                        {pesoShort(thirteenth)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={emp.status === "active" ? "success" : "muted"} className="capitalize">
                          {emp.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap print:hidden">
                        <div className="inline-flex items-center gap-1.5">
                          <Button size="xs" variant="outline" onClick={() => openEdit(emp)}>
                            <PencilIcon className="size-3.5" />
                            Edit
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => {
                              const res = p.toggleEmployeeStatus(emp.id)
                              toast.add({ title: res.ok ? `Updated ${emp.name} status` : res.error })
                            }}
                          >
                            {emp.status === "active" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          <TablePagination {...empPg.pagination} />
        </div>
      </Widget>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add payroll employee"}</DialogTitle>
            <DialogDescription>
              Manage employment details, compensation, and masked government mandatory IDs. Salary changes are logged in the CEO audit trail.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            {/* Section 1: Employee Details */}
            <div className="flex flex-col gap-3 rounded-xl border bg-muted/15 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <UserIcon className="size-3.5 text-primary" />
                Employee Information
              </div>

              {/* Employee Photo Picker */}
              <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-background/60 p-3">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-primary/10 text-base font-semibold text-primary transition hover:border-primary/60"
                  aria-label="Upload employee photo"
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt={watchedName || "Employee"} className="size-full object-cover" />
                  ) : (
                    <span>{initialsOf(watchedName)}</span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition group-hover:opacity-100">
                    <CameraIcon className="size-4" />
                  </span>
                </button>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="text-sm font-medium">Employee photo</div>
                  <p className="text-xs text-muted-foreground">Optional portrait shown on the payroll directory. JPG, PNG or WebP · Max 3 MB.</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        handlePhotoFile(e.target.files?.[0])
                        e.target.value = ""
                      }}
                    />
                    <Button type="button" size="xs" variant="outline" onClick={() => photoInputRef.current?.click()}>
                      <CameraIcon className="size-3.5" />
                      {photoUrl ? "Change photo" : "Upload photo"}
                    </Button>
                    {photoUrl && (
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setPhotoUrl(undefined)}
                      >
                        <XIcon className="size-3.5" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pe-name">Full name</Label>
                  <Input id="pe-name" {...form.register("name")} placeholder="e.g. Juan Dela Cruz" />
                  {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pe-pos">Position / Title</Label>
                  <Input id="pe-pos" {...form.register("position")} placeholder="e.g. Account Executive" />
                  {form.formState.errors.position && <p className="text-xs text-destructive">{form.formState.errors.position.message}</p>}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pe-dept">Department</Label>
                  <NativeSelect
                    id="pe-dept"
                    value={form.watch("department")}
                    onChange={(e) => form.setValue("department", e.target.value as PayrollDepartment)}
                  >
                    {PAYROLL_DEPARTMENTS.map((d) => (
                      <NativeSelectOption key={d} value={d}>{d}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pe-stat">Employment status</Label>
                  <NativeSelect
                    id="pe-stat"
                    value={form.watch("employmentStatus")}
                    onChange={(e) => form.setValue("employmentStatus", e.target.value as EmploymentStatus)}
                  >
                    <NativeSelectOption value="regular">Regular</NativeSelectOption>
                    <NativeSelectOption value="probationary">Probationary</NativeSelectOption>
                    <NativeSelectOption value="contractual">Contractual</NativeSelectOption>
                  </NativeSelect>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pe-hire">Date hired</Label>
                  <Input id="pe-hire" type="date" {...form.register("dateHired")} />
                </div>
              </div>
            </div>

            {/* Section 2: Compensation */}
            <div className="flex flex-col gap-3 rounded-xl border bg-muted/15 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <BanknoteIcon className="size-3.5 text-primary" />
                  Compensation &amp; Pay Schedule
                </span>
                <span className="font-sans text-[11px] text-muted-foreground tabular-nums">
                  Daily {phpExact(watchedDaily)} · Semi-mo {phpExact(watchedBasic / 2)}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pe-basic">Monthly basic (₱)</Label>
                  <Input id="pe-basic" type="number" inputMode="decimal" min={0} {...form.register("monthlyBasic")} />
                  {form.formState.errors.monthlyBasic && <p className="text-xs text-destructive">{form.formState.errors.monthlyBasic.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pe-allow">Monthly allowance (₱)</Label>
                  <Input id="pe-allow" type="number" inputMode="decimal" min={0} {...form.register("monthlyAllowance")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pe-freq">Pay frequency</Label>
                  <NativeSelect
                    id="pe-freq"
                    value={form.watch("payFrequency")}
                    onChange={(e) => form.setValue("payFrequency", e.target.value as PayFrequency)}
                  >
                    <NativeSelectOption value="semi-monthly">Semi-monthly</NativeSelectOption>
                    <NativeSelectOption value="monthly">Monthly</NativeSelectOption>
                  </NativeSelect>
                </div>
              </div>
            </div>

            {/* Section 3: Government & Mandatory IDs */}
            <div className="flex flex-col gap-3 rounded-xl border bg-muted/15 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <IdCardIcon className="size-3.5 text-primary" />
                  Government &amp; Mandatory IDs (Masked)
                </span>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => setExtraGovIds((prev) => [...prev, { label: "", value: "••••-" }])}
                >
                  <PlusIcon className="size-3.5" />
                  Add mandatory ID
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pe-sss">SSS No.</Label>
                  <Input id="pe-sss" {...form.register("sssMasked")} placeholder="••••-1099" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pe-phic">PhilHealth No.</Label>
                  <Input id="pe-phic" {...form.register("philHealthMasked")} placeholder="••••-2099" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pe-hdmf">Pag-IBIG (HDMF) No.</Label>
                  <Input id="pe-hdmf" {...form.register("pagIbigMasked")} placeholder="••••-3099" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="pe-tin">TIN (BIR)</Label>
                  <Input id="pe-tin" {...form.register("tinMasked")} placeholder="••••-4099" />
                </div>
              </div>

              {extraGovIds.length > 0 && (
                <div className="flex flex-col gap-2 border-t pt-3">
                  <p className="text-[11px] font-medium text-muted-foreground">Additional Mandatory / Benefit IDs</p>
                  {extraGovIds.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                      <Input
                        className="h-8 text-xs"
                        placeholder="Label (e.g. HMO, PRC, BIR RDO)"
                        value={item.label}
                        onChange={(e) =>
                          setExtraGovIds((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x))
                          )
                        }
                      />
                      <Input
                        className="h-8 text-xs"
                        placeholder="Masked ID (e.g. ••••-8821)"
                        value={item.value}
                        onChange={(e) =>
                          setExtraGovIds((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, value: e.target.value } : x))
                          )
                        }
                      />
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        aria-label="Remove ID"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setExtraGovIds((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save changes" : "Add employee"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
