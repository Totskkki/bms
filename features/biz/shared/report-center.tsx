"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { EyeIcon, PlusIcon, SendIcon, SparklesIcon } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { PageHeader } from "@/kit/ui-patterns/page-header"
import { Widget } from "@/kit/widgets/widget"
import { filterByScope } from "@/lib/rbac"

import { MONTHS, NOW, useBiz, type Report, type ReportKind } from "../store"
import { peso, totals } from "../metrics"
import { EmptyBox, ExportButtons, ReportStatusBadge, ReportTimeline, TablePagination, usePagination } from "../parts"

const reportSchema = z.object({
  kind: z.enum(["daily", "weekly", "monthly"]),
  title: z.string().min(3, "Title must be at least 3 characters"),
  period: z.string().min(2, "Period is required"),
  content: z.string().min(10, "Please provide a brief report summary"),
})

type ReportFormValues = z.infer<typeof reportSchema>

export function DepartmentReportsPage({
  title,
  description,
  allowedKinds,
}: {
  title: string
  description: string
  allowedKinds: ReportKind[]
}) {
  const s = useBiz()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [openComposer, setOpenComposer] = useState(false)
  const [editingId, setEditingId] = useState<number | undefined>(undefined)
  const [viewing, setViewing] = useState<Report | null>(null)

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      kind: allowedKinds[0],
      title: "",
      period: `${MONTHS[NOW]} 2026`,
      content: "",
    },
  })

  const scoped = useMemo(() => {
    const mine = filterByScope(s.reports, s.currentUser).filter((r) => r.department !== "management")
    return mine.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false
      if (search.trim() && !r.title.toLowerCase().includes(search.trim().toLowerCase())) return false
      return true
    })
  }, [s.reports, s.currentUser, statusFilter, search])

  const pg = usePagination(scoped, 10)

  function generateDraft(kind: ReportKind) {
    const user = s.currentUser
    if (!user) return
    const periodStr = kind === "daily" ? "Nov 26, 2026" : kind === "weekly" ? "Nov 20–26, 2026" : "Nov 2026"
    if (user.role === "sales") {
      const myDeals = s.deals.filter((d) => d.ownerId === user.id && d.month === NOW)
      const confirmed = myDeals.filter((d) => d.stage === "confirmed")
      const leads = myDeals.filter((d) => d.stage === "lead" || d.stage === "inquiry")
      const proposals = myDeals.filter((d) => d.stage === "proposal")
      const confirmedTotal = confirmed.reduce((a, b) => a + b.amount, 0)
      form.setValue("kind", kind)
      form.setValue("period", periodStr)
      form.setValue("title", `${kind[0].toUpperCase() + kind.slice(1)} Sales Report — ${user.name}`)
      form.setValue(
        "content",
        `Confirmed sales: ${confirmed.length} deals totaling ${peso(confirmedTotal)}. Active pipeline: ${proposals.length} proposals and ${leads.length} leads/inquiries. Next focus: closing pending proposals before month-end.`
      )
    } else if (user.role === "reporter") {
      const myActs = s.activities.filter((a) => a.authorId === user.id && a.month === NOW)
      const myPhotos = s.photos.filter((p) => p.authorId === user.id && p.month === NOW)
      const places = [...new Set(myActs.map((a) => a.place))].join(", ") || "assigned coverage areas"
      form.setValue("kind", kind)
      form.setValue("period", periodStr)
      form.setValue("title", `${kind[0].toUpperCase() + kind.slice(1)} Field Coverage Report — ${user.name}`)
      form.setValue(
        "content",
        `Logged ${myActs.length} field activities across ${places} with ${myPhotos.length} documented photo entries. All daily assignments tracked and ready for Manager review.`
      )
    } else if (user.role === "finance") {
      const t = totals(s, NOW)
      const unpaidBills = s.payables.filter((p) => p.status === "unpaid").length
      form.setValue("kind", kind)
      form.setValue("period", periodStr)
      form.setValue("title", `${kind[0].toUpperCase() + kind.slice(1)} Financial Summary — ${MONTHS[NOW]} 2026`)
      form.setValue(
        "content",
        `This month collections: ${peso(t.collections)}. Confirmed revenue: ${peso(t.revenue)}. Expenses recorded: ${peso(t.expenses)}. Net profit: ${peso(t.profit)}. Outstanding receivables: ${peso(t.receivables)} (${t.unpaidInvoices} unpaid invoices); ${unpaidBills} unpaid vendor bills.`
      )
    }
    toast.add({ title: "Draft generated from live department data" })
  }

  function openNew() {
    setEditingId(undefined)
    form.reset({
      kind: allowedKinds[0],
      title: "",
      period: `${MONTHS[NOW]} 2026`,
      content: "",
    })
    setOpenComposer(true)
  }

  function openEdit(report: Report) {
    setEditingId(report.id)
    form.reset({
      kind: report.kind,
      title: report.title,
      period: report.period,
      content: report.content,
    })
    setOpenComposer(true)
  }

  const onSubmit = form.handleSubmit((values) => {
    const res = s.submitReport({ id: editingId, ...values })
    toast.add({ title: res.ok ? "Report submitted to Manager" : res.error })
    if (res.ok) setOpenComposer(false)
  })

  function handleSaveDraft() {
    const values = form.getValues()
    if (!values.title.trim()) {
      toast.add({ title: "Add a title before saving a draft" })
      return
    }
    const res = s.saveDraftReport(values)
    toast.add({ title: res.ok ? "Draft saved" : res.error })
    if (res.ok) setOpenComposer(false)
  }

  const csvRows = scoped.map((r) => [r.title, r.kind, r.period, r.authorName, r.status])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <ExportButtons
              filename="department-reports"
              headers={["Title", "Type", "Period", "Author", "Status"]}
              rows={csvRows}
            />
            <Button size="sm" onClick={openNew}>
              <PlusIcon className="size-4" />
              New report
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row print:hidden">
        <Input
          placeholder="Search reports…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <NativeSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
          <NativeSelectOption value="all">All statuses</NativeSelectOption>
          <NativeSelectOption value="draft">Draft</NativeSelectOption>
          <NativeSelectOption value="submitted">Submitted</NativeSelectOption>
          <NativeSelectOption value="reviewed">Reviewed</NativeSelectOption>
          <NativeSelectOption value="sent_to_ceo">Sent to CEO</NativeSelectOption>
          <NativeSelectOption value="approved">Approved</NativeSelectOption>
          <NativeSelectOption value="returned">Returned</NativeSelectOption>
        </NativeSelect>
      </div>

      <Widget>
        <div className="overflow-x-auto px-(--card-spacing)">
          {scoped.length === 0 ? (
            <EmptyBox title="No reports yet" description="Create a new report or use Generate draft to prefill from your live data." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right print:hidden">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pg.items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell className="capitalize">{r.kind}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{r.period}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.authorName}</TableCell>
                    <TableCell>
                      <ReportStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap print:hidden">
                      <div className="inline-flex items-center gap-1.5">
                        <Button size="xs" variant="outline" onClick={() => setViewing(r)}>
                          <EyeIcon className="size-3.5" />
                          View
                        </Button>
                        {(r.status === "draft" || r.status === "returned") && (
                          <Button size="xs" onClick={() => openEdit(r)}>
                            <SendIcon className="size-3.5" />
                            Edit & submit
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

      {/* Composer dialog */}
      <Dialog open={openComposer} onOpenChange={setOpenComposer}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit & resubmit report" : "Create report"}</DialogTitle>
            <DialogDescription>
              Submit to your Manager for review, or auto-generate a draft from your current numbers.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rep-kind">Report type</Label>
                <NativeSelect
                  id="rep-kind"
                  value={form.watch("kind")}
                  onChange={(e) => form.setValue("kind", e.target.value as ReportKind)}
                >
                  {allowedKinds.map((k) => (
                    <NativeSelectOption key={k} value={k}>
                      {k[0].toUpperCase() + k.slice(1)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rep-period">Period</Label>
                <Input id="rep-period" {...form.register("period")} placeholder="e.g. Nov 2026" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
              <span className="text-xs text-muted-foreground">Auto-fill from live department data</span>
              <Button
                type="button"
                size="xs"
                variant="secondary"
                onClick={() => generateDraft(form.getValues("kind"))}
              >
                <SparklesIcon className="size-3.5" />
                Generate draft
              </Button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rep-title">Title</Label>
              <Input id="rep-title" {...form.register("title")} placeholder="Report title" />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rep-content">Summary & details</Label>
              <Textarea id="rep-content" rows={4} {...form.register("content")} placeholder="Write key highlights, numbers, and blockers…" />
              {form.formState.errors.content && (
                <p className="text-xs text-destructive">{form.formState.errors.content.message}</p>
              )}
            </div>

            <DialogFooter className="gap-2">
              {!editingId && (
                <Button type="button" variant="outline" onClick={handleSaveDraft}>
                  Save draft
                </Button>
              )}
              <Button type="submit">
                <SendIcon className="size-3.5" />
                Submit to Manager
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail + Timeline dialog */}
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
                  {viewing.kind.toUpperCase()} · {viewing.period} · By {viewing.authorName}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 text-sm">
                <p className="rounded-lg border bg-muted/25 p-3 whitespace-pre-wrap">{viewing.content}</p>
                {viewing.comments.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-semibold text-destructive">Return comments</p>
                    {viewing.comments.map((c) => (
                      <div key={c.id} className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs">
                        <p className="font-medium">{c.by} ({c.at})</p>
                        <p className="mt-0.5 text-muted-foreground">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Status timeline</p>
                  <ReportTimeline report={viewing} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
