import { Link, useNavigate, useParams } from "react-router"
import { ArrowLeft, CheckCheck, Clock, Image as ImageIcon, Link2, MessageSquare, TriangleAlert } from "lucide-react"
import { cn } from "cn"

import { Detail, EvidenceGallery, Timeline } from "@/components/common/detail-view"
import { PageHeader } from "@/components/common/page-header"
import { SectionCard } from "@/components/common/section-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { priorityTone } from "@/data/operations"
import { ticketTimeline } from "@/data/ticket-detail"
import { findTicket, useTicketDetails } from "@/data/ticket-store"
import { control } from "@/lib/data-table"
import { workStatus, type WorkStatus } from "@/lib/status"

/**
 * Plain-English standing. A ticket is Open or Closed - see `ticketStatuses` -
 * so there are two things to say about one.
 */
const narrative = (status: WorkStatus, by: string) =>
  status === "closed"
    ? "Settled and closed out. If the problem comes back, report it again and a fresh ticket is raised."
    : `Raised by ${by} and still with the OLIVINE helpdesk. The answer lands here and on the trail below.`

/**
 * One support ticket: what was reported, what was attached, what came back, and
 * every step it has been through.
 *
 * The answer sits directly under the report, because the two are read together -
 * what was wrong, and what was done about it. The trail is the full audit, one
 * line per raise, pick-up, resolution and closure, which is what matters when
 * something is disputed.
 *
 * Nothing on this screen is editable. The enterprise raises a ticket and reads
 * the answer; the desk works it from OCC, which is where resolving and closing
 * live - EMMS-E is not the console.
 */
export function SupportTicketDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const details = useTicketDetails()
  const ticket = findTicket(id)
  const detail = id ? details[id] : undefined

  if (!ticket || !detail) {
    return (
      <div>
        <PageHeader
          title="Support Ticket"
          breadcrumbs={[{ label: "Support Tickets", to: "/support-tickets" }, { label: id ?? "Unknown" }]}
        />
        <SectionCard title="Not found" hoverable={false}>
          <p className="py-6 text-center text-xs text-muted-foreground">
            No ticket with id <span className="font-medium text-foreground">{id}</span>.{" "}
            <Link to="/support-tickets" className="text-primary hover:underline">Back to the list</Link>
          </p>
        </SectionCard>
      </div>
    )
  }

  const status = workStatus[ticket.status]
  const timeline = ticketTimeline(detail)

  /* The records this ticket concerns, and the screen each one opens */
  const linked = [
    ticket.inspectionId ? { label: "Inspection", id: ticket.inspectionId, to: `/inspection-activities/${ticket.inspectionId}` } : null,
    ticket.maintenanceId ? { label: "Task", id: ticket.maintenanceId, to: `/tasks/${ticket.maintenanceId}` } : null,
    /* The asset's report record is the only asset screen built, so that is where an asset goes */
    ticket.assetId ? { label: "Asset", id: ticket.assetId, to: `/reports/${ticket.assetId}` } : null,
  ].filter(Boolean) as { label: string; id: string; to: string }[]

  return (
    <div>
      <PageHeader
        title={ticket.subject}
        description={`${ticket.id} · ${ticket.plant}`}
        breadcrumbs={[{ label: "Support Tickets", to: "/support-tickets" }, { label: ticket.id }]}
        actions={
          <Button variant="outline" size="sm" className={control} onClick={() => navigate("/support-tickets")}>
            <ArrowLeft className="size-3.5" /> Back to list
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {/* ---------- What was reported ---------- */}
          <SectionCard title="Ticket" icon={<TriangleAlert className="size-4 text-critical" />} hoverable={false}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Detail label="Ticket ID"><span className="font-medium tabular-nums">{ticket.id}</span></Detail>
              <Detail label="Category">{ticket.category}</Detail>
              <Detail label="Status">
                <Badge variant={status.badge} className="rounded px-1.5 py-0 text-[0.65rem]">{status.label}</Badge>
              </Detail>
              <Detail label="Priority">
                <span className={cn("rounded px-1.5 py-0.5 text-[0.65rem] font-semibold", priorityTone[ticket.priority])}>
                  {ticket.priority}
                </span>
              </Detail>
              <Detail label="Plant">{ticket.plant}</Detail>
              <Detail label="Raised From">{ticket.source}</Detail>
              <Detail label="Raised By"><span className="font-medium">{ticket.raisedBy}</span></Detail>
              <Detail label="Raised On"><span className="tabular-nums">{ticket.raised}</span></Detail>
              <Detail label="Last Updated"><span className="tabular-nums">{ticket.lastUpdated}</span></Detail>
              <Detail label="Subject" className="col-span-2 sm:col-span-3">
                <span className="font-medium">{ticket.subject}</span>
              </Detail>
              <Detail label="Description" className="col-span-2 sm:col-span-3">
                <span className="text-muted-foreground">{detail.description}</span>
              </Detail>
            </div>
          </SectionCard>

          {/* ---------- What came back ---------- */}
          <SectionCard title="Resolution" icon={<MessageSquare className="size-4 text-primary" />} hoverable={false}>
            {detail.resolution ? (
              <div className="rounded-lg bg-healthy-soft p-3 text-xs text-healthy-soft-foreground">
                <div className="text-[0.65rem] font-bold tracking-wide uppercase">Resolved</div>
                <p className="mt-1 leading-relaxed">{detail.resolution.summary}</p>
                <p className="mt-1.5 text-[0.65rem] opacity-80">
                  {detail.resolution.by} · <span className="tabular-nums">{detail.resolution.at}</span>
                </p>
              </div>
            ) : (
              <p className="flex items-center gap-1.5 rounded-lg bg-attention-soft px-3 py-2.5 text-xs text-attention-soft-foreground">
                <Clock className="size-3.5 shrink-0" />
                The OLIVINE helpdesk has this. The answer lands here once it is settled.
              </p>
            )}
          </SectionCard>

          {/* ---------- What was attached ---------- */}
          <SectionCard title="Attachments" icon={<ImageIcon className="size-4 text-primary" />} hoverable={false}>
            <EvidenceGallery items={detail.attachments} empty="Nothing was attached to this ticket." />
          </SectionCard>
        </div>

        {/* ---------- Sidebar ---------- */}
        <div className="space-y-4">
          <SectionCard title="Standing" icon={<CheckCheck className="size-4 text-primary" />} hoverable={false}>
            <p className="text-xs text-muted-foreground">{narrative(ticket.status, ticket.raisedBy)}</p>
          </SectionCard>

          <SectionCard title="Linked Records" icon={<Link2 className="size-4 text-primary" />} hoverable={false}>
            {linked.length ? (
              <ul className="space-y-2.5">
                {linked.map((record) => (
                  <li key={record.id}>
                    <Detail label={record.label}>
                      <Link to={record.to} className="font-medium tabular-nums text-primary hover:underline">
                        {record.id}
                      </Link>
                    </Detail>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-3 text-center text-xs text-muted-foreground">
                This ticket was not raised against a particular record.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Activity History" hoverable={false}>
            <Timeline steps={timeline} />
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
