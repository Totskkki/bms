"use client"

import { DownloadIcon, PrinterIcon, UploadCloudIcon } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { downloadCsv } from "@/kit/data/csv"
import { DataTablePagination } from "@/kit/data-table/pagination"
import { PageHeader } from "@/kit/ui-patterns/page-header"
import { StatusBadge, type Tone } from "@/kit/ui-patterns/status-badge"
import { Widget, WidgetHeader, WidgetValue } from "@/kit/widgets/widget"
import { cn } from "@/lib/utils"

import { peso, pesoShort } from "./metrics"
import { useBiz, type Report, type ReportStatus, type Stage, type TaskPriority, type TaskStatus } from "./store"

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

/** Personalized dashboard header: "Good morning, Ramon" + live date, time, and summary context. */
export function DashboardGreetingHeader({
  summary,
  actions,
}: {
  summary?: React.ReactNode
  actions?: React.ReactNode
}) {
  const currentUser = useBiz((s) => s.currentUser)
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])

  const firstName = currentUser?.name.split(/\s+/)[0] ?? "there"
  const greeting = now ? greetingForHour(now.getHours()) : "Welcome"
  const dateText = now
    ? now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : ""
  const timeText = now
    ? now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : ""

  return (
    <PageHeader
      title={`${greeting}, ${firstName}`}
      description={
        <span className="inline-flex flex-wrap items-center gap-x-1.5">
          {dateText && (
            <span>
              {dateText} · <span className="font-sans tabular-nums">{timeText}</span>
            </span>
          )}
          {dateText && summary && <span aria-hidden>·</span>}
          {summary && <span>{summary}</span>}
        </span>
      }
      actions={actions}
    />
  )
}

/**
 * Renders Philippine peso amounts with a balanced peso glyph (matching digit height
 * in sans tabular-nums so the peso sign never appears oversized).
 */
export function PesoAmount({
  value,
  compact = false,
  className,
}: {
  value: number
  compact?: boolean
  className?: string
}) {
  const formatted = compact ? pesoShort(value) : peso(value)
  const neg = formatted.startsWith("-")
  const withoutSign = neg ? formatted.slice(1) : formatted
  const digits = withoutSign.startsWith("₱") ? withoutSign.slice(1) : withoutSign
  return (
    <span className={cn("font-sans tabular-nums tracking-tight", className)}>
      {neg ? "-" : ""}
      <span className="font-normal">₱</span>
      {digits}
    </span>
  )
}

export function Stat({
  title,
  value,
  caption,
  delta,
  invert,
}: {
  title: string
  value: React.ReactNode
  caption?: React.ReactNode
  delta?: number | null
  invert?: boolean
}) {
  return (
    <Widget>
      <WidgetHeader title={title} />
      <WidgetValue value={value} caption={caption} delta={delta} invert={invert} size="md" />
    </Widget>
  )
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Widget className={className}>
      <WidgetHeader title={title} action={action} />
      <div className="px-(--card-spacing) text-sm">{children}</div>
    </Widget>
  )
}

export function Grid({ children, cols = 4 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  const c = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" }[cols]
  return <div className={`grid gap-4 sm:grid-cols-2 ${c}`}>{children}</div>
}

export function ExportButtons({
  filename,
  headers,
  rows,
}: {
  filename: string
  headers: string[]
  rows: (string | number)[][]
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadCsv(filename.endsWith(".csv") ? filename : `${filename}.csv`, headers, rows)}
      >
        <DownloadIcon className="size-4" />
        Excel (CSV)
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <PrinterIcon className="size-4" />
        PDF
      </Button>
    </div>
  )
}

export function EmptyBox({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}

export function usePagination<T>(items: T[], defaultPageSize = 10) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pageCount)

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, safePage, pageSize])

  return {
    items: pageItems,
    pagination: {
      page: safePage,
      pageSize,
      total,
      pageCount,
      onPageChange: (next: number) => setPage(Math.min(Math.max(1, next), pageCount)),
      onPageSizeChange: (size: number) => {
        setPageSize(size)
        setPage(1)
      },
    },
  }
}

