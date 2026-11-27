"use client"

import {
  ArrowRightIcon,
  BellIcon,
  CheckIcon,
  ClipboardCheckIcon,
  FileCheck2Icon,
  ReceiptTextIcon,
  RotateCcwIcon,
  ShoppingBagIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { StatusBadge } from "@/kit/ui-patterns/status-badge"
import { Widget, WidgetHeader } from "@/kit/widgets/widget"
import { cn } from "@/lib/utils"

import { type EmployeePerformanceRow } from "../metrics"
import { TablePagination, usePagination } from "../parts"
import { type ActionResult, type NotificationItem, type NotificationKind, type Report } from "../store"

function scoreBarClass(pct: number) {
  if (pct >= 80) return "bg-success"
  if (pct >= 50) return "bg-warning"
  return "bg-destructive"
}

function scoreTextClass(pct: number) {
  if (pct >= 80) return "text-success"
  if (pct >= 50) return "text-warning-foreground dark:text-warning"
  return "text-destructive"
}

export function EmployeePerformancePanel({
  rows,
  className,
}: {
  rows: EmployeePerformanceRow[]
  className?: string
}) {
  const pg = usePagination(rows, 10)
  return (
    <Widget className={className}>
      <WidgetHeader title="Employee Performance" icon={UsersIcon} />
      <div className="overflow-x-auto px-(--card-spacing)">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>This Month</TableHead>
              <TableHead className="text-right">% of Target</TableHead>
              <TableHead className="w-28">Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pg.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                  No employee performance data yet.
                </TableCell>
              </TableRow>
            ) : (
              pg.items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium whitespace-nowrap">{row.name}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <StatusBadge tone={row.department === "Sales" ? "info" : "neutral"} dot={false}>
                      {row.department}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="font-sans text-xs whitespace-nowrap tabular-nums">
                    {row.result}
                  </TableCell>
                  <TableCell className={cn("text-right font-sans text-xs font-semibold tabular-nums", scoreTextClass(row.pct))}>
                    {row.pct}%
                  </TableCell>
                  <TableCell>
                    <div
                      className="h-2 w-full overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuenow={row.barValue}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${row.name} target progress`}
                    >
                      <div
                        className={cn("h-full rounded-full transition-all", scoreBarClass(row.pct))}
                        style={{ width: `${row.barValue}%` }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination {...pg.pagination} />
      </div>
    </Widget>
  )
}

export function PendingApprovalsPanel({
  reports,
  onApprove,
  onReturn,
  className,
}: {
  reports: Report[]
  onApprove: (id: number) => ActionResult
  onReturn: (id: number, comment: string) => ActionResult
  className?: string
}) {
  const [returning, setReturning] = useState<Report | null>(null)
  const [comment, setComment] = useState("")

  return (
    <>
      <Widget className={className}>
        <WidgetHeader
          title="Pending Approvals"
          icon={ClipboardCheckIcon}
          action={
            reports.length > 0 ? (
              <Badge variant="secondary" className="font-sans tabular-nums">
                {reports.length}
              </Badge>
            ) : undefined
          }
        />
        <div className="flex flex-col gap-2 px-(--card-spacing)">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center">
              <FileCheck2Icon className="mb-2 size-6 text-muted-foreground/70" />
              <p className="text-sm text-muted-foreground">Nothing waiting for your approval.</p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="flex flex-col gap-2.5 rounded-xl border bg-muted/25 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{report.title}</p>
                    <p className="text-xs text-muted-foreground">Submitted by {report.authorName}</p>
                  </div>
                  <StatusBadge tone="info" dot={false} className="shrink-0 capitalize">
                    {report.kind}
                  </StatusBadge>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <Button
                    size="xs"
                    onClick={() => {
                      const res = onApprove(report.id)
                      toast.add({ title: res.ok ? `Approved "${report.title}"` : res.error })
                    }}
                  >
                    <CheckIcon className="size-3.5" />
                    Approve
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setReturning(report)
                      setComment("")
                    }}
                  >
                    <RotateCcwIcon className="size-3.5" />
                    Return
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Widget>

      <Dialog open={!!returning} onOpenChange={(o) => !o && setReturning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return report with comment</DialogTitle>
            <DialogDescription>
              {returning ? `Returning "${returning.title}" to ${returning.authorName}.` : ""}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Explain what needs revision or clarification…"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturning(null)}>
              Cancel
            </Button>
            <Button
              disabled={!comment.trim()}
              onClick={() => {
                if (!returning) return
                const res = onReturn(returning.id, comment)
                toast.add({ title: res.ok ? `Returned "${returning.title}"` : res.error })
                if (res.ok) setReturning(null)
              }}
            >
              Return report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

const NOTIF_ICON: Record<NotificationKind, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  sale: { icon: ShoppingBagIcon, tone: "bg-info/15 text-info" },
  payment: { icon: WalletIcon, tone: "bg-success/15 text-success" },
  expense: { icon: ReceiptTextIcon, tone: "bg-warning/20 text-warning-foreground dark:text-warning" },
  report: { icon: FileCheck2Icon, tone: "bg-primary/15 text-primary" },
  task: { icon: ClipboardCheckIcon, tone: "bg-muted text-muted-foreground" },
  info: { icon: BellIcon, tone: "bg-muted text-muted-foreground" },
}

export function NotificationsPanel({
  notifications,
  viewAllHref = "/ceo/notifications",
  className,
}: {
  notifications: NotificationItem[]
  viewAllHref?: string
  className?: string
}) {
  const latest = notifications.slice(0, 6)

  return (
    <Widget className={className}>
      <WidgetHeader
        title="Important Notifications"
        icon={BellIcon}
        action={
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline print:hidden"
          >
            View all
            <ArrowRightIcon className="size-3" />
          </Link>
        }
      />
      <div className="px-(--card-spacing)">
        {latest.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No recent notifications.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {latest.map((item) => {
              const { icon: Icon, tone } = NOTIF_ICON[item.kind]
              return (
                <li key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                  <Link href={item.href} className="flex items-start gap-3 rounded-lg transition-colors hover:opacity-80">
                    <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg", tone)}>
                      <Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">{item.text}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.at}</p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Widget>
  )
}
