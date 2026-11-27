"use client"

import {
  BanknoteIcon,
  ClockAlertIcon,
  ReceiptTextIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react"

import { Widget, WidgetHeader, WidgetValue } from "@/kit/widgets/widget"
import { cn } from "@/lib/utils"

import { ceoSummary, peso, pesoShort } from "../metrics"
import { PesoAmount } from "../parts"

type Summary = ReturnType<typeof ceoSummary>

export function CeoKpiCards({ summary }: { summary: Summary }) {
  const profitPositive = summary.profit.value >= 0
  const marginPct = Math.round(summary.profit.margin * 100)
  const collectionRatePct = Math.round(summary.receivables.collectionRate * 100)
  const unpaidCount = summary.receivables.unpaidInvoices
  const cmp = summary.comparisonLabel

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Widget>
        <WidgetHeader title="Total Revenue" icon={TrendingUpIcon} />
        <WidgetValue
          value={<PesoAmount value={summary.revenue.value} compact />}
          delta={summary.revenue.delta}
          caption={cmp ? `${cmp} · ${peso(summary.revenue.value)}` : `${summary.periodLabel} · ${peso(summary.revenue.value)}`}
          size="lg"
        />
      </Widget>

      <Widget>
        <WidgetHeader title="Total Sales" icon={ShoppingBagIcon} />
        <WidgetValue
          value={<PesoAmount value={summary.sales.value} compact />}
          delta={summary.sales.delta}
          caption={`This month · last month ${pesoShort(summary.sales.previous)}`}
          size="lg"
        />
      </Widget>

      <Widget>
        <WidgetHeader title="Total Expenses" icon={ReceiptTextIcon} />
        <WidgetValue
          value={<PesoAmount value={summary.expenses.value} compact />}
          delta={summary.expenses.delta}
          invert
          caption={cmp ? `${cmp} · ${peso(summary.expenses.value)}` : `${summary.periodLabel} · ${peso(summary.expenses.value)}`}
          size="lg"
        />
      </Widget>

      <Widget>
        <WidgetHeader title="Net Profit" icon={BanknoteIcon} />
        <WidgetValue
          value={
            <PesoAmount
              value={summary.profit.value}
              compact
              className={cn(profitPositive ? "text-success" : "text-destructive")}
            />
          }
          delta={summary.profit.delta}
          caption={
            <span className={cn("font-medium", profitPositive ? "text-success" : "text-destructive")}>
              {marginPct}% profit margin
            </span>
          }
          size="lg"
        />
      </Widget>

      <Widget>
        <WidgetHeader title="Total Collections" icon={WalletIcon} />
        <WidgetValue
          value={<PesoAmount value={summary.collections.value} compact />}
          delta={summary.collections.delta}
          caption={cmp ? `${cmp} · payments received` : `${summary.periodLabel} · payments received`}
          size="lg"
        />
      </Widget>

      <Widget>
        <WidgetHeader title="Outstanding Receivables" icon={ClockAlertIcon} />
        <WidgetValue
          value={<PesoAmount value={summary.receivables.value} compact />}
          delta={summary.receivables.delta}
          invert
          caption={`${unpaidCount} unpaid ${unpaidCount === 1 ? "invoice" : "invoices"} · ${collectionRatePct}% collected`}
          size="lg"
        />
      </Widget>
    </div>
  )
}