export function TablePagination({
  page,
  pageSize,
  total,
  pageCount,
  onPageChange,
  onPageSizeChange,
  className,
}: {
  page: number
  pageSize: number
  total: number
  pageCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  className?: string
}) {
  if (total === 0) return null
  return (
    <div className={cn("mt-3 border-t pt-3 print:hidden", className)}>
      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        pageCount={pageCount}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}

/** Styled drag-and-drop / click file uploader replacing the native browser file input. */
export function FileDropzone({
  id,
  accept,
  multiple = false,
  hint,
  onFiles,
  className,
}: {
  id?: string
  accept?: string
  multiple?: boolean
  hint?: string
  onFiles: (files: File[]) => void
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)

  function emit(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])
    if (files.length > 0) onFiles(files)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        emit(e.dataTransfer.files)
      }}
      className={cn(
        "group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors focus-visible:outline-2 focus-visible:outline-ring",
        dragging
          ? "border-primary bg-primary/10"
          : "border-border/80 bg-muted/25 hover:border-primary/60 hover:bg-muted/45",
        className
      )}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          emit(e.target.files)
          e.target.value = ""
        }}
      />
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
        <UploadCloudIcon className="size-5" />
      </span>
      <div className="text-sm">
        <span className="font-medium text-primary">Click to upload</span>{" "}
        <span className="text-muted-foreground">or drag and drop</span>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

const REPORT_META: Record<ReportStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "muted" },
  submitted: { label: "Submitted", tone: "warning" },
  reviewed: { label: "Reviewed", tone: "info" },
  sent_to_ceo: { label: "Sent to CEO", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  returned: { label: "Returned", tone: "danger" },
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const meta = REPORT_META[status]
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
}

const STAGE_TONE: Record<Stage, Tone> = {
  inquiry: "muted",
  lead: "info",
  proposal: "warning",
  confirmed: "success",
}

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <StatusBadge tone={STAGE_TONE[stage]} className="capitalize">
      {stage}
    </StatusBadge>
  )
}

const PRIORITY_TONE: Record<TaskPriority, Tone> = {
  low: "muted",
  medium: "warning",
  high: "danger",
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <StatusBadge tone={PRIORITY_TONE[priority]} className="capitalize">
      {priority}
    </StatusBadge>
  )
}

const TASK_STATUS_META: Record<TaskStatus, { label: string; tone: Tone }> = {
  todo: { label: "To do", tone: "muted" },
  in_progress: { label: "In progress", tone: "info" },
  done: { label: "Completed", tone: "success" },
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const meta = TASK_STATUS_META[status]
  return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
}

export function ReportTimeline({ report }: { report: Report }) {
  return (
    <ol className="flex flex-col gap-2 border-l-2 border-border pl-3.5 text-xs">
      {report.history.map((entry, idx) => (
        <li key={idx} className="relative">
          <span className="absolute top-1 -left-[19px] size-2 rounded-full bg-primary" />
          <p className="font-medium text-foreground">{entry.action}</p>
          <p className="text-muted-foreground">
            {entry.by} · {entry.at}
          </p>
        </li>
      ))}
    </ol>
  )
}

export function Bars({
  data,
  x,
  keys,
  format,
}: {
  data: Record<string, string | number>[]
  x: string
  keys: { key: string; label: string }[]
  format: (n: number) => string
}) {
  const config: ChartConfig = Object.fromEntries(
    keys.map((k, i) => [k.key, { label: k.label, color: `var(--chart-${i + 1})` }])
  )
  return (
    <ChartContainer config={config} className="h-60 w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey={x} tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => format(Number(v))} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {keys.map((k) => (
          <Bar key={k.key} dataKey={k.key} fill={`var(--color-${k.key})`} radius={4} />
        ))}
      </BarChart>
    </ChartContainer>
  )
}
