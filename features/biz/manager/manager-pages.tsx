"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CheckIcon, PlusIcon, RotateCcwIcon, SendIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { PageHeader } from "@/kit/ui-patterns/page-header"
import { Widget, WidgetHeader } from "@/kit/widgets/widget"

import {
  departmentScores,
  employeePerformance,
  peso,
  pesoShort,
  TARGET,
  totals,
} from "../metrics"
import {
  DashboardGreetingHeader,
  EmptyBox,
  ExportButtons,
  Grid,
  Panel,
  PesoAmount,
  PriorityBadge,
  ReportStatusBadge,
  ReportTimeline,
  Stat,
  TablePagination,
  TaskStatusBadge,
  usePagination,
} from "../parts"
import { DEMO_ACCOUNTS, NOW, useBiz, type Report, type TaskPriority, type TaskStatus } from "../store"
import { DepartmentPerformanceChart } from "../ceo/charts"
import { EmployeePerformancePanel } from "../ceo/people-actions"

export function ManagerOverviewPage() {
  const s = useBiz()
  const now = totals(s, NOW)
  const scores = departmentScores(s, "1m")
  const openTasks = s.tasks.filter((t) => t.status !== "done")
  const pendingReview = s.reports.filter((r) => r.status === "submitted")

  const deptCards = [
    {
      name: "Sales & Marketing",
      target: pesoShort(TARGET),
      actual: pesoShort(now.sales),
      openTasks: openTasks.filter((t) => t.department === "sales").length,
      pendingReports: pendingReview.filter((r) => r.department === "sales").length,
      score: scores.find((d) => d.dept === "Sales")?.score ?? 0,
    },
    {
      name: "AM Reporters",
      target: "6 outputs",
      actual: `${s.activities.length + s.reports.filter((r) => r.department === "reporters").length} outputs`,
      openTasks: openTasks.filter((t) => t.department === "reporters").length,
      pendingReports: pendingReview.filter((r) => r.department === "reporters").length,
      score: scores.find((d) => d.dept === "AM Reporters")?.score ?? 0,
    },
    {
      name: "Finance",
      target: pesoShort(now.sales),
      actual: pesoShort(now.collections),
      openTasks: openTasks.filter((t) => t.department === "finance").length,
      pendingReports: pendingReview.filter((r) => r.department === "finance").length,
      score: scores.find((d) => d.dept === "Finance")?.score ?? 0,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <DashboardGreetingHeader
        summary={`${openTasks.length} open tasks · ${pendingReview.length} reports awaiting review`}
      />

      <Grid cols={3}>
        {deptCards.map((d) => (
          <Widget key={d.name}>
            <WidgetHeader title={d.name} />
            <div className="flex flex-col gap-3 px-(--card-spacing) text-sm">
              <div className="flex items-baseline justify-between">
                <span className="font-sans text-2xl font-semibold tabular-nums">{d.actual}</span>
                <span className="text-xs text-muted-foreground">Target {d.target}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${d.score >= 80 ? "bg-success" : d.score >= 50 ? "bg-warning" : "bg-destructive"}`}
                  style={{ width: `${d.score}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{d.openTasks} open tasks</span>
                <span>{d.pendingReports} reports to review</span>
              </div>
            </div>
          </Widget>
        ))}
      </Grid>

      <Grid cols={2}>
        <DepartmentPerformanceChart data={scores} />
        <Panel title="Operations snapshot">
          <div className="grid grid-cols-2 gap-3">
            <Stat title="Reports to review" value={String(pendingReview.length)} caption="From employees" />
            <Stat title="Open tasks" value={String(openTasks.length)} caption="Across all teams" />
            <Stat title="Reviewed & ready" value={String(s.reports.filter((r) => r.status === "reviewed").length)} caption="Ready to consolidate" />
            <Stat title="Field activities" value={String(s.activities.length)} caption="Logged this month" />
          </div>
        </Panel>
      </Grid>
    </div>
  )
}

const taskSchema = z.object({
  title: z.string().min(3, "Task title is required"),
  description: z.string().min(3, "Short description is required"),
  toId: z.string().min(1, "Select an employee"),
  dueDate: z.string().min(4, "Due date is required"),
  priority: z.enum(["low", "medium", "high"]),
})

export function ManagerTasksPage() {
  const s = useBiz()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")

  const staff = DEMO_ACCOUNTS.filter((u) => u.role === "sales" || u.role === "reporter" || u.role === "finance")

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      toId: staff[0]?.id ?? "",
      dueDate: "2026-11-30",
      priority: "medium",
    },
  })

  const filtered = s.tasks.filter((t) => {
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false
    if (search.trim() && !t.title.toLowerCase().includes(search.trim().toLowerCase()) && !t.to.toLowerCase().includes(search.trim().toLowerCase())) {
      return false
    }
    return true
  })

  const columns: { status: TaskStatus; label: string }[] = [
    { status: "todo", label: "To do" },
    { status: "in_progress", label: "In progress" },
    { status: "done", label: "Completed" },
  ]

  const onSubmit = form.handleSubmit((values) => {
    const res = s.assignTask(values)
    toast.add({ title: res.ok ? "Task assigned and notification sent" : res.error })
    if (res.ok) {
      form.reset()
      setOpen(false)
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assign Tasks"
        description="Create and track departmental tasks and field assignments."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <PlusIcon className="size-4" />
            New task
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Search task or assignee…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <NativeSelect value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="sm:w-44">
          <NativeSelectOption value="all">All priorities</NativeSelectOption>
          <NativeSelectOption value="high">High</NativeSelectOption>
          <NativeSelectOption value="medium">Medium</NativeSelectOption>
          <NativeSelectOption value="low">Low</NativeSelectOption>
        </NativeSelect>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((col) => {
          const items = filtered.filter((t) => t.status === col.status)
          return (
            <Panel key={col.status} title={`${col.label} (${items.length})`}>
              {items.length === 0 ? (
                <EmptyBox title={`No ${col.label.toLowerCase()} tasks`} />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {items.map((t) => (
                    <div key={t.id} className="flex flex-col gap-2 rounded-xl border bg-muted/20 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-snug">{t.title}</p>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>{t.to}</span>
                        <span>Due {t.dueDate}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <TaskStatusBadge status={t.status} />
                        <NativeSelect
                          size="sm"
                          value={t.status}
                          onChange={(e) => {
                            const res = s.updateTaskStatus(t.id, e.target.value as TaskStatus)
                            toast.add({ title: res.ok ? "Task status updated" : res.error })
                          }}
                          className="w-32"
                        >
                          <NativeSelectOption value="todo">To do</NativeSelectOption>
                          <NativeSelectOption value="in_progress">In progress</NativeSelectOption>
                          <NativeSelectOption value="done">Completed</NativeSelectOption>
                        </NativeSelect>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign new task</DialogTitle>
            <DialogDescription>The employee will immediately see this task and receive a notification.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="t-title">Title</Label>
              <Input id="t-title" {...form.register("title")} placeholder="e.g. Cover barangay trade fair" />
              {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="t-desc">Description</Label>
              <Textarea id="t-desc" rows={3} {...form.register("description")} placeholder="Deliverables and notes…" />
              {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-emp">Assign to</Label>
                <NativeSelect id="t-emp" value={form.watch("toId")} onChange={(e) => form.setValue("toId", e.target.value)}>
                  {staff.map((u) => (
                    <NativeSelectOption key={u.id} value={u.id}>
                      {u.name} ({u.department})
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="t-due">Due date</Label>
                <Input id="t-due" type="date" {...form.register("dueDate")} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="t-prio">Priority</Label>
              <NativeSelect
                id="t-prio"
                value={form.watch("priority")}
                onChange={(e) => form.setValue("priority", e.target.value as TaskPriority)}
              >
                <NativeSelectOption value="low">Low</NativeSelectOption>
                <NativeSelectOption value="medium">Medium</NativeSelectOption>
                <NativeSelectOption value="high">High</NativeSelectOption>
              </NativeSelect>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Assign task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ManagerDailyReportsPage() {
  const s = useBiz()
  const [search, setSearch] = useState("")
  const [returning, setReturning] = useState<Report | null>(null)
  const [comment, setComment] = useState("")

  const inbox = useMemo(
    () =>
      s.reports
        .filter((r) => r.status === "submitted")
        .filter((r) => !search.trim() || r.title.toLowerCase().includes(search.trim().toLowerCase())),
    [s.reports, search]
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Daily Reports Inbox"
        description="Review departmental submissions before bundling them into a consolidated report for the CEO."
      />

      <Input
        placeholder="Search submitted reports…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="sm:max-w-xs"
      />

      {inbox.length === 0 ? (
        <Widget>
          <div className="px-(--card-spacing)">
            <EmptyBox title="Review inbox is clear" description="All submitted departmental reports have been processed." />
          </div>
        </Widget>
      ) : (
        <div className="flex flex-col gap-4">
          {inbox.map((report) => (
            <Widget key={report.id}>
              <div className="flex flex-col gap-3 px-(--card-spacing)">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">{report.title}</h3>
                      <ReportStatusBadge status={report.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                      {report.department} · {report.kind} · By {report.authorName} · {report.period}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const res = s.reviewReport(report.id)
                        toast.add({ title: res.ok ? `Approved "${report.title}" for consolidation` : res.error })
                      }}
                    >
                      <CheckIcon className="size-4" />
                      Approve to include
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
                      Return
                    </Button>
                  </div>
                </div>
                <p className="rounded-lg border bg-muted/25 p-3 text-sm">{report.content}</p>
                <ReportTimeline report={report} />
              </div>
            </Widget>
          ))}
        </div>
      )}

      <Dialog open={!!returning} onOpenChange={(o) => !o && setReturning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return report to employee</DialogTitle>
            <DialogDescription>
              {returning ? `Returning "${returning.title}" to ${returning.authorName}.` : ""}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Explain what needs to be updated…"
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
              Return with comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ManagerEmployeesPage() {
  const s = useBiz()
  const rows = employeePerformance(s)
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employee Performance"
        description="Monthly progress across Sales and AM Reporters."
        actions={
          <ExportButtons
            filename="manager-employee-performance"
            headers={["Employee", "Department", "This Month", "Target", "% of Target"]}
            rows={rows.map((r) => [r.name, r.department, r.result, r.target, `${r.pct}%`])}
          />
        }
      />
      <EmployeePerformancePanel rows={rows} />
    </div>
  )
}

export function ManagerAccomplishmentsPage() {
  const s = useBiz()
  const confirmedThisMonth = s.deals.filter((d) => d.stage === "confirmed" && d.month === NOW)
  const paymentsThisMonth = s.payments.filter((p) => p.month === NOW)
  const actPg = usePagination(s.activities, 10)
  const dealsPg = usePagination(confirmedThisMonth, 10)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Department Accomplishments"
        description="Live operational highlights from Sales, AM Reporters, and Finance."
      />

      <Grid cols={3}>
        <Stat title="Sales confirmed" value={String(confirmedThisMonth.length)} caption={<PesoAmount value={confirmedThisMonth.reduce((a, b) => a + b.amount, 0)} compact />} />
        <Stat title="Field coverages" value={String(s.activities.length)} caption={`${s.photos.length} photo sets documented`} />
        <Stat title="Payments collected" value={String(paymentsThisMonth.length)} caption={<PesoAmount value={paymentsThisMonth.reduce((a, b) => a + b.amount, 0)} compact />} />
      </Grid>

      <Panel title="AM Reporter field accomplishments">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actPg.items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.title}</TableCell>
                  <TableCell>{a.by}</TableCell>
                  <TableCell>{a.place}</TableCell>
                  <TableCell className="text-muted-foreground">{a.date}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{a.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination {...actPg.pagination} />
        </div>
      </Panel>

      <Panel title="Sales deals closed this month">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dealsPg.items.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.customer}</TableCell>
                  <TableCell>{d.owner}</TableCell>
                  <TableCell className="text-right font-sans tabular-nums">{peso(d.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination {...dealsPg.pagination} />
        </div>
      </Panel>
    </div>
  )
}

export function ManagerConsolidatedPage() {
  const s = useBiz()
  const reviewed = s.reports.filter((r) => r.status === "reviewed" && r.department !== "management")
  const history = s.reports.filter((r) => r.department === "management")
  const historyPg = usePagination(history, 10)

  const [selectedIds, setSelectedIds] = useState<number[]>(() => reviewed.map((r) => r.id))
  const [title, setTitle] = useState("Consolidated Operations Report — Nov 2026")
  const [period, setPeriod] = useState("Nov 2026")
  const [summary, setSummary] = useState(
    "Consolidated departmental summary covering reviewed Sales, AM Reporters, and Finance reports."
  )

  const toggleId = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const chosen = reviewed.filter((r) => selectedIds.includes(r.id))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = s.submitConsolidatedReport({
      title,
      period,
      content: `${summary}\n\nIncluded:\n${chosen.map((r) => `- [${r.department}] ${r.title} (${r.authorName})`).join("\n")}`,
      bundledReportIds: chosen.map((r) => r.id),
    })
    toast.add({ title: res.ok ? "Consolidated report submitted to CEO" : res.error })
    if (res.ok) setSelectedIds([])
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Consolidated Report"
        description="Bundle reviewed departmental reports and submit to the CEO for final approval."
      />

      <Grid cols={2}>
        <Panel title={`Reviewed departmental reports (${reviewed.length})`}>
          {reviewed.length === 0 ? (
            <EmptyBox
              title="No reviewed reports ready"
              description="Approve submitted reports in Daily Reports first to include them here."
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {reviewed.map((r) => (
                <label
                  key={r.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 hover:bg-muted/30"
                >
                  <Checkbox
                    checked={selectedIds.includes(r.id)}
                    onCheckedChange={() => toggleId(r.id)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {r.department} · {r.authorName} · {r.period}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.content}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Preview & submit to CEO">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cons-title">Consolidated report title</Label>
              <Input id="cons-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cons-period">Period</Label>
              <Input id="cons-period" value={period} onChange={(e) => setPeriod(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cons-summary">Executive summary</Label>
              <Textarea id="cons-summary" rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} required />
            </div>
            <div className="rounded-lg border bg-muted/25 p-3 text-xs">
              <p className="font-medium">Selected to bundle: {chosen.length}</p>
              <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                {chosen.length === 0 ? (
                  <li>Select at least one reviewed report on the left.</li>
                ) : (
                  chosen.map((r) => <li key={r.id}>{r.title} ({r.department})</li>)
                )}
              </ul>
            </div>
            <Button type="submit" disabled={chosen.length === 0 || !title.trim()}>
              <SendIcon className="size-4" />
              Submit to CEO
            </Button>
          </form>
        </Panel>
      </Grid>

      <Panel title="Submitted consolidated reports">
        {history.length === 0 ? (
          <EmptyBox title="No consolidated reports sent yet" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Latest note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyPg.items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell>{r.period}</TableCell>
                    <TableCell><ReportStatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.comments.length > 0 ? r.comments[r.comments.length - 1].text : r.history[r.history.length - 1]?.action}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination {...historyPg.pagination} />
          </div>
        )}
      </Panel>
    </div>
  )
}
