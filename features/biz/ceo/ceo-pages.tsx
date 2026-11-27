"use client"

import { CheckIcon, EyeIcon, RotateCcwIcon, ShieldCheckIcon } from "lucide-react"
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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { PillBars, StepLines } from "@/components/chronicle/charts"
import { PageHeader } from "@/kit/ui-patterns/page-header"
import { StatusBadge } from "@/kit/ui-patterns/status-badge"
import { Widget } from "@/kit/widgets/widget"

import {
  balances,
  employeePerformance,
  expenseByCategory,
  monthly,
  peso,
  pesoShort,
  TARGET,
  totals,
} from "../metrics"
import {
  Bars,
  EmptyBox,
  ExportButtons,
  Grid,
  Panel,
  PesoAmount,
  ReportStatusBadge,
  ReportTimeline,
  StageBadge,
  Stat,
  TablePagination,
  usePagination,
} from "../parts"
import { MONTHS, NOW, useBiz, type Report } from "../store"
import { CeoPayrollApprovalsSection } from "../finance/payroll/approvals-mypayslips"
import { EmployeePerformancePanel } from "./people-actions"

export function CeoSalesPage() {
  const s = useBiz()
  const now = totals(s, NOW)
  const all = totals(s)
  const openDeals = s.deals.filter((d) => d.stage !== "confirmed")
  const [stage, setStage] = useState("all")
  const filtered = s.deals.filter((d) => stage === "all" || d.stage === stage)
  const pg = usePagination(filtered, 10)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sales and Marketing"
        description="Executive read-only summary of pipeline, confirmed sales, and campaigns."
        actions={
          <ExportButtons
            filename="ceo-sales-summary"
            headers={["Customer", "Stage", "Amount", "Owner", "Month"]}
            rows={filtered.map((d) => [d.customer, d.stage, d.amount, d.owner, MONTHS[d.month]])}
          />
        }
      />

      <Grid>
        <Stat title="Confirmed sales (6 mo)" value={<PesoAmount value={all.sales} compact />} caption="All confirmed deals" />
        <Stat title="This month sales" value={<PesoAmount value={now.sales} compact />} caption={`${Math.round((now.sales / TARGET) * 100)}% of ${pesoShort(TARGET)} target`} />
        <Stat title="Active pipeline" value={String(openDeals.length)} caption="Inquiries, leads, proposals" />
        <Stat title="Marketing leads" value={String(s.marketingActivities.reduce((a, m) => a + m.leadsGenerated, 0))} caption={`${s.marketingActivities.length} campaigns`} />
      </Grid>

      <Panel title="Monthly confirmed sales">
        <div className="h-64">
          <PillBars
            data={monthly(s).map((m) => ({ label: m.month, title: `${m.month} 2026`, value: m.sales }))}
            highlight="last"
            format={peso}
            barSize={26}
            className="h-full"
          />
        </div>
      </Panel>

      <Panel
        title="Pipeline & confirmed deals"
        action={
          <NativeSelect size="sm" value={stage} onChange={(e) => setStage(e.target.value)} className="w-36 print:hidden">
            <NativeSelectOption value="all">All stages</NativeSelectOption>
            <NativeSelectOption value="inquiry">Inquiry</NativeSelectOption>
            <NativeSelectOption value="lead">Lead</NativeSelectOption>
            <NativeSelectOption value="proposal">Proposal</NativeSelectOption>
            <NativeSelectOption value="confirmed">Confirmed</NativeSelectOption>
          </NativeSelect>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Month</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pg.items.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.customer}</TableCell>
                  <TableCell><StageBadge stage={d.stage} /></TableCell>
                  <TableCell className="font-sans tabular-nums">{peso(d.amount)}</TableCell>
                  <TableCell>{d.owner}</TableCell>
                  <TableCell className="text-muted-foreground">{MONTHS[d.month]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination {...pg.pagination} />
        </div>
      </Panel>
    </div>
  )
}

export function CeoReportersPage() {
  const s = useBiz()
  const reporterReports = s.reports.filter((r) => r.department === "reporters")
  const totalPhotos = s.activities.reduce((a, x) => a + x.photos, 0) + s.photos.length
  const pg = usePagination(s.activities, 10)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AM Reporters"
        description="Executive summary of field coverage, accomplishments, and attendance."
        actions={
          <ExportButtons
            filename="ceo-reporters-summary"
            headers={["Activity", "Reporter", "Location", "Date", "Photos"]}
            rows={s.activities.map((a) => [a.title, a.by, a.place, a.date, a.photos])}
          />
        }
      />

      <Grid>
        <Stat title="Field activities" value={String(s.activities.length)} caption="Logged this month" />
        <Stat title="Documented photos" value={String(totalPhotos)} caption="Across field coverages" />
        <Stat title="Reports submitted" value={String(reporterReports.length)} caption="Daily, weekly, monthly" />
        <Stat title="Attendance logged" value={String(s.attendance.length)} caption="Active field check-ins" />
      </Grid>

      <Panel title="Recent field accomplishments">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Photos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pg.items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.title}</TableCell>
                  <TableCell>{a.by}</TableCell>
                  <TableCell>{a.place}</TableCell>
                  <TableCell className="text-muted-foreground">{a.date}</TableCell>
                  <TableCell className="text-right font-sans tabular-nums">{a.photos}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination {...pg.pagination} />
        </div>
      </Panel>
    </div>
  )
}

