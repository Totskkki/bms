import { create } from "zustand"

import { can, type Department, type Permission, type Role, type UserAccount } from "@/lib/rbac"
import { computePayroll, type PayrollInputs } from "./finance/payroll-calc"

export const ORG_ID = "org-1"
export const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]
export const NOW = 5 // Nov 2026
export const EXPENSE_CATEGORIES = ["Salaries", "Operations", "Marketing", "Utilities", "Equipment"] as const

export type Stage = "inquiry" | "lead" | "proposal" | "confirmed"
export type ReportKind = "daily" | "weekly" | "monthly"
export type ReportStatus = "draft" | "submitted" | "reviewed" | "sent_to_ceo" | "approved" | "returned"
export type TaskPriority = "low" | "medium" | "high"
export type TaskStatus = "todo" | "in_progress" | "done"
export type NotificationKind = "sale" | "payment" | "expense" | "report" | "task" | "info"

export const DEMO_ACCOUNTS: UserAccount[] = [
  { id: "u-ramon", orgId: ORG_ID, name: "Ramon Dela Cruz", email: "ramon@businesshub.ph", role: "ceo", department: "executive", title: "Chief Executive Officer", initials: "RD", status: "active", lastLogin: "Today · 8:15 AM" },
  { id: "u-liza", orgId: ORG_ID, name: "Liza Santos", email: "liza@businesshub.ph", role: "manager", department: "management", title: "Operations Manager", initials: "LS", status: "active", lastLogin: "Today · 8:05 AM" },
  { id: "u-carlo", orgId: ORG_ID, name: "Carlo Reyes", email: "carlo@businesshub.ph", role: "sales", department: "sales", title: "Senior Sales Executive", initials: "CR", status: "active", lastLogin: "Today · 8:42 AM" },
  { id: "u-mika", orgId: ORG_ID, name: "Mika Ong", email: "mika@businesshub.ph", role: "sales", department: "sales", title: "Account Executive", initials: "MO", status: "active", lastLogin: "Yesterday · 5:20 PM" },
  { id: "u-joy", orgId: ORG_ID, name: "Joy Mendoza", email: "joy@businesshub.ph", role: "reporter", department: "reporters", title: "Field AM Reporter", initials: "JM", status: "active", lastLogin: "Today · 7:55 AM" },
  { id: "u-ben", orgId: ORG_ID, name: "Ben Aquino", email: "ben@businesshub.ph", role: "reporter", department: "reporters", title: "Field AM Reporter", initials: "BA", status: "active", lastLogin: "Today · 8:10 AM" },
  { id: "u-nina", orgId: ORG_ID, name: "Nina Cruz", email: "nina@businesshub.ph", role: "reporter", department: "reporters", title: "Field AM Reporter", initials: "NC", status: "active", lastLogin: "Yesterday · 4:45 PM" },
  { id: "u-anna", orgId: ORG_ID, name: "Anna Villanueva", email: "anna@businesshub.ph", role: "finance", department: "finance", title: "Finance Officer", initials: "AV", status: "active", lastLogin: "Today · 8:22 AM" },
  { id: "u-paolo", orgId: ORG_ID, name: "Paolo Diaz", email: "paolo@businesshub.ph", role: "finance", department: "finance", title: "Accounting Specialist", initials: "PD", status: "active", lastLogin: "Yesterday · 6:02 PM" },
  { id: "u-admin", orgId: ORG_ID, name: "Alex Soriano", email: "admin@businesshub.ph", role: "admin", department: "admin", title: "System Administrator", initials: "AS", status: "active", lastLogin: "Today · 8:30 AM" },
]

export interface Customer {
  id: number
  orgId: string
  name: string
  contact: string
  email: string
  phone: string
  industry: string
  status: "active" | "prospect"
  ownerId: string
  department: Department
}

export interface ProposalDoc {
  name: string
  url: string
  size?: string
}

export interface Deal {
  id: number
  orgId: string
  customerId: number
  customer: string
  amount: number
  stage: Stage
  month: number
  ownerId: string
  owner: string
  department: Department
  createdAt: string
  dueDate: string
  notes?: string
  proposalDoc?: ProposalDoc
}

export interface MarketingActivity {
  id: number
  orgId: string
  campaign: string
  date: string
  channel: string
  cost: number
  leadsGenerated: number
  ownerId: string
  department: Department
  month: number
}

export interface Payment {
  id: number
  orgId: string
  dealId: number
  amount: number
  month: number
  date: string
  method: string
  recordedBy: string
  department: Department
  referenceNo?: string
  checkNo?: string
  remarks?: string
  proofFile?: ProposalDoc
}

export interface Expense {
  id: number
  orgId: string
  category: string
  amount: number
  month: number
  date: string
  note: string
  attachmentName?: string
  receiptFile?: ProposalDoc
  totalAmount?: number
  birTaxType?: string
  birTaxAmount?: number
  recordedBy: string
  department: Department
}

export interface Payable {
  id: number
  orgId: string
  vendor: string
  category: string
  amount: number
  dueDate: string
  status: "unpaid" | "paid"
  paidAt?: string
  month: number
  department: Department
}

export interface PayrollEntry extends PayrollInputs {
  id: number
  orgId: string
  employeeId: string
  employeeName: string
  roleLabel: string
  month: number
  basePay: number
  status: "pending" | "paid"
  paidAt?: string
  department: Department
}

export interface MediaAttachment {
  id: string
  name: string
  url: string
  mediaType: "image" | "video"
}

export interface Activity {
  id: number
  orgId: string
  authorId: string
  by: string
  title: string
  place: string
  notes: string
  photos: number
  media?: MediaAttachment[]
  date: string
  month: number
  department: Department
}

export interface PhotoItem {
  id: number
  orgId: string
  authorId: string
  by: string
  caption: string
  location: string
  url: string
  mediaType?: "image" | "video"
  date: string
  month: number
  department: Department
}

export interface AttendanceRecord {
  id: number
  orgId: string
  authorId: string
  by: string
  date: string
  timeIn: string
  timeOut?: string
  status: "present" | "completed"
  month: number
  department: Department
}

export interface Task {
  id: number
  orgId: string
  title: string
  description: string
  toId: string
  to: string
  department: Department
  dueDate: string
  priority: TaskPriority
  status: TaskStatus
  assignedBy: string
}

export interface ReportComment {
  id: number
  by: string
  role: Role
  text: string
  at: string
}

export interface ReportHistoryEntry {
  by: string
  role: Role
  action: string
  at: string
}

export interface Report {
  id: number
  orgId: string
  kind: ReportKind
  department: Department
  authorId: string
  authorName: string
  title: string
  content: string
  period: string
  attachments: string[]
  status: ReportStatus
  bundledReportIds?: number[]
  comments: ReportComment[]
  history: ReportHistoryEntry[]
  month: number
}

export interface NotificationItem {
  id: string
  orgId: string
  text: string
  kind: NotificationKind
  targetRoles: Role[]
  targetUserId?: string
  href: string
  at: string
  readBy: string[]
}

export interface AuditLog {
  id: number
  orgId: string
  actorName: string
  actorRole: Role
  action: string
  target: string
  detail: string
  at: string
}

export type ActionResult = { ok: true } | { ok: false; error: string }

const SESSION_KEY = "bh-current-user"

