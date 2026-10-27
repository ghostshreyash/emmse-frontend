import { useSyncExternalStore } from "react"

import { taskDetail, type TaskDetail } from "@/data/task-detail"
import { tasks, type TaskRow } from "@/data/tasks"

/**
 * One copy of the task book plus the execution record behind each row, shared by
 * the list and the details screen, so a task raised from an inspection shows up
 * in both. Stands in for the query cache until these rows come from the API.
 */
let rows: TaskRow[] = tasks
let details: Record<string, TaskDetail> = Object.fromEntries(rows.map((r) => [r.id, taskDetail(r)]))

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

export const useTaskRows = () => useSyncExternalStore(subscribe, () => rows)

export const useTaskDetails = () => useSyncExternalStore(subscribe, () => details)

export const findTask = (id?: string) => (id ? rows.find((r) => r.id === id) : undefined)

/** Delete a task that has not started; anything further along is kept on the book */
export function deleteTask(id: string) {
  const task = rows.find((r) => r.id === id)
  if (!task || task.status !== "open") return false
  rows = rows.filter((r) => r.id !== id)
  const rest = { ...details }
  delete rest[id]
  details = rest
  emit()
  return true
}

/**
 * Change an Open task's booking and details. Work already under way is not
 * edited here - what was assigned is then part of what was done.
 */
export function updateTask(id: string, row: Partial<Omit<TaskRow, "id">>, detail: Partial<TaskDetail> = {}) {
  const task = rows.find((r) => r.id === id)
  if (!task || task.status !== "open") return false
  rows = rows.map((r) => (r.id === id ? { ...r, ...row } : r))
  details = { ...details, [id]: { ...details[id], ...detail } }
  emit()
  return true
}

/** Next free id for a task raised in this session */
// One past the highest raised so far, so a deleted task's number is never handed out again
const nextId = () => `MT-${Math.max(2299, ...rows.map((r) => Number(r.id.slice(3)) || 0)) + 1}`

/**
 * Add a task to the book, with whatever of its execution record is already known
 * laid over the generated one. Returns the new id so the caller can open it.
 */
export function addTask(row: Omit<TaskRow, "id">, detail: Partial<TaskDetail>) {
  const id = nextId()
  const full: TaskRow = { id, ...row }
  rows = [full, ...rows]
  details = { ...details, [id]: { ...taskDetail(full), ...detail } }
  emit()
  return id
}

/**
 * Raise a maintenance task off the back of an inspection, carrying the plant and
 * asset across so nobody re-keys them.
 */
export function addTaskFromInspection(source: {
  inspectionId: string
  /** The register asset the inspection looked at */
  assetTag: string
  activity: string
  plant: string
  asset: string
  elpremar: string
  scheduled: string
  slot: number
  recommendation: string
  /** Who raised it: the signed-in user */
  createdBy: string
}) {
  return addTask(
    {
      asset: source.asset,
      plant: source.plant,
      // A fire prevention inspection raises fire preventive work; anything else, preventive
      type: /fire/i.test(source.activity) ? "Fire Preventive Maintenance" : "Preventive Maintenance",
      elpremar: source.elpremar,
      scheduled: source.scheduled,
      slot: source.slot,
      status: "assigned",
      inspectionId: source.inspectionId,
      assetTag: source.assetTag,
    },
    {
      description: `Raised from inspection ${source.inspectionId} (${source.activity}). ${source.recommendation}`,
      createdBy: source.createdBy,
      execution: undefined,
      products: [],
      evidence: [],
      review: undefined,
    }
  )
}
