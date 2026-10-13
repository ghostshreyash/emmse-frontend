import { Link, useNavigate, useParams } from "react-router"
import {
  ArrowLeft,
  CheckCheck,
  Flame,
  Image as ImageIcon,
  MapPin,
  Package,
  ShieldCheck,
  Wrench,
  Zap,
} from "lucide-react"
import { cn } from "cn"

import { PageHeader } from "@/components/common/page-header"
import { SectionCard } from "@/components/common/section-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Detail, EvidenceGallery, Timeline } from "@/components/common/detail-view"
import { taskTimeline, type Execution } from "@/data/task-detail"
import { criticalityTone, priorityTone, slotLabel } from "@/data/operations"
import { findTask, useTaskDetails } from "@/data/task-store"
import { control } from "@/lib/data-table"
import { maintenanceStatus, workStatus, type WorkStatus } from "@/lib/status"

const look = (s: WorkStatus) => maintenanceStatus[s] ?? workStatus[s]

/** Plain-English standing, so each status reads for what it actually is */
function narrative(status: WorkStatus, elpremar: string, plant: string, execution?: Execution) {
  switch (status) {
    case "in_progress":
      return `In progress by ${execution?.performedBy ?? elpremar} at ${plant}${execution ? `, started ${execution.startedAt}` : ""}. It closes out once the completed work is submitted.`
    case "open":
      return `Raised and on the books for ${elpremar}${execution?.endedAt ? `, submitted on ${execution.endedAt}` : ""}.`
    case "rejected":
      return `Sent back to ${elpremar} for correction. It returns for review once the evidence is re-submitted.`
    case "completed":
      return `Completed by ${execution?.performedBy ?? elpremar}${execution?.endedAt ? ` on ${execution.endedAt}` : ""} and closed out. The asset health report has been updated.`
    default:
      return `Approved and on the books for ${elpremar}. The asset health report has been updated.`
  }
}

/**
 * Task Details, ported from the OCC Maintenance Activity Details screen. EMMS-E
 * only views a booking: OCC schedules and reassigns its ELPREMARs, so the OCC
 * reassign dialog is left out here.
 */
