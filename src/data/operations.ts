/**
 * What Tasks and Inspections share: the working day, the ELPREMARs who carry the
 * work out, and the pools both books are generated from. Ported from OCC's
 * occ-tables / mock data and scoped to this enterprise's own plants. Replace with
 * the API once the backend exists.
 */
import { addDays, format } from "date-fns"

import { enterpriseInfo, plants } from "@/data/dashboard"
import { inspectionTypes, type AssetCriticality } from "@/data/master-data"

/** dd-MM-yyyy, offset from today, so the books always sit around the current date */
export const day = (offset: number) => format(addDays(new Date(), offset), "dd-MM-yyyy")

/** The same seeded generator every mock here uses, so rows stay put between renders */
export function seeded(seed: number) {
  let s = seed
  const random = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
  const pick = <T,>(pool: readonly T[]) => pool[Math.floor(random() * pool.length)]
  return { random, pick }
}

/* ---------- Working day ---------- */

/** Hour-long intervals a job can be booked into (09:00 - 18:00) */
export const daySlots = [9, 10, 11, 12, 13, 14, 15, 16, 17]

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`

/** 14 -> "14:00 - 15:00" */
export const slotLabel = (hour: number) => `${hh(hour)} - ${hh(hour + 1)}`

/** Slot for a job with no recorded time, hashed from its own key so it stays stable */
export function slotFor(key: string) {
  const n = [...key].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  return daySlots[n % daySlots.length]
}

/* ---------- Pools ---------- */

export const priorities = ["Low", "Medium", "High", "Critical"] as const
export type Priority = (typeof priorities)[number]

/**
 * How badly a failure on the asset would hurt. The list itself is the parameter
 * sheet's Asset Criticality, held in master-data beside the other sheet
 * vocabularies; it is re-exported here because this is where the screens that
 * use it already reach for their pools.
 */
export { assetCriticality, type AssetCriticality } from "@/data/master-data"

export const areas = ["Main Substation (11kV)", "LT Panels - Block A", "DG Set Area", "Production Floor", "Utility Area", "Cable Trench"]
export const assetCategories = ["LT Panel", "HT Panel", "APFC Panel", "MCC", "PCC", "PDB", "Switchboard", "Transformer", "UPS", "Distribution Board", "Control Panel", "Fire Alarm Panel"]
export const units = ["Block A", "Block B", "Unit 1", "Unit 2", "Unit 3", "Main", "Incomer 1", "Incomer 2", "T1", "T2", "SB1", "SB2"]

/**
 * The inspection work an ELPREMAR can be sent out on — also what the Activity
 * column shows. The list itself is the parameter sheet's Inspection Type, held
 * in master-data with the maintenance types beside it.
 */
export const activityTypes: readonly string[] = inspectionTypes
export const durations = ["1 Hour", "2 Hours", "4 Hours", "6 Hours", "8 Hours"]

/** A random dd-MM-yyyy commissioning date between 2010 and 2023 */
export function commissionDate(random: () => number) {
  const d = 1 + Math.floor(random() * 28)
  const m = 1 + Math.floor(random() * 12)
  const y = 2010 + Math.floor(random() * 14)
  return `${String(d).padStart(2, "0")}-${String(m).padStart(2, "0")}-${y}`
}

/* ---------- Tones ---------- */

/** Priority pill colours, matching the health/alert token families */
export const priorityTone: Record<Priority, string> = {
  Low: "bg-neutral-soft text-neutral-soft-foreground",
  Medium: "bg-info-soft text-info-soft-foreground",
  High: "bg-attention-soft text-attention-soft-foreground",
  Critical: "bg-critical-soft text-critical-soft-foreground",
}

/**
 * Asset criticality pills. Three levels, so High takes the critical red; Low stays
 * neutral rather than green, since a low-criticality asset is not a healthy one.
 */
export const criticalityTone: Record<AssetCriticality, string> = {
  Low: "bg-neutral-soft text-neutral-soft-foreground",
  Medium: "bg-attention-soft text-attention-soft-foreground",
  High: "bg-critical-soft text-critical-soft-foreground",
}

/* ---------- ELPREMARs ---------- */

/** An OLIVINE field engineer who carries out inspections and maintenance on site */
export type Elpremar = {
  id: string
  name: string
  department: string
  plant: string
  enterprise: string
  phone: string
  email: string
  available: boolean
  skills: string[]
}

const enterprise = enterpriseInfo.name
const plantName = (id: string) => plants.find((p) => p.id === id)!.name

export const elpremars: Elpremar[] = [
  { id: "EMP-EL-0047", name: "Suresh Kumar", department: "Electrical", plant: plantName("JSR"), enterprise, phone: "+91 98765 43210", email: "suresh.kumar@olivineglobal.com", available: true, skills: ["HT Panels & Switchgear", "Thermography", "Routine Inspections"] },
  { id: "EMP-EL-0052", name: "Amit Sharma", department: "Electrical", plant: plantName("KLN"), enterprise, phone: "+91 98111 22334", email: "amit.sharma@olivineglobal.com", available: true, skills: ["Transformers", "Condition Monitoring", "Cable Testing"] },
  { id: "EMP-EL-0061", name: "Ramesh Patil", department: "Maintenance", plant: plantName("MER"), enterprise, phone: "+91 99200 44556", email: "ramesh.patil@olivineglobal.com", available: false, skills: ["Breaker Maintenance", "INSTA CLEAN Application", "Routine Inspections"] },
  { id: "EMP-EL-0073", name: "Anil Singh", department: "Electrical", plant: plantName("KHP"), enterprise, phone: "+91 97654 11223", email: "anil.singh@olivineglobal.com", available: true, skills: ["Protection & Relay Testing", "HT Panels & Switchgear", "Earthing & Lightning Protection"] },
  { id: "EMP-EL-0081", name: "Priya Nair", department: "Electrical", plant: plantName("SBD"), enterprise, phone: "+91 98480 55667", email: "priya.nair@olivineglobal.com", available: true, skills: ["Thermography", "Condition Monitoring", "Transformers"] },
  { id: "EMP-EL-0094", name: "Kavita Rao", department: "Maintenance", plant: plantName("JSR"), enterprise, phone: "+91 98220 33445", email: "kavita.rao@olivineglobal.com", available: true, skills: ["HT Panels & Switchgear", "Breaker Maintenance", "Cable Testing"] },
]

/** Who work is assigned to: available engineers and those on leave alike */
export const crew = elpremars.map((e) => e.name)

/* ---------- ELPREMAR schedules ---------- */

export type ScheduleEntry = {
  date: Date
  kind: "job" | "leave"
  label: string
  /** Hour the job starts; leave covers the whole day and has no slot */
  slot?: number
}

/**
 * Mock schedule for one ELPREMAR: a deterministic spread of jobs and leave
 * over the current and next two months (seeded by ELPREMAR id, so it is
 * stable between renders). Unavailable ELPREMARs start on leave today.
 * Replace with GET /elpremars/:id/schedule later.
 */
export function mockElpremarSchedule(elpremarId: string, available: boolean): ScheduleEntry[] {
  let seed = [...elpremarId].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) >>> 0
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
  const jobs = [...activityTypes]
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const entries: ScheduleEntry[] = []

  for (let i = 0; i < 92; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const r = random()
    if (date.getDay() === 0) continue // Sundays off
    if (r < 0.06) {
      entries.push({ date, kind: "leave", label: "On leave" })
    } else if (r < 0.42) {
      const count = r < 0.16 ? 2 : 1
      const taken = new Set<number>()
      for (let j = 0; j < count; j++) {
        // Two jobs on one day must not land in the same interval
        let k = Math.floor(random() * daySlots.length)
        while (taken.has(daySlots[k])) k = (k + 1) % daySlots.length
        taken.add(daySlots[k])
        entries.push({ date, kind: "job", label: jobs[Math.floor(random() * jobs.length)], slot: daySlots[k] })
      }
    }
  }

  if (!available) {
    for (let i = 0; i < 5; i++) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
      entries.push({ date, kind: "leave", label: "On leave" })
    }
  }
  return entries
}
