import { useMemo, useState } from "react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { ChevronLeft, ChevronRight, HardHat, Mail, Phone } from "lucide-react"
import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SectionCard } from "@/components/common/section-card"
import { useInspectionRows } from "@/data/inspection-store"
import { slotLabel, type Elpremar } from "@/data/operations"
import { useTaskRows } from "@/data/task-store"
import { td, th } from "@/lib/data-table"
import { workStatus, type WorkStatus } from "@/lib/status"

/**
 * The rail that describes an ELPREMAR booked onto new work, shared by Add Inspection
 * and Add Maintenance Task. The bookings the assign dialog checks are in
 * data/elpremar-bookings.ts.
 */

/*
 * Mock availability: the days this ELPREMAR cannot take work (leave or otherwise
 * unavailable). Every other day in the month reads as available, so the calendar
 * answers one question — can they be booked that day or not.
 */
const unavailableDays = new Set([26, 31])

const availabilityStyle = {
  available: { dot: "bg-healthy", label: "Available" },
  unavailable: { dot: "bg-critical", label: "Not Available" },
}

/** `selected` is the day the activity is booked for, highlighted in the grid */
function AvailabilityCalendar({ selected }: { selected?: Date }) {
  // Opens on the booked month; the caller remounts on a new booking so this resets
  const [month, setMonth] = useState(() => startOfMonth(selected ?? new Date()))
  const today = new Date()

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) })

  return (
    <div>
      <div className="mb-2 flex items-center justify-between rounded-md bg-info-soft px-2 py-1">
        <Button variant="ghost" size="icon-sm" onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="Previous month"><ChevronLeft /></Button>
        <span className="text-sm font-semibold">{format(month, "MMMM yyyy")}</span>
        <Button variant="ghost" size="icon-sm" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Next month"><ChevronRight /></Button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1 font-medium text-muted-foreground">{d}</div>
        ))}
        {days.map((day) => {
          const inMonth = isSameMonth(day, month)
          const state = unavailableDays.has(day.getDate()) ? "unavailable" : "available"
          const isSelected = !!selected && isSameDay(day, selected)
          const isToday = isSameDay(day, today)
          return (
            <div key={day.toISOString()} className="flex flex-col items-center py-0.5">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-md",
                  !inMonth && "text-muted-foreground/50",
                  // The booked day is filled; today keeps a ring so both stay readable
                  isSelected && "bg-primary font-semibold text-primary-foreground",
                  isToday && !isSelected && "ring-1 ring-primary/50 font-semibold text-primary"
                )}
              >
                {format(day, "d")}
              </span>
              <span className={cn("mt-0.5 size-1.5 rounded-full", inMonth ? availabilityStyle[state].dot : "bg-transparent")} />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
        {Object.values(availabilityStyle).map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", s.dot)} /> {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * The rail beside a booking form once an ELPREMAR is assigned: who they are, their
 * availability with the booked day picked out, and what they already have today.
 */
export function ElpremarRail({ selected, bookedDay }: { selected: Elpremar; bookedDay?: Date }) {
  const inspectionRows = useInspectionRows()
  const taskRows = useTaskRows()

  // The chosen ELPREMAR's jobs today, in time order
  const todaysTasks = useMemo(() => {
    const today = format(new Date(), "dd-MM-yyyy")
    const jobs: { slot: number; asset: string; activity: string; status: WorkStatus }[] = [
      ...inspectionRows
        .filter((t) => t.elpremar === selected.name && t.due === today)
        .map((t) => ({ slot: t.slot, asset: `${t.asset} · ${t.plant}`, activity: t.activity, status: t.status })),
      ...taskRows
        .filter((m) => m.elpremar === selected.name && m.scheduled === today)
        .map((m) => ({ slot: m.slot, asset: `${m.asset} · ${m.plant}`, activity: m.type, status: m.status })),
    ]
    return jobs.sort((a, b) => a.slot - b.slot)
  }, [selected, inspectionRows, taskRows])

  return (
    <>
    <SectionCard title="Selected ELPREMAR Details" actions={<Button variant="link" size="xs">View Profile</Button>}>
      <div className="flex items-start gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-attention-soft text-attention"><HardHat className="size-7" /></div>
        <div className="min-w-0 flex-1 text-xs">
          <div className="text-sm font-semibold">{selected.name}</div>
          <div>{selected.id}</div>
          <div className="text-muted-foreground">{selected.department} Department</div>
          <div className="text-muted-foreground">{selected.plant}</div>
        </div>
        <div className="space-y-1.5 text-xs">
          <Badge variant={selected.available ? "healthy" : "critical"}>{selected.available ? "Available" : "Not Available"}</Badge>
          <div className="flex items-center gap-1.5"><Phone className="size-3.5 text-primary" /> {selected.phone}</div>
          <div className="flex items-center gap-1.5"><Mail className="size-3.5 text-primary" /> <span className="truncate">{selected.email}</span></div>
        </div>
      </div>
    </SectionCard>

    <SectionCard title="ELPREMAR Details">
      <AvailabilityCalendar key={bookedDay?.toISOString() ?? "none"} selected={bookedDay} />
    </SectionCard>

    <SectionCard title={`Today's Tasks (${format(new Date(), "d MMM yyyy")})`} viewAllTo="/inspection-activities" contentClassName="px-2">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead className={th}>#</TableHead><TableHead className={th}>Time</TableHead><TableHead className={th}>Location / Asset</TableHead><TableHead className={th}>Activity</TableHead><TableHead className={th}>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {todaysTasks.map((t, i) => (
            <TableRow key={`${t.slot}-${t.asset}`}>
              <TableCell className={td}>{i + 1}</TableCell>
              <TableCell className={cn(td, "tabular-nums")}>{slotLabel(t.slot).slice(0, 5)}</TableCell>
              <TableCell className={td}>{t.asset}</TableCell>
              <TableCell className={td}>{t.activity}</TableCell>
              <TableCell className={td}><Badge variant={workStatus[t.status].badge} className="rounded px-1.5 py-0 text-[0.65rem]">{workStatus[t.status].label}</Badge></TableCell>
            </TableRow>
          ))}
          {todaysTasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-4 text-center text-xs text-muted-foreground">Nothing booked for today.</TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </SectionCard>
    </>
  )
}
