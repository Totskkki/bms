import { RoleShell } from "@/features/biz/shell/role-shell"

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="finance">{children}</RoleShell>
}
