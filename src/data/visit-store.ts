/**
 * Scheduled visits: an ELPREMAR booked to a plant's area to inspect one or more categories of
 * assets, raised from Schedule a Visit with the same form as Add Inspection.
 * Mock only - replace with GET/POST /visits once the backend exists.
 */
import { useSyncExternalStore } from "react"
import { format, parse } from "date-fns"

import { plants } from "@/data/dashboard"
import { activityTypes, areas, assetCategories, crew, day, daySlots, durations, priorities, seeded, type Priority } from "@/data/operations"
import type { WorkStatus } from "@/lib/status"
import type { AssignValues } from "@/pages/add-inspection"

/** A visit waits (Open), runs or is done - the same states as an inspection */
export type VisitStatus = Extract<WorkStatus, "pending" | "in_progress" | "completed">
export const visitStatusOrder: VisitStatus[] = ["pending", "in_progress", "completed"]

export type VisitRow = {
  id: string
  plant: string
  area: string
  /** The asset categories the visit covers */
  categories: string[]
  /** Blank when the assets were not counted at booking */
  assetCount: string
  /** Inspection types to carry out on the visit; may be empty when not yet known */
  activities: string[]
  /** dd-MM-yyyy, as every other register carries dates */
  date: string
  /** Hour the booked interval starts */
  slot: number
  duration: string
  elpremar: string
  priority: Priority
  description: string
  status: VisitStatus
}

function generateVisits(count: number): VisitRow[] {
  const { random, pick } = seeded(20261023)
  return Array.from({ length: count }, (_, i): VisitRow => {
    const offset = Math.floor(random() * 40) - 14
    return {
      id: `VST-${1024 - i}`,
      plant: plants[i % plants.length].name,
      area: pick(areas),
      // Most visits cover one category, some take in a second
      categories: [...new Set([pick(assetCategories), ...(random() < 0.35 ? [pick(assetCategories)] : [])])],
      assetCount: String(1 + Math.floor(random() * 12)),
      activities: [pick(activityTypes)],
      date: day(offset),
      slot: pick(daySlots),
      duration: pick(durations),
      elpremar: crew[i % crew.length],
      priority: pick(priorities),
      description: "Site visit to inspect the assets in this area and record their condition.",
      // Past visits have happened; future ones are still open
      status: offset < 0 ? (random() < 0.7 ? "completed" : "in_progress") : "pending",
    }
  })
}

let rows: VisitRow[] = generateVisits(18)

const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}
const emit = () => listeners.forEach((listener) => listener())

export const useVisitRows = () => useSyncExternalStore(subscribe, () => rows)

/** What the visit form hands over: its date as yyyy-MM-dd and its start time as HH:mm */
export type NewVisit = Omit<VisitRow, "id" | "date" | "slot" | "status"> & { date: string; time: string }

/** What the visit form captured, as a visit booked to that ELPREMAR */
export const visitFromForm = (values: AssignValues, elpremar: string): NewVisit => ({
  plant: values.plant,
  area: values.area,
  categories: values.categories ?? [],
  assetCount: values.assetCount ?? "",
  activities: values.activity ?? [],
  date: values.date,
  time: values.time,
  duration: values.duration ?? "",
  elpremar,
  priority: values.priority as Priority,
  description: values.description,
})

/** A visit as the form holds it, so an Open one can be reopened in that same form */
export const visitToForm = (v: VisitRow): Partial<AssignValues> => ({
  plant: v.plant,
  area: v.area,
  categories: v.categories,
  assetCount: v.assetCount,
  activity: v.activities,
  date: format(parse(v.date, "dd-MM-yyyy", new Date()), "yyyy-MM-dd"),
  time: `${String(v.slot).padStart(2, "0")}:00`,
  duration: v.duration,
  priority: v.priority,
  description: v.description,
})

export function addVisit(visit: NewVisit) {
  const next = Math.max(1000, ...rows.map((r) => Number(r.id.slice(4)))) + 1
  const { time, ...rest } = visit
  const row: VisitRow = {
    ...rest,
    id: `VST-${next}`,
    date: format(parse(visit.date, "yyyy-MM-dd", new Date()), "dd-MM-yyyy"),
    slot: Number(time.slice(0, 2)),
    status: "pending",
  }
  rows = [row, ...rows]
  emit()
  return row
}

export const findVisit = (id?: string) => (id ? rows.find((r) => r.id === id) : undefined)

/** Saves an edit to an Open visit; one that has started keeps what it was booked with */
export function updateVisit(id: string, visit: NewVisit) {
  const row = rows.find((r) => r.id === id)
  if (!row || row.status !== "pending") return false
  const { time, ...rest } = visit
  rows = rows.map((r) =>
    r.id !== id
      ? r
      : { ...r, ...rest, date: format(parse(visit.date, "yyyy-MM-dd", new Date()), "dd-MM-yyyy"), slot: Number(time.slice(0, 2)) }
  )
  emit()
  return true
}

/** Delete a visit that has not started; anything further along is kept */
export function deleteVisit(id: string) {
  const row = rows.find((r) => r.id === id)
  if (!row || row.status !== "pending") return false
  rows = rows.filter((r) => r.id !== id)
  emit()
  return true
}
