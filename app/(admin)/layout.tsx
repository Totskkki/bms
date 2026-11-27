import { RoleShell } from "@/features/biz/shell/role-shell"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="admin">{children}</RoleShell>
}
