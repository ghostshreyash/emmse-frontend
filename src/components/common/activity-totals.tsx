import { ClipboardCheck, Flame, ShieldCheck, Wrench } from "lucide-react"

import { StatCard } from "@/components/common/stat-card"
import { maintenanceMix } from "@/data/dashboard"
import type { ActivityTotals } from "@/data/report-trends"

/**
 * What has been carried out over the window the charts cover: maintenance in
 * total, each programme on its own, and the inspections behind them.
 *
 * These are the totals **of the charts on the same screen**, summed series by
 * series, so a card and the bars beside it cannot disagree. On Reports they
 * follow the filters down with everything else; on an asset's own record they
 * count that asset alone.
 *
 * One card per maintenance type, taken from `maintenanceMix` rather than
 * written out here, so a programme added to or dropped from the vocabulary
 * appears and disappears from this row with no edit.
 */
export function ActivityTotalCards({ totals }: { totals: ActivityTotals }) {
  const byType = [
    { key: "preventive" as const, icon: ShieldCheck, tone: "info" as const, value: totals.preventive },
    { key: "firePreventive" as const, icon: Flame, tone: "critical" as const, value: totals.firePreventive },
  ]

  return (
    <div className="mb-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total Maintenance" value={totals.maintenance} icon={Wrench} tone="highlight" />
      {byType.map((card) => {
        /* The label is the programme's own name, so the sheet's wording reaches the card */
        const series = maintenanceMix.find((s) => s.key === card.key)
        return series ? (
          <StatCard key={card.key} label={series.label} value={card.value} icon={card.icon} tone={card.tone} />
        ) : null
      })}
      <StatCard label="Total Inspections" value={totals.inspections} icon={ClipboardCheck} tone="success" />
    </div>
  )
}
