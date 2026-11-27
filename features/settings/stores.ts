import { create } from "zustand"

import { DEMO_ACCOUNTS, useBiz } from "@/features/biz/store"

/**
 * Saved settings for the demo. They live in memory, so they last until a
 * reload, like the rest of the sample data. With a backend, load them with
 * `useRecord` and save them with `useKitMutation` instead.
 */

export interface Profile {
  name: string
  email: string
  title: string
  bio: string
  /** One or two letters; empty means "from my name". */
  initials: string
}

export type Channel = "email" | "inApp" | "mobile"
export type AlertKind =
  | "newPaying"
  | "expansion"
  | "contraction"
  | "paymentFailed"
  | "churn"
  | "seatLimit"
  | "taskAssigned"
  | "weeklyDigest"

export interface NotificationPrefs {
  channels: Record<Channel, Record<AlertKind, boolean>>
  /** Hold mobile pushes overnight, in the user's time zone. */
  quietHours: boolean
}

const all = (
  value: boolean,
  overrides: Partial<Record<AlertKind, boolean>> = {}
): Record<AlertKind, boolean> => ({
  newPaying: value,
  expansion: value,
  contraction: value,
  paymentFailed: value,
  churn: value,
  seatLimit: value,
  taskAssigned: value,
  weeklyDigest: value,
  ...overrides,
})

export const DEFAULT_PREFS: NotificationPrefs = {
  channels: {
    email: all(false, { paymentFailed: true, churn: true, weeklyDigest: true }),
    inApp: all(true, { weeklyDigest: false }),
    mobile: all(false, { paymentFailed: true, churn: true }),
  },
  quietHours: true,
}

interface SettingsState {
  profile: Profile
  notifications: NotificationPrefs
  saveProfile: (profile: Profile) => void
  saveNotifications: (prefs: NotificationPrefs) => void
}

const fallbackUser = DEMO_ACCOUNTS[0]

export const useSettingsStore = create<SettingsState>((set) => ({
  profile: {
    name: fallbackUser.name,
    email: fallbackUser.email,
    title: fallbackUser.title,
    bio: "Managing daily operations, team performance, and departmental reporting in Business Hub.",
    initials: fallbackUser.initials,
  },
  notifications: DEFAULT_PREFS,
  saveProfile: (profile) => {
    set({ profile })
    useBiz.getState().updateProfile({
      name: profile.name,
      title: profile.title,
      initials: profile.initials,
    })
  },
  saveNotifications: (notifications) => set({ notifications }),
}))
