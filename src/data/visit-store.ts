/**
 * Scheduled visits: an ELPREMAR booked to a plant's area to inspect a category of
 * assets, raised from Schedule a Visit with the same form as Add Inspection.
 * Mock only - replace with GET/POST /visits once the backend exists.
 */
import { useSyncExternalStore } from "react"
import { format, parse } from "date-fns"

import { assetRegister } from "@/data/assets"
import { plants } from "@/data/dashboard"
import { activityTypes, areas, crew, day, daySlots, durations, priorities, seeded, type Priority } from "@/data/operations"
import type { WorkStatus } from "@/lib/status"

/** A visit waits (Open), runs or is done - the same states as an inspection */
export type VisitStatus = Extract<WorkStatus, "pending" | "in_progress" | "completed">
export const visitStatusOrder: VisitStatus[] = ["pending", "in_progress", "completed"]

export type VisitRow = {
  id: string
  plant: string
  area: string
  /** The register asset the visit is for, and what it is */
  assetTag: string
  asset: string
  category: string
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
    const plant = plants[i % plants.length].name
    // Walk each plant's register from the top, so the visits land on real assets
    const onSite = assetRegister.filter((a) => a.plant === plant)
    const target = onSite[Math.floor(i / plants.length) % onSite.length]
    return {
      id: `VST-${1024 - i}`,
      plant,
      area: pick(areas),
      assetTag: target.tagId,
      asset: target.name,
      category: target.category,
      activities: [...activityTypes],
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

/** Delete a visit that has not started; anything further along is kept */
export function deleteVisit(id: string) {
  const row = rows.find((r) => r.id === id)
  if (!row || row.status !== "pending") return false
  rows = rows.filter((r) => r.id !== id)
  emit()
  return true
}
