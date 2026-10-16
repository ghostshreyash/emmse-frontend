/**
 * The three trends above the Reports screen (mockup page 34): Asset Health,
 * Contamination Level and Maintenance Activity, over the last six months.
 *
 * **Where the figures come from.** The month we are in is real: it is counted
 * off the very rows the table below is showing, so the charts and the table can
 * never disagree, and narrowing the filters moves both together. The five
 * months before it are a seeded walk backwards - the mock holds one inspection
 * and one clean per asset, not half a year of them, so there is no history to
 * count. The walk is deterministic and always lands on the real current month.
 *
 * TODO(api): replace the back-walk with GET /reports/trends once the reporting
 * service stores the monthly extraction the client asked for ("asset score and
 * status come from daily extraction of EVITA reports, stored as structured
 * data"). The current-month arithmetic here stays as the check on it.
 *
 * The walk leans one way on purpose: the further back you look the worse the
 * estate reads, so the trend shows the improvement maintenance is there to
 * produce. That is a property of the stand-in, not a claim about the data.
 */
import { format, subMonths } from "date-fns"

import { maintenanceMix, type MaintenanceMonth } from "@/data/dashboard"
import { inspections } from "@/data/inspections"
import { maintenanceTypes } from "@/data/master-data"
import type { ReportKind } from "@/data/report-documents"
import { contaminationLevels, type ContaminationLevel, type Finding, type ReportRow } from "@/data/reports"
import { tasks } from "@/data/tasks"

/** How many months the charts cover. The mockup's own window. */
export const TREND_MONTHS = 6

export type HealthMonth = { month: string; healthy: number; alarming: number; atRisk: number }
export type ContaminationMonth = { month: string; low: number; medium: number; high: number }
/** One asset's own score, month by month */
export type ScoreMonth = { month: string; score: number }
/** One asset's own dust reading, and the level that lands in */
export type DustMonth = { month: string; dust: number; level: ContaminationLevel }

/** The last six month names, oldest first, ending with the month we are in */
export function trendMonths(count = TREND_MONTHS): string[] {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => format(subMonths(now, count - 1 - i), "MMM"))
}

/** The same seeded generator the rest of the mock data uses, so nothing moves between renders */
function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

const keyOf = (text: string) => [...text].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7)

/**
 * Walk a three-way split backwards through the months.
 *
 * The total stays put - the estate does not gain or lose assets month to month -
 * and what moves is the share: going back, assets shift out of `good` and into
 * `fair` and `poor`. Everything is clamped so no bucket goes negative and the
 * three always add back up to the total, which is what makes the stacked bars
 * and the lines agree with the count above them.
 */
function shiftBack(good: number, fair: number, poor: number, months: string[], seed: number) {
  const total = good + fair + poor
  const random = seeded(seed)

  return months.map((month, i) => {
    /* The last entry is the month we are in, and that one is the real count */
    const back = months.length - 1 - i
    if (!back) return { month, good, fair, poor, total }

    /* A few assets per month back, nudged so the line is not a ruler */
    const moved = Math.min(good, Math.round(back * (total * 0.03) + random() * 2))
    const toPoor = Math.min(Math.round(moved * 0.4), moved)

    return {
      month,
      good: good - moved,
      fair: fair + (moved - toPoor),
      poor: poor + toPoor,
      total,
    }
  })
}

/* ---------- Enterprise-wide: the rows the table is showing ---------- */

/** How many assets sit in each health band this month, and how that got there */
export function healthTrend(rows: ReportRow[], months = trendMonths()): HealthMonth[] {
  const count = (finding: string) => rows.filter((r) => r.contaminationStatus === finding).length
  return shiftBack(count("Healthy"), count("Alarming"), count("At Risk"), months, 4703 + rows.length).map((m) => ({
    month: m.month,
    healthy: m.good,
    alarming: m.fair,
    atRisk: m.poor,
  }))
}

