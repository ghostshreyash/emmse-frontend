/**
 * Mock data for Inspections — the enterprise's inspection activities, ported from
 * the OCC Inspection Activities screens and scoped to this enterprise's own plants.
 * Replace with GET /inspection-activities once the backend exists.
 */
import { assetRegister } from "@/data/assets"
import { plants } from "@/data/dashboard"
import { activityTypes, crew, day, daySlots, priorities, seeded, type Priority } from "@/data/operations"
import type { WorkStatus } from "@/lib/status"

/** An inspection only ever waits, runs or finishes — there is no separate assigned state */
export type InspectionStatus = Extract<WorkStatus, "pending" | "in_progress" | "completed">

export const inspectionStatusOrder: InspectionStatus[] = ["pending", "in_progress", "completed"]

export type InspectionRow = {
  id: string
  /** Owned and booked from the start, so these are never blank */
  elpremar: string
  plant: string
  asset: string
  /** The register asset inspected, so its history can be read back on the asset */
  assetTag: string
  /** An inspection activity — cleaning is maintenance work and belongs in Tasks */
  activity: string
  due: string
  /** Hour the booked interval starts */
  slot: number
  priority: Priority
  status: InspectionStatus
}

function generateInspections(count: number): InspectionRow[] {
  const { random, pick } = seeded(20250529)
  const taken = new Set<string>()
  const rows: InspectionRow[] = []

  for (let i = 0; i < count; i++) {
    // Walked in order, so every plant and engineer appears once the count covers them
    const plant = plants[i % plants.length].name
    // Walk each plant's register from the top, so the hand-written assets lead and
    // a handful of assets per plant build up a history of more than one inspection
    const onSite = assetRegister.filter((a) => a.plant === plant).slice(0, 8)
    const target = onSite[Math.floor(i / plants.length) % onSite.length]
    const elpremar = crew[(i * 5) % crew.length]
    const due = day(Math.floor(random() * 50) - 28)
    let slot = pick(daySlots)
    // Shift along the day rather than book the same person twice at once
    for (let n = 0; n < daySlots.length && taken.has(`${elpremar}|${due}|${slot}`); n++)
      slot = daySlots[(daySlots.indexOf(slot) + 1) % daySlots.length]
    taken.add(`${elpremar}|${due}|${slot}`)

    rows.push({
      id: `INS-${8841 - i}`,
      elpremar,
      plant,
      asset: target.name,
      assetTag: target.tagId,
      activity: pick(activityTypes),
      due,
      slot,
      priority: pick(priorities),
      status: pick(inspectionStatusOrder),
    })
  }
  return rows
}

/** The whole inspection queue, newest id first */
export const inspections: InspectionRow[] = generateInspections(60)
