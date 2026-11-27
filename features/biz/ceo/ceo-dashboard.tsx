"use client"

import { useState } from "react"

import { Segmented, type SegmentedOption } from "@/kit/ui-patterns/segmented"

import {
  ceoSummary,
  departmentScores,
  employeePerformance,
  monthly,
  notificationsForUser,
  type Period,
} from "../metrics"
import { DashboardGreetingHeader, ExportButtons, PesoAmount, Stat } from "../parts"
import { NOW, useBiz } from "../store"
import { payrollThisMonth, usePayroll } from "../finance/payroll/store"
import {
  CollectionsReceivablesChart,
  DepartmentPerformanceChart,
  MonthlySalesChart,
  RevenueExpensesChart,
} from "./charts"
import { CeoKpiCards } from "./kpi-cards"
import {
  EmployeePerformancePanel,
  NotificationsPanel,
  PendingApprovalsPanel,
} from "./people-actions"

const PERIOD_OPTIONS: SegmentedOption<Period>[] = [
  { value: "1m", label: "This month" },
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
]

export function CeoDashboard() {
  const [period, setPeriod] = useState<Period>("6m")
  const s = useBiz()
  const payrollRuns = usePayroll((st) => st.runs)
  const monthlyPayroll = payrollThisMonth(payrollRuns, NOW)

  const summary = ceoSummary(s, period)
  const monthlyData = monthly(s, period)
  const deptData = departmentScores(s, period)
  const employeeRows = employeePerformance(s)
  const pendingReports = s.reports.filter((r) => r.status === "sent_to_ceo" && r.department === "management")
  const myNotifications = notificationsForUser(s.notifications, s.currentUser)

  const csvRows = monthlyData.map((m) => [
    m.month,
    m.revenue,
    m.expenses,
    m.profit,
    m.collections,
    m.receivables,
  ])

  return (
    <div className="ceo-report flex flex-col gap-6">
      <DashboardGreetingHeader
        summary={`Executive overview · ${summary.periodLabel}`}
        actions={
          <ExportButtons
            filename="executive-overview"
            headers={["Month", "Revenue", "Expenses", "Net Profit", "Collections", "Receivables"]}
            rows={csvRows}
          />
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Segmented
          value={period}
          onChange={setPeriod}
          options={PERIOD_OPTIONS}
          aria-label="Reporting period"
          className="w-full sm:w-auto sm:min-w-80"
        />
      </div>

      {/* Row 1: 6 Executive KPI cards */}
      <CeoKpiCards summary={summary} />

      {/* Payroll this month summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          title="Payroll this month"
          value={<PesoAmount value={monthlyPayroll.total} compact />}
          caption={`${monthlyPayroll.count} approved/released ${monthlyPayroll.count === 1 ? "run" : "runs"} · Gross + employer shares`}
        />
      </div>

      {/* Row 2: Monthly Sales (wide) + Revenue vs Expenses */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <MonthlySalesChart data={monthlyData} className="lg:col-span-7" />
        <RevenueExpensesChart data={monthlyData} className="lg:col-span-5" />
      </div>

      {/* Row 3: Collections vs Receivables + Department Performance */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CollectionsReceivablesChart data={monthlyData} />
        <DepartmentPerformanceChart data={deptData} />
      </div>

      {/* Row 4: Employee Performance (wide) + Pending Approvals + Important Notifications */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
        <EmployeePerformancePanel rows={employeeRows} className="md:col-span-2 xl:col-span-6" />
        <PendingApprovalsPanel
          reports={pendingReports}
          onApprove={s.approveReport}
          onReturn={s.returnReport}
          className="xl:col-span-3"
        />
        <NotificationsPanel
          notifications={myNotifications}
          viewAllHref="/ceo/notifications"
          className="xl:col-span-3"
        />
      </div>
    </div>
  )
}
