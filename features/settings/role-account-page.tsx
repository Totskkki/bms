"use client"

import { DEMO_ACCOUNTS, useBiz } from "@/features/biz/store"

import { AccountPage } from "./account-page"

export function RoleAccountSettingsPage() {
  const user = useBiz((s) => s.currentUser) ?? DEMO_ACCOUNTS[0]
  return <AccountPage user={{ name: user.name, email: user.email }} />
}
