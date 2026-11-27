"use client"

import { BarChart3Icon, Building2Icon, ScaleIcon, TrendingUpIcon } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Widget, WidgetHeader } from "@/kit/widgets/widget"

import { peso, pesoShort } from "../metrics"

export interface MonthlyPoint {
  month: string
  sales: number
  revenue: number
  expenses: number
  profit: number
  collections: number
  receivables: number
}

export interface DeptScore {
  dept: string
  score: number
}

function PesoTooltip({
  formatter,
}: {
  formatter?: (value: number) => string
}) {
  const fmt = formatter ?? peso
  return (
    <ChartTooltipContent
      formatter={(value, name, item) => (
        <div className="flex w-full items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="size-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: item.color }}
            />
            {name}
          </span>
          <span className="font-mono font-medium text-foreground tabular-nums">
            {fmt(Number(value ?? 0))}
          </span>
        </div>
      )}
    />
  )
}

const SALES_CONFIG = {
  sales: { label: "Confirmed Sales", color: "var(--chart-1)" },
} satisfies ChartConfig

export function MonthlySalesChart({
  data,
  className,
}: {
  data: MonthlyPoint[]
  className?: string
}) {
  return (
    <Widget className={className}>
      <WidgetHeader title="Monthly Sales" icon={TrendingUpIcon} />
      <div className="px-(--card-spacing)">
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No sales data for this period.</p>
        ) : data.length === 1 ? (
          <ChartContainer config={SALES_CONFIG} className="h-64 w-full">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => pesoShort(Number(v))} />
              <ChartTooltip content={<PesoTooltip />} />
              <Bar dataKey="sales" name="Confirmed Sales" fill="var(--color-sales)" radius={[6, 6, 0, 0]} maxBarSize={64} />
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartContainer config={SALES_CONFIG} className="h-64 w-full">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="ceoSalesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => pesoShort(Number(v))} />
              <ChartTooltip content={<PesoTooltip />} />
              <Area
                type="monotone"
                dataKey="sales"
                name="Confirmed Sales"
                stroke="var(--color-sales)"
                strokeWidth={2.5}
                fill="url(#ceoSalesFill)"
                dot={{ r: 3.5, fill: "var(--color-sales)" }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </div>
    </Widget>
  )
}

const REV_EXP_CONFIG = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  expenses: { label: "Expenses", color: "var(--chart-3)" },
  profit: { label: "Net Profit", color: "var(--success)" },
} satisfies ChartConfig

export function RevenueExpensesChart({
  data,
  className,
}: {
  data: MonthlyPoint[]
  className?: string
}) {
  return (
    <Widget className={className}>
      <WidgetHeader title="Revenue vs Expenses" icon={ScaleIcon} />
      <div className="px-(--card-spacing)">
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No financial data for this period.</p>
        ) : (
          <ChartContainer config={REV_EXP_CONFIG} className="h-64 w-full">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => pesoShort(Number(v))} />
              <ChartTooltip content={<PesoTooltip />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="revenue" name="Revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="expenses" name="Expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Line
                type="monotone"
                dataKey="profit"
                name="Net Profit"
                stroke="var(--color-profit)"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "var(--color-profit)" }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </div>
    </Widget>
  )
}

const COLL_REC_CONFIG = {
  collections: { label: "Collections", color: "var(--chart-1)" },
  receivables: { label: "Receivables", color: "var(--warning)" },
} satisfies ChartConfig

export function CollectionsReceivablesChart({
  data,
  className,
}: {
  data: MonthlyPoint[]
  className?: string
}) {
  return (
    <Widget className={className}>
      <WidgetHeader title="Collections vs Receivables" icon={BarChart3Icon} />
      <div className="px-(--card-spacing)">
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No collection data for this period.</p>
        ) : (
          <ChartContainer config={COLL_REC_CONFIG} className="h-64 w-full">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => pesoShort(Number(v))} />
              <ChartTooltip content={<PesoTooltip />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="collections" name="Collections" fill="var(--color-collections)" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="receivables" name="Receivables" fill="var(--color-receivables)" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </Widget>
  )
}

const DEPT_CONFIG = {
  score: { label: "% of Goal", color: "var(--chart-1)" },
} satisfies ChartConfig

function deptColor(score: number) {
  if (score >= 80) return "var(--success)"
  if (score >= 50) return "var(--warning)"
  return "var(--destructive)"
}

export function DepartmentPerformanceChart({
  data,
  className,
}: {
  data: DeptScore[]
  className?: string
}) {
  return (
    <Widget className={className}>
      <WidgetHeader
        title="Department Performance"
        icon={Building2Icon}
        action={
          <div className="hidden items-center gap-3 text-[11px] text-muted-foreground sm:flex">
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-success" />
              80%+
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-warning" />
              50–79%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-destructive" />
              &lt;50%
            </span>
          </div>
        }
      />
      <div className="px-(--card-spacing)">
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No department scores yet.</p>
        ) : (
          <ChartContainer config={DEPT_CONFIG} className="h-64 w-full">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="dept"
                tickLine={false}
                axisLine={false}
                width={108}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<PesoTooltip formatter={(v) => `${Math.round(v)}%`} />} />
              <Bar dataKey="score" name="% of Goal" radius={[0, 6, 6, 0]} maxBarSize={26}>
                {data.map((entry) => (
                  <Cell key={entry.dept} fill={deptColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </Widget>
  )
}
