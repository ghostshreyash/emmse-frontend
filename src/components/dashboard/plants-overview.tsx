import { Factory } from "lucide-react"
import { cn } from "cn"

import { plants } from "@/data/dashboard"
import { healthStatus } from "@/lib/status"

const segments = ["healthy", "attention", "critical"] as const

/**
 * Every plant's asset count and health split, shown beside the enterprise card when
 * the dashboard is on "All Plants". Read-only; the plant dropdown does the scoping.
 */
export function PlantsOverview() {
  return (
    <section className="flex h-full flex-col rounded-xl bg-gradient-to-br from-info-soft via-card to-card p-3 shadow-sm ring-1 ring-primary/15">
      <header className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-brand-navy dark:text-foreground">
          <Factory className="size-4 text-primary" /> Plants at a Glance
        </h3>
        <ul className="flex gap-2.5 text-[0.6rem] text-muted-foreground">
          {segments.map((key) => (
            <li key={key} className="flex items-center gap-1">
              <span className={cn("size-2 rounded-full", healthStatus[key].dot)} />
              {healthStatus[key].label}
            </li>
          ))}
        </ul>
      </header>

      {/* The list scrolls inside the card, so the enterprise card beside it sets the height
          however many plants there are */}
      <div className="relative min-h-32 flex-1">
        <ul className="absolute inset-0 overflow-y-auto pr-1 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
          {plants.map((p) => (
            <li key={p.id} className="flex items-center gap-2.5 px-1.5 py-0.5">
              <span className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/10 text-[0.55rem] font-bold text-primary">
                {p.id}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium">{p.name}</span>
              <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums">{p.assets}</span>
              {/* Healthy / Alarming / At Risk as one stacked bar */}
              <span
                className="flex h-2 w-32 shrink-0 overflow-hidden rounded-full bg-muted xl:w-44"
                title={segments.map((key) => `${healthStatus[key].label}: ${p[key]}`).join(" · ")}
              >
                {segments.map((key) => (
                  <span key={key} className={healthStatus[key].dot} style={{ width: `${(p[key] / p.assets) * 100}%` }} />
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
