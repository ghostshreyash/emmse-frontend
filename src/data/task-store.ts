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

/** Next free id for a task raised in this session */
const nextId = () => `MT-${2300 + rows.filter((r) => r.id.startsWith("MT-23")).length}`

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
      type: "Preventive Maintenance",
      elpremar: source.elpremar,
      scheduled: source.scheduled,
      slot: source.slot,
      status: "assigned",
      inspectionId: source.inspectionId,
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
