/**
 * Support Tickets: everything this enterprise has raised with the OLIVINE
 * helpdesk, and where each one got to.
 *
 * This is the enterprise end of the ticket model. The client settled at the
 * 03-10-2026 review that **all** enterprise-to-OCC communication goes through
 * one ticket - "I have a request or I have a complaint" - and that tickets
 * originate here, not in EVITA: an ELPREMAR on a tablet raises nothing, they
 * have the chatbot for queries. So Report an Issue belongs on this screen, and
 * OCC's own Support Tickets console is the receiving end of it.
 *
 * Ported from OCC's ticket tables and scoped to this enterprise. OCC sees every
 * enterprise, so its Enterprise and Country columns become a Plant filter here,
 * the same trade Tasks and Inspections already make.
 *
 * Replace with GET /support-tickets once the backend exists.
 */
import { plants } from "@/data/dashboard"
import { assetRegister } from "@/data/assets"
import { inspections } from "@/data/inspections"
import { day, priorities, seeded, type Priority } from "@/data/operations"
import { tasks } from "@/data/tasks"
import type { WorkStatus } from "@/lib/status"

/**
 * What a ticket is about. OCC's own list, verbatim, so a ticket raised here
 * lands in a category the desk already sorts by.
 */
export const ticketCategories = [
  "System",
  "Technical",
  "Assignment",
  "Asset",
  "Inspection",
  "Testing & Measurement",
  "Maintenance",
  "Report",
  "Access",
  "Data/Sync",
  "Dashboard",
  "Other",
] as const

export type TicketCategory = (typeof ticketCategories)[number]

/**
 * Which screen the ticket was raised from. A ticket raised inside a module
 * carries that record across - the asset, the inspection, the task - so the
 * desk never has to ask the reporter which one they were looking at.
 */
export const ticketSources = ["EMMSE", "Asset", "Inspection", "Maintenance", "Reports", "Dashboard"] as const

export type TicketSource = (typeof ticketSources)[number]

export type TicketRow = {
  id: string
  plant: string
  subject: string
  category: TicketCategory
  /** dd-MM-yyyy */
  raised: string
  /** Who reported it: an enterprise or plant user, never the OCC desk */
  raisedBy: string
  /** The screen the ticket was raised from */
  source: TicketSource
  /** Last status change, comment or assignment, as `dd-MM-yyyy HH:mm` */
  lastUpdated: string
  priority: Priority
  status: WorkStatus
  /* --- the record it is about, carried from the screen it was raised on --- */
  /** Digital Asset ID */
  assetId?: string
  inspectionId?: string
  maintenanceId?: string
}

/* ---------- Pools ---------- */

/**
 * Who raises tickets here: the plant heads on the register plus the two desk
 * accounts that can sign in. Taken from the plant list rather than typed, so a
 * ticket can never name somebody this enterprise does not have.
 */
const reporters = [...plants.map((p) => p.head), "Rahul Mehta", "Kavita Iyer"]

const subjectsByCategory: Record<TicketCategory, string[]> = {
  System: ["Add a new sub-department to the hierarchy", "Session times out too quickly", "Plant list out of order on every screen"],
  Technical: ["Thermal camera not connecting", "Handheld device will not charge", "Sensor reading drifts after calibration"],
  Assignment: ["Request an ELPREMAR for a shutdown window", "Booked slot clashes with a plant shutdown", "ELPREMAR unavailable for the booked slot"],
  Asset: ["Asset QR code not scanning", "Correct the panel rating on record", "Duplicate asset record created"],
  Inspection: ["Inspection submitted without the thermal images", "Inspection checklist missing a step", "Re-inspection not raised after a failed point"],
  "Testing & Measurement": ["PD meter not pairing over Bluetooth", "IR test values not saving", "Measurement unit shown incorrectly"],
  Maintenance: ["Maintenance activity stuck in progress", "INSTA CLEAN consumables not recorded", "Cannot close out completed maintenance"],
  Report: ["Health report PDF not downloading", "Report shows last month's figures", "Add a plant summary to the export"],
  Access: ["User access request for the plant head", "Reset the login for a new supervisor", "Role change for a maintenance supervisor"],
  "Data/Sync": ["Field records not syncing back", "Duplicate readings after a sync", "Sync stuck at 80 percent"],
  Dashboard: ["Dashboard loading slowly", "KPI tile shows a stale count", "Asset health donut disagrees with the register"],
  Other: ["General query on platform usage", "Training request for new joiners", "Feedback on the portal layout"],
}