export function TaskDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const details = useTaskDetails()
  const activity = findTask(id)
  const detail = id ? details[id] : undefined

  if (!activity || !detail) {
    return (
      <div>
        <PageHeader title="Task" breadcrumbs={[{ label: "Tasks", to: "/tasks" }, { label: id ?? "Unknown" }]} />
        <SectionCard title="Not found" hoverable={false}>
          <p className="py-6 text-center text-xs text-muted-foreground">
            No task with id <span className="font-medium text-foreground">{id}</span>.{" "}
            <Link to="/tasks" className="text-primary hover:underline">Back to the list</Link>
          </p>
        </SectionCard>
      </div>
    )
  }

  const status = look(activity.status)
  const { execution } = detail
  const timeline = taskTimeline(activity, detail)

  return (
    <div>
      <PageHeader
        title={activity.asset}
        breadcrumbs={[{ label: "Tasks", to: "/tasks" }, { label: activity.id }]}
        actions={
          <Button variant="outline" size="sm" className={control} onClick={() => navigate("/tasks")}>
            <ArrowLeft className="size-3.5" /> Back to list
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {/* ---------- What was assigned ---------- */}
          <SectionCard title="Activity" icon={<Wrench className="size-4 text-primary" />} hoverable={false}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Detail label="Task ID"><span className="font-medium tabular-nums">{activity.id}</span></Detail>
              <Detail label="Maintenance Type">{activity.type}</Detail>
              <Detail label="Status">
                <Badge variant={status.badge} className="rounded px-1.5 py-0 text-[0.65rem]">{status.label}</Badge>
              </Detail>
              <Detail label="Plant">{activity.plant}</Detail>
              <Detail label="Asset"><span className="font-medium">{activity.asset}</span></Detail>
              <Detail label="Assigned ELPREMAR">{activity.elpremar}</Detail>
              <Detail label="Scheduled Date / Time">
                <span className="tabular-nums">{activity.scheduled}</span>
                <span className="block text-[0.65rem] tabular-nums text-muted-foreground">{slotLabel(activity.slot)}</span>
              </Detail>
              <Detail label="Priority">
                <span className={cn("rounded px-1.5 py-0.5 text-[0.65rem] font-semibold", priorityTone[detail.priority])}>{detail.priority}</span>
              </Detail>
              <Detail label="Assigned / Created By">{detail.createdBy}</Detail>
              <Detail label="Task Description" className="col-span-2 sm:col-span-3">
                <span className="text-muted-foreground">{detail.description}</span>
              </Detail>
            </div>
          </SectionCard>

          {/* ---------- What the ELPREMAR executed ---------- */}
          <SectionCard title="Maintenance Execution" icon={<Zap className="size-4 text-primary" />} hoverable={false}>
            {execution ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                <Detail label="Performed By">
                  <span className="font-medium">{execution.performedBy}</span>
                  {execution.performedBy !== activity.elpremar ? (
                    <span className="block text-[0.65rem] text-attention">Differs from the assigned ELPREMAR</span>
                  ) : null}
                </Detail>
                <Detail label="Mode of Operation">
                  <Badge
                    variant={execution.mode.startsWith("Offline") ? "warning" : "info"}
                    className="rounded px-1.5 py-0 text-[0.65rem]"
                  >
                    {execution.mode}
                  </Badge>
                </Detail>
                <Detail label="Actual Start Time"><span className="tabular-nums">{execution.startedAt}</span></Detail>
                <Detail label="Actual End Time">
                  {execution.endedAt ? (
                    <span className="tabular-nums">{execution.endedAt}</span>
                  ) : (
                    <span className="text-muted-foreground">Still in progress</span>
                  )}
                </Detail>
                <Detail label="Completion Notes" className="col-span-2 sm:col-span-3">
                  <span className="text-muted-foreground">{execution.notes}</span>
                </Detail>
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-muted-foreground">Work has not started yet.</p>
            )}
          </SectionCard>

          {/* ---------- Consumables ---------- */}
          <SectionCard title="INSTA Products Used" icon={<Package className="size-4 text-primary" />} hoverable={false}>
            {detail.products.length ? (
              <ul className="divide-y divide-foreground/10 text-xs">
                {detail.products.map((p) => (
                  <li key={p.name} className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
                    <span className="min-w-0 truncate font-medium">{p.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{p.quantity} {p.unit}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-3 text-center text-xs text-muted-foreground">No products recorded against this activity.</p>
            )}
          </SectionCard>

          {/* ---------- Add-on activities ---------- */}
          <SectionCard title="Additional Activities" icon={<ShieldCheck className="size-4 text-primary" />} hoverable={false}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg p-3 ring-1 ring-foreground/10">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Flame className="size-3.5 text-critical" /> Fire Prevention System
                </div>
                {detail.firePrevention ? (
                  <div className="mt-2 space-y-2">
                    <Detail label="System">{detail.firePrevention.system}</Detail>
                    <Detail label="Remarks"><span className="text-muted-foreground">{detail.firePrevention.remarks}</span></Detail>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">Not performed</p>
                )}
              </div>
              <div className="rounded-lg p-3 ring-1 ring-foreground/10">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Zap className="size-3.5 text-attention" /> Partial Discharge Mitigation
                </div>
                {detail.pdMitigation ? (
                  <div className="mt-2 space-y-2">
                    <Detail label="Method">{detail.pdMitigation.method}</Detail>
                    <Detail label="Remarks"><span className="text-muted-foreground">{detail.pdMitigation.remarks}</span></Detail>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">Not performed</p>
                )}
              </div>
            </div>
          </SectionCard>

          {/* ---------- Evidence ---------- */}
          <SectionCard title="Evidence & Attachments" icon={<ImageIcon className="size-4 text-primary" />} hoverable={false}>
            <EvidenceGallery items={detail.evidence} />
          </SectionCard>
        </div>

        {/* ---------- Sidebar ---------- */}
        <div className="space-y-4">
          <SectionCard title="Asset Details" icon={<MapPin className="size-4 text-primary" />} hoverable={false}>
            <div className="space-y-2.5">
              <Detail label="Asset ID"><span className="tabular-nums">{detail.assetTag}</span></Detail>
              <Detail label="Asset Name"><span className="font-medium">{activity.asset}</span></Detail>
              <Detail label="Location">{detail.area}</Detail>
              <Detail label="Asset Criticality">
                <span className={cn("rounded px-1.5 py-0.5 text-[0.65rem] font-semibold", criticalityTone[detail.assetCriticality])}>
                  {detail.assetCriticality}
                </span>
              </Detail>
              <Detail label="Commission Date"><span className="tabular-nums">{detail.commissionedOn}</span></Detail>
              <Detail label="Asset Category">{detail.assetCategory}</Detail>
            </div>
          </SectionCard>

          <SectionCard title="Booking" icon={<CheckCheck className="size-4 text-primary" />} hoverable={false}>
            <p className="text-xs text-muted-foreground">
              {narrative(activity.status, activity.elpremar, activity.plant, execution)}
            </p>
          </SectionCard>

          <SectionCard title="Activity Timeline" hoverable={false}>
            <Timeline steps={timeline} />
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
