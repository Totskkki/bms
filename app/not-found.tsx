import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-page p-6 text-center">
      <p className="font-sans text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 font-heading text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you requested does not exist or is outside your dashboard.
      </p>
      <Button className="mt-5" render={<Link href="/" />}>
        Return to dashboard
      </Button>
    </div>
  )
}
