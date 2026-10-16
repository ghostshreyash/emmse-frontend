/**
 * Everything the Support Ticket Details screen shows beyond the list row: what
 * was reported, what was attached, what came back, and every step the ticket
 * has been through.
 *
 * Derived from the row with a seeded RNG, so a given ticket always reads the
 * same. Replace with GET /support-tickets/:id later - the shapes below are what
 * that endpoint should return.
 */
import type { EvidenceItem, TimelineStep } from "@/data/evidence"
import type { TicketCategory, TicketRow } from "@/data/tickets"

/** How the ticket was put right, captured when the desk resolves it */
export type TicketResolution = {
  by: string
  at: string
  summary: string
}

/**
 * One line of the audit trail. Every raise, status change, resolution and
 * closure appends one, so the history is complete and in order.
 */
export type TicketEvent = {
  at: string
  by: string
  action: string
  note?: string
}

export type TicketDetail = {
  description: string
  /** What the reporter attached, plus anything the desk added while working it */
  attachments: EvidenceItem[]
  resolution?: TicketResolution
  history: TicketEvent[]
}

const descriptionsByCategory: Record<TicketCategory, string> = {
  System: "The portal behaves differently from what the team expects. The steps that reproduce it were captured and are attached.",
  Technical: "A field device is not behaving as it should. The engineer has retried on a second handset with the same outcome.",
  Assignment: "The plant needs an ELPREMAR booked against this work and cannot complete the booking from its own screens.",
  Asset: "The asset record does not match what is physically on site. A photograph of the nameplate is attached for comparison.",
  Inspection: "An inspection has come back incomplete, so it cannot be relied on to raise the maintenance that follows from it.",
  "Testing & Measurement": "A measurement instrument is not reporting correctly, so the readings cannot be trusted or recorded.",
  Maintenance: "A maintenance task is not moving through its expected states, so it cannot be closed out.",
  Report: "A report is not producing the expected output. The period and filters that were used are noted below.",
  Access: "A user needs their access adjusted so they can carry out their role on the platform.",
  "Data/Sync": "Records captured in the field have not come back to the platform, so the latest readings are missing here.",
  Dashboard: "A dashboard panel is not showing what the team expects for the plant selected.",
  Other: "A general query that does not fall under the other categories. The detail is in the description below.",
}

/** The OLIVINE desk, who pick a ticket up and answer it */
const deskOwners = ["Priya Nair (OCC)", "Rakesh Menon (OCC)", "Divya Iyer (OCC)", "Arun Prakash (OCC)"]

const resolutions = [
  "Root cause traced and corrected. Verified with the reporter before closing.",
  "Configuration corrected on the affected plant and confirmed working end to end.",
  "Fix released to production. The reporter has confirmed the original steps now work.",
  "Record corrected and re-synced. Both the portal and the field app now agree.",
]

/** dd-MM-yyyy + hour → "dd-MM-yyyy HH:mm" */
const at = (date: string, hour: number, minute = 0) =>
  `${date} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`

/** `dd-MM-yyyy HH:mm` → epoch ms, for ordering the trail */
export function stampTime(mark: string) {
  const [date, time = "00:00"] = mark.split(" ")
  const [d, m, y] = date.split("-").map(Number)
  const [hh, mm] = time.split(":").map(Number)
  return new Date(y, m - 1, d, hh, mm).getTime()
}

/** Add whole hours to a `dd-MM-yyyy HH:mm` stamp, rolling the date as needed */
function plusHours(mark: string, hours: number) {
  const [date, time = "09:00"] = mark.split(" ")
  const [d, m, y] = date.split("-").map(Number)
  const [hh, mm] = time.split(":").map(Number)
  const next = new Date(y, m - 1, d, hh + hours, mm)
  const dmy = `${String(next.getDate()).padStart(2, "0")}-${String(next.getMonth() + 1).padStart(2, "0")}-${next.getFullYear()}`
  return at(dmy, next.getHours(), next.getMinutes())
}

export function ticketDetail(row: TicketRow): TicketDetail {
  let seed = [...row.id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 17)
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
  const pick = <T,>(pool: readonly T[]) => pool[Math.floor(random() * pool.length)]

  const owner = pick(deskOwners)
  /*
   * An open ticket has not moved since it was raised, so the row's own
   * `lastUpdated` **is** the raise moment - taking it from there rather than
   * rolling another hour here keeps the Last Updated column and the first line
   * of the trail saying the same thing.
   */
  const raisedAt =
    row.status === "open" ? row.lastUpdated : at(row.raised, 9 + Math.floor(random() * 4), Math.floor(random() * 6) * 10)
  /* A ticket is Open or Closed, and only a closed one has an answer against it */
  const settled = row.status === "closed"

  /*
   * The trail: raised, and - once it is closed - picked up, answered and closed.
   * The pick-up line is on the trail rather than in the status, which is where
   * the detail of how the desk worked it belongs.
   */
  const history: TicketEvent[] = [
    { at: raisedAt, by: row.raisedBy, action: "Ticket Raised", note: `${row.category} · from ${row.source}` },
  ]

  let resolution: TicketResolution | undefined
  if (settled) {
    history.push({
      at: plusHours(raisedAt, 1 + Math.floor(random() * 4)),
      by: owner,
      action: "Picked Up By The Desk",
      note: `Assigned to ${owner}`,
    })

    const resolvedAt = plusHours(row.lastUpdated, 0)
    resolution = { by: owner, at: resolvedAt, summary: pick(resolutions) }
    history.push({ at: resolvedAt, by: owner, action: "Ticket Resolved", note: resolution.summary })
    history.push({ at: plusHours(resolvedAt, 2), by: owner, action: "Ticket Closed", note: "Confirmed with the reporter" })
  }

  /* --- what the reporter attached --- */
  const attachments: EvidenceItem[] = []
  if (random() < 0.7) {
    attachments.push({
      id: `${row.id}-A1`,
      kind: "photo",
      label: "Screenshot from the reporter",
      caption: `Captured at ${row.plant}`,
      meta: raisedAt,
    })
  }
  if (row.category === "Asset" || row.category === "Technical") {
    attachments.push({
      id: `${row.id}-A2`,
      kind: "photo",
      label: "Nameplate / device photo",
      caption: row.plant,
      meta: raisedAt,
    })
  }
  if (settled) {
    attachments.push({
      id: `${row.id}-A3`,
      kind: "document",
      label: "Resolution note.pdf",
      caption: "Signed off by the OLIVINE desk",
      meta: "148 KB",
    })
  }

  return {
    description: descriptionsByCategory[row.category] ?? descriptionsByCategory.Other,
    attachments,
    resolution,
    /*
     * The trail is built a stage at a time off two different stamps - when the
     * ticket was raised and when it was last updated - so it is ordered by the
     * clock before it is read rather than trusted to come out in order.
     */
    history: [...history].sort((a, b) => stampTime(a.at) - stampTime(b.at)),
  }
}

/**
 * The one Activity History rail: the audit trail itself, with the person on
 * each line. There is no separate lifecycle card to keep in step with it.
 */
export function ticketTimeline(detail: TicketDetail): TimelineStep[] {
  return detail.history.map((event) => ({
    step: event.action,
    at: event.at,
    note: event.note ? `${event.by} · ${event.note}` : event.by,
  }))
}
