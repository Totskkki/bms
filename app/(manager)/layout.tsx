import { RoleShell } from "@/features/biz/shell/role-shell"

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="manager">{children}</RoleShell>
}
