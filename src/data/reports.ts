/**
 * Reports & Analytics: the three documents an asset's record produces, and the
 * work each one was read off.
 *
 * The flow this screen sits at the end of:
 *
 *   ELPREMAR inspects an asset in EVITA  ->  Inspections (an Inspection ID)
 *     -> the contamination and hygiene readings, which score the asset
 *   that inspection raises maintenance    ->  Tasks (a Task ID)
 *     -> the before-and-after of the clean
 *
 * So a report is never free-standing: every row here names the Inspection ID it
 * was read off and, once a clean has happened, the Task ID that produced the
 * cleaning report. That is the client's rule from the 03-10-2026 review -
 * "only that which gets inspected will get maintained", mapped on Inspection ID
 * + Asset ID - and it is why the Inspection and Task columns on this screen
 * link straight through to those screens.
 *
 * Three reports, settled with the client on 23-09-2026 (Olivine Digital
 * Platform, pages 6-7) and already built this way in EVITA:
 *
 * - **Contamination Report** scores the asset from dust thickness, dust type,
 *   hotspot temperature and the related observations. This is what produces the
 *   Health Score.
 * - **Hygiene Report** is independent of it, is point-specific and carries no
 *   score at all - a checklist over the Phase-1 physical parameters.
 * - **Cleaning Report** is the asset as found against the asset after cleaning,
 *   so it exists only once maintenance has actually run.
 *
 * Dates here come from the inspection and task rows the report cites, not from
 * the register's own `lastInspection` / `nextDue`, so that clicking an
 * Inspection ID shows the same date this screen just showed.
 *
 * Replace with GET /reports once the reporting service exists. The meeting also
 * settled that the report must be stored as structured data and not only as a
 * PDF, which is what these fields are: the PDF is the article, these are the
 * figures behind it.
 */
import { assetRegister, type AssetRecord } from "@/data/assets"
import { inspections, type InspectionRow } from "@/data/inspections"
import { seeded } from "@/data/operations"
import { tasks, type TaskRow } from "@/data/tasks"
import type { MaintenanceType } from "@/data/master-data"

/* ---------- Vocabulary ---------- */

/**
 * Contamination / Hygiene Status.
 *
 * The parameter sheet's own list for these two reads Good / Attention Required /
 * Poor Condition, but the client settled the health wording at the screen review
 * - Healthy / Alarming / At Risk - and EVITA's reports already say that. One
 * word across the three products beats the sheet's older wording on one screen.
 *
 * There is no "Not Inspected" value: a report only covers an asset that has
 * been inspected, so the case cannot arise here.
 */
export const findings = ["Healthy", "Alarming", "At Risk"] as const
export type Finding = (typeof findings)[number]

export const findingLook: Record<Finding, { badge: "healthy" | "attention" | "critical"; dot: string }> = {
  Healthy: { badge: "healthy", dot: "bg-healthy" },
  Alarming: { badge: "attention", dot: "bg-attention" },
  "At Risk": { badge: "critical", dot: "bg-critical" },
}

/**
 * How much dust the panel is carrying, as the contamination table reports it,
 * and the millimetres that separate the three. Chosen so the register fills all
 * three levels rather than piling into the middle one - the mock-data rule in
 * CLAUDE.md, and here it is also what keeps the Contamination Level Trend from
 * being a flat chart.
 */
export const DUST_LIGHT = 0.75
export const DUST_HEAVY = 1.3

export const contaminationLevels = ["Low", "Medium", "High"] as const
export type ContaminationLevel = (typeof contaminationLevels)[number]

export const contaminationTone: Record<ContaminationLevel, string> = {
  Low: "bg-healthy-soft text-healthy-soft-foreground",
  Medium: "bg-attention-soft text-attention-soft-foreground",
  High: "bg-critical-soft text-critical-soft-foreground",
}

/**
 * The Phase-1 physical parameters the Hygiene Report walks, verbatim from the
 * client's answer. Phase 2 adds the technical set - voltage, current, power
 * factor and the rest of the power-quality parameters.
 */