export function CeoFinancePage() {
  const s = useBiz()
  const all = totals(s)
  const unpaidBills = s.payables.filter((p) => p.status === "unpaid")
  const unpaidReceivables = balances(s).filter((b) => b.balance > 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Finance"
        description="Executive financial overview across income, expenses, receivables, and payables."
        actions={
          <ExportButtons
            filename="ceo-finance-summary"
            headers={["Month", "Collections", "Expenses", "Net Profit", "Receivables"]}
            rows={monthly(s).map((m) => [m.month, m.collections, m.expenses, m.profit, m.receivables])}
          />
        }
      />

      <Grid>
        <Stat title="Total collections" value={<PesoAmount value={all.collections} compact />} caption="6-month payments received" />
        <Stat title="Total expenses" value={<PesoAmount value={all.expenses} compact />} caption="All departments" />
        <Stat title="Outstanding receivables" value={<PesoAmount value={all.receivables} compact />} caption={`${unpaidReceivables.length} unpaid invoices`} />
        <Stat title="Accounts payable" value={<PesoAmount value={unpaidBills.reduce((a, b) => a + b.amount, 0)} compact />} caption={`${unpaidBills.length} unpaid bills`} />
      </Grid>

      <Grid cols={2}>
        <Panel title="Monthly cash flow (collections vs expenses)">
          <div className="h-64">
            <StepLines
              data={monthly(s).map((m) => ({ month: m.month, collections: m.collections, expenses: m.expenses }))}
              xKey="month"
              series={[
                { key: "collections", label: "Collections", color: "var(--chart-lead)" },
                { key: "expenses", label: "Expenses", color: "var(--chart-2)" },
              ]}
              format={pesoShort}
              className="h-full"
            />
          </div>
        </Panel>
        <Panel title="This month expenses by category">
          <div className="h-64">
            <PillBars
              data={expenseByCategory(s).map((c) => ({ label: c.category, title: c.category, value: c.amount }))}
              highlight="max"
              format={peso}
              barSize={26}
              className="h-full"
            />
          </div>
        </Panel>
      </Grid>
    </div>
  )
}

export function CeoEmployeesPage() {
  const s = useBiz()
  const [dept, setDept] = useState("all")
  const [search, setSearch] = useState("")

  const rows = useMemo(() => {
    return employeePerformance(s).filter((r) => {
      if (dept !== "all" && r.department !== dept) return false
      if (search.trim() && !r.name.toLowerCase().includes(search.trim().toLowerCase())) return false
      return true
    })
  }, [s, dept, search])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employee Performance"
        description="Ranked monthly results vs target across departments."
        actions={
          <ExportButtons
            filename="employee-performance"
            headers={["Employee", "Department", "This Month", "Target", "% of Target"]}
            rows={rows.map((r) => [r.name, r.department, r.result, r.target, `${r.pct}%`])}
          />
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row print:hidden">
        <Input
          placeholder="Search employee…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <NativeSelect value={dept} onChange={(e) => setDept(e.target.value)} className="sm:w-48">
          <NativeSelectOption value="all">All departments</NativeSelectOption>
          <NativeSelectOption value="Sales">Sales</NativeSelectOption>
          <NativeSelectOption value="AM Reporters">AM Reporters</NativeSelectOption>
        </NativeSelect>
      </div>

      <EmployeePerformancePanel rows={rows} />
    </div>
  )
}

