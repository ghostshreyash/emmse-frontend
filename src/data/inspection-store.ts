import { useSyncExternalStore } from "react"

import { inspectionDetail, type InspectionDetail } from "@/data/inspection-detail"
import { inspections, type InspectionRow } from "@/data/inspections"

/**
 * One copy of the inspection queue plus the test record behind each row, shared
 * by the list and the details screen. Stands in for the query cache until these
 * rows come from the API.
 */
let rows: InspectionRow[] = inspections
let details: Record<string, InspectionDetail> = Object.fromEntries(rows.map((r) => [r.id, inspectionDetail(r)]))

const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

export const useInspectionRows = () => useSyncExternalStore(subscribe, () => rows)

export const useInspectionDetails = () => useSyncExternalStore(subscribe, () => details)

export const findInspection = (id?: string) => (id ? rows.find((r) => r.id === id) : undefined)

/** Delete an inspection that has not started; anything further along is kept */
export function deleteInspection(id: string) {
  const row = rows.find((r) => r.id === id)
  if (!row || row.status !== "pending") return false
  rows = rows.filter((r) => r.id !== id)
  const rest = { ...details }
  delete rest[id]
  details = rest
  listeners.forEach((listener) => listener())
  return true
}

export function updateInspection(id: string, patch: Partial<InspectionRow>) {
  rows = rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
  // A reassignment changes who the record says performed the work, until it is re-executed
  if (patch.elpremar && details[id]?.execution)
    details = { ...details, [id]: { ...details[id], execution: { ...details[id].execution!, performedBy: patch.elpremar } } }
  listeners.forEach((listener) => listener())
}
