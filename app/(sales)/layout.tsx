import { RoleShell } from "@/features/biz/shell/role-shell"

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="sales">{children}</RoleShell>
}
