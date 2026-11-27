"use client"

import { useMemo } from "react"

import { ROLE_HOME } from "@/config/nav-by-role"
import { SETTINGS_NAV } from "@/config/settings-nav"
import { useBiz } from "@/features/biz/store"
import { SettingsLayout } from "@/kit/settings/settings-layout"

/**
 * The settings frame with Chronicle's full settings sections, scoped to the
 * currently logged-in role's route prefix (e.g. /ceo/settings/profile).
 */
export function SettingsFrame({ children }: { children: React.ReactNode }) {
  const role = useBiz((s) => s.currentUser?.role)

  const groups = useMemo(() => {
    const base = role ? ROLE_HOME[role] : ""
    return SETTINGS_NAV.map((group) => ({
      ...group,
      items: group.items.map((item) => ({
        ...item,
        href: `${base}${item.href}`,
      })),
    }))
  }, [role])

  return (
    <SettingsLayout
      groups={groups}
      description="Your profile, how Business Hub looks, and which alerts reach you."
    >
      {children}
    </SettingsLayout>
  )
}
