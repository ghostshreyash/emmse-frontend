import {
  BookOpen,
  ChartColumn,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  Flame,
  Gauge,
  HardDrive,
  LifeBuoy,
  House,
  Settings,
  ShieldAlert,
  SquareCheckBig,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  path: string
  icon: LucideIcon
  /**
   * Other route prefixes that belong to this section, so a details screen keeps
   * its sidebar entry highlighted even though it sits on its own path.
   */
  covers?: string[]
}

/**
 * Every EMMS-E section, in the order shown in the dashboard mockup (page 31). The router
 * gives each one a page (a placeholder until it is built), whether or not the sidebar
 * lists it, so links from the dashboard keep working.
 */
export const sections = {
  dashboard: { title: "Dashboard", path: "/", icon: House },
  assets: { title: "Asset Management", path: "/assets", icon: HardDrive },
  tasks: { title: "Maintenance Tasks", path: "/tasks", icon: Wrench },
  /** The original Tasks route, kept as its placeholder page; Tasks now lives at /tasks */
  maintenance: { title: "Maintenance Activities", path: "/maintenance-activities", icon: Wrench },
  reports: { title: "Reports & Analytics", path: "/reports", icon: ChartColumn, covers: ["/reports/"] },
  inspections: { title: "Inspections", path: "/inspection-activities", icon: ClipboardCheck },
  /** The original Inspections route, kept as its placeholder page */
  inspectionsPlaceholder: { title: "Inspections", path: "/inspections", icon: ClipboardCheck },
  testing: { title: "Testing & Measurements", path: "/testing-measurements", icon: SquareCheckBig },
  reliability: { title: "Reliability & PD Analysis", path: "/reliability", icon: Gauge },
  safety: { title: "Safety & Compliance", path: "/safety-compliance", icon: ShieldAlert },
  fire: { title: "Fire Prevention System", path: "/fire-prevention", icon: Flame },
  users: { title: "Users & Access", path: "/users", icon: UsersRound },
  /**
   * Support Tickets: how this enterprise raises anything with OCC. The client
   * settled that every enterprise-to-OCC message is a ticket, so this is the
   * one channel - `support` below stays the placeholder Help section it was.
   */
  tickets: { title: "Support Tickets", path: "/support-tickets", icon: LifeBuoy, covers: ["/support-tickets/"] },
  work: { title: "Work Management", path: "/work-management", icon: ClipboardList },
  knowledge: { title: "Knowledge Library", path: "/knowledge-library", icon: BookOpen },
  settings: { title: "Settings", path: "/settings", icon: Settings },
  support: { title: "Support / Help", path: "/support", icon: CircleHelp },
} satisfies Record<string, NavItem>

/** The sidebar menu. Sections are hidden from it for now, not removed from the app. */
export const navigation: NavItem[] = [
  sections.dashboard,
  sections.assets,
  sections.tasks,
  sections.inspections,
  sections.reports,
  sections.tickets,
  // sections.testing,
  // sections.reliability,
  // sections.safety,
  // sections.fire,
  // sections.users,
  // sections.work,
  // sections.knowledge,
  // sections.settings,
  // sections.support,
]
