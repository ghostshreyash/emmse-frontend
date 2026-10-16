import { useSyncExternalStore } from "react"

import { ticketDetail, type TicketDetail } from "@/data/ticket-detail"
import { tickets, type TicketRow } from "@/data/tickets"

/**
 * One copy of the ticket book plus what sits behind each row, shared by the list
 * and the details screen, so an issue reported from the dialog shows up in both
 * straight away. Stands in for the query cache until these rows come from the
 * API - the same shape as the task and inspection stores.
 */
let rows: TicketRow[] = tickets
let details: Record<string, TicketDetail> = Object.fromEntries(rows.map((r) => [r.id, ticketDetail(r)]))

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

export const useTicketRows = () => useSyncExternalStore(subscribe, () => rows)

export const useTicketDetails = () => useSyncExternalStore(subscribe, () => details)

export const findTicket = (id?: string) => (id ? rows.find((r) => r.id === id) : undefined)

/** Next free id for a ticket raised in this session */
const nextId = () => `TKT-${1520 + rows.filter((r) => r.id.startsWith("TKT-15")).length}`

/**
 * Raise a ticket with the OLIVINE desk.
 *
 * It lands as Open with a trail of one line, which is the truth of it: nobody
 * has looked at it yet. Returns the new id so the caller can name it in the
 * confirmation and open it.
 */
export function raiseTicket(
  row: Omit<TicketRow, "id" | "status" | "lastUpdated">,
  detail: Pick<TicketDetail, "description"> & Partial<TicketDetail>
) {
  const id = nextId()
  const now = new Date()
  const stamp = `${row.raised} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  const full: TicketRow = { id, ...row, status: "open", lastUpdated: stamp }

  rows = [full, ...rows]
  details = {
    ...details,
    [id]: {
      ...detail,
      attachments: detail.attachments ?? [],
      resolution: undefined,
      history: [{ at: stamp, by: row.raisedBy, action: "Ticket Raised", note: `${row.category} · from ${row.source}` }],
    },
  }
  emit()
  return id
}
