import { Link } from "react-router"
import { FileText, Plus, Search, Wrench, Zap } from "lucide-react"

import { SectionCard } from "@/components/common/section-card"

const actions = [
  { label: "Schedule Maintenance", icon: Wrench, to: "/maintenance-activities" },
  { label: "Search Asset / QR Code", icon: Search, to: "/assets" },
  { label: "View Reports", icon: FileText, to: "/reports" },
  { label: "Add New Asset", icon: Plus, to: "/assets" },
]

export function QuickActions() {
  return (
    <SectionCard title="Quick Actions" icon={<Zap className="size-4 text-primary" />}>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(({ label, icon: Icon, to }) => (
          <Link
            key={label}
            to={to}
            className="flex flex-col items-center justify-center gap-1.5 rounded-md bg-info-soft/70 px-2 py-3 text-center text-xs font-medium text-brand-navy ring-1 ring-info/10 transition-colors hover:bg-info-soft hover:ring-primary/30 dark:text-foreground"
          >
            <Icon className="size-5 text-primary" />
            {label}
          </Link>
        ))}
      </div>
    </SectionCard>
  )
}
