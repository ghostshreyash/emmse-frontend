/**
 * Mock data for Tasks — the enterprise's maintenance activities, ported from the
 * OCC Maintenance Activities screens and scoped to this enterprise's own plants
 * (EMMS-E never shows another enterprise's work). Replace with
 * GET /maintenance-activities once the backend exists.
 */
import { plants } from "@/data/dashboard"
import { inspections, type InspectionRow } from "@/data/inspections"
import { maintenanceTypes, type MaintenanceType } from "@/data/master-data"
import { assetCategories, crew, day, daySlots, seeded, units } from "@/data/operations"
import type { WorkStatus } from "@/lib/status"

/**
 * The maintenance programmes a task can belong to, in the parameter sheet's own
 * wording — see `maintenanceTypes`, which is the one place the list is kept and
 * the one place to change it.
 */
export const taskTypes = maintenanceTypes
export type TaskType = MaintenanceType

/** The mock book is raised already signed off, so none of it waits in "open" */
const workStates: WorkStatus[] = ["assigned", "in_progress", "completed"]

/**
 * Status filter options, in the order a task moves through them. "open" reads as
 * Pending For Approval: where a task added from the Add Task screen starts.
 */
export const taskStatuses: WorkStatus[] = ["open", ...workStates]

export type TaskRow = {
  id: string
  asset: string
  plant: string
  type: TaskType
  /** Planned work is always owned and booked, so these are never blank */
  elpremar: string
  scheduled: string
  /** Hour the booked interval starts */
  slot: number
  status: WorkStatus
  /** The inspection this work traces back to; absent on a task added directly */
  inspectionId?: string
}

/**
 * Trace every task back to an inspection at the same plant, spread across that
 * plant's inspections rather than all pointing at the first one.
 */
function inspectionAt(plant: string, n: number) {
  const pool: InspectionRow[] = inspections.filter((t) => t.plant === plant)
  return (pool.length ? pool : inspections)[n % (pool.length || inspections.length)].id
}

function generateTasks(count: number): TaskRow[] {
  const { random, pick } = seeded(20250528)
  const taken = new Set<string>()
  const rows: TaskRow[] = []

  for (let i = 0; i < count; i++) {
    // Walked in order, so every plant and engineer appears once the count covers them
    const plant = plants[i % plants.length].name
    const elpremar = crew[i % crew.length]
    const scheduled = day(Math.floor(random() * 50) - 28)
    let slot = pick(daySlots)
    // Shift along the day rather than book the same person twice at once
    for (let n = 0; n < daySlots.length && taken.has(`${elpremar}|${scheduled}|${slot}`); n++)
      slot = daySlots[(daySlots.indexOf(slot) + 1) % daySlots.length]
    taken.add(`${elpremar}|${scheduled}|${slot}`)

    rows.push({
      id: `MT-${2291 - i}`,
      asset: `${pick(assetCategories)} - ${pick(units)}`,
      plant,
      type: pick(taskTypes),
      elpremar,
      scheduled,
      slot,
      status: pick(workStates),
      inspectionId: inspectionAt(plant, Math.floor(i / plants.length)),
    })
  }
  return rows
}

/** Everything on the books, newest id first */
export const tasks: TaskRow[] = generateTasks(48)