function svgThumb(label: string, accent: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='400' viewBox='0 0 640 400'><rect width='640' height='400' fill='${accent}' fill-opacity='0.14'/><rect x='24' y='24' width='592' height='352' rx='18' fill='none' stroke='${accent}' stroke-opacity='0.35' stroke-width='2'/><text x='320' y='205' text-anchor='middle' font-family='sans-serif' font-size='22' font-weight='600' fill='${accent}'>${label}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const CUSTOMER_SEED = [
  { name: "Mindanao Foods", contact: "Elena Navarro", email: "elena@mindanaofoods.ph", phone: "0917-201-4401", industry: "Food & Beverage" },
  { name: "Sunrise Hardware", contact: "Marco Lim", email: "marco@sunrisehw.ph", phone: "0917-201-4402", industry: "Construction" },
  { name: "Kalaw Pharmacy", contact: "Dr. Grace Kalaw", email: "grace@kalawrx.ph", phone: "0917-201-4403", industry: "Healthcare" },
  { name: "Greenfield Agri", contact: "Rico Bautista", email: "rico@greenfield.ph", phone: "0917-201-4404", industry: "Agriculture" },
  { name: "Blue Coast Trading", contact: "Tessa Sy", email: "tessa@bluecoast.ph", phone: "0917-201-4405", industry: "Logistics" },
  { name: "Metro Printing", contact: "Jomar Vega", email: "jomar@metroprint.ph", phone: "0917-201-4406", industry: "Media" },
  { name: "Alon Telecom", contact: "Karen Chua", email: "karen@alontel.ph", phone: "0917-201-4407", industry: "Telecom" },
  { name: "Prime Builders", contact: "Engr. Noel Tan", email: "noel@primebuilders.ph", phone: "0917-201-4408", industry: "Construction" },
  { name: "Luzon Feeds", contact: "Dante Morales", email: "dante@luzonfeeds.ph", phone: "0917-201-4409", industry: "Agriculture" },
  { name: "Island Motors", contact: "Cathy Go", email: "cathy@islandmotors.ph", phone: "0917-201-4410", industry: "Automotive" },
]

function buildSeed() {
  let seed = 7
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)

  const customers: Customer[] = CUSTOMER_SEED.map((c, idx) => ({
    id: idx + 1,
    orgId: ORG_ID,
    ...c,
    status: idx < 8 ? "active" : "prospect",
    ownerId: idx % 2 === 0 ? "u-carlo" : "u-mika",
    department: "sales",
  }))

  const deals: Deal[] = []
  const payments: Payment[] = []
  const expenses: Expense[] = []
  let dealId = 1

  for (let month = 0; month <= NOW; month++) {
    const mm = String(month + 6).padStart(2, "0")
    for (let i = 0; i < 5; i++) {
      const ownerId = i % 2 ? "u-mika" : "u-carlo"
      const owner = i % 2 ? "Mika Ong" : "Carlo Reyes"
      const amount = Math.round((45 + rnd() * 155) * 1000)
      const stage: Stage = month === NOW && i > 2 ? (i === 3 ? "proposal" : "lead") : "confirmed"
      const cust = customers[(month * 3 + i) % customers.length]
      const day = String(4 + i * 5).padStart(2, "0")
      deals.push({
        id: dealId++,
        orgId: ORG_ID,
        customerId: cust.id,
        customer: cust.name,
        amount,
        stage,
        month,
        ownerId,
        owner,
        department: "sales",
        createdAt: `2026-${mm}-${day}`,
        dueDate: `2026-${mm}-28`,
      })
    }

    deals
      .filter((d) => d.month === month && d.stage === "confirmed")
      .forEach((d, i) => {
        const paid =
          month === NOW
            ? i % 2
              ? 0
              : d.amount * 0.5
            : i === 0 && month === NOW - 1
              ? d.amount * 0.4
              : i === 1 && month === NOW - 2
                ? d.amount * 0.6
                : d.amount
        if (paid > 0) {
          payments.push({
            id: payments.length + 1,
            orgId: ORG_ID,
            dealId: d.id,
            amount: Math.round(paid),
            month,
            date: `2026-${mm}-20`,
            method: i % 2 === 0 ? "Bank Transfer" : "Check",
            recordedBy: "Anna Villanueva",
            department: "finance",
          })
        }
      })

    EXPENSE_CATEGORIES.forEach((category) => {
      expenses.push({
        id: expenses.length + 1,
        orgId: ORG_ID,
        category,
        amount: Math.round((category === "Salaries" ? 180 : 20 + rnd() * 48) * 1000),
        month,
        date: `2026-${mm}-15`,
        note: `${category} for ${MONTHS[month]} 2026`,
        attachmentName: `${category.toLowerCase()}-${MONTHS[month].toLowerCase()}.pdf`,
        recordedBy: "Anna Villanueva",
        department: "finance",
      })
    })
  }

  deals.push(
    {
      id: dealId++,
      orgId: ORG_ID,
      customerId: 2,
      customer: "Sunrise Hardware",
      amount: 95_000,
      stage: "inquiry",
      month: NOW,
      ownerId: "u-mika",
      owner: "Mika Ong",
      department: "sales",
      createdAt: "2026-11-22",
      dueDate: "2026-12-10",
      notes: "Requested Q4 sponsorship package quote.",
    },
    {
      id: dealId++,
      orgId: ORG_ID,
      customerId: 9,
      customer: "Luzon Feeds",
      amount: 145_000,
      stage: "proposal",
      month: NOW,
      ownerId: "u-carlo",
      owner: "Carlo Reyes",
      department: "sales",
      createdAt: "2026-11-20",
      dueDate: "2026-12-05",
      notes: "Radio + field activation proposal sent.",
      proposalDoc: {
        name: "Luzon-Feeds-Q4-Proposal.pdf",
        url: "data:text/plain;charset=utf-8,Luzon%20Feeds%20Q4%20Radio%20%26%20Field%20Activation%20Proposal%20(Demo)",
        size: "248 KB",
      },
    }
  )

  const marketingActivities: MarketingActivity[] = [
    { id: 1, orgId: ORG_ID, campaign: "Koronadal Trade Fair Booth", date: "2026-11-18", channel: "Events", cost: 35_000, leadsGenerated: 14, ownerId: "u-carlo", department: "sales", month: NOW },
    { id: 2, orgId: ORG_ID, campaign: "Holiday Radio Spot Bundle", date: "2026-11-12", channel: "Broadcast", cost: 48_000, leadsGenerated: 22, ownerId: "u-mika", department: "sales", month: NOW },
    { id: 3, orgId: ORG_ID, campaign: "Agri-Business Facebook Push", date: "2026-10-25", channel: "Social Media", cost: 18_500, leadsGenerated: 11, ownerId: "u-carlo", department: "sales", month: NOW - 1 },
  ]

  const payables: Payable[] = [
    { id: 1, orgId: ORG_ID, vendor: "South Cotabato Power Co.", category: "Utilities", amount: 28_500, dueDate: "2026-11-30", status: "unpaid", month: NOW, department: "finance" },
    { id: 2, orgId: ORG_ID, vendor: "Mindanao Fiber Telecom", category: "Utilities", amount: 14_200, dueDate: "2026-12-03", status: "unpaid", month: NOW, department: "finance" },
    { id: 3, orgId: ORG_ID, vendor: "ProAudio Equipment Supply", category: "Equipment", amount: 64_000, dueDate: "2026-12-08", status: "unpaid", month: NOW, department: "finance" },
    { id: 4, orgId: ORG_ID, vendor: "Metro Printing Press", category: "Marketing", amount: 22_000, dueDate: "2026-11-15", status: "paid", paidAt: "2026-11-14", month: NOW, department: "finance" },
  ]

  const payroll: PayrollEntry[] = DEMO_ACCOUNTS.filter((u) => u.role !== "ceo").map((u, idx) => {
    const dailyRate = u.role === "manager" ? 1_900 : u.role === "finance" ? 1_300 : u.role === "sales" ? 1_150 : 1_050
    const daysWorked = 22
    const overtimeHours = idx % 3 === 0 ? 4 : idx % 2 === 0 ? 2 : 0
    const lateMinutes = idx % 4 === 1 ? 30 : 0
    const allowance = u.role === "reporter" ? 2_500 : 1_500
    const bonus = u.role === "sales" ? 6_500 : 1_500
    return {
      id: idx + 1,
      orgId: ORG_ID,
      employeeId: u.id,
      employeeName: u.name,
      roleLabel: u.title,
      month: NOW,
      dailyRate,
      daysWorked,
      overtimeHours,
      lateMinutes,
      allowance,
      bonus,
      otherDeductions: 0,
      basePay: dailyRate * daysWorked,
      status: idx < 3 ? "paid" : "pending",
      paidAt: idx < 3 ? "2026-11-15" : undefined,
      department: "finance",
    }
  })

  const activities: Activity[] = [
    { id: 1, orgId: ORG_ID, authorId: "u-joy", by: "Joy Mendoza", title: "Interview at City Hall", place: "Koronadal City", notes: "Covered mayor's Q4 infrastructure briefing and recorded 2 audio clips.", photos: 4, date: "2026-11-26", month: NOW, department: "reporters" },
    { id: 2, orgId: ORG_ID, authorId: "u-ben", by: "Ben Aquino", title: "Sponsor store opening visit", place: "Tupi Public Market", notes: "Documented Sunrise Hardware promo ribbon-cutting.", photos: 2, date: "2026-11-25", month: NOW, department: "reporters" },
    { id: 3, orgId: ORG_ID, authorId: "u-nina", by: "Nina Cruz", title: "Community agri-fair coverage", place: "Polomolok Plaza", notes: "Interviewed 5 cooperative leaders for morning segment.", photos: 6, date: "2026-11-24", month: NOW, department: "reporters" },
    { id: 4, orgId: ORG_ID, authorId: "u-joy", by: "Joy Mendoza", title: "Public market price check", place: "Koronadal Market", notes: "Weekly rice, produce, and fuel price monitoring.", photos: 3, date: "2026-11-22", month: NOW, department: "reporters" },
  ]

  const photos: PhotoItem[] = [
    { id: 1, orgId: ORG_ID, authorId: "u-joy", by: "Joy Mendoza", caption: "City Hall Press Briefing", location: "Koronadal City", url: svgThumb("City Hall Press Briefing", "#d97706"), date: "2026-11-26", month: NOW, department: "reporters" },
    { id: 2, orgId: ORG_ID, authorId: "u-ben", by: "Ben Aquino", caption: "Sunrise Hardware Promo Launch", location: "Tupi", url: svgThumb("Sunrise Hardware Launch", "#0d9488"), date: "2026-11-25", month: NOW, department: "reporters" },
    { id: 3, orgId: ORG_ID, authorId: "u-nina", by: "Nina Cruz", caption: "Polomolok Agri-Fair Booths", location: "Polomolok", url: svgThumb("Polomolok Agri-Fair", "#2563eb"), date: "2026-11-24", month: NOW, department: "reporters" },
  ]

  const attendance: AttendanceRecord[] = [
    { id: 1, orgId: ORG_ID, authorId: "u-joy", by: "Joy Mendoza", date: "2026-11-25", timeIn: "07:55 AM", timeOut: "05:08 PM", status: "completed", month: NOW, department: "reporters" },
    { id: 2, orgId: ORG_ID, authorId: "u-ben", by: "Ben Aquino", date: "2026-11-26", timeIn: "08:02 AM", status: "present", month: NOW, department: "reporters" },
    { id: 3, orgId: ORG_ID, authorId: "u-nina", by: "Nina Cruz", date: "2026-11-26", timeIn: "07:48 AM", status: "present", month: NOW, department: "reporters" },
  ]

  const tasks: Task[] = [
    { id: 1, orgId: ORG_ID, title: "Cover the trade fair opening", description: "Live updates, 5+ photos, and organizer interview.", toId: "u-joy", to: "Joy Mendoza", department: "reporters", dueDate: "2026-11-28", priority: "high", status: "in_progress", assignedBy: "Liza Santos" },
    { id: 2, orgId: ORG_ID, title: "Follow up Prime Builders proposal", description: "Confirm final Q4 ad slot pricing.", toId: "u-carlo", to: "Carlo Reyes", department: "sales", dueDate: "2026-11-27", priority: "high", status: "todo", assignedBy: "Liza Santos" },
    { id: 3, orgId: ORG_ID, title: "Reconcile October receivables", description: "Match bank deposit slips against Kalaw Pharmacy invoice.", toId: "u-paolo", to: "Paolo Diaz", department: "finance", dueDate: "2026-11-26", priority: "medium", status: "done", assignedBy: "Liza Santos" },
    { id: 4, orgId: ORG_ID, title: "Barangay health drive photo set", description: "Upload captioned gallery before 4 PM.", toId: "u-ben", to: "Ben Aquino", department: "reporters", dueDate: "2026-11-29", priority: "medium", status: "todo", assignedBy: "Liza Santos" },
  ]

  const reports: Report[] = [
    {
      id: 1,
      orgId: ORG_ID,
      kind: "daily",
      department: "reporters",
      authorId: "u-joy",
      authorName: "Joy Mendoza",
      title: "Barangay coverage, Koronadal",
      content: "Covered City Hall Q4 infrastructure briefing and public market price check. Uploaded 4 field photos.",
      period: "Nov 26, 2026",
      attachments: ["city-hall-notes.pdf"],
      status: "submitted",
      comments: [],
      history: [{ by: "Joy Mendoza", role: "reporter", action: "Submitted daily report", at: "Today, 09:30 AM" }],
      month: NOW,
    },
    {
      id: 2,
      orgId: ORG_ID,
      kind: "daily",
      department: "reporters",
      authorId: "u-ben",
      authorName: "Ben Aquino",
      title: "Market price monitoring — Tupi",
      content: "Completed morning price check across 12 stalls and visited Sunrise Hardware ribbon-cutting.",
      period: "Nov 25, 2026",
      attachments: [],
      status: "reviewed",
      comments: [],
      history: [
        { by: "Ben Aquino", role: "reporter", action: "Submitted daily report", at: "Yesterday, 04:15 PM" },
        { by: "Liza Santos", role: "manager", action: "Reviewed and approved for consolidation", at: "Today, 08:40 AM" },
      ],
      month: NOW,
    },
    {
      id: 3,
      orgId: ORG_ID,
      kind: "weekly",
      department: "sales",
      authorId: "u-carlo",
      authorName: "Carlo Reyes",
      title: "Weekly sales pipeline summary (W4 Nov)",
      content: "3 confirmed sales booked this month, 2 active proposals in final negotiation, 14 trade fair leads.",
      period: "Nov 20–26, 2026",
      attachments: ["nov-w4-pipeline.csv"],
      status: "reviewed",
      comments: [],
      history: [
        { by: "Carlo Reyes", role: "sales", action: "Submitted weekly report", at: "Yesterday, 05:00 PM" },
        { by: "Liza Santos", role: "manager", action: "Reviewed and approved for consolidation", at: "Today, 08:45 AM" },
      ],
      month: NOW,
    },
    {
      id: 4,
      orgId: ORG_ID,
      kind: "monthly",
      department: "finance",
      authorId: "u-anna",
      authorName: "Anna Villanueva",
      title: "November collections & expense summary",
      content: "Collections tracking on pace; 3 unpaid utility/equipment payables scheduled before month-end.",
      period: "Nov 2026",
      attachments: ["nov-income-statement.pdf"],
      status: "reviewed",
      comments: [],
      history: [
        { by: "Anna Villanueva", role: "finance", action: "Submitted monthly report", at: "Yesterday, 05:30 PM" },
        { by: "Liza Santos", role: "manager", action: "Reviewed and approved for consolidation", at: "Today, 08:50 AM" },
      ],
      month: NOW,
    },
    {
      id: 5,
      orgId: ORG_ID,
      kind: "weekly",
      department: "management",
      authorId: "u-liza",
      authorName: "Liza Santos",
      title: "Consolidated Operations Report — Week 4 Nov",
      content: "Bundled weekly summary across Sales, AM Reporters, and Finance. Sales at pace for monthly target; field coverage on track.",
      period: "Nov 20–26, 2026",
      attachments: ["consolidated-w4-nov.pdf"],
      status: "sent_to_ceo",
      bundledReportIds: [2, 3, 4],
      comments: [],
      history: [
        { by: "Liza Santos", role: "manager", action: "Compiled consolidated report and sent to CEO", at: "Today, 09:00 AM" },
      ],
      month: NOW,
    },
    {
      id: 6,
      orgId: ORG_ID,
      kind: "monthly",
      department: "management",
      authorId: "u-liza",
      authorName: "Liza Santos",
      title: "October Consolidated Monthly Report",
      content: "October revenue exceeded target with 92% collections and full departmental reporting compliance.",
      period: "Oct 2026",
      attachments: ["oct-consolidated.pdf"],
      status: "approved",
      comments: [],
      history: [
        { by: "Liza Santos", role: "manager", action: "Sent consolidated report to CEO", at: "Nov 02, 2026" },
        { by: "Ramon Dela Cruz", role: "ceo", action: "Approved report", at: "Nov 03, 2026" },
      ],
      month: NOW - 1,
    },
  ]

  const notifications: NotificationItem[] = [
    { id: "n-1", orgId: ORG_ID, text: 'Manager sent "Consolidated Operations Report — Week 4 Nov" for CEO approval', kind: "report", targetRoles: ["ceo"], href: "/ceo/approvals", at: "15m ago", readBy: [] },
    { id: "n-2", orgId: ORG_ID, text: "Joy Mendoza submitted daily report: Barangay coverage, Koronadal", kind: "report", targetRoles: ["manager"], href: "/manager/daily-reports", at: "30m ago", readBy: [] },
    { id: "n-3", orgId: ORG_ID, text: "Sale confirmed: Mindanao Foods. Receivable created for Finance.", kind: "sale", targetRoles: ["ceo", "manager", "finance", "sales"], href: "/finance/receivables", at: "1h ago", readBy: [] },
    { id: "n-4", orgId: ORG_ID, text: "Payment received from Mindanao Foods (Bank Transfer)", kind: "payment", targetRoles: ["ceo", "finance"], href: "/finance/payments", at: "2h ago", readBy: [] },
    { id: "n-5", orgId: ORG_ID, text: "New field assignment: Cover the trade fair opening", kind: "task", targetRoles: ["reporter"], targetUserId: "u-joy", href: "/reporters/assignments", at: "3h ago", readBy: [] },
    { id: "n-6", orgId: ORG_ID, text: "Expense recorded: Salaries ₱180,000", kind: "expense", targetRoles: ["ceo", "finance"], href: "/finance/expenses", at: "Today", readBy: [] },
  ]

  const auditLogs: AuditLog[] = [
    { id: 1, orgId: ORG_ID, actorName: "Liza Santos", actorRole: "manager", action: "Report sent to CEO", target: "Consolidated Operations Report — Week 4 Nov", detail: "Bundled 3 departmental reports", at: "Today, 09:00 AM" },
    { id: 2, orgId: ORG_ID, actorName: "Carlo Reyes", actorRole: "sales", action: "Sale confirmed", target: "Mindanao Foods", detail: "Confirmed deal added to Finance receivables", at: "Today, 08:15 AM" },
    { id: 3, orgId: ORG_ID, actorName: "Anna Villanueva", actorRole: "finance", action: "Payment recorded", target: "Mindanao Foods", detail: "Bank Transfer payment applied", at: "Today, 08:30 AM" },
    { id: 4, orgId: ORG_ID, actorName: "Liza Santos", actorRole: "manager", action: "Task assigned", target: "Joy Mendoza", detail: "Cover the trade fair opening", at: "Yesterday, 03:20 PM" },
  ]

  const users: UserAccount[] = DEMO_ACCOUNTS.map((u) => ({ ...u }))

  return {
    users,
    customers,
    deals,
    marketingActivities,
    payments,
    expenses,
    payables,
    payroll,
    activities,
    photos,
    attendance,
    tasks,
    reports,
    notifications,
    auditLogs,
  }
}

