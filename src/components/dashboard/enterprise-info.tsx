import { Link } from "react-router"
import { ArrowRight, Factory } from "lucide-react"

import { enterpriseInfo } from "@/data/dashboard"

const rows: [string, string | number][] = [
  ["Enterprise ID", enterpriseInfo.id],
  ["Headquarters", enterpriseInfo.headquarters],
  ["Total Locations", enterpriseInfo.locations],
  ["Total Sub-Divisions", enterpriseInfo.subDivisions],
  ["Total Assets", enterpriseInfo.assets.toLocaleString("en-IN")],
  ["Active Users", enterpriseInfo.activeUsers],
]

/** The admin's own enterprise at a glance, beside the KPI tiles */
export function EnterpriseInfo() {
  return (
    <section className="flex h-full flex-col rounded-lg bg-card p-3 shadow-xs ring-1 ring-foreground/10">
      <header className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-primary">Enterprise Information</h3>
        <Link to="/settings" className="flex items-center gap-1 text-[0.7rem] font-medium text-primary hover:underline">
          View Details <ArrowRight className="size-3" />
        </Link>
      </header>
      <div className="flex flex-1 items-center gap-3">
        {/* TODO: the enterprise's own logo once onboarding stores one */}
        <div className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-md bg-info-soft text-primary">
          <Factory className="size-7" />
          <span className="px-1 text-center text-[0.6rem] leading-tight font-bold">{enterpriseInfo.name}</span>
        </div>
        <dl className="grid min-w-0 flex-1 grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[0.7rem]">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="truncate font-semibold">: {value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
