# Business Hub — Business Management Dashboard

A centralized, modern, and responsive **Business Management Dashboard** built so the **CEO** can monitor overall company performance, the **Manager** can supervise daily operations, and each department (**Sales & Marketing**, **AM Reporters**, and **Finance**) can manage and report its own activities in one connected system.

> **Stage 1 — Interactive Demo Mode**
> All dashboards are fully connected in memory (Zustand store) with a 6-month Philippine Peso (`₱`) seed dataset. Actions entered by one department (confirmed sales, customer payments, expenses, payroll releases, field reports, and consolidated reports) automatically update management and CEO dashboards in real time. Refreshing the browser resets the session to the initial seed.

---

## 1. Organizational Structure & Roles

```text
                CEO (/ceo)
                    │
             Manager (/manager)
        ┌───────────┼───────────┐
        ▼           ▼           ▼
Sales & Marketing  AM Reporters  Finance
    (/sales)       (/reporters) (/finance)

+ Bonus Module: System Admin (/admin) — User Accounts, RBAC & Backups
```

Each employee signs in to an individual account with strict **Role-Based Access Control (RBAC)** (`lib/rbac/`), a dedicated sidebar, and a distinct role accent theme.

---

## 2. Features by Role

### A. CEO Dashboard (`/ceo`)
- **Executive Overview**: Time-of-day greeting with live date/time, Total Revenue, Total Sales, Total Expenses, Net Profit, Total Collections, Outstanding Receivables, Payroll This Month, Department Performance, Employee Performance, Pending Approvals, and Important Notifications.
- **Department Views**: Dedicated drill-downs for **Sales & Marketing**, **AM Reporters**, and **Finance** with monthly charts and breakdowns.
- **Governance**: Employee Performance tracking, **Approvals** (Consolidated Reports & Payroll Runs with Approve / Return), Financial & Operational Reports, and CEO Audit Log.

### B. Manager Dashboard (`/manager`)
- **Operations Overview**: Cross-department KPIs, pending reviews, and task status.
- **Assign Tasks**: Create and track tasks across Sales, AM Reporters, and Finance with priority levels.
- **Daily Reports Inbox**: Review departmental daily/weekly/monthly reports (Approve or Return with comment).
- **Employee Performance & Accomplishments**: Monitor individual staff metrics and field accomplishments.
- **Consolidated Report**: Bundle reviewed departmental reports and submit a consolidated report to the CEO.
- **Payroll Review**: Review submitted payroll runs with **department totals only** (individual salaries are hidden for privacy).

### C. Sales and Marketing Dashboard (`/sales`)
- **Customer Database**: Searchable directory with add/edit customer profiles.
- **Sales Pipeline**: New Customer Inquiries, Sales Leads, Sales Proposals (includes downloadable `.doc` templates + PDF/DOC/DOCX upload), and Confirmed Sales.
- **Targets & Marketing**: Monthly sales targets vs. actual performance, and Marketing Activities tracker (cost & leads generated).
- **Reports**: Submit daily and monthly sales reports to the Manager.
- *Connected workflow*: Confirming a sale automatically creates a receivable in Finance and notifies Management & CEO.

### D. AM Reporters Dashboard (`/reporters`)
- **Individual Employee Accounts**: Each reporter sees their own assignments, logs, and attendance.
- **Daily Activity Reports**: Log field activities with multi-file **photo and video** uploads (auto-synced to Photos & Documentation).
- **Field Assignments & Accomplishments**: Update assigned tasks and track completed fieldwork.
- **Photos & Documentation**: Media gallery with lightbox preview and video playback.
- **Attendance**: One-click Time In / Time Out logging (automatically feeds into Payroll time inputs).
- **Reports**: Submit daily, weekly, and monthly field reports.

### E. Finance Dashboard (`/finance`)
- **Overview**: Total Income, Total Expenses, Accounts Receivable, Accounts Payable, Net Cash Flow, and Payroll This Month.
- **Income & Customer Payments**: Record payments via Bank Transfer, Cheque, Cash, or GCash with reference/cheque numbers, proof upload, and remarks.
- **Expenses**: Multi-line expense entry with Philippine **BIR Tax** computation (Non-VAT, 12% VAT Inclusive/Exclusive, 1%/2%/5% EWT) and receipt attachments.
- **Accounts Receivable**: Aging buckets (`0–30`, `31–60`, `61+` days) with one-click payment collection.
- **Accounts Payable**: Vendor bills with an interactive **Due-Date Calendar** (color-coded unpaid/paid dates) and unpaid payroll visibility.
- **Cash Flow**: Interactive monthly inflow vs. outflow charts and category breakdowns.
- **Full Payroll Module (`/finance/payroll`)**:
  - Pure TypeScript integer-centavo computation engine (`features/biz/finance/payroll/engine.ts`).
  - Sticky mini-sidebar covering **Overview**, **Employees** (with photo upload, SSS, PhilHealth, Pag-IBIG, TIN, and custom mandatory IDs), **4-Step Run Payroll Wizard**, **Payroll Register**, **Printable Payslips** (single & batch PDF), **Gov. Contributions Summary**, **Loans & Advances**, and **Payroll Settings**.
  - Multi-step approval workflow: `Finance (Prepare & Submit) → Manager (Review Dept Totals) → CEO (Approve) → Finance (Release)`. Releasing a run automatically posts salary & employer-share expenses, reduces loan balances, issues employee payslips (**My Payslips**), and logs an audit entry.
