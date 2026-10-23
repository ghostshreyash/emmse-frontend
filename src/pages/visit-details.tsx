import { useState } from "react"
import { Link, useParams } from "react-router"
import { format, parse } from "date-fns"
import { toast } from "sonner"
import { ArrowLeft, CalendarClock, Lock, Pencil } from "lucide-react"
import { cn } from "cn"

import { Detail } from "@/components/common/detail-view"
import { PageHeader } from "@/components/common/page-header"
import { SectionCard } from "@/components/common/section-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { elpremars, priorityTone, slotLabel } from "@/data/operations"
import { updateVisit, useVisitRows, visitFromForm, visitToForm } from "@/data/visit-store"
import { control } from "@/lib/data-table"
import { inspectionStatus, workStatus, type WorkStatus } from "@/lib/status"
import { ActivityIntake } from "@/pages/add-inspection"

// A visit reads its states the way an inspection does: Open, In Progress, Completed
const look = (s: WorkStatus) => inspectionStatus[s] ?? workStatus[s]

const list = (items: string[]) => (items.length ? items.join(", ") : "-")

/**
 * One scheduled visit. While it is Open (not started) it can be edited in the
 * same form it was scheduled with; once the ELPREMAR is on it, it is read-only.
 */
export function VisitDetailsPage() {
  const { id } = useParams()
  const visit = useVisitRows().find((r) => r.id === id)
  const [editing, setEditing] = useState(false)

  if (!visit) {
    return (
      <div className="space-y-4">
        <PageHeader title="Visit" breadcrumbs={[{ label: "Schedule a Visit", to: "/visits" }, { label: id ?? "Unknown" }]} />
        <SectionCard title="Not found" hoverable={false}>
          <p className="py-6 text-center text-xs text-muted-foreground">
            No visit with id <span className="font-medium text-foreground">{id}</span>.{" "}
            <Link to="/visits" className="text-primary hover:underline">Back to the list</Link>
          </p>
        </SectionCard>
      </div>
    )
  }

  const open = visit.status === "pending"
  const status = look(visit.status)
  const elpremar = elpremars.find((e) => e.name === visit.elpremar)

  if (editing && open) {
    return (
      <ActivityIntake
        title={`Edit ${visit.id}`}
        listLabel="Schedule a Visit"
        listPath="/visits"
        breadcrumbs={[{ label: "Schedule a Visit", to: "/visits" }, { label: visit.id, onClick: () => setEditing(false) }, { label: "Edit" }]}
        back={{ label: `Back to ${visit.id}`, onClick: () => setEditing(false) }}
        cardTitle="Schedule a Visit with an ELPREMAR"
        intro="This visit has not started yet, so where, what, when and who can all still change."
        submitLabel="Save Changes"
        untitled="Visit"
        initial={visitToForm(visit)}
        initialElpremar={elpremar}
        onCancel={() => setEditing(false)}
        onSubmit={(values, person) => {
          // TODO: PATCH /visits/:id
          if (updateVisit(visit.id, visitFromForm(values, person.name))) {
            toast.success(`${visit.id} updated`, {
              description: `${person.name} · ${format(parse(values.date, "yyyy-MM-dd", new Date()), "d MMM yyyy")}, ${values.time}`,
            })
          }
          setEditing(false)
          window.scrollTo({ top: 0 })
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={visit.id}
        breadcrumbs={[{ label: "Schedule a Visit", to: "/visits" }, { label: visit.id }]}
        actions={
          <>
            <Button variant="outline" size="sm" className={cn(control, "bg-card")} asChild>
              <Link to="/visits"><ArrowLeft className="size-3.5" /> Back to Schedule a Visit</Link>
            </Button>
            {/* Only a visit that has not started can still change */}
            {open ? (
              <Button size="sm" className={control} onClick={() => setEditing(true)}>
                <Pencil className="size-3.5" /> Edit Visit
              </Button>
            ) : null}
          </>
        }
      />

      <SectionCard title="Visit Details" icon={<CalendarClock className="size-4 text-primary" />} hoverable={false}>
        {open ? null : (
          <p className="mb-3 flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" /> This visit is {status.label.toLowerCase()}, so its details can no longer be edited.
          </p>
        )}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <Detail label="Visit ID"><span className="font-medium tabular-nums">{visit.id}</span></Detail>
          <Detail label="Status">
            <Badge variant={status.badge} className="rounded px-1.5 py-0 text-[0.65rem]">{status.label}</Badge>
          </Detail>
          <Detail label="Priority">
            <span className={cn("rounded px-1.5 py-0.5 text-[0.65rem] font-semibold", priorityTone[visit.priority])}>{visit.priority}</span>
          </Detail>
          <Detail label="Plant">{visit.plant}</Detail>
          <Detail label="Location / Area">{visit.area}</Detail>
          <Detail label="No. of Assets">{visit.assetCount || "-"}</Detail>
          <Detail label="Asset Category" className="col-span-2 sm:col-span-3">{list(visit.categories)}</Detail>
          <Detail label="Activity Type" className="col-span-2 sm:col-span-3">{list(visit.activities)}</Detail>
          <Detail label="Assigned ELPREMAR">
            <span className="font-medium">{visit.elpremar}</span>
            {elpremar ? <span className="block text-[0.65rem] text-muted-foreground">{elpremar.id} · {elpremar.department} Dept.</span> : null}
          </Detail>
          <Detail label="Scheduled Date & Time">
            <span className="tabular-nums">{visit.date}</span>
            <span className="block text-[0.65rem] tabular-nums text-muted-foreground">{slotLabel(visit.slot)}</span>
          </Detail>
          <Detail label="Estimated Duration">{visit.duration || "-"}</Detail>
          <Detail label="Task Description" className="col-span-2 sm:col-span-3">
            <span className="text-muted-foreground">{visit.description}</span>
          </Detail>
        </div>
      </SectionCard>
    </div>
  )
}