type SeedData = ReturnType<typeof buildSeed>

export interface NotificationPrefs {
  sales: boolean
  payments: boolean
  expenses: boolean
  reports: boolean
  tasks: boolean
  emailDigest: boolean
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  sales: true,
  payments: true,
  expenses: true,
  reports: true,
  tasks: true,
  emailDigest: false,
}

export interface BizState extends SeedData {
  currentUser: UserAccount | null
  authHydrated: boolean
  notificationPrefs: NotificationPrefs
  hydrateAuth: () => void
  login: (email: string) => ActionResult
  loginAs: (userId: string) => ActionResult
  logout: () => void
  updateProfile: (patch: { name: string; title: string; initials?: string }) => ActionResult
  updateNotificationPrefs: (patch: Partial<NotificationPrefs>) => void

  // Sales
  addCustomer: (input: Omit<Customer, "id" | "orgId" | "ownerId" | "department">) => ActionResult
  updateCustomer: (id: number, patch: Partial<Omit<Customer, "id" | "orgId">>) => ActionResult
  addDeal: (input: { customerId?: number; customer: string; amount: number; stage: Stage; dueDate?: string; notes?: string; proposalDoc?: ProposalDoc }) => ActionResult
  attachProposalDoc: (dealId: number, doc: ProposalDoc) => ActionResult
  updateDealStage: (id: number, stage: Stage) => ActionResult
  advanceDeal: (id: number) => ActionResult
  addMarketingActivity: (input: { campaign: string; date: string; channel: string; cost: number; leadsGenerated: number }) => ActionResult