/**
 * How many assets are carrying how much dust. A separate reading from the
 * health bands above - see the note on `contamination` in data/reports - so the
 * two charts are not one curve drawn twice.
 */
export function contaminationTrend(rows: ReportRow[], months = trendMonths()): ContaminationMonth[] {
  const count = (level: ContaminationLevel) => rows.filter((r) => r.contamination === level).length
  return shiftBack(count("Low"), count("Medium"), count("High"), months, 8821 + rows.length).map((m) => ({
    month: m.month,
    low: m.good,
    medium: m.fair,
    high: m.poor,
  }))
}

/**
 * Maintenance carried out, by type, month by month.
 *
 * Counted off the cleans behind the cleaning reports in view, which is the
 * maintenance this screen can actually account for. Unlike the two above, the
 * total is not fixed - some months carry more work than others - so this one
 * scales rather than shifts, and the month we are in is the real count.
 */
export function maintenanceTrend(rows: ReportRow[], months = trendMonths()): MaintenanceMonth[] {
  const done = rows.map((r) => r.maintenance).filter(Boolean)
  const counts = maintenanceTypes.map((type) => done.filter((m) => m!.type === type).length)
  const random = seeded(6577 + rows.length)

  return months.map((month, i) => {
    const back = months.length - 1 - i
    const row = { month } as MaintenanceMonth
    maintenanceMix.forEach((series, n) => {
      /* Earlier months ran a little lighter, so the bars build towards today */
      row[series.key] = back ? Math.max(0, Math.round(counts[n] * (1 - back * 0.08) - random() * 1.5)) : counts[n]
    })
    return row
  })
}

/* ---------- One asset ---------- */

/**
 * One asset's health score over the six months.
 *
 * The month we are in is the score the asset actually holds; before that it
 * climbs back towards where it was, with the clean - when there has been one -
 * as the step up. A single asset has one reading, not a distribution, so this
 * is a line of its score rather than a count of bands.
 */
export function assetScoreTrend(row: ReportRow, months = trendMonths()): ScoreMonth[] {
  const random = seeded(keyOf(row.asset.tagId))
  return months.map((month, i) => {
    const back = months.length - 1 - i
    if (!back) return { month, score: row.healthScore }
    /* Worse the further back, bounded so a strong asset never reads as failing */
    const drop = back * 2.5 + random() * 3
    return { month, score: Math.max(12, Math.min(100, Math.round(row.healthScore - drop))) }
  })
}

/**
 * One asset's dust reading over the six months, in millimetres, each month
 * carrying the level that reading falls in so the bars can be coloured by it.
 *
 * Dust builds until the panel is cleaned, so this runs the other way from the
 * score: heavier going back, and the current month is the reading on the
 * report. The thresholds are the register's own - see DUST_LIGHT / DUST_HEAVY.
 */
export function assetDustTrend(row: ReportRow, months = trendMonths()): DustMonth[] {
  const random = seeded(keyOf(row.asset.tagId) + 31)
  const levelAt = (dust: number): ContaminationLevel => {
    const [low, medium, high] = contaminationLevels
    return dust < 0.75 ? low : dust < 1.3 ? medium : high
  }

  return months.map((month, i) => {
    const back = months.length - 1 - i
    if (!back) return { month, dust: row.dustThickness, level: row.contamination }
    const dust = Math.round((row.dustThickness + back * 0.12 + random() * 0.1) * 100) / 100
    return { month, dust, level: levelAt(dust) }
  })
}

/**
 * One asset's maintenance over the six months, by type.
 *
 * A single asset has one or two jobs a year, not a bar every month, so most
 * months are empty and that is the honest picture - the chart is there to show
 * when the asset was last touched and with what, not to fill a canvas. The
 * month of the asset's own clean carries it; the rest are seeded stand-ins for
 * the history the mock does not hold.
 */
