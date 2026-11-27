"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRightIcon, CalendarDaysIcon, CheckCircle2Icon, FileTextIcon, PlusIcon, Trash2Icon, TrendingUpIcon, UploadIcon, WalletIcon, XIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
import { HourBars, PillBars, StepLines } from "@/components/chronicle/charts"
import { change } from "@/kit/data/format"
import { PageHeader } from "@/kit/ui-patterns/page-header"
import { Segmented } from "@/kit/ui-patterns/segmented"
import { StatusBadge } from "@/kit/ui-patterns/status-badge"
import { PeriodHeader, Widget, WidgetHeader, WidgetValue } from "@/kit/widgets/widget"

import { balances, expenseByCategory, monthly, peso, pesoShort, totals } from "../metrics"
import { Bars, DashboardGreetingHeader, EmptyBox, ExportButtons, FileDropzone, Grid, Panel, PesoAmount, Stat, TablePagination, usePagination } from "../parts"
import { DepartmentReportsPage } from "../shared/report-center"
import { EXPENSE_CATEGORIES, MONTHS, NOW, useBiz, type ProposalDoc } from "../store"
import { payrollThisMonth, usePayroll } from "./payroll/store"

export function FinanceOverviewPage() {
  const s = useBiz()
  const all = totals(s)
  const unpaidInvoices = balances(s).filter((b) => b.balance > 0)
  const unpaidBills = s.payables.filter((p) => p.status === "unpaid")
  const recPg = usePagination(unpaidInvoices, 10)
  const billPg = usePagination(unpaidBills, 10)
  const payOvPg = usePagination(s.payments, 10)
  const [collectDealId, setCollectDealId] = useState<number | null>(null)
  const totalPayables = unpaidBills.reduce((a, b) => a + b.amount, 0)
  const netCashFlow = all.collections - all.expenses
  const payrollRuns = usePayroll((st) => st.runs)
  const monthlyPayroll = payrollThisMonth(payrollRuns, NOW)
  const payrollTotal = monthlyPayroll.total
  const payrollRunsCount = monthlyPayroll.count
  const dealMap = useMemo(() => new Map(s.deals.map((d) => [d.id, d])), [s.deals])
  const cashFlowRows = monthly(s).map((m) => ({
    month: m.month,
    inflow: m.collections,
    outflow: m.expenses,
    net: m.collections - m.expenses,
  }))

  return (
    <div className="flex flex-col gap-6">
      <DashboardGreetingHeader
        summary={`${unpaidInvoices.length} unpaid invoices · ${unpaidBills.length} unpaid vendor bills`}
        actions={
          <ExportButtons
            filename="finance-overview"
            headers={["Month", "Collections", "Expenses", "Net Cash Flow", "Receivables"]}
            rows={monthly(s).map((m) => [m.month, m.collections, m.expenses, m.collections - m.expenses, m.receivables])}
          />
        }
      />

      <Grid cols={3}>
        <Stat title="Total income" value={<PesoAmount value={all.collections} compact />} caption="Customer payments received (6 mo)" />
        <Stat title="Total expenses" value={<PesoAmount value={all.expenses} compact />} caption="All categories (6 mo)" />
        <Stat title="Accounts receivable" value={<PesoAmount value={all.receivables} compact />} caption={`${unpaidInvoices.length} unpaid invoices`} />
        <Stat title="Accounts payable" value={<PesoAmount value={totalPayables} compact />} caption={`${unpaidBills.length} unpaid vendor bills`} />
        <Stat
          title="Cash flow"
          value={
            <PesoAmount
              value={netCashFlow}
              compact
              className={netCashFlow >= 0 ? "text-success" : "text-destructive"}
            />
          }
          caption="Inflow minus outflow (6 mo)"
        />
        <Stat title="Payroll this month" value={<PesoAmount value={payrollTotal} compact />} caption={`${payrollRunsCount} approved/released ${payrollRunsCount === 1 ? "run" : "runs"}`} />
      </Grid>

      <Grid cols={2}>
        <Panel
          title="Cash flow (monthly inflow vs outflow)"
          action={
            <Link href="/finance/cash-flow" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline print:hidden">
              View cash flow <ArrowRightIcon className="size-3" />
            </Link>
          }
        >
          <div className="h-64">
            <StepLines
              data={cashFlowRows}
              xKey="month"
              series={[
                { key: "inflow", label: "Inflow", color: "var(--chart-lead)" },
                { key: "outflow", label: "Outflow", color: "var(--chart-2)" },
              ]}
              format={pesoShort}
              className="h-full"
            />
          </div>
        </Panel>
        <Panel
          title="This month expenses by category"
          action={
            <Link href="/finance/expenses" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline print:hidden">
              View expenses <ArrowRightIcon className="size-3" />
            </Link>
          }
        >
          <div className="h-64">
            <PillBars
              data={expenseByCategory(s).map((c) => ({
                label: c.category,
                title: c.category,
                value: c.amount,
              }))}
              highlight="max"
              format={peso}
              barSize={28}
              className="h-full"
            />
          </div>
        </Panel>
      </Grid>

      <Grid cols={2}>
        <Panel
          title="Outstanding balances (Accounts receivable)"
          action={
            <Link href="/finance/receivables" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline print:hidden">
              View all <ArrowRightIcon className="size-3" />
            </Link>
          }
        >
          {unpaidInvoices.length === 0 ? (
            <EmptyBox title="No outstanding balances" description="All confirmed customer invoices are fully paid." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Aging</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right print:hidden">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recPg.items.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        <div>{b.customer}</div>
                        <div className="text-xs text-muted-foreground">
                          Paid {peso(b.paid)} of {peso(b.amount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={b.agingBucket === "61+" ? "danger" : b.agingBucket === "31-60" ? "warning" : "info"}>
                          {b.agingBucket}d
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right font-sans font-semibold tabular-nums">{peso(b.balance)}</TableCell>
                      <TableCell className="text-right print:hidden">
                        <Button
                          size="xs"
                          onClick={() => setCollectDealId(b.id)}
                        >
                          <WalletIcon className="size-3.5" />
                          Collect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination {...recPg.pagination} />
            </div>
          )}
        </Panel>

        <Panel
          title="Accounts payable (Upcoming bills)"
          action={
            <Link href="/finance/payables" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline print:hidden">
              View all <ArrowRightIcon className="size-3" />
            </Link>
          }
        >
          {unpaidBills.length === 0 ? (
            <EmptyBox title="No unpaid bills" description="All vendor payables are settled." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right print:hidden">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billPg.items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <div>{p.vendor}</div>
                        <div className="text-xs text-muted-foreground">{p.category}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.dueDate}</TableCell>
                      <TableCell className="text-right font-sans font-semibold tabular-nums">{peso(p.amount)}</TableCell>
                      <TableCell className="text-right print:hidden">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            const res = s.markPayablePaid(p.id)
                            toast.add({ title: res.ok ? `Marked ${p.vendor} as paid` : res.error })
                          }}
                        >
                          <CheckCircle2Icon className="size-3.5" />
                          Mark paid
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination {...billPg.pagination} />
            </div>
          )}
        </Panel>
      </Grid>

      <Panel
        title="Recent customer payments"
        action={
          <Link href="/finance/payments" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline print:hidden">
            View all payments <ArrowRightIcon className="size-3" />
          </Link>
        }
      >
        {s.payments.length === 0 ? (
          <EmptyBox title="No customer payments recorded yet" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payOvPg.items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground">{p.date}</TableCell>
                    <TableCell className="font-medium">{dealMap.get(p.dealId)?.customer ?? `Invoice #${p.dealId}`}</TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell>{p.recordedBy}</TableCell>
                    <TableCell className="text-right font-sans font-medium tabular-nums text-success">{peso(p.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination {...payOvPg.pagination} />
          </div>
        )}
      </Panel>

      <RecordPaymentDialog
        open={collectDealId !== null}
        onOpenChange={(o) => !o && setCollectDealId(null)}
        initialDealId={collectDealId ?? undefined}
      />
    </div>
  )
}

const paymentSchema = z.object({
  dealId: z.coerce.number().min(1, "Select an invoice"),
  amount: z.coerce.number().min(1, "Amount must be greater than zero"),
  method: z.string().min(2, "Payment method required"),
  referenceNo: z.string().optional(),
  checkNo: z.string().optional(),
  remarks: z.string().optional(),
})

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function RecordPaymentDialog({
  open,
  onOpenChange,
  initialDealId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDealId?: number
}) {
  const s = useBiz()
  const unpaid = useMemo(() => balances(s).filter((b) => b.balance > 0), [s])
  const [proofFile, setProofFile] = useState<ProposalDoc | undefined>(undefined)

  const form = useForm<z.input<typeof paymentSchema>, unknown, z.output<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      dealId: initialDealId ?? unpaid[0]?.id ?? 0,
      amount: unpaid.find((u) => u.id === initialDealId)?.balance ?? unpaid[0]?.balance ?? 0,
      method: "Bank Transfer",
      referenceNo: "",
      checkNo: "",
      remarks: "",
    },
  })

  useEffect(() => {
    if (!open) return
    const target = unpaid.find((u) => u.id === initialDealId) ?? unpaid[0]
    setProofFile(undefined)
    if (target) {
      form.reset({
        dealId: target.id,
        amount: target.balance,
        method: "Bank Transfer",
        referenceNo: "",
        checkNo: "",
        remarks: "",
      })
    }
  }, [open, initialDealId, unpaid, form])

  const selectedMethod = form.watch("method")
  const isCash = selectedMethod === "Cash"
  const isCheck = selectedMethod === "Cheque" || selectedMethod === "Check"

  const onSubmit = form.handleSubmit((values) => {
    const cash = values.method === "Cash"
    const check = values.method === "Cheque" || values.method === "Check"
    const res = s.recordPayment(values.dealId, values.amount, values.method, {
      referenceNo: cash || check ? undefined : values.referenceNo,
      checkNo: check ? values.checkNo : undefined,
      remarks: values.remarks,
      proofFile: cash ? undefined : proofFile,
    })
    toast.add({ title: res.ok ? "Payment recorded. CEO totals updated." : res.error })
    if (res.ok) {
      setProofFile(undefined)
      onOpenChange(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record customer payment</DialogTitle>
          <DialogDescription>Applies immediately to Accounts Receivable and CEO Collections.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-inv">Invoice</Label>
            <NativeSelect
              id="pay-inv"
              value={String(form.watch("dealId"))}
              onChange={(e) => {
                const id = Number(e.target.value)
                form.setValue("dealId", id)
                const inv = unpaid.find((u) => u.id === id)
                if (inv) form.setValue("amount", inv.balance)
              }}
            >
              {unpaid.map((u) => (
                <NativeSelectOption key={u.id} value={String(u.id)}>
                  {u.customer} — Balance {peso(u.balance)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pay-amt">Amount (₱)</Label>
              <Input id="pay-amt" type="number" {...form.register("amount")} />
              {form.formState.errors.amount && <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pay-method">Method</Label>
              <NativeSelect id="pay-method" value={form.watch("method")} onChange={(e) => form.setValue("method", e.target.value)}>
                <NativeSelectOption value="Bank Transfer">Bank Transfer</NativeSelectOption>
                <NativeSelectOption value="Cheque">Cheque</NativeSelectOption>
                <NativeSelectOption value="Cash">Cash</NativeSelectOption>
                <NativeSelectOption value="GCash">GCash</NativeSelectOption>
              </NativeSelect>
            </div>
          </div>
          {!isCash && (
            <>
              <div className="flex flex-col gap-1.5">
                {isCheck ? (
                  <>
                    <Label htmlFor="pay-chk">Cheque No.</Label>
                    <Input id="pay-chk" {...form.register("checkNo")} placeholder="e.g. CHK-001452" />
                  </>
                ) : (
                  <>
                    <Label htmlFor="pay-ref">Ref No.</Label>
                    <Input id="pay-ref" {...form.register("referenceNo")} placeholder="e.g. REF-2026-0842" />
                  </>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pay-proof">Proof of payment (deposit slip / receipt)</Label>
                <FileDropzone
                  id="pay-proof"
                  accept="image/*,.pdf,application/pdf"
                  hint="PNG, JPG, or PDF"
                  onFiles={(files) => {
                    const file = files[0]
                    if (!file) return
                    setProofFile({
                      name: file.name,
                      url: URL.createObjectURL(file),
                      size: formatBytes(file.size),
                    })
                  }}
                />
                {proofFile && (
                  <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-2.5 py-1.5 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <FileTextIcon className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate font-medium">{proofFile.name}</span>
                      {proofFile.size && <span className="text-muted-foreground">({proofFile.size})</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => setProofFile(undefined)}
                      aria-label="Remove proof file"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-remarks">Remarks</Label>
            <Textarea id="pay-remarks" rows={2} {...form.register("remarks")} placeholder="Bank branch, partial payment note, or remarks…" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Record payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function FinancePaymentsPage() {
  const s = useBiz()
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)

  const unpaid = useMemo(() => balances(s).filter((b) => b.balance > 0), [s])

  const dealMap = useMemo(() => new Map(s.deals.map((d) => [d.id, d])), [s.deals])
  const filtered = s.payments.filter((p) => {
    const cust = dealMap.get(p.dealId)?.customer ?? ""
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      cust.toLowerCase().includes(q) ||
      p.method.toLowerCase().includes(q) ||
      (p.referenceNo ?? "").toLowerCase().includes(q) ||
      (p.checkNo ?? "").toLowerCase().includes(q)
    )
  })
  const payPg = usePagination(filtered, 10)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Income & Customer Payments"
        description="Record incoming payments against confirmed customer invoices."
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <ExportButtons
              filename="customer-payments"
              headers={["Date", "Customer", "Method", "Ref No.", "Cheque No.", "Remarks", "Amount", "Recorded By"]}
              rows={filtered.map((p) => [
                p.date,
                dealMap.get(p.dealId)?.customer ?? `#${p.dealId}`,
                p.method,
                p.referenceNo ?? "",
                p.checkNo ?? "",
                p.remarks ?? "",
                p.amount,
                p.recordedBy,
              ])}
            />
            <Button size="sm" disabled={unpaid.length === 0} onClick={() => setOpen(true)}>
              <PlusIcon className="size-4" />
              Record payment
            </Button>
          </div>
        }
      />

      <Input
        placeholder="Search customer, method, ref no., or cheque no.…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="sm:max-w-xs print:hidden"
      />

      <Widget>
        <div className="overflow-x-auto px-(--card-spacing)">
          {filtered.length === 0 ? (
            <EmptyBox title="No payments found" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Ref / Cheque No.</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payPg.items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{p.date}</TableCell>
                    <TableCell className="font-medium">
                      <div>{dealMap.get(p.dealId)?.customer ?? `Invoice #${p.dealId}`}</div>
                      {p.remarks && <div className="max-w-xs truncate text-xs text-muted-foreground">{p.remarks}</div>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{p.method}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {p.referenceNo || p.checkNo ? (
                        <div className="flex flex-col">
                          {p.referenceNo && <span>Ref: {p.referenceNo}</span>}
                          {p.checkNo && <span className="text-muted-foreground">Check: {p.checkNo}</span>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.proofFile ? (
                        <a
                          href={p.proofFile.url}
                          download={p.proofFile.name}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex max-w-36 items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 text-xs font-medium text-primary hover:underline"
                          title={p.proofFile.name}
                        >
                          <FileTextIcon className="size-3 shrink-0" />
                          <span className="truncate">{p.proofFile.name}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{p.recordedBy}</TableCell>
                    <TableCell className="text-right font-sans tabular-nums text-success whitespace-nowrap">{peso(p.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <TablePagination {...payPg.pagination} />
        </div>
      </Widget>

      <RecordPaymentDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}

const BIR_TAX_OPTIONS = [
  { id: "Non-VAT (0%)", label: "Non-VAT (0%)", rate: 0, mode: "none" as const },
  { id: "12% VAT (Included)", label: "12% VAT (Inclusive)", rate: 0.12, mode: "inclusive" as const },
  { id: "12% VAT (Added)", label: "12% VAT (Exclusive)", rate: 0.12, mode: "exclusive" as const },
  { id: "1% EWT (Goods)", label: "1% EWT — Goods", rate: 0.01, mode: "withholding" as const },
  { id: "2% EWT (Services)", label: "2% EWT — Services", rate: 0.02, mode: "withholding" as const },
  { id: "5% EWT (Rental)", label: "5% EWT — Rental", rate: 0.05, mode: "withholding" as const },
]

function computeBirTax(amount: number, taxId: string): { tax: number; total: number } {
  const clean = Number.isFinite(amount) && amount > 0 ? amount : 0
  const opt = BIR_TAX_OPTIONS.find((o) => o.id === taxId) ?? BIR_TAX_OPTIONS[0]
  if (opt.mode === "inclusive") {
    const tax = Math.round(clean - clean / (1 + opt.rate))
    return { tax, total: Math.round(clean) }
  }
  if (opt.mode === "exclusive") {
    const tax = Math.round(clean * opt.rate)
    return { tax, total: Math.round(clean + tax) }
  }
  if (opt.mode === "withholding") {
    const tax = Math.round(clean * opt.rate)
    return { tax, total: Math.max(0, Math.round(clean - tax)) }
  }
  return { tax: 0, total: Math.round(clean) }
}

interface ExpenseDraftItem {
  id: string
  category: string
  amount: string
  birTaxType: string
  note: string
  receiptFile?: ProposalDoc
}

function makeExpenseDraft(): ExpenseDraftItem {
  return {
    id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    category: EXPENSE_CATEGORIES[0],
    amount: "",
    birTaxType: "Non-VAT (0%)",
    note: "",
  }
}

export function FinanceExpensesPage() {
  const s = useBiz()
  const [search, setSearch] = useState("")
  const [cat, setCat] = useState("all")
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<ExpenseDraftItem[]>([makeExpenseDraft()])
  const [formError, setFormError] = useState<string | null>(null)

  const filtered = s.expenses.filter((e) => {
    if (cat !== "all" && e.category !== cat) return false
    if (
      search.trim() &&
      !e.note.toLowerCase().includes(search.trim().toLowerCase()) &&
      !e.category.toLowerCase().includes(search.trim().toLowerCase())
    ) {
      return false
    }
    return true
  })
  const expPg = usePagination(filtered, 10)

  function updateItem(id: string, patch: Partial<ExpenseDraftItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev))
  }

  const summary = useMemo(() => {
    return items.reduce(
      (acc, it) => {
        const amt = Number(it.amount) || 0
        const { tax, total } = computeBirTax(amt, it.birTaxType)
        return {
          subtotal: acc.subtotal + amt,
          tax: acc.tax + tax,
          total: acc.total + total,
        }
      },
      { subtotal: 0, tax: 0, total: 0 }
    )
  }, [items])

  function handleSaveExpenses(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (!it.amount || Number(it.amount) <= 0) {
        setFormError(`Expense #${i + 1}: enter an amount greater than ₱0.`)
        return
      }
      if (!it.note.trim()) {
        setFormError(`Expense #${i + 1}: enter a note / description.`)
        return
      }
    }

    let okCount = 0
    let lastError = ""
    for (const it of items) {
      const baseAmount = Math.round(Number(it.amount))
      const { tax, total } = computeBirTax(baseAmount, it.birTaxType)
      const res = s.addExpense(it.category, baseAmount, it.note, it.receiptFile?.name, {
        birTaxType: it.birTaxType,
        birTaxAmount: tax,
        totalAmount: total,
        receiptFile: it.receiptFile,
      })
      if (res.ok) okCount += 1
      else lastError = res.error
    }

    toast.add({
      title:
        okCount > 0
          ? `Recorded ${okCount} ${okCount === 1 ? "expense" : "expenses"}. CEO profit updated.`
          : lastError || "Failed to record expenses",
    })
    if (okCount > 0) {
      setItems([makeExpenseDraft()])
      setOpen(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Expenses"
        description="Record multiple operating expenses with BIR tax computation and receipt uploads."
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <ExportButtons
              filename="expenses"
              headers={["Date", "Category", "Note", "BIR Tax", "Tax Amount", "Receipt", "Amount", "Total"]}
              rows={filtered.map((e) => [
                e.date,
                e.category,
                e.note,
                e.birTaxType ?? "Non-VAT (0%)",
                e.birTaxAmount ?? 0,
                e.receiptFile?.name ?? e.attachmentName ?? "",
                e.amount,
                e.totalAmount ?? e.amount,
              ])}
            />
            <Button
              size="sm"
              onClick={() => {
                setItems([makeExpenseDraft()])
                setFormError(null)
                setOpen(true)
              }}
            >
              <PlusIcon className="size-4" />
              Add expense
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row print:hidden">
        <Input placeholder="Search expenses…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        <NativeSelect value={cat} onChange={(e) => setCat(e.target.value)} className="sm:w-44">
          <NativeSelectOption value="all">All categories</NativeSelectOption>
          {EXPENSE_CATEGORIES.map((c) => (
            <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <Widget>
        <div className="overflow-x-auto px-(--card-spacing)">
          {filtered.length === 0 ? (
            <EmptyBox title="No expenses found" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>BIR Tax</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expPg.items.map((e) => {
                  const finalTotal = e.totalAmount ?? e.amount
                  const hasTax = (e.birTaxAmount ?? 0) > 0
                  return (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{e.date}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{e.category}</TableCell>
                    <TableCell>{e.note}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {e.birTaxType && e.birTaxType !== "Non-VAT (0%)" ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{e.birTaxType}</span>
                          {e.birTaxAmount ? (
                            <span className="text-muted-foreground tabular-nums">Tax: {peso(e.birTaxAmount)}</span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Non-VAT</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {e.receiptFile ? (
                        <a
                          href={e.receiptFile.url}
                          download={e.receiptFile.name}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex max-w-36 items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 text-xs font-medium text-primary hover:underline"
                          title={e.receiptFile.name}
                        >
                          <FileTextIcon className="size-3 shrink-0" />
                          <span className="truncate">{e.receiptFile.name}</span>
                        </a>
                      ) : e.attachmentName ? (
                        <span className="text-xs text-muted-foreground">{e.attachmentName}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-sans tabular-nums whitespace-nowrap">{peso(e.amount)}</TableCell>
                    <TableCell className={`text-right font-sans tabular-nums whitespace-nowrap ${hasTax ? "font-semibold" : "text-muted-foreground"}`}>
                      {peso(finalTotal)}
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          <TablePagination {...expPg.pagination} />
        </div>
      </Widget>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[96vw] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Record expenses</DialogTitle>
            <DialogDescription>
              Add multiple expense rows horizontally with BIR tax computation and receipt uploads.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveExpenses} className="flex flex-col gap-4">
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/35">
                    <TableHead className="w-8 text-center">#</TableHead>
                    <TableHead className="min-w-32">Category</TableHead>
                    <TableHead className="min-w-44">Description / Note</TableHead>
                    <TableHead className="min-w-28">Amount (₱)</TableHead>
                    <TableHead className="min-w-40">BIR Tax</TableHead>
                    <TableHead className="min-w-40">Receipt</TableHead>
                    <TableHead className="min-w-24 text-right">Total</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => {
                    const calc = computeBirTax(Number(item.amount) || 0, item.birTaxType)
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-center font-sans text-xs text-muted-foreground tabular-nums">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <NativeSelect
                            size="sm"
                            aria-label={`Expense ${idx + 1} category`}
                            value={item.category}
                            onChange={(e) => updateItem(item.id, { category: e.target.value })}
                          >
                            {EXPENSE_CATEGORIES.map((c) => (
                              <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>
                            ))}
                          </NativeSelect>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 text-xs"
                            aria-label={`Expense ${idx + 1} description`}
                            value={item.note}
                            onChange={(e) => updateItem(item.id, { note: e.target.value })}
                            placeholder="e.g. Electric bill, OR #10421"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 font-sans text-xs tabular-nums"
                            type="number"
                            min={1}
                            aria-label={`Expense ${idx + 1} amount`}
                            placeholder="0"
                            value={item.amount}
                            onChange={(e) => updateItem(item.id, { amount: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <NativeSelect
                              size="sm"
                              aria-label={`Expense ${idx + 1} BIR tax`}
                              value={item.birTaxType}
                              onChange={(e) => updateItem(item.id, { birTaxType: e.target.value })}
                            >
                              {BIR_TAX_OPTIONS.map((opt) => (
                                <NativeSelectOption key={opt.id} value={opt.id}>{opt.label}</NativeSelectOption>
                              ))}
                            </NativeSelect>
                            {calc.tax > 0 && (
                              <span className="text-[10px] text-muted-foreground tabular-nums">
                                Tax: {peso(calc.tax)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.receiptFile ? (
                            <div className="flex items-center justify-between gap-1.5 rounded-md border bg-muted/35 px-2 py-1 text-xs">
                              <span className="flex min-w-0 items-center gap-1">
                                <FileTextIcon className="size-3 shrink-0 text-primary" />
                                <span className="max-w-24 truncate font-medium" title={item.receiptFile.name}>
                                  {item.receiptFile.name}
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, { receiptFile: undefined })}
                                aria-label="Remove receipt"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <XIcon className="size-3" />
                              </button>
                            </div>
                          ) : (
                            <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-border bg-muted/20 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-primary">
                              <UploadIcon className="size-3.5" />
                              <span>Upload</span>
                              <input
                                type="file"
                                accept="image/*,.pdf,application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  e.target.value = ""
                                  if (!file) return
                                  updateItem(item.id, {
                                    receiptFile: {
                                      name: file.name,
                                      url: URL.createObjectURL(file),
                                      size: formatBytes(file.size),
                                    },
                                  })
                                }}
                              />
                            </label>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-sans text-xs font-semibold tabular-nums whitespace-nowrap">
                          {peso(calc.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            disabled={items.length <= 1}
                            aria-label={`Remove row ${idx + 1}`}
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/25 px-4 py-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setItems((prev) => [...prev, makeExpenseDraft()])}
              >
                <PlusIcon className="size-4" />
                Add row
              </Button>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="text-muted-foreground">
                  Rows: <strong className="text-foreground tabular-nums">{items.length}</strong>
                </span>
                <span className="text-muted-foreground">
                  BIR Tax: <strong className="text-foreground tabular-nums">{peso(summary.tax)}</strong>
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  Grand Total: {peso(summary.total)}
                </span>
              </div>
            </div>

            {formError && <p className="text-xs font-medium text-destructive">{formError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">
                Save {items.length > 1 ? `${items.length} expenses` : "expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function FinanceReceivablesPage() {
  const s = useBiz()
  const [bucket, setBucket] = useState("all")
  const [search, setSearch] = useState("")
  const [collectDealId, setCollectDealId] = useState<number | null>(null)

  const unpaid = useMemo(() => balances(s).filter((b) => b.balance > 0), [s])
  const b0 = unpaid.filter((b) => b.agingBucket === "0-30").reduce((a, x) => a + x.balance, 0)
  const b31 = unpaid.filter((b) => b.agingBucket === "31-60").reduce((a, x) => a + x.balance, 0)
  const b61 = unpaid.filter((b) => b.agingBucket === "61+").reduce((a, x) => a + x.balance, 0)

  const filtered = unpaid.filter((b) => {
    if (bucket !== "all" && b.agingBucket !== bucket) return false
    if (search.trim() && !b.customer.toLowerCase().includes(search.trim().toLowerCase())) return false
    return true
  })
  const arPg = usePagination(filtered, 10)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Accounts Receivable"
        description="Outstanding confirmed sales with aging buckets (0–30, 31–60, 61+ days)."
        actions={
          <ExportButtons
            filename="accounts-receivable"
            headers={["Customer", "Invoice", "Paid", "Balance", "Aging"]}
            rows={filtered.map((b) => [b.customer, b.amount, b.paid, b.balance, b.agingBucket])}
          />
        }
      />

      <Grid cols={3}>
        <Stat title="0–30 days" value={<PesoAmount value={b0} compact />} caption="Current invoices" />
        <Stat title="31–60 days" value={<PesoAmount value={b31} compact />} caption="Follow-up needed" />
        <Stat title="61+ days" value={<PesoAmount value={b61} compact />} caption="Overdue" />
      </Grid>

      <div className="flex flex-col gap-2 sm:flex-row print:hidden">
        <Input placeholder="Search customer…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        <NativeSelect value={bucket} onChange={(e) => setBucket(e.target.value)} className="sm:w-44">
          <NativeSelectOption value="all">All aging buckets</NativeSelectOption>
          <NativeSelectOption value="0-30">0–30 days</NativeSelectOption>
          <NativeSelectOption value="31-60">31–60 days</NativeSelectOption>
          <NativeSelectOption value="61+">61+ days</NativeSelectOption>
        </NativeSelect>
      </div>

      <Widget>
        <div className="overflow-x-auto px-(--card-spacing)">
          {filtered.length === 0 ? (
            <EmptyBox title="No outstanding receivables" description="All matching confirmed invoices have been paid." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Aging</TableHead>
                  <TableHead className="text-right">Invoice</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right print:hidden">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arPg.items.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.customer}</TableCell>
                    <TableCell className="text-muted-foreground">{MONTHS[b.month]}</TableCell>
                    <TableCell>
                      <StatusBadge tone={b.agingBucket === "61+" ? "danger" : b.agingBucket === "31-60" ? "warning" : "info"}>
                        {b.agingBucket} days
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right font-sans tabular-nums">{peso(b.amount)}</TableCell>
                    <TableCell className="text-right font-sans tabular-nums text-muted-foreground">{peso(b.paid)}</TableCell>
                    <TableCell className="text-right font-sans font-semibold tabular-nums">{peso(b.balance)}</TableCell>
                    <TableCell className="text-right print:hidden">
                      <Button
                        size="xs"
                        onClick={() => setCollectDealId(b.id)}
                      >
                        <WalletIcon className="size-3.5" />
                        Collect balance
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <TablePagination {...arPg.pagination} />
        </div>
      </Widget>

      <RecordPaymentDialog
        open={collectDealId !== null}
        onOpenChange={(o) => !o && setCollectDealId(null)}
        initialDealId={collectDealId ?? undefined}
      />
    </div>
  )
}

const payableSchema = z.object({
  vendor: z.string().min(2, "Vendor name is required"),
  category: z.string().min(2, "Category is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than zero"),
  dueDate: z.string().min(4, "Due date is required"),
})

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function FinancePayablesPage() {
  const s = useBiz()
  const [status, setStatus] = useState("all")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [open, setOpen] = useState(false)

  const form = useForm<z.input<typeof payableSchema>, unknown, z.output<typeof payableSchema>>({
    resolver: zodResolver(payableSchema),
    defaultValues: { vendor: "", category: "Utilities", amount: 12000, dueDate: "2026-12-05" },
  })

  const selectedIso = selectedDate ? toIsoDate(selectedDate) : null

  const filtered = s.payables.filter((p) => {
    if (status !== "all" && p.status !== status) return false
    if (selectedIso && p.dueDate !== selectedIso) return false
    return true
  })
  const apPg = usePagination(filtered, 10)

  const unpaidDates = useMemo(
    () => s.payables.filter((p) => p.status === "unpaid").map((p) => parseIsoDate(p.dueDate)),
    [s.payables]
  )
  const paidDates = useMemo(
    () => s.payables.filter((p) => p.status === "paid").map((p) => parseIsoDate(p.dueDate)),
    [s.payables]
  )
  const totalUnpaid = s.payables.filter((p) => p.status === "unpaid").reduce((a, b) => a + b.amount, 0)
  const totalPaid = s.payables.filter((p) => p.status === "paid").reduce((a, b) => a + b.amount, 0)

  const onSubmit = form.handleSubmit((values) => {
    const res = s.addPayable(values)
    toast.add({ title: res.ok ? "Vendor bill added" : res.error })
    if (res.ok) {
      form.reset()
      setOpen(false)
    }
  })

  function openAddBill(dueDate?: string) {
    form.reset({
      vendor: "",
      category: "Utilities",
      amount: 12000,
      dueDate: dueDate ?? selectedIso ?? "2026-12-05",
    })
    setOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Accounts Payable"
        description="Vendor bills and upcoming due dates. Click a date on the calendar to filter bills."
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <ExportButtons
              filename="accounts-payable"
              headers={["Vendor", "Category", "Due Date", "Status", "Amount"]}
              rows={filtered.map((p) => [p.vendor, p.category, p.dueDate, p.status, p.amount])}
            />
            <Button size="sm" onClick={() => openAddBill()}>
              <PlusIcon className="size-4" />
              Add bill
            </Button>
          </div>
        }
      />

      <Grid cols={3}>
        <Stat title="Total unpaid bills" value={<PesoAmount value={totalUnpaid} compact />} caption={`${unpaidDates.length} upcoming due`} />
        <Stat title="Total paid bills" value={<PesoAmount value={totalPaid} compact />} caption={`${paidDates.length} settled`} />
        <Stat
          title="Next due date"
          value={
            s.payables
              .filter((p) => p.status === "unpaid")
              .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]?.dueDate ?? "None"
          }
          caption="Earliest unpaid payable"
        />
      </Grid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel
          title="Due-date calendar"
          className="lg:col-span-4 print:hidden"
          action={
            selectedDate ? (
              <Button size="xs" variant="ghost" onClick={() => setSelectedDate(undefined)}>
                Clear date
              </Button>
            ) : (
              <CalendarDaysIcon className="size-4 text-muted-foreground" />
            )
          }
        >
          <div className="flex flex-col items-center gap-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              defaultMonth={new Date(2026, 10, 1)}
              modifiers={{ unpaid: unpaidDates, paid: paidDates }}
              modifiersClassNames={{
                unpaid: "bg-warning/25 text-warning-foreground dark:text-warning font-semibold rounded-md",
                paid: "bg-success/20 text-success font-semibold rounded-md",
              }}
              className="rounded-xl border bg-transparent"
            />
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-warning/50" />
                Unpaid due
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-success/50" />
                Paid
              </span>
            </div>
            {selectedIso && (
              <Button size="xs" variant="outline" className="w-full" onClick={() => openAddBill(selectedIso)}>
                <PlusIcon className="size-3.5" />
                Add bill due on {selectedIso}
              </Button>
            )}
          </div>
        </Panel>

        <div className="flex flex-col gap-4 lg:col-span-8">
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <NativeSelect value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-44">
              <NativeSelectOption value="all">All bills</NativeSelectOption>
              <NativeSelectOption value="unpaid">Unpaid</NativeSelectOption>
              <NativeSelectOption value="paid">Paid</NativeSelectOption>
            </NativeSelect>
            {selectedIso && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/40 px-2.5 py-1 text-xs">
                Due on <strong>{selectedIso}</strong>
                <button
                  type="button"
                  onClick={() => setSelectedDate(undefined)}
                  aria-label="Clear date filter"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            )}
          </div>

          <Widget>
            <div className="overflow-x-auto px-(--card-spacing)">
              {filtered.length === 0 ? (
                <EmptyBox
                  title={selectedIso ? `No bills due on ${selectedIso}` : "No bills found"}
                  description={selectedIso ? "Click Clear date to see all bills, or add a bill for this date." : undefined}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right print:hidden">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apPg.items.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.vendor}</TableCell>
                        <TableCell>{p.category}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{p.dueDate}</TableCell>
                        <TableCell>
                          <StatusBadge tone={p.status === "paid" ? "success" : "warning"} className="capitalize">
                            {p.status}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-right font-sans tabular-nums whitespace-nowrap">{peso(p.amount)}</TableCell>
                        <TableCell className="text-right print:hidden">
                          {p.status === "unpaid" ? (
                            <Button
                              size="xs"
                              onClick={() => {
                                const res = s.markPayablePaid(p.id)
                                toast.add({ title: res.ok ? `Marked ${p.vendor} as paid` : res.error })
                              }}
                            >
                              <CheckCircle2Icon className="size-3.5" />
                              Mark paid
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Paid {p.paidAt}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <TablePagination {...apPg.pagination} />
            </div>
          </Widget>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add vendor bill</DialogTitle>
            <DialogDescription>Track an upcoming payable with its due date.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ap-v">Vendor</Label>
              <Input id="ap-v" {...form.register("vendor")} placeholder="Vendor name" />
              {form.formState.errors.vendor && <p className="text-xs text-destructive">{form.formState.errors.vendor.message}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ap-c">Category</Label>
                <NativeSelect id="ap-c" value={form.watch("category")} onChange={(e) => form.setValue("category", e.target.value)}>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ap-a">Amount (₱)</Label>
                <Input id="ap-a" type="number" {...form.register("amount")} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ap-d">Due date</Label>
              <Input id="ap-d" type="date" {...form.register("dueDate")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Add bill</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type CashFlowChartView = "inflow" | "outflow" | "compare"

export function FinanceCashFlowPage() {
  const s = useBiz()
  const [view, setView] = useState<CashFlowChartView>("inflow")
  const rows = monthly(s).map((m) => ({
    month: m.month,
    inflow: m.collections,
    outflow: m.expenses,
    net: m.collections - m.expenses,
  }))
  const cfPg = usePagination(rows, 10)

  const totalInflow = rows.reduce((a, r) => a + r.inflow, 0)
  const totalOutflow = rows.reduce((a, r) => a + r.outflow, 0)
  const totalNet = totalInflow - totalOutflow
  const last = rows[rows.length - 1]
  const prev = rows[rows.length - 2]
  const inflowDelta = last && prev ? change(last.inflow, prev.inflow) : null
  const outflowDelta = last && prev ? change(last.outflow, prev.outflow) : null
  const coveragePct = totalOutflow > 0 ? Math.round((totalInflow / totalOutflow) * 100) : 0

  const categories = expenseByCategory(s).sort((a, b) => b.amount - a.amount)
  const maxCat = Math.max(1, ...categories.map((c) => c.amount))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cash Flow"
        description="Monthly cash inflows (collections), outflows (expenses), and net liquidity."
        actions={
          <ExportButtons
            filename="cash-flow"
            headers={["Month", "Inflow", "Outflow", "Net Cash Flow"]}
            rows={rows.map((r) => [r.month, r.inflow, r.outflow, r.net])}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Hero Chronicle Cash Flow widget */}
        <Widget className="xl:col-span-2">
          <WidgetHeader title="Monthly cash flow" icon={WalletIcon} />
          <PeriodHeader
            columns={[
              {
                label: "Total inflow (6 mo)",
                value: pesoShort(totalInflow),
                delta: inflowDelta,
                caption: last ? `${last.month}: ${pesoShort(last.inflow)}` : "Collections",
              },
              {
                label: "Total outflow (6 mo)",
                value: pesoShort(totalOutflow),
                delta: outflowDelta,
                caption: last ? `${last.month}: ${pesoShort(last.outflow)}` : "Expenses",
              },
              {
                label: "Net cash flow",
                value: pesoShort(totalNet),
                delta: null,
                caption: `${coveragePct}% inflow-to-outflow coverage`,
              },
            ]}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 px-(--card-spacing)">
            <div className="flex flex-wrap gap-x-4 gap-y-1 font-sans text-xs text-muted-foreground tabular-nums">
              <span>
                Inflow <span className="font-medium text-foreground">{peso(totalInflow)}</span>
              </span>
              <span>
                Outflow <span className="font-medium text-foreground">{peso(totalOutflow)}</span>
              </span>
              <span>
                Net{" "}
                <span className={totalNet >= 0 ? "font-medium text-success" : "font-medium text-destructive"}>
                  {totalNet >= 0 ? "+" : ""}
                  {peso(totalNet)}
                </span>
              </span>
            </div>
            <Segmented<CashFlowChartView>
              aria-label="Cash flow chart view"
              value={view}
              onChange={setView}
              className="w-auto shrink-0 print:hidden"
              options={[
                { value: "inflow", label: "Inflows" },
                { value: "outflow", label: "Outflows" },
                { value: "compare", label: "Inflow vs Outflow" },
              ]}
            />
          </div>

          <div className="h-64 px-(--card-spacing)">
            {view === "compare" ? (
              <StepLines
                data={rows}
                xKey="month"
                series={[
                  { key: "inflow", label: "Inflow", color: "var(--chart-lead)" },
                  { key: "outflow", label: "Outflow", color: "var(--chart-2)" },
                ]}
                format={pesoShort}
                className="h-full"
              />
            ) : (
              <PillBars
                data={rows.map((r) => ({
                  label: r.month,
                  title: `${r.month} 2026`,
                  value: view === "inflow" ? r.inflow : r.outflow,
                }))}
                highlight="last"
                format={peso}
                barSize={26}
                className="h-full"
              />
            )}
          </div>
        </Widget>

        {/* Right column: Chronicle HourBars overlay + horizontal proportion breakdown */}
        <div className="flex flex-col gap-4">
          <Widget>
            <WidgetHeader title="Inflow vs outflow pulse" icon={TrendingUpIcon} />
            <WidgetValue
              value={<PesoAmount value={totalNet} compact className={totalNet >= 0 ? "text-success" : "text-destructive"} />}
              caption="Bars = monthly inflow · dashed line = outflow"
              size="md"
            />
            <div className="h-32 px-(--card-spacing)">
              <HourBars
                data={rows.map((r) => ({
                  label: `${r.month} 2026`,
                  current: r.inflow,
                  previous: r.outflow,
                }))}
                currentLabel="Inflow"
                previousLabel="Outflow"
                format={peso}
                className="h-full"
              />
            </div>
          </Widget>

          <Widget>
            <WidgetHeader title="Outflow breakdown (this month)" />
            <div className="flex flex-col gap-3 px-(--card-spacing)">
              {categories.map((c, idx) => {
                const width = Math.max(4, Math.round((c.amount / maxCat) * 100))
                const barTone = idx === 0 ? "bg-primary" : idx === 1 ? "bg-chart-2" : "bg-chart-3"
                return (
                  <div key={c.category} className="grid grid-cols-[90px_1fr_auto] items-center gap-3 text-xs">
                    <span className="truncate text-muted-foreground">{c.category}</span>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${barTone}`} style={{ width: `${width}%` }} />
                    </div>
                    <span className="font-sans font-medium tabular-nums">{pesoShort(c.amount)}</span>
                  </div>
                )
              })}
            </div>
          </Widget>
        </div>
      </div>

      <Panel title="Monthly cash flow breakdown">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Inflow</TableHead>
                <TableHead className="text-right">Outflow</TableHead>
                <TableHead className="text-right">Net Cash Flow</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cfPg.items.map((r) => (
                <TableRow key={r.month}>
                  <TableCell className="font-medium">{r.month} 2026</TableCell>
                  <TableCell className="text-right font-sans tabular-nums">{peso(r.inflow)}</TableCell>
                  <TableCell className="text-right font-sans tabular-nums">{peso(r.outflow)}</TableCell>
                  <TableCell className={`text-right font-sans font-semibold tabular-nums ${r.net >= 0 ? "text-success" : "text-destructive"}`}>
                    {peso(r.net)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination {...cfPg.pagination} />
        </div>
      </Panel>
    </div>
  )
}

export function FinancePayrollPage() {
  const s = useBiz()
  const totalPayroll = s.payroll.reduce((a, p) => a + p.basePay + p.bonus, 0)
  const paidCount = s.payroll.filter((p) => p.status === "paid").length
  const prPg = usePagination(s.payroll, 10)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payroll"
        description={`Monthly staff payroll (${MONTHS[NOW]} 2026).`}
        actions={
          <ExportButtons
            filename="payroll"
            headers={["Employee", "Title", "Base Pay", "Bonus", "Total", "Status"]}
            rows={s.payroll.map((p) => [p.employeeName, p.roleLabel, p.basePay, p.bonus, p.basePay + p.bonus, p.status])}
          />
        }
      />

      <Grid cols={3}>
        <Stat title="Total monthly payroll" value={<PesoAmount value={totalPayroll} compact />} caption={`${s.payroll.length} employees`} />
        <Stat title="Disbursed" value={String(paidCount)} caption="Marked as paid" />
        <Stat title="Pending disbursement" value={String(s.payroll.length - paidCount)} caption="Awaiting release" />
      </Grid>

      <Widget>
        <div className="overflow-x-auto px-(--card-spacing)">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="text-right">Base Pay</TableHead>
                <TableHead className="text-right">Bonus</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right print:hidden">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prPg.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.employeeName}</TableCell>
                  <TableCell className="text-muted-foreground">{p.roleLabel}</TableCell>
                  <TableCell className="text-right font-sans tabular-nums">{peso(p.basePay)}</TableCell>
                  <TableCell className="text-right font-sans tabular-nums">{peso(p.bonus)}</TableCell>
                  <TableCell className="text-right font-sans font-semibold tabular-nums">{peso(p.basePay + p.bonus)}</TableCell>
                  <TableCell>
                    <StatusBadge tone={p.status === "paid" ? "success" : "warning"} className="capitalize">
                      {p.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-right print:hidden">
                    {p.status === "pending" ? (
                      <Button
                        size="xs"
                        onClick={() => {
                          const res = s.markPayrollPaid(p.id)
                          toast.add({ title: res.ok ? `Payroll paid for ${p.employeeName}` : res.error })
                        }}
                      >
                        Mark paid
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Paid {p.paidAt}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination {...prPg.pagination} />
        </div>
      </Widget>
    </div>
  )
}

export function FinanceReportsPage() {
  const s = useBiz()
  const rows = monthly(s)
  const incPg = usePagination(rows, 10)

  return (
    <div className="flex flex-col gap-8">
      <Panel
        title="Monthly Income Statement Summary"
        action={
          <ExportButtons
            filename="income-statement"
            headers={["Month", "Revenue", "Expenses", "Net Profit", "Collections", "Receivables"]}
            rows={rows.map((m) => [m.month, m.revenue, m.expenses, m.profit, m.collections, m.receivables])}
          />
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Net Profit</TableHead>
                <TableHead className="text-right">Collections</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incPg.items.map((m) => (
                <TableRow key={m.month}>
                  <TableCell className="font-medium">{m.month} 2026</TableCell>
                  <TableCell className="text-right font-sans tabular-nums">{peso(m.revenue)}</TableCell>
                  <TableCell className="text-right font-sans tabular-nums">{peso(m.expenses)}</TableCell>
                  <TableCell className={`text-right font-sans font-semibold tabular-nums ${m.profit >= 0 ? "text-success" : "text-destructive"}`}>
                    {peso(m.profit)}
                  </TableCell>
                  <TableCell className="text-right font-sans tabular-nums">{peso(m.collections)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination {...incPg.pagination} />
        </div>
      </Panel>

      <DepartmentReportsPage
        title="Financial Reports"
        description="Generate and submit monthly or weekly financial reports to the Manager."
        allowedKinds={["monthly", "weekly", "daily"]}
      />
    </div>
  )
}