- **Financial Reports**: Income statement summary and monthly report submission.

---

## 3. Bonus Module: System Admin (`/admin`)

Included as a **bonus enterprise module** to separate IT/account administration from executive business oversight while keeping the 5 core operational roles untouched:

- **Overview (`/admin`)**: Total accounts, active vs. deactivated logins, accounts-by-role chart, and recent audit activity.
- **User Accounts (`/admin/users`)**: Create new employee login accounts, edit roles/departments/titles, issue temporary password resets, activate/deactivate logins (deactivated users are blocked from signing in), and remove accounts.
- **Roles & Permissions (`/admin/roles`)**: Live read-only RBAC permissions matrix across all 6 roles.
- **System Audit Log (`/admin/audit`)**: Searchable, filterable trail of account changes, approvals, payments, and payroll releases with CSV/PDF export.
- **Backup & Demo Data (`/admin/backup`)**: Export a complete workspace JSON backup snapshot or reset all demo data back to the 6-month seed.

---

## 4. Reporting Workflow

All departments follow the required reporting chain:

```text
Employee (Sales / Reporter / Finance)
  → Submit Daily, Weekly, or Monthly Report
    → Manager reviews (Approve or Return with comment)
      → Manager bundles into Consolidated Report
        → CEO approves (or Returns with comment)
```

---

## 5. System Capabilities

- **Individual Accounts & RBAC**: Centralized permission & scope checks (`lib/rbac/`) enforced in both UI routes and Zustand store actions.
- **Automated Calculations**: Real-time revenue, net profit, receivables aging, cash flow, BIR taxes, and centavo-accurate payroll math.
- **Charts & Visualizations**: Interactive Recharts & Chronicle charts across CEO, Finance, Sales, Payroll, and Admin dashboards.
- **Notifications & Audit Trail**: Role-targeted notification bell with unread badges and chronological audit logs.
- **Exports**: CSV (Excel-compatible) downloads and print-ready PDF views on tables, reports, registers, and payslips.
- **Responsive & Themeable**: Desktop, tablet, and mobile layouts with Light & Dark mode support and full Settings pages (`Profile`, `Account`, `Appearance`, `Notifications`, `Connections`).

---

## 6. Demo Accounts (`/login`)

Any password works in demo mode (or click any account card on `/login`):

| Name | Email | Role | Workspace |
|---|---|---|---|
| Ramon Dela Cruz | `ramon@businesshub.ph` | **CEO** | `/ceo` |
| Liza Santos | `liza@businesshub.ph` | **Manager** | `/manager` |
| Carlo Reyes | `carlo@businesshub.ph` | **Sales & Marketing** | `/sales` |
| Mika Ong | `mika@businesshub.ph` | **Sales & Marketing** | `/sales` |
| Joy Mendoza | `joy@businesshub.ph` | **AM Reporters** | `/reporters` |
| Ben Aquino | `ben@businesshub.ph` | **AM Reporters** | `/reporters` |
| Nina Cruz | `nina@businesshub.ph` | **AM Reporters** | `/reporters` |
| Anna Villanueva | `anna@businesshub.ph` | **Finance** | `/finance` |
| Paolo Diaz | `paolo@businesshub.ph` | **Finance** | `/finance` |
| Alex Soriano *(Bonus)* | `admin@businesshub.ph` | **System Admin** | `/admin` |

---

## 7. Tech Stack

- **Framework**: Next.js 16 (App Router) & React 19
- **Language**: TypeScript 6
- **Styling & UI**: Tailwind CSS v4, shadcn/ui (Base UI), Lucide Icons
- **State & Forms**: Zustand, React Hook Form, Zod
- **Charts & Tables**: Recharts, TanStack Table
- **Testing**: Vitest

---

## 8. Getting Started

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be directed to `/login` to choose a role account.

### Useful Scripts

```bash
pnpm typecheck                                                               # TypeScript check (tsc --noEmit)
pnpm vitest run features/biz/metrics.test.ts features/biz/finance/payroll/engine.test.ts  # Business & Payroll unit tests
pnpm build                                                                   # Production build
pnpm lint                                                                    # ESLint check
```

---

## 9. Stage 2 Roadmap (Production Readiness)

This Stage 1 build fulfills the initial interactive demo specification using in-memory dummy data. Moving to Stage 2 production requires:
- Connecting a secure relational database (e.g., PostgreSQL / Supabase) with encrypted credentials and automated scheduled backups.
- Replacing demo session login with server-side authentication (hashed passwords, HTTP-only sessions, password reset emails).
- Verifying official SSS, PhilHealth, Pag-IBIG, and BIR withholding tax tables in Payroll Settings before live payroll runs.