export function assetMaintenanceTrend(row: ReportRow, months = trendMonths()): MaintenanceMonth[] {
  const random = seeded(keyOf(row.asset.tagId) + 97)
  /* Which series the asset's own clean belongs to */
  const ownSeries = row.maintenance ? maintenanceTypes.indexOf(row.maintenance.type) : -1

  return months.map((month, i) => {
    const back = months.length - 1 - i
    const out = { month } as MaintenanceMonth
    maintenanceMix.forEach((series, n) => {
      if (!back) {
        out[series.key] = n === ownSeries ? 1 : 0
        return
      }
      /* Roughly one job every few months, landing on one series at a time */
      out[series.key] = random() < 0.12 ? 1 : 0
    })
    return out
  })
}

/* ---------- Activity totals ---------- */

/**
 * What the KPI cards count, over the same six months the charts cover - they
 * are the totals **of those charts**, summed series by series, so a card can
 * never disagree with the bars drawn beside it.
 */
export type ActivityTotals = {
  /** Every maintenance job, whatever its type */
  maintenance: number
  preventive: number
  firePreventive: number
  inspections: number
}

/**
 * How many inspections fall in the window for an asset on a given cycle.
 *
 * An asset inspected every three months has had two in six; one on a yearly
 * cycle has had the one. Never zero - a row only reaches this screen because it
 * has been inspected at least once.
 */
export const inspectionsInWindow = (frequency: number, months = TREND_MONTHS) =>
  Math.max(1, Math.round(months / frequency))

/** The whole estate's inspections over the window, asset by asset */
export const estateInspections = (rows: ReportRow[]) =>
  rows.reduce((n, row) => n + inspectionsInWindow(row.frequency), 0)

/** Sum a maintenance trend into its totals, and carry the inspection count beside it */
export function activityTotals(months: MaintenanceMonth[], inspections: number): ActivityTotals {
  const sum = (key: (typeof maintenanceMix)[number]["key"]) => months.reduce((n, m) => n + m[key], 0)
  const preventive = sum("preventive")
  const firePreventive = sum("firePreventive")

  return {
    maintenance: preventive + firePreventive,
    preventive,
    firePreventive,
    inspections,
  }
}

/* ---------- One asset's report history ---------- */

/**
 * Every report an asset has accumulated, not only its latest three.
 *
 * Built from the books rather than invented: the inspections and tasks that
 * actually sit at the asset's plant against its own category, which is the same
 * pool the current report was read off. That matters because each row links to
 * its activity - a fabricated id would either open nothing or, worse, open
 * somebody else's record, and the dates and the ELPREMAR on the row have to be
 * the ones that activity really carries.
 *
 * One inspection produces two reports, contamination and hygiene; one clean
 * produces one. Newest first, with the current reading marked - the figures
 * elsewhere on the screen belong to the entries flagged `latest`.
 *
 * The readings on older entries are a seeded walk back from today's, for the
 * same reason the trends are: the mock holds one set of figures per asset, not
 * a year of them. TODO(api): GET /assets/:id/reports replaces the walk.
 */
export type ReportHistoryEntry = {
  /** Stable key: the activity and which report off it */
  id: string
  kind: ReportKind
  source: "Inspection" | "Maintenance"
  activityId: string
  activityTo: string
  activityType: string
  by: string
  /** dd-MM-yyyy */
  on: string
  nextDue: string
  /** What that report said — whichever of these its kind carries */
  score?: number
  status?: Finding
  level?: ContaminationLevel
  hygieneOpen?: number
  /** The most recent of its kind, and so the one the rest of the screen shows */
  latest: boolean
}

/** dd-MM-yyyy → sortable number, newest largest */
const onDate = (dmy: string) => {
  const [d, m, y] = dmy.split("-")
  return Number(`${y}${m}${d}`)
}