export function CeoApprovalsPage() {
  const s = useBiz()
  const pending = s.reports.filter((r) => r.status === "sent_to_ceo" && r.department === "management")
  const [returning, setReturning] = useState<Report | null>(null)
  const [comment, setComment] = useState("")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Approvals"
        description="Consolidated reports and payroll runs awaiting your executive approval."
      />

      <CeoPayrollApprovalsSection />

      {pending.length === 0 ? (
        <Widget>
          <div className="px-(--card-spacing)">
            <EmptyBox title="Nothing waiting for your approval." description="When the Manager submits a consolidated report, it appears here." />
          </div>
        </Widget>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.map((report) => {
            const bundled = (report.bundledReportIds ?? [])
              .map((id) => s.reports.find((r) => r.id === id))
              .filter((r): r is Report => Boolean(r))
            return (
              <Widget key={report.id}>
                <div className="flex flex-col gap-4 px-(--card-spacing)">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">{report.title}</h3>
                        <ReportStatusBadge status={report.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Submitted by {report.authorName} · {report.period} · {report.kind}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 print:hidden">
                      <Button
                        size="sm"
                        onClick={() => {
                          const res = s.approveReport(report.id)
                          toast.add({ title: res.ok ? `Approved "${report.title}"` : res.error })
                        }}
                      >
                        <CheckIcon className="size-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReturning(report)
                          setComment("")
                        }}
                      >
                        <RotateCcwIcon className="size-4" />
                        Return with comment
                      </Button>
                    </div>
                  </div>

                  <p className="rounded-xl border bg-muted/25 p-3.5 text-sm">{report.content}</p>

                  {bundled.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                        Included departmental reports ({bundled.length})
                      </p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {bundled.map((b) => (
                          <div key={b.id} className="rounded-lg border p-2.5 text-xs">
                            <p className="font-medium">{b.title}</p>
                            <p className="mt-0.5 text-muted-foreground capitalize">
                              {b.department} · {b.authorName}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Status timeline</p>
                    <ReportTimeline report={report} />
                  </div>
                </div>
              </Widget>
            )
          })}
        </div>
      )}

      <Dialog open={!!returning} onOpenChange={(o) => !o && setReturning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return consolidated report</DialogTitle>
            <DialogDescription>
              {returning ? `Provide feedback for ${returning.authorName} on "${returning.title}".` : ""}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write what needs to be revised before approval…"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturning(null)}>Cancel</Button>
            <Button
              disabled={!comment.trim()}
              onClick={() => {
                if (!returning) return
                const res = s.returnReport(returning.id, comment)
                toast.add({ title: res.ok ? `Returned "${returning.title}"` : res.error })
                if (res.ok) setReturning(null)
              }}
            >
              Return report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function CeoReportsPage() {
  const s = useBiz()
  const [search, setSearch] = useState("")
  const [dept, setDept] = useState("all")
  const [status, setStatus] = useState("all")
  const [viewing, setViewing] = useState<Report | null>(null)

  const filtered = useMemo(() => {
    return s.reports.filter((r) => {
      if (dept !== "all" && r.department !== dept) return false
      if (status !== "all" && r.status !== status) return false
      if (search.trim() && !r.title.toLowerCase().includes(search.trim().toLowerCase())) return false
      return true
    })
  }, [s.reports, dept, status, search])

  const reportsPg = usePagination(filtered, 10)
  const auditPg = usePagination(s.auditLogs, 10)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports & Audit Log"
        description="All departmental and consolidated reports, plus the company audit trail."
        actions={
          <ExportButtons
            filename="all-company-reports"
            headers={["Title", "Department", "Type", "Author", "Period", "Status"]}
            rows={filtered.map((r) => [r.title, r.department, r.kind, r.authorName, r.period, r.status])}
          />
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row print:hidden">
        <Input
          placeholder="Search reports…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <NativeSelect value={dept} onChange={(e) => setDept(e.target.value)} className="sm:w-44">
          <NativeSelectOption value="all">All departments</NativeSelectOption>
          <NativeSelectOption value="management">Management</NativeSelectOption>
          <NativeSelectOption value="sales">Sales</NativeSelectOption>
          <NativeSelectOption value="reporters">AM Reporters</NativeSelectOption>
          <NativeSelectOption value="finance">Finance</NativeSelectOption>
        </NativeSelect>
        <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-44">
          <NativeSelectOption value="all">All statuses</NativeSelectOption>
          <NativeSelectOption value="submitted">Submitted</NativeSelectOption>
          <NativeSelectOption value="reviewed">Reviewed</NativeSelectOption>
          <NativeSelectOption value="sent_to_ceo">Sent to CEO</NativeSelectOption>
          <NativeSelectOption value="approved">Approved</NativeSelectOption>
          <NativeSelectOption value="returned">Returned</NativeSelectOption>
        </NativeSelect>
      </div>

      <Panel title={`All reports (${filtered.length})`}>
        {filtered.length === 0 ? (
          <EmptyBox title="No matching reports" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right print:hidden">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportsPg.items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell className="capitalize">{r.department}</TableCell>
                    <TableCell className="capitalize">{r.kind}</TableCell>
                    <TableCell>{r.authorName}</TableCell>
                    <TableCell><ReportStatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-right print:hidden">
                      <Button size="xs" variant="outline" onClick={() => setViewing(r)}>
                        <EyeIcon className="size-3.5" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination {...reportsPg.pagination} />
          </div>
        )}
      </Panel>

      <Panel
        title="Audit log"
        action={
          <StatusBadge tone="info" dot={false}>
            <ShieldCheckIcon className="size-3" />
            CEO visibility
          </StatusBadge>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditPg.items.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{log.at}</TableCell>
                  <TableCell className="whitespace-nowrap font-medium">{log.actorName}</TableCell>
                  <TableCell className="whitespace-nowrap">{log.action}</TableCell>
                  <TableCell className="whitespace-nowrap">{log.target}</TableCell>
                  <TableCell className="text-muted-foreground">{log.detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination {...auditPg.pagination} />
        </div>
      </Panel>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          {viewing && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2">
                  <DialogTitle>{viewing.title}</DialogTitle>
                  <ReportStatusBadge status={viewing.status} />
                </div>
                <DialogDescription>
                  {viewing.department} · {viewing.kind} · {viewing.period} · By {viewing.authorName}
                </DialogDescription>
              </DialogHeader>
              <p className="rounded-lg border bg-muted/25 p-3 text-sm whitespace-pre-wrap">{viewing.content}</p>
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Status timeline</p>
                <ReportTimeline report={viewing} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
