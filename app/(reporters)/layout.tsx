import { RoleShell } from "@/features/biz/shell/role-shell"

export default function ReportersLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="reporter">{children}</RoleShell>
}
