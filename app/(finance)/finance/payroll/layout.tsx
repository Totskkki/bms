import { PayrollFrame } from "@/features/biz/finance/payroll/payroll-frame"

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  return <PayrollFrame>{children}</PayrollFrame>
}