/** The screen a category is most likely raised from, so the source is never arbitrary */
const sourceByCategory: Record<TicketCategory, TicketSource> = {
  System: "EMMSE",
  Technical: "EMMSE",
  Assignment: "Maintenance",
  Asset: "Asset",
  Inspection: "Inspection",
  "Testing & Measurement": "Inspection",
  Maintenance: "Maintenance",
  Report: "Reports",
  Access: "EMMSE",
  "Data/Sync": "EMMSE",
  Dashboard: "Dashboard",
  Other: "EMMSE",
}

/**
 * A ticket is Open or Closed - see `ticketStatuses`. Dealt out by **position**
 * rather than by hashing, so both buckets on the status filter have rows behind
 * them: a hash divisor over a book this size has emptied one before, which
 * shows on screen as a filter that selects nothing.
 */
const statusSpread: WorkStatus[] = ["open", "closed", "closed", "open", "closed", "closed", "open", "closed"]

/* ---------- Generated book ---------- */

/**
 * Attach the record the ticket is about, where its category implies one.
 *
 * Only ids that exist are used - an inspection from the inspection book, a task
 * from the task book, an asset from the register - so a linked record on a
 * ticket always opens.
 */
function linkedRecord(category: TicketCategory, plant: string, n: number) {
  if (category === "Inspection" || category === "Testing & Measurement") {
    const pool = inspections.filter((row) => row.plant === plant)
    return { inspectionId: pool.length ? pool[n % pool.length].id : undefined }
  }
  if (category === "Maintenance" || category === "Assignment") {
    const pool = tasks.filter((row) => row.plant === plant)
    return { maintenanceId: pool.length ? pool[n % pool.length].id : undefined }
  }
  if (category === "Asset" || category === "Report") {
    const pool = assetRegister.filter((asset) => asset.plant === plant)
    return { assetId: pool.length ? pool[n % pool.length].tagId : undefined }
  }
  return {}
}

function generateTickets(count: number): TicketRow[] {
  const { random, pick } = seeded(20250601)
  const rows: TicketRow[] = []

  for (let i = 0; i < count; i++) {
    // Walked in order, so every plant, category and reporter appears once the count covers them
    const plant = plants[i % plants.length].name
    const category = ticketCategories[i % ticketCategories.length]
    const status = statusSpread[i % statusSpread.length]

    /*
     * When it was raised, and when it last moved - the second measured **from**
     * the first, never drawn on its own. Both dates used to come from their own
     * roll of the dice, which let a ticket be settled before it was raised: the
     * trail on the details screen is sorted by the clock, so that showed up as
     * Resolved and Closed sitting above Ticket Raised.
     *
     * A closed ticket is settled a day to three later. An open one has not moved,
     * so its last update is the moment it was raised, which is what the details
     * screen reads back as the raise time.
     */
    const raisedOn = -(2 + Math.floor(random() * 56))
    const raised = day(raisedOn)
    const movedOn = status === "open" ? 0 : 1 + Math.floor(random() * 3)
    const hour = 9 + Math.floor(random() * (movedOn ? 6 : 4))

    rows.push({
      id: `TKT-${1480 + count - i}`,
      plant,
      subject: pick(subjectsByCategory[category]),
      category,
      raised,
      raisedBy: reporters[i % reporters.length],
      source: sourceByCategory[category],
      lastUpdated: `${day(raisedOn + movedOn)} ${String(hour).padStart(2, "0")}:${String(Math.floor(random() * 6) * 10).padStart(2, "0")}`,
      priority: pick(priorities),
      status,
      ...linkedRecord(category, plant, Math.floor(i / plants.length)),
    })
  }
  return rows
}

/** Everything this enterprise has raised, newest id first */
export const tickets: TicketRow[] = generateTickets(36)