  // Finance
  recordPayment: (
    dealId: number,
    amount: number,
    method?: string,
    meta?: { referenceNo?: string; checkNo?: string; remarks?: string; proofFile?: ProposalDoc }
  ) => ActionResult
  addExpense: (
    category: string,
    amount: number,
    note: string,
    attachmentName?: string,
    meta?: { birTaxType?: string; birTaxAmount?: number; totalAmount?: number; receiptFile?: ProposalDoc }
  ) => ActionResult
  addPayable: (input: { vendor: string; category: string; amount: number; dueDate: string }) => ActionResult
  markPayablePaid: (id: number) => ActionResult
  updatePayrollEntry: (id: number, patch: Partial<PayrollInputs>) => ActionResult
  applyPayrollDays: (daysWorked: number) => ActionResult
  markPayrollPaid: (id: number) => ActionResult
  markAllPayrollPaid: () => ActionResult

  // Reporters
  addActivity: (input: { title: string; place: string; notes: string; photos: number; date?: string; media?: MediaAttachment[] }) => ActionResult
  addPhoto: (input: { caption: string; location: string; url: string; mediaType?: "image" | "video"; date?: string }) => ActionResult
  timeIn: () => ActionResult
  timeOut: () => ActionResult

  // Tasks
  assignTask: (input: { title: string; description: string; toId: string; dueDate: string; priority: TaskPriority }) => ActionResult
  updateTaskStatus: (id: number, status: TaskStatus) => ActionResult

  // Reports workflow
  saveDraftReport: (input: { kind: ReportKind; title: string; content: string; period: string; attachments?: string[] }) => ActionResult
  submitReport: (input: { id?: number; kind: ReportKind; title: string; content: string; period: string; attachments?: string[] }) => ActionResult
  reviewReport: (id: number) => ActionResult
  returnReport: (id: number, comment: string) => ActionResult
  submitConsolidatedReport: (input: { title: string; content: string; period: string; bundledReportIds: number[] }) => ActionResult
  approveReport: (id: number) => ActionResult

  // Notifications
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  // Admin: User Management
  createUser: (input: { name: string; email: string; role: Role; department: Department; title: string }) => ActionResult
  updateUser: (id: string, patch: { name?: string; email?: string; role?: Role; department?: Department; title?: string }) => ActionResult
  toggleUserStatus: (id: string) => ActionResult
  resetUserPassword: (id: string) => ActionResult & { tempPassword?: string }
  deleteUser: (id: string) => ActionResult

  reset: () => void
}

const NEXT_STAGE: Record<Stage, Stage> = {
  inquiry: "lead",
  lead: "proposal",
  proposal: "confirmed",
  confirmed: "confirmed",
}

const fmtPeso = (n: number) => `₱${Math.round(n).toLocaleString("en-PH")}`
const nowStamp = () => "Just now"
const todayIso = () => "2026-11-26"

function saveSessionUser(user: UserAccount | null) {
  if (typeof window === "undefined") return
  try {
    if (user) {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } else {
      window.sessionStorage.removeItem(SESSION_KEY)
    }
  } catch {
    // Ignore storage quota / private mode errors
  }
}

function readSessionUser(users: UserAccount[]): UserAccount | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { id?: string }
    const found = users.find((a) => a.id === parsed.id) ?? null
    if (found && found.status === "inactive") return null
    return found
  } catch {
    return null
  }
}

function pushNotif(
  list: NotificationItem[],
  entry: Omit<NotificationItem, "id" | "orgId" | "at" | "readBy">
): NotificationItem[] {
  return [
    {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orgId: ORG_ID,
      at: nowStamp(),
      readBy: [],
      ...entry,
    },
    ...list,
  ].slice(0, 40)
}

function pushAudit(
  list: AuditLog[],
  actor: UserAccount,
  action: string,
  target: string,
  detail: string
): AuditLog[] {
  return [
    {
      id: Date.now() + Math.floor(Math.random() * 1000),
      orgId: ORG_ID,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      target,
      detail,
      at: nowStamp(),
    },
    ...list,
  ].slice(0, 60)
}

