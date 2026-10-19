import { useMemo } from "react"

import type { Booking } from "@/components/common/assign-elpremar-dialog"
import { enterpriseInfo } from "@/data/dashboard"
import { useInspectionRows } from "@/data/inspection-store"
import { useTaskRows } from "@/data/task-store"

/** Everything already on someone's books, inspections and maintenance alike */
export function useElpremarBookings(): Booking[] {
  const inspectionRows = useInspectionRows()
  const taskRows = useTaskRows()
  return useMemo(
    () =>
      ([
        ...taskRows.map((m) => ({ elpremar: m.elpremar, date: m.scheduled, label: m.asset, plant: m.plant, enterprise: enterpriseInfo.name, slot: m.slot })),
        ...inspectionRows.map((t) => ({ elpremar: t.elpremar, date: t.due, label: t.activity, plant: t.plant, enterprise: enterpriseInfo.name, slot: t.slot })),
      ] as (Omit<Booking, "elpremar" | "date"> & { elpremar?: string; date?: string })[]).filter(
        (b): b is Booking => !!b.elpremar && !!b.date
      ),
    [taskRows, inspectionRows]
  )
}
