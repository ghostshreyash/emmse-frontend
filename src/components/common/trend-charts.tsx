import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, XAxis, YAxis } from "recharts"
import { CalendarDays } from "lucide-react"

import { SectionCard } from "@/components/common/section-card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { maintenanceMix, type MaintenanceMonth } from "@/data/dashboard"
import { contaminationLevels } from "@/data/reports"
import type { ContaminationMonth, DustMonth, HealthMonth, ScoreMonth } from "@/data/report-trends"
import { healthStatus } from "@/lib/status"

/**
 * The three trend charts from the Reports & Analytics mockup (page 34), and the
 * single-asset readings of two of them.
 *
 * They live here rather than beside one screen because three screens draw them:
 * the dashboard takes the maintenance one, Reports takes all three across the
 * estate, and an asset's own record takes its own score and dust. Colours come
 * from the status tokens rather than from each chart choosing its own, so a
 * Healthy asset is the same green in a line, a bar, a badge and a donut.
 *
 * Every chart is the same shape: a SectionCard with the window on its header,
 * a fixed-height ChartContainer, and the legend underneath rather than inside,
 * where recharts would shrink the plot to fit it.
 */

/** The window every one of these covers, shown on the card header */
function Window({ label = "Last 6 Months" }: { label?: string }) {
  return (
    <span className="flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.7rem] text-primary">
      <CalendarDays className="size-3" /> {label}
    </span>
  )
}

/** Series keys and their colours, shown under the plot */
function Legend({ series }: { series: { key: string; label: string; color: string }[] }) {
  return (
    <ul className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[0.7rem]">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  )
}

const chartBox = "aspect-auto h-44 w-full"
const axis = { tickLine: false, axisLine: false, fontSize: 11 } as const

/* ---------- Asset Health Trend ---------- */

/** One line per health band, so the three read against each other over the months */
const healthSeries = [
  { key: "healthy", label: healthStatus.healthy.label, color: healthStatus.healthy.color },
  { key: "alarming", label: healthStatus.attention.label, color: healthStatus.attention.color },
  { key: "atRisk", label: healthStatus.critical.label, color: healthStatus.critical.color },
]

const healthConfig = Object.fromEntries(
  healthSeries.map((s) => [s.key, { label: s.label, color: s.color }])
) satisfies ChartConfig

/** How many assets sit in each health band, month by month */
export function HealthTrend({ data }: { data: HealthMonth[] }) {
  return (
    <SectionCard title="Asset Health Trend" icon={<CalendarDays className="size-4 text-primary" />} actions={<Window />}>
      <ChartContainer config={healthConfig} className={chartBox}>
        <LineChart data={data} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" {...axis} />
          <YAxis {...axis} allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {healthSeries.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={`var(--color-${s.key})`}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ChartContainer>
      <Legend series={healthSeries} />
    </SectionCard>
  )
}

/* ---------- Contamination Level Trend ---------- */

/**
 * Low / Medium / High take the same three colours as the health bands: a panel
 * under heavy dust is heading the same way as one scoring badly, and the two
 * charts sit side by side, so using a second palette here would read as a
 * second meaning.
 */
const contaminationSeries = [
  { key: "low", label: contaminationLevels[0], color: healthStatus.healthy.color },
  { key: "medium", label: contaminationLevels[1], color: healthStatus.attention.color },
  { key: "high", label: contaminationLevels[2], color: healthStatus.critical.color },
]

const contaminationConfig = Object.fromEntries(
  contaminationSeries.map((s) => [s.key, { label: s.label, color: s.color }])
) satisfies ChartConfig

/** How many assets are carrying how much dust, month by month */
export function ContaminationTrend({ data }: { data: ContaminationMonth[] }) {
  return (
    <SectionCard
      title="Contamination Level Trend"
      icon={<CalendarDays className="size-4 text-primary" />}
      actions={<Window />}
    >
      <ChartContainer config={contaminationConfig} className={chartBox}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" {...axis} />
          <YAxis {...axis} allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {contaminationSeries.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId="level"
              fill={`var(--color-${s.key})`}
              maxBarSize={28}
              radius={i === contaminationSeries.length - 1 ? [3, 3, 0, 0] : 0}
            />
          ))}
        </BarChart>
      </ChartContainer>
      <Legend series={contaminationSeries} />
    </SectionCard>
  )
}

/* ---------- Maintenance Activity Trend ---------- */

const maintenanceConfig = Object.fromEntries(
  maintenanceMix.map((t) => [t.key, { label: t.label, color: t.color }])
) satisfies ChartConfig

/** Stacked monthly maintenance activities by type, last six months */
export function MaintenanceTrend({ data }: { data: MaintenanceMonth[] }) {
  return (
    <SectionCard
      title="Maintenance Activity Trend"
      icon={<CalendarDays className="size-4 text-primary" />}
      actions={<Window />}
    >
      <ChartContainer config={maintenanceConfig} className={chartBox}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" {...axis} />
          <YAxis {...axis} allowDecimals={false} />
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
      <Legend series={maintenanceMix.map((t) => ({ key: t.key, label: t.label, color: t.color }))} />
    </SectionCard>
  )
}

/* ---------- One asset ---------- */

const scoreConfig = { score: { label: "Health Score", color: "var(--primary)" } } satisfies ChartConfig

/**
 * One asset's score over the months.
 *
 * A single asset has a reading, not a distribution, so this is its own score on
 * a fixed 0-100 axis rather than a count of bands. Fixed, because a score that
 * moved between 78 and 82 on an auto-scaled axis would look like a collapse.
 */
export function AssetScoreTrend({ data }: { data: ScoreMonth[] }) {
  return (
    <SectionCard title="Asset Health Trend" icon={<CalendarDays className="size-4 text-primary" />} actions={<Window />}>
      <ChartContainer config={scoreConfig} className={chartBox}>
        <LineChart data={data} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" {...axis} />
          <YAxis {...axis} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="score" stroke="var(--color-score)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 4 }} />
        </LineChart>
      </ChartContainer>
      <p className="mt-1 text-center text-[0.7rem] text-muted-foreground">Health Score, out of 100</p>
    </SectionCard>
  )
}

const dustConfig = { dust: { label: "Dust thickness (mm)", color: healthStatus.attention.color } } satisfies ChartConfig

const dustColor: Record<string, string> = {
  Low: healthStatus.healthy.color,
  Medium: healthStatus.attention.color,
  High: healthStatus.critical.color,
}

/**
 * One asset's dust reading, each bar coloured by the level it falls in - so the
 * chart shows both how much dust there was and when that tipped the panel from
 * Low into Medium, which a single-colour bar would hide.
 */
export function AssetDustTrend({ data }: { data: DustMonth[] }) {
  return (
    <SectionCard
      title="Contamination Level Trend"
      icon={<CalendarDays className="size-4 text-primary" />}
      actions={<Window />}
    >
      <ChartContainer config={dustConfig} className={chartBox}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" {...axis} />
          <YAxis {...axis} unit="mm" width={44} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="dust" maxBarSize={28} radius={[3, 3, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.month} fill={dustColor[d.level]} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <Legend series={contaminationSeries} />
    </SectionCard>
  )
}
