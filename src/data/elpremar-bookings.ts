import { useMemo } from "react"

import type { Booking } from "@/components/common/assign-elpremar-dialog"
import { enterpriseInfo } from "@/data/dashboard"
import { useInspectionRows } from "@/data/inspection-store"
import { useTaskRows } from "@/data/task-store"
import { useVisitRows } from "@/data/visit-store"

/** Everything already on someone's books: inspections, maintenance and scheduled visits alike */
export function useElpremarBookings(): Booking[] {
  const inspectionRows = useInspectionRows()
  const taskRows = useTaskRows()
  const visitRows = useVisitRows()
  return useMemo(
    () =>
      ([
        ...taskRows.map((m) => ({ elpremar: m.elpremar, date: m.scheduled, label: m.asset, plant: m.plant, enterprise: enterpriseInfo.name, slot: m.slot })),
        ...inspectionRows.map((t) => ({ elpremar: t.elpremar, date: t.due, label: t.activity, plant: t.plant, enterprise: enterpriseInfo.name, slot: t.slot })),
        ...visitRows.map((v) => ({ elpremar: v.elpremar, date: v.date, label: `Visit · ${v.area}`, plant: v.plant, enterprise: enterpriseInfo.name, slot: v.slot })),
      ] as (Omit<Booking, "elpremar" | "date"> & { elpremar?: string; date?: string })[]).filter(
        (b): b is Booking => !!b.elpremar && !!b.date
      ),
    [taskRows, inspectionRows, visitRows]
  )
}
