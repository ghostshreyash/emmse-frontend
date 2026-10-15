import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { CalendarDays } from "lucide-react"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { SectionCard } from "@/components/common/section-card"
import { maintenanceMix, type MaintenanceMonth } from "@/data/dashboard"

const config = Object.fromEntries(maintenanceMix.map((t) => [t.key, { label: t.label, color: t.color }])) satisfies ChartConfig

/** Stacked monthly maintenance activities by type, last six months */
export function MaintenanceTrend({ data }: { data: MaintenanceMonth[] }) {
  return (
    <SectionCard
      title="Maintenance Activity Trend"
      icon={<CalendarDays className="size-4 text-primary" />}
      actions={
        <span className="flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.7rem] text-primary">
          <CalendarDays className="size-3" /> Last 6 Months
        </span>
      }
    >
      <ChartContainer config={config} className="aspect-auto h-44 w-full">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis tickLine={false} axisLine={false} fontSize={11} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {maintenanceMix.map((t, i) => (
            <Bar
              key={t.key}
              dataKey={t.key}
              stackId="type"
              fill={`var(--color-${t.key})`}
              maxBarSize={28}
              radius={i === maintenanceMix.length - 1 ? [3, 3, 0, 0] : 0}
            />
          ))}
        </BarChart>
      </ChartContainer>
      <ul className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[0.7rem]">
        {maintenanceMix.map((t) => (
          <li key={t.key} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: t.color }} />
            {t.label}
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}
