import { RoleShell } from "@/features/biz/shell/role-shell"

export default function CeoLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="ceo">{children}</RoleShell>
}
