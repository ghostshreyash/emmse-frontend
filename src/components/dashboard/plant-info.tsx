import { Building2, CalendarDays, Factory, Gauge, MapPin, UserRound, type LucideIcon } from "lucide-react"

import type { Plant } from "@/data/dashboard"

/**
 * The selected plant at a glance, shown beside the enterprise card. Asset counts and
 * health are left to the KPI tiles just below, so nothing here repeats them.
 */
export function PlantInfo({ plant }: { plant: Plant }) {
  const facts: { icon: LucideIcon; label: string; value: string | number; tone: string }[] = [
    { icon: Gauge, label: "Capacity", value: plant.capacity, tone: "text-attention" },
    { icon: Building2, label: "Departments", value: plant.departments, tone: "text-primary" },
    { icon: UserRound, label: "Plant Head", value: plant.head, tone: "text-highlight" },
    { icon: CalendarDays, label: "Commissioned On", value: plant.commissioned, tone: "text-healthy" },
  ]

  return (
    <section className="relative flex h-full flex-col overflow-hidden rounded-xl bg-gradient-to-br from-info-soft via-card to-card p-3 shadow-sm ring-1 ring-primary/15 duration-300 animate-in fade-in slide-in-from-left-2">
      <span aria-hidden="true" className="absolute -top-12 -right-10 size-36 rounded-full bg-primary/5" />

      <div className="relative flex items-center gap-3">
        {/* The plant's uploaded logo, or a generic plant mark */}
        {plant.logo ? (
          <img
            src={plant.logo}
            alt={`${plant.name} logo`}
            className="size-14 shrink-0 rounded-xl bg-white object-contain p-1.5 shadow-md ring-1 ring-foreground/10"
          />
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-brand-navy text-white shadow-md">
            <Factory className="size-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[0.6rem] font-semibold tracking-wider text-muted-foreground uppercase">
            Plant
            <span className="rounded bg-primary/10 px-1 py-px tracking-normal text-primary">{plant.id}</span>
            <span className="rounded bg-highlight/12 px-1.5 py-px tracking-normal text-highlight normal-case">{plant.type}</span>
          </div>
          <h3 className="truncate text-base leading-tight font-bold text-brand-navy dark:text-foreground">{plant.name}</h3>
          <div className="mt-0.5 flex items-center gap-1 text-[0.7rem] text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{plant.location}</span>
          </div>
        </div>
      </div>

      <dl className="relative mt-auto grid grid-cols-2 gap-2 pt-2.5">
        {facts.map(({ icon: Icon, label, value, tone }) => (
          <div key={label} className="flex items-center gap-2 rounded-lg bg-card px-2 py-1.5 ring-1 ring-foreground/8">
            <Icon className={`size-4 shrink-0 ${tone}`} />
            <div className="flex min-w-0 flex-col-reverse leading-tight">
              <dt className="truncate text-[0.6rem] text-muted-foreground">{label}</dt>
              <dd className="truncate text-sm font-bold text-brand-navy tabular-nums dark:text-foreground">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}
