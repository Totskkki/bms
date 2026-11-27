"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileTextIcon,
  PencilIcon,
  PlusIcon,
  UploadIcon,
  XIcon,
} from "lucide-react"
import { useMemo, useRef, useState } from "react"
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
import { PillBars } from "@/components/chronicle/charts"
import { PageHeader } from "@/kit/ui-patterns/page-header"
import { StatusBadge } from "@/kit/ui-patterns/status-badge"
import { Widget } from "@/kit/widgets/widget"

import { balances, monthly, peso, pesoShort, SALES_REP_TARGET, TARGET, totals } from "../metrics"
import {
  Bars,
  DashboardGreetingHeader,
  EmptyBox,
  ExportButtons,
  FileDropzone,
  Grid,
  Panel,
  PesoAmount,
  StageBadge,
  Stat,
  TablePagination,
  usePagination,
} from "../parts"
import { DepartmentReportsPage } from "../shared/report-center"
import { DEMO_ACCOUNTS, MONTHS, NOW, useBiz, type Customer, type ProposalDoc, type Stage } from "../store"

export function SalesOverviewPage() {
  const s = useBiz()
  const now = totals(s, NOW)
  const pct = Math.round((now.sales / TARGET) * 100)
  const funnel = (["inquiry", "lead", "proposal", "confirmed"] as Stage[]).map((stage) => {
    const items = s.deals.filter((d) => d.stage === stage && d.month === NOW)
    return { stage, count: items.length, amount: items.reduce((a, b) => a + b.amount, 0) }
  })

  return (
    <div className="flex flex-col gap-6">
      <DashboardGreetingHeader
        summary={`${pct}% of monthly sales target · ${s.deals.filter((d) => d.stage !== "confirmed").length} open pipeline deals`}
        actions={
          <ExportButtons
            filename="sales-overview"
            headers={["Month", "Confirmed Sales", "Collections"]}
            rows={monthly(s).map((m) => [m.month, m.sales, m.collections])}
          />
        }
      />

      <Grid>
        <Stat title="Monthly target" value={<PesoAmount value={TARGET} compact />} caption={`${MONTHS[NOW]} 2026 goal`} />
        <Stat title="Confirmed sales" value={<PesoAmount value={now.sales} compact />} caption={`${pct}% of target`} />
        <Stat title="Open pipeline" value={String(s.deals.filter((d) => d.stage !== "confirmed").length)} caption="Inquiries, leads, proposals" />
        <Stat title="Active customers" value={String(s.customers.length)} caption="In CRM database" />
      </Grid>

      <Grid cols={2}>
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
        <Panel title="This month pipeline funnel">
          <div className="flex flex-col gap-3">
            {funnel.map((f) => (
              <div key={f.stage} className="flex items-center justify-between rounded-xl border bg-muted/20 px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <StageBadge stage={f.stage} />
                  <span className="text-xs text-muted-foreground">{f.count} deals</span>
                </div>
                <span className="font-sans text-sm font-semibold tabular-nums">{peso(f.amount)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </Grid>
    </div>
  )
}

const customerSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  contact: z.string().min(2, "Contact person is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(6, "Phone number is required"),
  industry: z.string().min(2, "Industry is required"),
  status: z.enum(["active", "prospect"]),
})

export function SalesCustomersPage() {
  const s = useBiz()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", contact: "", email: "", phone: "", industry: "", status: "prospect" },
  })

  const filtered = useMemo(
    () =>
      s.customers.filter((c) => {
        if (status !== "all" && c.status !== status) return false
        const q = search.trim().toLowerCase()
        if (q && !c.name.toLowerCase().includes(q) && !c.contact.toLowerCase().includes(q) && !c.industry.toLowerCase().includes(q)) {
          return false
        }
        return true
      }),
    [s.customers, status, search]
  )
  const custPg = usePagination(filtered, 10)

  function openNew() {
    setEditing(null)
    form.reset({ name: "", contact: "", email: "", phone: "", industry: "", status: "prospect" })
    setOpen(true)
  }

  function openEdit(c: Customer) {
    setEditing(c)
    form.reset({
      name: c.name,
      contact: c.contact,
      email: c.email,
      phone: c.phone,
      industry: c.industry,
      status: c.status,
    })
    setOpen(true)
  }

  const onSubmit = form.handleSubmit((values) => {
    const res = editing ? s.updateCustomer(editing.id, values) : s.addCustomer(values)
    toast.add({ title: res.ok ? (editing ? "Customer updated" : "Customer added") : res.error })
    if (res.ok) setOpen(false)
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Customers"
        description="Searchable client directory and confirmed revenue per account."
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <ExportButtons
              filename="customers"
              headers={["Customer", "Contact", "Email", "Phone", "Industry", "Status"]}
              rows={filtered.map((c) => [c.name, c.contact, c.email, c.phone, c.industry, c.status])}
            />
            <Button size="sm" onClick={openNew}>
              <PlusIcon className="size-4" />
              Add customer
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row print:hidden">
        <Input placeholder="Search customer, contact, industry…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40">
          <NativeSelectOption value="all">All statuses</NativeSelectOption>
          <NativeSelectOption value="active">Active</NativeSelectOption>
          <NativeSelectOption value="prospect">Prospect</NativeSelectOption>
        </NativeSelect>
      </div>

      <Widget>
        <div className="overflow-x-auto px-(--card-spacing)">
          {filtered.length === 0 ? (
            <EmptyBox title="No customers found" description="Add a customer or adjust your search filter." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Confirmed Sales</TableHead>
                  <TableHead className="text-right print:hidden">Edit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custPg.items.map((c) => {
                  const total = s.deals
                    .filter((d) => d.customer === c.name && d.stage === "confirmed")
                    .reduce((a, b) => a + b.amount, 0)
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <div>{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      </TableCell>
                      <TableCell>
                        <div>{c.contact}</div>
                        <div className="text-xs text-muted-foreground">{c.phone}</div>
                      </TableCell>
                      <TableCell>{c.industry}</TableCell>
                      <TableCell>
                        <StatusBadge tone={c.status === "active" ? "success" : "info"} className="capitalize">
                          {c.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right font-sans tabular-nums">{peso(total)}</TableCell>
                      <TableCell className="text-right print:hidden">
                        <Button size="xs" variant="outline" onClick={() => openEdit(c)}>
                          <PencilIcon className="size-3.5" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          <TablePagination {...custPg.pagination} />
        </div>
      </Widget>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit customer" : "Add customer"}</DialogTitle>
            <DialogDescription>Keep customer contact details up to date for proposals and billing.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-name">Company name</Label>
              <Input id="c-name" {...form.register("name")} />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-contact">Contact person</Label>
                <Input id="c-contact" {...form.register("contact")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-phone">Phone</Label>
                <Input id="c-phone" {...form.register("phone")} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-email">Email</Label>
                <Input id="c-email" type="email" {...form.register("email")} />
                {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-ind">Industry</Label>
                <Input id="c-ind" {...form.register("industry")} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-status">Status</Label>
              <NativeSelect id="c-status" value={form.watch("status")} onChange={(e) => form.setValue("status", e.target.value as "active" | "prospect")}>
                <NativeSelectOption value="prospect">Prospect</NativeSelectOption>
                <NativeSelectOption value="active">Active</NativeSelectOption>
              </NativeSelect>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save changes" : "Add customer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const PROPOSAL_TEMPLATES = [
  {
    id: "media-package",
    name: "Standard Media Package",
    filename: "BusinessHub-Media-Package-Template.doc",
    summary: "Radio spots, field mentions, and monthly billing schedule.",
    body: "BUSINESS HUB — MEDIA PACKAGE PROPOSAL\n\nClient: [Client Name]\nDate: [Date]\nPrepared by: [Sales Representative]\n\n1. Campaign Overview\n   - Broadcast & Digital Placement\n   - Coverage Area & Schedule\n\n2. Package Investment (PHP)\n   - Base Package: PHP [Amount]\n   - Payment Terms: 50% upon confirmation, 50% upon completion\n\n3. Approval & Conforme\n   Authorized Signatory: _____________________\n",
  },
  {
    id: "event-sponsorship",
    name: "Event Sponsorship Proposal",
    filename: "BusinessHub-Event-Sponsorship-Template.doc",
    summary: "On-ground booth activation, live AM reporter coverage, and branding.",
    body: "BUSINESS HUB — EVENT SPONSORSHIP PROPOSAL\n\nClient: [Client Name]\nEvent: [Event Title & Venue]\nDate: [Date]\n\n1. Sponsorship Deliverables\n   - Live AM Reporter Coverage & Photo Documentation\n   - Branded Booth & On-Air Mentions\n\n2. Sponsorship Fee (PHP)\n   - Total Amount: PHP [Amount]\n\n3. Conforme\n   Client Signature: _____________________\n",
  },
  {
    id: "annual-retainer",
    name: "Quarterly / Annual Retainer",
    filename: "BusinessHub-Retainer-Proposal-Template.doc",
    summary: "Recurring multi-month partnership with volume discount tiers.",
    body: "BUSINESS HUB — RETAINER PARTNERSHIP PROPOSAL\n\nClient: [Client Name]\nTerm: [3 / 6 / 12 Months]\n\n1. Monthly Deliverables\n   - Dedicated Account Management\n   - Monthly Performance & Coverage Summary\n\n2. Monthly Retainer Fee (PHP)\n   - Fee: PHP [Amount] / month\n\n3. Approval\n   Authorized Signatory: _____________________\n",
  },
]

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function downloadProposalTemplate(tpl: (typeof PROPOSAL_TEMPLATES)[number]) {
  const blob = new Blob([tpl.body], { type: "application/msword;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = tpl.filename
  a.click()
  URL.revokeObjectURL(url)
}

const dealSchema = z.object({
  customer: z.string().min(2, "Customer name is required"),
  amount: z.coerce.number().min(1000, "Amount must be at least ₱1,000"),
  dueDate: z.string().min(4, "Due date is required"),
  notes: z.string().optional(),
})

export function SalesStagePage({
  stage,
  title,
  description,
  addLabel,
  nextLabel,
}: {
  stage: Stage
  title: string
  description: string
  addLabel: string
  nextLabel?: string
}) {
  const s = useBiz()
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [uploadedDoc, setUploadedDoc] = useState<ProposalDoc | undefined>(undefined)
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null)
  const rowFileInputRef = useRef<HTMLInputElement | null>(null)

  const form = useForm<z.input<typeof dealSchema>, unknown, z.output<typeof dealSchema>>({
    resolver: zodResolver(dealSchema),
    defaultValues: { customer: s.customers[0]?.name ?? "", amount: 75000, dueDate: "2026-12-15", notes: "" },
  })

  const balanceMap = useMemo(() => {
    const map = new Map<number, { paid: number; balance: number }>()
    for (const b of balances(s)) map.set(b.id, { paid: b.paid, balance: b.balance })
    return map
  }, [s])

  const rows = useMemo(
    () =>
      s.deals.filter((d) => {
        if (d.stage !== stage) return false
        const q = search.trim().toLowerCase()
        if (q && !d.customer.toLowerCase().includes(q) && !d.owner.toLowerCase().includes(q)) return false
        return true
      }),
    [s.deals, stage, search]
  )
  const dealPg = usePagination(rows, 10)

  const onSubmit = form.handleSubmit((values) => {
    const res = s.addDeal({ ...values, stage, proposalDoc: stage === "proposal" ? uploadedDoc : undefined })
    toast.add({
      title: res.ok
        ? stage === "confirmed"
          ? "Sale confirmed. Finance receivables and CEO totals updated."
          : `${title} record created`
        : res.error,
    })
    if (res.ok) {
      form.reset()
      setUploadedDoc(undefined)
      setOpen(false)
    }
  })

  function handleRowFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || uploadTargetId === null) return
    const doc: ProposalDoc = {
      name: file.name,
      url: URL.createObjectURL(file),
      size: formatFileSize(file.size),
    }
    const res = s.attachProposalDoc(uploadTargetId, doc)
    toast.add({ title: res.ok ? `Attached "${file.name}"` : res.error })
    setUploadTargetId(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <ExportButtons
              filename={`sales-${stage}`}
              headers={["Customer", "Amount", "Stage", "Owner", "Month"]}
              rows={rows.map((d) => [d.customer, d.amount, d.stage, d.owner, MONTHS[d.month]])}
            />
            <Button
              size="sm"
              onClick={() => {
                setUploadedDoc(undefined)
                setOpen(true)
              }}
            >
              <PlusIcon className="size-4" />
              {addLabel}
            </Button>
          </div>
        }
      />

      {stage === "proposal" && (
        <Panel title="Proposal templates (DOC / PDF)" className="print:hidden">
          <p className="mb-3 text-xs text-muted-foreground">
            Download a starter template, customize it for your client, then upload the finished PDF or Word document to any proposal below.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {PROPOSAL_TEMPLATES.map((tpl) => (
              <div key={tpl.id} className="flex flex-col justify-between gap-2.5 rounded-xl border bg-muted/20 p-3">
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <FileTextIcon className="size-4 shrink-0 text-primary" />
                    <span className="truncate">{tpl.name}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{tpl.summary}</p>
                </div>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  className="w-fit"
                  onClick={() => {
                    downloadProposalTemplate(tpl)
                    toast.add({ title: `Downloaded ${tpl.filename}` })
                  }}
                >
                  <DownloadIcon className="size-3.5" />
                  Download .doc
                </Button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <input
        ref={rowFileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleRowFileChange}
      />

      <Input
        placeholder="Search customer or sales owner…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="sm:max-w-xs print:hidden"
      />

      <Widget>
        <div className="overflow-x-auto px-(--card-spacing)">
          {rows.length === 0 ? (
            <EmptyBox title={`No ${title.toLowerCase()} yet`} description={`Click "${addLabel}" to add one.`} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  {stage === "proposal" && <TableHead>Proposal File</TableHead>}
                  {stage === "confirmed" && <TableHead className="text-right">Balance</TableHead>}
                  {nextLabel && <TableHead className="text-right print:hidden">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dealPg.items.map((d) => {
                  const bal = balanceMap.get(d.id)
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">
                        <div>{d.customer}</div>
                        {d.notes && <div className="text-xs text-muted-foreground">{d.notes}</div>}
                      </TableCell>
                      <TableCell>{d.owner}</TableCell>
                      <TableCell className="text-muted-foreground">{MONTHS[d.month]}</TableCell>
                      <TableCell className="text-right font-sans tabular-nums">{peso(d.amount)}</TableCell>
                      {stage === "proposal" && (
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            {d.proposalDoc ? (
                              <a
                                href={d.proposalDoc.url}
                                download={d.proposalDoc.name}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex max-w-44 items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-xs font-medium text-primary hover:underline"
                                title={d.proposalDoc.name}
                              >
                                <FileTextIcon className="size-3.5 shrink-0" />
                                <span className="truncate">{d.proposalDoc.name}</span>
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">No file</span>
                            )}
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              className="print:hidden"
                              onClick={() => {
                                setUploadTargetId(d.id)
                                rowFileInputRef.current?.click()
                              }}
                            >
                              <UploadIcon className="size-3.5" />
                              {d.proposalDoc ? "Replace" : "Upload"}
                            </Button>
                          </div>
                        </TableCell>
                      )}
                      {stage === "confirmed" && (
                        <TableCell className="text-right font-sans tabular-nums">
                          {bal && bal.balance > 0 ? (
                            <span className="text-warning-foreground dark:text-warning">{peso(bal.balance)}</span>
                          ) : (
                            <span className="text-success">Paid</span>
                          )}
                        </TableCell>
                      )}
                      {nextLabel && (
                        <TableCell className="text-right print:hidden">
                          <Button
                            size="xs"
                            onClick={() => {
                              const res = s.advanceDeal(d.id)
                              toast.add({
                                title: res.ok
                                  ? stage === "proposal"
                                    ? `Confirmed ${d.customer}. Finance receivables & CEO totals updated.`
                                    : `${d.customer} moved to next stage`
                                  : res.error,
                              })
                            }}
                          >
                            {stage === "proposal" ? <CheckCircle2Icon className="size-3.5" /> : <ArrowRightIcon className="size-3.5" />}
                            {nextLabel}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          <TablePagination {...dealPg.pagination} />
        </div>
      </Widget>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{addLabel}</DialogTitle>
            <DialogDescription>
              {stage === "confirmed"
                ? "Confirming a sale immediately creates a receivable in Finance and updates CEO totals."
                : stage === "proposal"
                  ? "Create a proposal and optionally attach a PDF or Word (.doc/.docx) document."
                  : "Add a new deal to this pipeline stage."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="d-cust">Customer</Label>
              <Input id="d-cust" list="sales-customers-list" {...form.register("customer")} placeholder="Customer name" />
              <datalist id="sales-customers-list">
                {s.customers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
              {form.formState.errors.customer && <p className="text-xs text-destructive">{form.formState.errors.customer.message}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-amt">Amount (₱)</Label>
                <Input id="d-amt" type="number" {...form.register("amount")} />
                {form.formState.errors.amount && <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-due">Target close / due date</Label>
                <Input id="d-due" type="date" {...form.register("dueDate")} />
              </div>
            </div>
            {stage === "proposal" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-file">Proposal document</Label>
                <FileDropzone
                  id="d-file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  hint="PDF, DOC, or DOCX"
                  onFiles={(files) => {
                    const file = files[0]
                    if (!file) return
                    setUploadedDoc({
                      name: file.name,
                      url: URL.createObjectURL(file),
                      size: formatFileSize(file.size),
                    })
                  }}
                />
                {uploadedDoc && (
                  <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-2.5 py-1.5 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <FileTextIcon className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate font-medium">{uploadedDoc.name}</span>
                      {uploadedDoc.size && <span className="text-muted-foreground">({uploadedDoc.size})</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => setUploadedDoc(undefined)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Remove attached file"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="d-notes">Notes</Label>
              <Textarea id="d-notes" rows={2} {...form.register("notes")} placeholder="Package details or follow-up notes…" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{addLabel}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function SalesTargetsPage() {
  const s = useBiz()
  const now = totals(s, NOW)
  const teamPct = Math.round((now.sales / TARGET) * 100)
  const reps = DEMO_ACCOUNTS.filter((u) => u.role === "sales").map((u) => {
    const actual = s.deals
      .filter((d) => d.ownerId === u.id && d.stage === "confirmed" && d.month === NOW)
      .reduce((a, b) => a + b.amount, 0)
    return { ...u, actual, pct: Math.round((actual / SALES_REP_TARGET) * 100) }
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Sales Targets" description={`Monthly target vs actual confirmed sales (${MONTHS[NOW]} 2026).`} />
      <Grid cols={3}>
        <Stat title="Team target" value={<PesoAmount value={TARGET} compact />} caption="Monthly goal" />
        <Stat title="Actual confirmed" value={<PesoAmount value={now.sales} compact />} caption={`${teamPct}% achieved`} />
        <Stat title="Remaining to goal" value={<PesoAmount value={Math.max(0, TARGET - now.sales)} compact />} caption={now.sales >= TARGET ? "Goal met!" : "Needed this month"} />
      </Grid>

      <Panel title="Individual rep progress">
        <div className="flex flex-col gap-4">
          {reps.map((r) => (
            <div key={r.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{r.name}</span>
                <span className="font-sans text-xs tabular-nums text-muted-foreground">
                  {peso(r.actual)} / {peso(SALES_REP_TARGET)} ({r.pct}%)
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${r.pct >= 80 ? "bg-success" : r.pct >= 50 ? "bg-warning" : "bg-destructive"}`}
                  style={{ width: `${Math.min(100, r.pct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

const marketingSchema = z.object({
  campaign: z.string().min(3, "Campaign name is required"),
  date: z.string().min(4, "Date is required"),
  channel: z.string().min(2, "Channel is required"),
  cost: z.coerce.number().min(0, "Cost cannot be negative"),
  leadsGenerated: z.coerce.number().min(0, "Leads cannot be negative"),
})

export function SalesMarketingPage() {
  const s = useBiz()
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)

  const form = useForm<z.input<typeof marketingSchema>, unknown, z.output<typeof marketingSchema>>({
    resolver: zodResolver(marketingSchema),
    defaultValues: { campaign: "", date: "2026-11-26", channel: "Broadcast", cost: 20000, leadsGenerated: 10 },
  })

  const filtered = s.marketingActivities.filter(
    (m) => !search.trim() || m.campaign.toLowerCase().includes(search.trim().toLowerCase()) || m.channel.toLowerCase().includes(search.trim().toLowerCase())
  )
  const mktPg = usePagination(filtered, 10)

  const onSubmit = form.handleSubmit((values) => {
    const res = s.addMarketingActivity(values)
    toast.add({ title: res.ok ? "Marketing activity recorded" : res.error })
    if (res.ok) {
      form.reset()
      setOpen(false)
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Marketing Activities"
        description="Track campaigns, channels, spend, and leads generated."
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <ExportButtons
              filename="marketing-activities"
              headers={["Campaign", "Date", "Channel", "Cost", "Leads"]}
              rows={filtered.map((m) => [m.campaign, m.date, m.channel, m.cost, m.leadsGenerated])}
            />
            <Button size="sm" onClick={() => setOpen(true)}>
              <PlusIcon className="size-4" />
              Add campaign
            </Button>
          </div>
        }
      />

      <Input placeholder="Search campaigns or channels…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs print:hidden" />

      <Widget>
        <div className="overflow-x-auto px-(--card-spacing)">
          {filtered.length === 0 ? (
            <EmptyBox title="No marketing activities found" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Leads Generated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mktPg.items.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.campaign}</TableCell>
                    <TableCell className="text-muted-foreground">{m.date}</TableCell>
                    <TableCell>{m.channel}</TableCell>
                    <TableCell className="text-right font-sans tabular-nums">{peso(m.cost)}</TableCell>
                    <TableCell className="text-right font-sans tabular-nums">{m.leadsGenerated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <TablePagination {...mktPg.pagination} />
        </div>
      </Widget>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log marketing activity</DialogTitle>
            <DialogDescription>Record campaign spend and leads generated.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="m-camp">Campaign name</Label>
              <Input id="m-camp" {...form.register("campaign")} placeholder="e.g. December Radio Promo" />
              {form.formState.errors.campaign && <p className="text-xs text-destructive">{form.formState.errors.campaign.message}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="m-date">Date</Label>
                <Input id="m-date" type="date" {...form.register("date")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="m-ch">Channel</Label>
                <NativeSelect id="m-ch" value={form.watch("channel")} onChange={(e) => form.setValue("channel", e.target.value)}>
                  <NativeSelectOption value="Broadcast">Broadcast</NativeSelectOption>
                  <NativeSelectOption value="Events">Events</NativeSelectOption>
                  <NativeSelectOption value="Social Media">Social Media</NativeSelectOption>
                  <NativeSelectOption value="Print">Print</NativeSelectOption>
                </NativeSelect>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="m-cost">Cost (₱)</Label>
                <Input id="m-cost" type="number" {...form.register("cost")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="m-leads">Leads generated</Label>
                <Input id="m-leads" type="number" {...form.register("leadsGenerated")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Save campaign</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function SalesReportsPage() {
  return (
    <DepartmentReportsPage
      title="Sales Reports"
      description="Submit daily, weekly, and monthly sales reports to the Manager."
      allowedKinds={["daily", "weekly", "monthly"]}
    />
  )
}