/** dd-MM-yyyy, months on */
function monthsOn(dmy: string, months: number) {
  const [d, m, y] = dmy.split("-").map(Number)
  const date = new Date(y, m - 1 + months, d)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`
}

/** How many earlier activities of each kind the history reaches back over */
const HISTORY_INSPECTIONS = 4
const HISTORY_CLEANS = 3

/**
 * The completed work at this asset's plant, preferring its own category, that
 * happened **before** the activity the current figures came off. Anything later
 * is left out: it would contradict the reading the screen is showing.
 */
function earlierThan<T extends { id: string; plant: string; asset: string; status: string }>(
  book: T[],
  row: ReportRow,
  on: (item: T) => string,
  before: string,
  excludeId: string,
  take: number
) {
  const atPlant = book.filter((item) => item.plant === row.asset.plant && item.status === "completed")
  const pool = atPlant.filter((item) => item.asset.startsWith(row.asset.category))
  return (pool.length ? pool : atPlant)
    .filter((item) => item.id !== excludeId && onDate(on(item)) < onDate(before))
    .sort((a, b) => onDate(on(b)) - onDate(on(a)))
    .slice(0, take)
}

export function assetReportHistory(row: ReportRow): ReportHistoryEntry[] {
  const random = seeded(keyOf(row.asset.tagId) + 17)
  const entries: ReportHistoryEntry[] = []

  /* --- what the inspections said --- */
  const olderInspections = earlierThan(inspections, row, (i) => i.due, row.inspection.on, row.inspection.id, HISTORY_INSPECTIONS)
  const visits = [{ ...row.inspection, latest: true }, ...olderInspections.map((i) => ({ id: i.id, activity: i.activity, elpremar: i.elpremar, on: i.due, latest: false }))]

  visits.forEach((visit, back) => {
    /* Older visits read worse, which is what the maintenance since was for */
    const score = visit.latest ? row.healthScore : Math.max(12, Math.min(100, Math.round(row.healthScore - back * 4 - random() * 4)))
    const status: Finding = score >= 70 ? "Healthy" : score >= 50 ? "Alarming" : "At Risk"
    const dust = visit.latest ? row.dustThickness : row.dustThickness + back * 0.2 + random() * 0.15
    const level: ContaminationLevel = dust < 0.75 ? "Low" : dust < 1.3 ? "Medium" : "High"

    const shared = {
      source: "Inspection" as const,
      activityId: visit.id,
      activityTo: `/inspection-activities/${visit.id}`,
      activityType: visit.activity,
      by: visit.elpremar,
      on: visit.on,
      nextDue: monthsOn(visit.on, row.frequency),
      latest: visit.latest,
    }

    entries.push({ ...shared, id: `${visit.id}-contamination`, kind: "contamination", score, status, level })
    entries.push({
      ...shared,
      id: `${visit.id}-hygiene`,
      kind: "hygiene",
      hygieneOpen: visit.latest ? row.hygieneOpen : Math.min(row.hygiene.length, back + Math.floor(random() * 3)),
    })
  })

  /* --- and what the cleans produced --- */
  if (row.maintenance) {
    const olderCleans = earlierThan(tasks, row, (t) => t.scheduled, row.maintenance.on, row.maintenance.id, HISTORY_CLEANS)
    const cleans = [
      { ...row.maintenance, latest: true },
      ...olderCleans.map((t) => ({ id: t.id, type: t.type, elpremar: t.elpremar, on: t.scheduled, latest: false })),
    ]

    for (const clean of cleans) {
      entries.push({
        id: `${clean.id}-cleaning`,
        kind: "cleaning",
        source: "Maintenance",
        activityId: clean.id,
        activityTo: `/tasks/${clean.id}`,
        activityType: clean.type,
        by: clean.elpremar,
        on: clean.on,
        /* A clean is good for a quarter, whatever the inspection cycle is */
        nextDue: monthsOn(clean.on, 3),
        latest: clean.latest,
      })
    }
  }

  /* Newest first, and a stable tie-break so two reports off one visit keep their order */
  return entries.sort((a, b) => onDate(b.on) - onDate(a.on) || a.id.localeCompare(b.id))
}