export const useBiz = create<BizState>((set, get) => {
  const guard = (permission: Permission): UserAccount | null => {
    const user = get().currentUser
    if (!user || !can(user.role, permission)) return null
    return user
  }

  return {
    ...buildSeed(),
    currentUser: null,
    authHydrated: false,
    notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS },

    hydrateAuth: () => {
      if (get().authHydrated) return
      const user = readSessionUser(get().users)
      set({ currentUser: user, authHydrated: true })
    },

    login: (email) => {
      const normalized = email.trim().toLowerCase()
      const user = get().users.find((a) => a.email.toLowerCase() === normalized)
      if (!user) {
        return { ok: false, error: "Account not found. Pick one of the demo accounts or check the email." }
      }
      if (user.status === "inactive") {
        return { ok: false, error: "This account has been deactivated by the System Admin." }
      }
      const updatedUser: UserAccount = { ...user, lastLogin: "Just now" }
      saveSessionUser(updatedUser)
      set((s) => ({
        currentUser: updatedUser,
        authHydrated: true,
        users: s.users.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
      }))
      return { ok: true }
    },

    loginAs: (userId) => {
      const user = get().users.find((a) => a.id === userId)
      if (!user) return { ok: false, error: "Demo account not found." }
      if (user.status === "inactive") {
        return { ok: false, error: "This account has been deactivated by the System Admin." }
      }
      const updatedUser: UserAccount = { ...user, lastLogin: "Just now" }
      saveSessionUser(updatedUser)
      set((s) => ({
        currentUser: updatedUser,
        authHydrated: true,
        users: s.users.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
      }))
      return { ok: true }
    },

    logout: () => {
      saveSessionUser(null)
      set({ currentUser: null, authHydrated: true })
    },

    updateProfile: (patch) => {
      const user = get().currentUser
      if (!user) return { ok: false, error: "Not signed in." }
      const name = patch.name.trim()
      const title = patch.title.trim()
      if (name.length < 2) return { ok: false, error: "Name must be at least 2 characters." }
      const computedInitials =
        patch.initials?.trim().toUpperCase().slice(0, 2) ||
        name
          .split(/\s+/)
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      const updated: UserAccount = { ...user, name, title: title || user.title, initials: computedInitials || user.initials }
      saveSessionUser(updated)
      set((s) => ({
        currentUser: updated,
        users: s.users.map((u) => (u.id === updated.id ? updated : u)),
      }))
      return { ok: true }
    },

    updateNotificationPrefs: (patch) => {
      set((s) => ({ notificationPrefs: { ...s.notificationPrefs, ...patch } }))
    },

    addCustomer: (input) => {
      const user = guard("customers:write")
      if (!user) return { ok: false, error: "You do not have permission to add customers." }
      set((s) => ({
        customers: [
          {
            id: Date.now(),
            orgId: ORG_ID,
            ownerId: user.id,
            department: "sales",
            ...input,
          },
          ...s.customers,
        ],
      }))
      return { ok: true }
    },

    updateCustomer: (id, patch) => {
      const user = guard("customers:write")
      if (!user) return { ok: false, error: "You do not have permission to edit customers." }
      set((s) => ({
        customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }))
      return { ok: true }
    },

    addDeal: (input) => {
      const user = guard("deals:create")
      if (!user) return { ok: false, error: "You do not have permission to create deals." }
      if (input.stage === "confirmed" && !can(user.role, "deals:confirm")) {
        return { ok: false, error: "You do not have permission to confirm sales." }
      }
      const existingCustomer = get().customers.find((c) => c.name.toLowerCase() === input.customer.trim().toLowerCase())
      const deal: Deal = {
        id: Date.now(),
        orgId: ORG_ID,
        customerId: input.customerId ?? existingCustomer?.id ?? 0,
        customer: input.customer.trim(),
        amount: Math.max(0, Math.round(input.amount)),
        stage: input.stage,
        month: NOW,
        ownerId: user.id,
        owner: user.name,
        department: "sales",
        createdAt: todayIso(),
        dueDate: input.dueDate || "2026-12-15",
        notes: input.notes,
        proposalDoc: input.proposalDoc,
      }
      set((s) => ({
        deals: [deal, ...s.deals],
        notifications: pushNotif(s.notifications, {
          text:
            deal.stage === "confirmed"
              ? `Sale confirmed: ${deal.customer} (${fmtPeso(deal.amount)}). Added to receivables.`
              : `New ${deal.stage}: ${deal.customer} (${fmtPeso(deal.amount)})`,
          kind: "sale",
          targetRoles: deal.stage === "confirmed" ? ["ceo", "manager", "finance", "sales"] : ["sales", "manager"],
          href: deal.stage === "confirmed" ? "/finance/receivables" : "/sales/leads",
        }),
        auditLogs:
          deal.stage === "confirmed"
            ? pushAudit(s.auditLogs, user, "Sale confirmed", deal.customer, `${fmtPeso(deal.amount)} added to receivables`)
            : s.auditLogs,
      }))
      return { ok: true }
    },

    attachProposalDoc: (dealId, doc) => {
      const user = guard("deals:update")
      if (!user) return { ok: false, error: "You do not have permission to attach proposal documents." }
      const deal = get().deals.find((d) => d.id === dealId)
      if (!deal) return { ok: false, error: "Proposal not found." }
      set((s) => ({
        deals: s.deals.map((d) => (d.id === dealId ? { ...d, proposalDoc: doc } : d)),
      }))
      return { ok: true }
    },

    updateDealStage: (id, stage) => {
      const perm: Permission = stage === "confirmed" ? "deals:confirm" : "deals:update"
      const user = guard(perm)
      if (!user) return { ok: false, error: "You do not have permission to update this deal." }
      const deal = get().deals.find((d) => d.id === id)
      if (!deal) return { ok: false, error: "Deal not found." }
      set((s) => ({
        deals: s.deals.map((d) => (d.id === id ? { ...d, stage } : d)),
        notifications: pushNotif(s.notifications, {
          text:
            stage === "confirmed"
              ? `Sale confirmed: ${deal.customer} (${fmtPeso(deal.amount)}). Receivable created.`
              : `${deal.customer} moved to ${stage}`,
          kind: "sale",
          targetRoles: stage === "confirmed" ? ["ceo", "manager", "finance", "sales"] : ["sales", "manager"],
          href: stage === "confirmed" ? "/finance/receivables" : "/sales/proposals",
        }),
        auditLogs:
          stage === "confirmed"
            ? pushAudit(s.auditLogs, user, "Sale confirmed", deal.customer, `${fmtPeso(deal.amount)} moved to confirmed sales`)
            : s.auditLogs,
      }))
      return { ok: true }
    },

    advanceDeal: (id) => {
      const deal = get().deals.find((d) => d.id === id)
      if (!deal) return { ok: false, error: "Deal not found." }
      return get().updateDealStage(id, NEXT_STAGE[deal.stage])
    },

    addMarketingActivity: (input) => {
      const user = guard("marketing:write")
      if (!user) return { ok: false, error: "You do not have permission to add marketing activities." }
      set((s) => ({
        marketingActivities: [
          {
            id: Date.now(),
            orgId: ORG_ID,
            ownerId: user.id,
            department: "sales",
            month: NOW,
            ...input,
          },
          ...s.marketingActivities,
        ],
      }))
      return { ok: true }
    },

    recordPayment: (dealId, amount, method = "Bank Transfer", meta) => {
      const user = guard("payments:write")
      if (!user) return { ok: false, error: "You do not have permission to record payments." }
      const deal = get().deals.find((d) => d.id === dealId && d.stage === "confirmed")
      if (!deal) return { ok: false, error: "Confirmed invoice not found." }
      const cleanAmount = Math.max(0, Math.round(amount))
      if (cleanAmount <= 0) return { ok: false, error: "Payment amount must be greater than zero." }
      const refText = meta?.referenceNo?.trim()
      const checkText = meta?.checkNo?.trim()
      const refSuffix = [refText ? `Ref: ${refText}` : "", checkText ? `Check: ${checkText}` : ""].filter(Boolean).join(" · ")
      set((s) => ({
        payments: [
          {
            id: Date.now(),
            orgId: ORG_ID,
            dealId,
            amount: cleanAmount,
            month: NOW,
            date: todayIso(),
            method,
            recordedBy: user.name,
            department: "finance",
            referenceNo: refText || undefined,
            checkNo: checkText || undefined,
            remarks: meta?.remarks?.trim() || undefined,
            proofFile: meta?.proofFile,
          },
          ...s.payments,
        ],
        notifications: pushNotif(s.notifications, {
          text: `Payment received: ${fmtPeso(cleanAmount)} from ${deal.customer} (${method})`,
          kind: "payment",
          targetRoles: ["ceo", "manager", "finance"],
          href: "/finance/payments",
        }),
        auditLogs: pushAudit(
          s.auditLogs,
          user,
          "Payment recorded",
          deal.customer,
          `${fmtPeso(cleanAmount)} via ${method}${refSuffix ? ` (${refSuffix})` : ""}`
        ),
      }))
      return { ok: true }
    },

    addExpense: (category, amount, note, attachmentName, meta) => {
      const user = guard("expenses:write")
      if (!user) return { ok: false, error: "You do not have permission to record expenses." }
      const cleanAmount = Math.max(0, Math.round(amount))
      if (cleanAmount <= 0) return { ok: false, error: "Expense amount must be greater than zero." }
      set((s) => ({
        expenses: [
          {
            id: Date.now() + Math.floor(Math.random() * 1000),
            orgId: ORG_ID,
            category,
            amount: cleanAmount,
            month: NOW,
            date: todayIso(),
            note: note.trim() || category,
            attachmentName: meta?.receiptFile?.name ?? (attachmentName?.trim() || undefined),
            receiptFile: meta?.receiptFile,
            birTaxType: meta?.birTaxType,
            birTaxAmount: meta?.birTaxAmount,
            totalAmount: meta?.totalAmount ?? cleanAmount,
            recordedBy: user.name,
            department: "finance",
          },
          ...s.expenses,
        ],
        notifications: pushNotif(s.notifications, {
          text: `Expense recorded: ${category} ${fmtPeso(cleanAmount)}`,
          kind: "expense",
          targetRoles: ["ceo", "finance"],
          href: "/finance/expenses",
        }),
        auditLogs: pushAudit(
          s.auditLogs,
          user,
          "Expense recorded",
          category,
          `${fmtPeso(cleanAmount)}${meta?.birTaxType ? ` (${meta.birTaxType})` : ""} — ${note.trim() || category}`
        ),
      }))
      return { ok: true }
    },

    addPayable: (input) => {
      const user = guard("payables:write")
      if (!user) return { ok: false, error: "You do not have permission to add bills." }
      set((s) => ({
        payables: [
          {
            id: Date.now(),
            orgId: ORG_ID,
            status: "unpaid",
            month: NOW,
            department: "finance",
            ...input,
          },
          ...s.payables,
        ],
      }))
      return { ok: true }
    },

    markPayablePaid: (id) => {
      const user = guard("payables:write")
      if (!user) return { ok: false, error: "You do not have permission to pay bills." }
      const item = get().payables.find((p) => p.id === id)
      if (!item || item.status === "paid") return { ok: false, error: "Unpaid bill not found." }
      set((s) => ({
        payables: s.payables.map((p) => (p.id === id ? { ...p, status: "paid", paidAt: todayIso() } : p)),
        expenses: [
          {
            id: Date.now(),
            orgId: ORG_ID,
            category: item.category,
            amount: item.amount,
            month: NOW,
            date: todayIso(),
            note: `Paid bill: ${item.vendor}`,
            recordedBy: user.name,
            department: "finance",
          },
          ...s.expenses,
        ],
        auditLogs: pushAudit(s.auditLogs, user, "Payable settled", item.vendor, `${fmtPeso(item.amount)} marked as paid`),
      }))
      return { ok: true }
    },

    updatePayrollEntry: (id, patch) => {
      const user = guard("payroll:write")
      if (!user) return { ok: false, error: "You do not have permission to edit payroll." }
      const entry = get().payroll.find((p) => p.id === id)
      if (!entry) return { ok: false, error: "Payroll entry not found." }
      set((s) => ({
        payroll: s.payroll.map((p) => {
          if (p.id !== id) return p
          const next = { ...p, ...patch }
          return { ...next, basePay: Math.round(next.dailyRate * next.daysWorked) }
        }),
      }))
      return { ok: true }
    },

    applyPayrollDays: (daysWorked) => {
      const user = guard("payroll:write")
      if (!user) return { ok: false, error: "You do not have permission to update payroll cutoff." }
      const cleanDays = Math.max(1, Math.min(31, Math.round(daysWorked)))
      set((s) => ({
        payroll: s.payroll.map((p) =>
          p.status === "pending" ? { ...p, daysWorked: cleanDays, basePay: Math.round(p.dailyRate * cleanDays) } : p
        ),
      }))
      return { ok: true }
    },

    markPayrollPaid: (id) => {
      const user = guard("payroll:write")
      if (!user) return { ok: false, error: "You do not have permission to process payroll." }
      const entry = get().payroll.find((p) => p.id === id)
      if (!entry || entry.status === "paid") return { ok: false, error: "Pending payroll entry not found." }
      const calc = computePayroll(entry)
      set((s) => ({
        payroll: s.payroll.map((p) => (p.id === id ? { ...p, status: "paid", paidAt: todayIso() } : p)),
        auditLogs: pushAudit(
          s.auditLogs,
          user,
          "Payroll disbursed",
          entry.employeeName,
          `Net pay ${fmtPeso(calc.netPay)} (Gross ${fmtPeso(calc.grossPay)}, Deductions ${fmtPeso(calc.totalDeductions)})`
        ),
      }))
      return { ok: true }
    },

    markAllPayrollPaid: () => {
      const user = guard("payroll:write")
      if (!user) return { ok: false, error: "You do not have permission to process payroll." }
      const pending = get().payroll.filter((p) => p.status === "pending")
      if (pending.length === 0) return { ok: false, error: "All payroll entries are already paid." }
      const totalNet = pending.reduce((a, p) => a + computePayroll(p).netPay, 0)
      set((s) => ({
        payroll: s.payroll.map((p) => (p.status === "pending" ? { ...p, status: "paid", paidAt: todayIso() } : p)),
        auditLogs: pushAudit(
          s.auditLogs,
          user,
          "Batch payroll disbursed",
          `${pending.length} employees`,
          `Total net disbursement ${fmtPeso(totalNet)}`
        ),
      }))
      return { ok: true }
    },

    addActivity: (input) => {
      const user = guard("activities:write")
      if (!user) return { ok: false, error: "You do not have permission to log field activities." }
      const media = input.media ?? []
      const date = input.date || todayIso()
      const photoCount = Math.max(Math.round(input.photos), media.length)
      const syncedPhotos: PhotoItem[] = media.map((m, idx) => ({
        id: Date.now() + idx + 1,
        orgId: ORG_ID,
        authorId: user.id,
        by: user.name,
        caption: `${input.title.trim()} — ${m.name}`,
        location: input.place.trim(),
        url: m.url,
        mediaType: m.mediaType,
        date,
        month: NOW,
        department: "reporters",
      }))
      set((s) => ({
        activities: [
          {
            id: Date.now(),
            orgId: ORG_ID,
            authorId: user.id,
            by: user.name,
            title: input.title.trim(),
            place: input.place.trim(),
            notes: input.notes.trim(),
            photos: Math.max(0, photoCount),
            media,
            date,
            month: NOW,
            department: "reporters",
          },
          ...s.activities,
        ],
        photos: syncedPhotos.length > 0 ? [...syncedPhotos, ...s.photos] : s.photos,
      }))
      return { ok: true }
    },

    addPhoto: (input) => {
      const user = guard("photos:write")
      if (!user) return { ok: false, error: "You do not have permission to upload photos." }
      set((s) => ({
        photos: [
          {
            id: Date.now(),
            orgId: ORG_ID,
            authorId: user.id,
            by: user.name,
            caption: input.caption.trim(),
            location: input.location.trim(),
            url: input.url,
            mediaType: input.mediaType ?? "image",
            date: input.date || todayIso(),
            month: NOW,
            department: "reporters",
          },
          ...s.photos,
        ],
      }))
      return { ok: true }
    },

    timeIn: () => {
      const user = guard("attendance:write")
      if (!user) return { ok: false, error: "You do not have permission to log attendance." }
      const existing = get().attendance.find((a) => a.authorId === user.id && a.date === todayIso())
      if (existing) return { ok: false, error: "Already timed in today." }
      const time = new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
      set((s) => ({
        attendance: [
          {
            id: Date.now(),
            orgId: ORG_ID,
            authorId: user.id,
            by: user.name,
            date: todayIso(),
            timeIn: time,
            status: "present",
            month: NOW,
            department: "reporters",
          },
          ...s.attendance,
        ],
      }))
      return { ok: true }
    },

    timeOut: () => {
      const user = guard("attendance:write")
      if (!user) return { ok: false, error: "You do not have permission to log attendance." }
      const existing = get().attendance.find((a) => a.authorId === user.id && a.date === todayIso() && !a.timeOut)
      if (!existing) return { ok: false, error: "No active time-in record for today." }
      const time = new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
      set((s) => ({
        attendance: s.attendance.map((a) =>
          a.id === existing.id ? { ...a, timeOut: time, status: "completed" } : a
        ),
      }))
      return { ok: true }
    },

    assignTask: (input) => {
      const user = guard("tasks:assign")
      if (!user) return { ok: false, error: "You do not have permission to assign tasks." }
      const assignee = DEMO_ACCOUNTS.find((a) => a.id === input.toId)
      if (!assignee) return { ok: false, error: "Employee not found." }
      const href =
        assignee.role === "reporter"
          ? "/reporters/assignments"
          : assignee.role === "sales"
            ? "/sales"
            : assignee.role === "finance"
              ? "/finance"
              : "/manager/tasks"
      set((s) => ({
        tasks: [
          {
            id: Date.now(),
            orgId: ORG_ID,
            title: input.title.trim(),
            description: input.description.trim(),
            toId: assignee.id,
            to: assignee.name,
            department: assignee.department,
            dueDate: input.dueDate,
            priority: input.priority,
            status: "todo",
            assignedBy: user.name,
          },
          ...s.tasks,
        ],
        notifications: pushNotif(s.notifications, {
          text: `Task assigned to ${assignee.name}: ${input.title.trim()}`,
          kind: "task",
          targetRoles: [assignee.role],
          targetUserId: assignee.id,
          href,
        }),
        auditLogs: pushAudit(s.auditLogs, user, "Task assigned", assignee.name, `${input.title.trim()} (due ${input.dueDate})`),
      }))
      return { ok: true }
    },

    updateTaskStatus: (id, status) => {
      const user = guard("tasks:update")
      if (!user) return { ok: false, error: "You do not have permission to update tasks." }
      const task = get().tasks.find((t) => t.id === id)
      if (!task) return { ok: false, error: "Task not found." }
      if (user.role === "reporter" && task.toId !== user.id) {
        return { ok: false, error: "You can only update your own assignments." }
      }
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
      }))
      return { ok: true }
    },

    saveDraftReport: (input) => {
      const user = guard("reports:submit")
      if (!user) return { ok: false, error: "You do not have permission to draft reports." }
      const report: Report = {
        id: Date.now(),
        orgId: ORG_ID,
        kind: input.kind,
        department: user.department,
        authorId: user.id,
        authorName: user.name,
        title: input.title.trim(),
        content: input.content.trim(),
        period: input.period.trim(),
        attachments: input.attachments ?? [],
        status: "draft",
        comments: [],
        history: [{ by: user.name, role: user.role, action: "Saved draft", at: nowStamp() }],
        month: NOW,
      }
      set((s) => ({ reports: [report, ...s.reports] }))
      return { ok: true }
    },

    submitReport: (input) => {
      const user = guard("reports:submit")
      if (!user) return { ok: false, error: "You do not have permission to submit reports." }

      if (input.id) {
        const existing = get().reports.find((r) => r.id === input.id)
        if (!existing) return { ok: false, error: "Report not found." }
        if (existing.status !== "draft" && existing.status !== "returned") {
          return { ok: false, error: `Cannot submit a report in "${existing.status}" status.` }
        }
        set((s) => ({
          reports: s.reports.map((r) =>
            r.id === existing.id
              ? {
                ...r,
                title: input.title.trim(),
                content: input.content.trim(),
                period: input.period.trim(),
                status: "submitted",
                history: [...r.history, { by: user.name, role: user.role, action: "Submitted to Manager", at: nowStamp() }],
              }
              : r
          ),
          notifications: pushNotif(s.notifications, {
            text: `${user.name} submitted ${input.kind} report: "${input.title.trim()}"`,
            kind: "report",
            targetRoles: ["manager"],
            href: "/manager/daily-reports",
          }),
        }))
        return { ok: true }
      }

      const report: Report = {
        id: Date.now(),
        orgId: ORG_ID,
        kind: input.kind,
        department: user.department,
        authorId: user.id,
        authorName: user.name,
        title: input.title.trim(),
        content: input.content.trim(),
        period: input.period.trim(),
        attachments: input.attachments ?? [],
        status: "submitted",
        comments: [],
        history: [{ by: user.name, role: user.role, action: `Submitted ${input.kind} report to Manager`, at: nowStamp() }],
        month: NOW,
      }
      set((s) => ({
        reports: [report, ...s.reports],
        notifications: pushNotif(s.notifications, {
          text: `${user.name} submitted ${input.kind} report: "${report.title}"`,
          kind: "report",
          targetRoles: ["manager"],
          href: "/manager/daily-reports",
        }),
      }))
      return { ok: true }
    },

    reviewReport: (id) => {
      const user = guard("reports:review")
      if (!user) return { ok: false, error: "You do not have permission to review reports." }
      const report = get().reports.find((r) => r.id === id)
      if (!report) return { ok: false, error: "Report not found." }
      if (report.status !== "submitted") {
        return { ok: false, error: `Only submitted reports can be reviewed (current: ${report.status}).` }
      }
      set((s) => ({
        reports: s.reports.map((r) =>
          r.id === id
            ? {
              ...r,
              status: "reviewed",
              history: [...r.history, { by: user.name, role: user.role, action: "Reviewed and approved for consolidation", at: nowStamp() }],
            }
            : r
        ),
        notifications: pushNotif(s.notifications, {
          text: `Manager reviewed "${report.title}"`,
          kind: "report",
          targetRoles: [DEMO_ACCOUNTS.find((a) => a.id === report.authorId)?.role ?? "sales"],
          targetUserId: report.authorId,
          href:
            report.department === "sales"
              ? "/sales/reports"
              : report.department === "reporters"
                ? "/reporters/reports"
                : "/finance/reports",
        }),
      }))
      return { ok: true }
    },

    returnReport: (id, comment) => {
      const user = guard("reports:return")
      if (!user) return { ok: false, error: "You do not have permission to return reports." }
      const report = get().reports.find((r) => r.id === id)
      if (!report) return { ok: false, error: "Report not found." }
      const cleanComment = comment.trim()
      if (!cleanComment) return { ok: false, error: "Please include a return comment." }

      const valid =
        (user.role === "manager" && report.status === "submitted") ||
        (user.role === "ceo" && report.status === "sent_to_ceo")
      if (!valid) {
        return { ok: false, error: `Cannot return report in "${report.status}" status as ${user.role}.` }
      }

      const author = DEMO_ACCOUNTS.find((a) => a.id === report.authorId)
      const authorHref =
        author?.role === "manager"
          ? "/manager/consolidated"
          : author?.role === "sales"
            ? "/sales/reports"
            : author?.role === "reporter"
              ? "/reporters/reports"
              : "/finance/reports"

      set((s) => ({
        reports: s.reports.map((r) =>
          r.id === id
            ? {
              ...r,
              status: "returned",
              comments: [...r.comments, { id: Date.now(), by: user.name, role: user.role, text: cleanComment, at: nowStamp() }],
              history: [...r.history, { by: user.name, role: user.role, action: `Returned with comment: "${cleanComment}"`, at: nowStamp() }],
            }
            : r
        ),
        notifications: pushNotif(s.notifications, {
          text: `${user.name} returned "${report.title}": ${cleanComment}`,
          kind: "report",
          targetRoles: [author?.role ?? "manager"],
          targetUserId: report.authorId,
          href: authorHref,
        }),
        auditLogs: pushAudit(s.auditLogs, user, "Report returned", report.title, cleanComment),
      }))
      return { ok: true }
    },

    submitConsolidatedReport: (input) => {
      const user = guard("reports:consolidate")
      if (!user) return { ok: false, error: "You do not have permission to submit consolidated reports." }
      if (input.bundledReportIds.length === 0) {
        return { ok: false, error: "Select at least one reviewed report to bundle." }
      }
      const validIds = input.bundledReportIds.filter((id) => {
        const r = get().reports.find((item) => item.id === id)
        return r && r.status === "reviewed"
      })
      if (validIds.length === 0) {
        return { ok: false, error: "Only reviewed departmental reports can be consolidated." }
      }

      const consolidated: Report = {
        id: Date.now(),
        orgId: ORG_ID,
        kind: "weekly",
        department: "management",
        authorId: user.id,
        authorName: user.name,
        title: input.title.trim(),
        content: input.content.trim(),
        period: input.period.trim(),
        attachments: [],
        status: "sent_to_ceo",
        bundledReportIds: validIds,
        comments: [],
        history: [{ by: user.name, role: user.role, action: `Submitted consolidated report (${validIds.length} bundled) to CEO`, at: nowStamp() }],
        month: NOW,
      }

      set((s) => ({
        reports: [
          consolidated,
          ...s.reports.map((r) =>
            validIds.includes(r.id)
              ? {
                ...r,
                status: "sent_to_ceo" as const,
                history: [...r.history, { by: user.name, role: user.role, action: "Included in consolidated report sent to CEO", at: nowStamp() }],
              }
              : r
          ),
        ],
        notifications: pushNotif(s.notifications, {
          text: `Manager submitted consolidated report "${consolidated.title}" for CEO approval`,
          kind: "report",
          targetRoles: ["ceo"],
          href: "/ceo/approvals",
        }),
        auditLogs: pushAudit(s.auditLogs, user, "Consolidated report sent", consolidated.title, `Bundled ${validIds.length} departmental reports`),
      }))
      return { ok: true }
    },

    approveReport: (id) => {
      const user = guard("reports:approve")
      if (!user) return { ok: false, error: "You do not have permission to approve reports." }
      const report = get().reports.find((r) => r.id === id)
      if (!report) return { ok: false, error: "Report not found." }
      if (report.status !== "sent_to_ceo") {
        return { ok: false, error: `Only reports sent to the CEO can be approved (current: ${report.status}).` }
      }
      const bundled = report.bundledReportIds ?? []
      set((s) => ({
        reports: s.reports.map((r) => {
          if (r.id === id || bundled.includes(r.id)) {
            return {
              ...r,
              status: "approved",
              history: [...r.history, { by: user.name, role: user.role, action: "Approved by CEO", at: nowStamp() }],
            }
          }
          return r
        }),
        notifications: pushNotif(s.notifications, {
          text: `CEO approved "${report.title}"`,
          kind: "report",
          targetRoles: ["ceo", "manager", "sales", "reporter", "finance"],
          href: "/manager/consolidated",
        }),
        auditLogs: pushAudit(s.auditLogs, user, "Report approved", report.title, `Approved by ${user.name}`),
      }))
      return { ok: true }
    },

    markNotificationRead: (id) => {
      const uid = get().currentUser?.id
      if (!uid) return
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id && !n.readBy.includes(uid) ? { ...n, readBy: [...n.readBy, uid] } : n
        ),
      }))
    },

    markAllNotificationsRead: () => {
      const uid = get().currentUser?.id
      if (!uid) return
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n.readBy.includes(uid) ? n : { ...n, readBy: [...n.readBy, uid] }
        ),
      }))
    },

    createUser: (input) => {
      const actor = guard("users:manage")
      if (!actor) return { ok: false, error: "Only System Admin can create user accounts." }
      const name = input.name.trim()
      const email = input.email.trim().toLowerCase()
      const title = input.title.trim()
      if (name.length < 2) return { ok: false, error: "Full name is required." }
      if (!email.includes("@")) return { ok: false, error: "Valid work email is required." }
      if (get().users.some((u) => u.email.toLowerCase() === email)) {
        return { ok: false, error: "An account with this email already exists." }
      }
      const initials =
        name
          .split(/\s+/)
          .filter(Boolean)
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() || "US"
      const created: UserAccount = {
        id: `u-${Date.now()}`,
        orgId: ORG_ID,
        name,
        email,
        role: input.role,
        department: input.department,
        title: title || "Staff Member",
        initials,
        status: "active",
        lastLogin: "Never",
      }
      set((s) => ({
        users: [created, ...s.users],
        auditLogs: pushAudit(
          s.auditLogs,
          actor,
          "User created",
          created.email,
          `Role: ${created.role} · Dept: ${created.department}`
        ),
        notifications: pushNotif(s.notifications, {
          text: `New user account created: ${created.name} (${created.role})`,
          kind: "info",
          targetRoles: ["admin", "ceo"],
          href: "/admin/users",
        }),
      }))
      return { ok: true }
    },

    updateUser: (id, patch) => {
      const actor = guard("users:manage")
      if (!actor) return { ok: false, error: "Only System Admin can edit user accounts." }
      const target = get().users.find((u) => u.id === id)
      if (!target) return { ok: false, error: "User account not found." }
      const nextEmail = patch.email !== undefined ? patch.email.trim().toLowerCase() : target.email
      if (!nextEmail.includes("@")) return { ok: false, error: "Valid work email is required." }
      if (get().users.some((u) => u.id !== id && u.email.toLowerCase() === nextEmail)) {
        return { ok: false, error: "Another account already uses this email." }
      }
      const nextName = patch.name !== undefined ? patch.name.trim() : target.name
      if (nextName.length < 2) return { ok: false, error: "Full name is required." }
      const nextRole = patch.role ?? target.role
      if (target.id === actor.id && nextRole !== "admin") {
        return { ok: false, error: "You cannot remove your own System Admin role." }
      }
      const initials =
        nextName
          .split(/\s+/)
          .filter(Boolean)
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() || target.initials
      const updated: UserAccount = {
        ...target,
        name: nextName,
        email: nextEmail,
        role: nextRole,
        department: patch.department ?? target.department,
        title: patch.title !== undefined ? patch.title.trim() || target.title : target.title,
        initials,
      }
      set((s) => ({
        users: s.users.map((u) => (u.id === id ? updated : u)),
        currentUser: s.currentUser?.id === id ? updated : s.currentUser,
        auditLogs: pushAudit(
          s.auditLogs,
          actor,
          "User updated",
          updated.email,
          `Role: ${target.role} → ${updated.role} · Title: ${updated.title}`
        ),
      }))
      if (get().currentUser?.id === id) saveSessionUser(updated)
      return { ok: true }
    },

    toggleUserStatus: (id) => {
      const actor = guard("users:manage")
      if (!actor) return { ok: false, error: "Only System Admin can change account status." }
      if (actor.id === id) return { ok: false, error: "You cannot deactivate your own active session." }
      const target = get().users.find((u) => u.id === id)
      if (!target) return { ok: false, error: "User account not found." }
      const nextStatus: "active" | "inactive" = target.status === "inactive" ? "active" : "inactive"
      set((s) => ({
        users: s.users.map((u) => (u.id === id ? { ...u, status: nextStatus } : u)),
        auditLogs: pushAudit(
          s.auditLogs,
          actor,
          nextStatus === "active" ? "User activated" : "User deactivated",
          target.email,
          `Account status changed to ${nextStatus}`
        ),
      }))
      return { ok: true }
    },

    resetUserPassword: (id) => {
      const actor = guard("users:manage")
      if (!actor) return { ok: false, error: "Only System Admin can reset passwords." }
      const target = get().users.find((u) => u.id === id)
      if (!target) return { ok: false, error: "User account not found." }
      const tempPassword = `BH-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
      set((s) => ({
        auditLogs: pushAudit(
          s.auditLogs,
          actor,
          "Password reset",
          target.email,
          `Temporary password issued for ${target.name}`
        ),
        notifications: pushNotif(s.notifications, {
          text: `Your password was reset by System Admin. Please update it in Settings.`,
          kind: "info",
          targetRoles: [target.role],
          targetUserId: target.id,
          href: "/login",
        }),
      }))
      return { ok: true, tempPassword }
    },

    deleteUser: (id) => {
      const actor = guard("users:manage")
      if (!actor) return { ok: false, error: "Only System Admin can remove user accounts." }
      if (actor.id === id) return { ok: false, error: "You cannot delete your own account." }
      const target = get().users.find((u) => u.id === id)
      if (!target) return { ok: false, error: "User account not found." }
      set((s) => ({
        users: s.users.filter((u) => u.id !== id),
        auditLogs: pushAudit(s.auditLogs, actor, "User removed", target.email, `Removed ${target.name} (${target.role})`),
      }))
      return { ok: true }
    },

    reset: () => set({ ...buildSeed() }),
  }
})