export const hygieneChecks = [
  "Hanging cables and wires",
  "Damaged cable ducts",
  "Improper cable joints",
  "Damaged thimbles / lugs",
  "Panel door and lock condition",
  "Cable gland condition",
  "Cable dressing and routing",
  "Panel housekeeping and safety",
] as const

/* ---------- Row ---------- */

/** The inspection a contamination and hygiene report were read off */
export type ReportInspection = {
  id: string
  /** Inspection Type: what the ELPREMAR was sent out to do */
  activity: string
  elpremar: string
  /** dd-MM-yyyy */
  on: string
}

/** The maintenance that produced the before-and-after of a clean */
export type ReportMaintenance = {
  id: string
  type: MaintenanceType
  elpremar: string
  on: string
}

/** One asset, as the three reports see it */
export type ReportRow = {
  asset: AssetRecord
  /* --- Contamination Report --- */
  contamination: ContaminationLevel
  contaminationStatus: Finding
  /** Out of 100; the Contamination Report is what produces it */
  healthScore: number
  /** Hotspot the thermal scan recorded, degC */
  hotspot: number
  /** Dust thickness on the busbar chamber, mm */
  dustThickness: number
  /* --- Hygiene Report --- */
  hygiene: { check: string; finding: Finding }[]
  /** The worst finding across the points, which is what the row reports */
  hygieneStatus: Finding
  /** How many points need something doing */
  hygieneOpen: number
  /* --- Where the reports came from --- */
  inspection: ReportInspection
  /** Inspection frequency in months, and the date that follows from it */
  frequency: number
  nextInspectionDue: string
  /** Absent until a clean has actually happened - no clean, no cleaning report */
  maintenance?: ReportMaintenance
  nextCleaningDue: string
}

/* ---------- Helpers ---------- */

