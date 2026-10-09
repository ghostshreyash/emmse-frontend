import {
  BookOpen,
  ChartColumn,
  CircleHelp,
  ClipboardCheck,
  ClipboardList,
  Flame,
  Gauge,
  HardDrive,
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

/** EMMS-E sidebar, in the order shown in the dashboard mockup (page 31) */
export const navigation: NavItem[] = [
  { title: "Dashboard", path: "/", icon: House },
  { title: "Asset Management", path: "/assets", icon: HardDrive },
  { title: "Maintenance Activities", path: "/maintenance-activities", icon: Wrench },
  { title: "Reports & Analytics", path: "/reports", icon: ChartColumn },
  { title: "Inspections", path: "/inspections", icon: ClipboardCheck },
  { title: "Testing & Measurements", path: "/testing-measurements", icon: SquareCheckBig },
  { title: "Reliability & PD Analysis", path: "/reliability", icon: Gauge },
  { title: "Safety & Compliance", path: "/safety-compliance", icon: ShieldAlert },
  { title: "Fire Prevention System", path: "/fire-prevention", icon: Flame },
  { title: "Users & Access", path: "/users", icon: UsersRound },
  { title: "Work Management", path: "/work-management", icon: ClipboardList },
  { title: "Knowledge Library", path: "/knowledge-library", icon: BookOpen },
  { title: "Settings", path: "/settings", icon: Settings },
  { title: "Support / Help", path: "/support", icon: CircleHelp },
]