/** dd-MM-yyyy, months on. Kept local so the module needs no date-fns at import time. */
function monthsOn(dmy: string, months: number) {
  const [d, m, y] = dmy.split("-").map(Number)
  const date = new Date(y, m - 1 + months, d)
  return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`
}

/**
 * The work an asset's report was read off.
 *
 * Only finished work produces a report, so this looks at completed rows only,
 * and prefers one raised against the asset's own category at its own plant -
 * the activity books name assets as "<category> - <unit>", so a Transformer at
 * Jamshedpur matches "Transformer - T1" there. Failing that it takes any
 * completed work at the plant, which keeps the Inspection ID on every row a
 * real one that opens.
 */
function completedAt<T extends { plant: string; asset: string; status: string }>(book: T[], asset: AssetRecord, nth: number) {
  const atPlant = book.filter((row) => row.plant === asset.plant && row.status === "completed")
  const pool = atPlant.filter((row) => row.asset.startsWith(asset.category))
  const from = pool.length ? pool : atPlant
  return from.length ? from[nth % from.length] : undefined
}

/* ---------- Report rows ---------- */

/**
 * Build the three reports for one asset. Seeded off the asset's own id, so the
 * table, the detail screen and the counts above them always agree, and nothing
 * moves between reloads.
 *
 * Statuses are taken by **position** where every bucket has to be populated -
 * the hygiene standing and whether a clean has happened yet. A hash divisor
 * across a list this size has emptied a bucket before, which shows up as a KPI
 * card stuck on zero.
 */
function reportFor(asset: AssetRecord, index: number): ReportRow | undefined {
  const { random } = seeded(7919 + index * 131)

  const inspected = completedAt(inspections, asset, index) as InspectionRow | undefined
  /* No finished inspection, no report: the asset is on the register, not here */
  if (!inspected) return undefined

  const score = asset.healthScore
  /* Not scored yet (onboarded and never inspected): nothing to report either */
  if (score === null) return undefined

  /*
   * Dust thickness is what the report measures; the level is read off it, and
   * the status is the band the score lands in. The two are close but not the
   * same reading - a panel can carry heavy dust and still score acceptably, or
   * sit under light dust with a hotspot that drags its score down - which is
   * why the level is taken from the millimetres rather than from the score.
   * Deriving both from the score made the contamination and health trends
   * identical curves, which told the reader nothing twice.
   */
  const dustThickness = Math.round((0.2 + (100 - score) * 0.02 + random() * 0.35) * 100) / 100
  const contamination: ContaminationLevel =
    dustThickness < DUST_LIGHT ? "Low" : dustThickness < DUST_HEAVY ? "Medium" : "High"

  /* The status is the score's own band: this is the report that produces it */
  const contaminationStatus: Finding = score >= 70 ? "Healthy" : score >= 50 ? "Alarming" : "At Risk"

  /*
   * Hygiene is independent of the score - a well-scoring panel can still have a
   * cable duct hanging off it - so the standing is dealt out by position and
   * the eight points are then generated to agree with it. Hashing each point on
   * its own put almost every asset at the worst of eight and emptied Healthy.
   */
  const hygieneSpread: Finding[] = ["Healthy", "Healthy", "Alarming", "Healthy", "At Risk", "Healthy", "Alarming", "Healthy", "Healthy", "Alarming"]
  const hygieneStatus = hygieneSpread[index % hygieneSpread.length]

  const first = index % hygieneChecks.length
  const second = (index + 3) % hygieneChecks.length
  const faults: Record<number, Finding> =
    hygieneStatus === "At Risk"
      ? { [first]: "At Risk", [second]: "Alarming" }
      : hygieneStatus === "Alarming"
        ? { [first]: "Alarming" }
        : {}

  const hygiene = hygieneChecks.map((check, i) => ({ check, finding: faults[i] ?? ("Healthy" as Finding) }))

  const frequency = [3, 6, 6, 12][index % 4]

  /*
   * Not every asset has been cleaned. An inspection raises the maintenance, and
   * on a live register a good few are still waiting on one - every fifth asset
   * here, by position, so the "no cleaning report yet" case is always on screen
   * rather than left to a divisor to produce.
   */
  const cleaned = index % 5 !== 4
  const maintained = cleaned ? (completedAt(tasks, asset, index) as TaskRow | undefined) : undefined

  return {
    asset,
    contamination,
    contaminationStatus,
    healthScore: score,
    /* Ambient sits around 32 degC at these plants; a worse score reads hotter */
    hotspot: Math.round((32 + (100 - score) * 0.45 + random() * 4) * 10) / 10,
    dustThickness,
    hygiene,
    hygieneStatus,
    hygieneOpen: hygiene.filter((p) => p.finding !== "Healthy").length,
    inspection: { id: inspected.id, activity: inspected.activity, elpremar: inspected.elpremar, on: inspected.due },
    frequency,
    nextInspectionDue: monthsOn(inspected.due, frequency),
    maintenance: maintained
      ? { id: maintained.id, type: maintained.type, elpremar: maintained.elpremar, on: maintained.scheduled }
      : undefined,
    nextCleaningDue: maintained ? monthsOn(maintained.scheduled, 3) : "",
  }
}

/* ---------- The register, as the reports read it ---------- */

/*
 * Generated last: this reads the register and both activity books above it.
 * Keep it at the end of the module and execute the module in node after merging
 * dev - the ordering is load-bearing, see occ-tables.ts in OCC for why.
 */

/**
 * Every asset that has a report, in Asset ID order - the default the client
 * asked for, and stable.
 *
 * An asset with no completed inspection against it is left out rather than
 * carried as a row of dashes: a health report has nothing to say about it yet.
 * It is still on the asset register.
 */
export const reportRows: ReportRow[] = assetRegister
  .map((asset, i) => reportFor(asset, i))
  .filter((row): row is ReportRow => Boolean(row))
  .sort((a, b) => a.asset.tagId.localeCompare(b.asset.tagId, undefined, { numeric: true }))

export const findReport = (tagId?: string) =>
  tagId ? reportRows.find((row) => row.asset.tagId.toLowerCase() === tagId.toLowerCase()) : undefined
