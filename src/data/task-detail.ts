/**
 * Everything the Task Details screen shows beyond the list row: what was assigned,
 * and what the ELPREMAR actually executed. Ported from OCC's maintenance-detail.
 *
 * Derived from the row with a seeded RNG so a given activity always reads the
 * same. Replace with GET /maintenance-activities/:id later — the shapes below
 * are what that endpoint should return.
 */
import type { EvidenceItem, TimelineStep } from "@/data/evidence"
import {
  areas,
  assetCategories,
  assetCriticality,
  commissionDate,
  priorities,
  slotLabel,
  type AssetCriticality,
  type Priority,
} from "@/data/operations"
import { findRegisteredAsset } from "@/data/assets"
import type { TaskRow } from "@/data/tasks"

/** An INSTA CLEAN consumable booked against the job */
/** Quantity and unit are absent where the screen that recorded it does not capture them */
export type InstaProduct = { name: string; quantity?: number; unit?: string }


export type MaintenanceReview = {
  outcome: "approved" | "rejected"
  by: string
  at: string
  remarks: string
}

/** What the ELPREMAR did on site — absent until the work actually starts */
export type Execution = {
  /** May differ from the assigned ELPREMAR: whoever actually attended */
  performedBy: string
  mode: "Online / In-Service" | "Offline / Out-of-Service"
  startedAt: string
  endedAt?: string
  notes: string
}

export type TaskDetail = {
  /* --- what OCC assigned --- */
  priority: Priority
  description: string
  createdBy: string
  area: string
  assetTag: string
  assetCategory: string
  /** How badly a failure here would hurt: High / Medium / Low */
  assetCriticality: AssetCriticality
  /** When the asset was put into service, dd-MM-yyyy */
  commissionedOn: string
  /* --- what was executed --- */
  execution?: Execution
  products: InstaProduct[]
  firePrevention?: { system: string; remarks: string }
  pdMitigation?: { method: string; remarks: string }
  evidence: EvidenceItem[]
  review?: MaintenanceReview
}

/** Share of tasks that use INSTA 50 (light contamination); the rest need INSTA 100 */
const INSTA_50_SHARE = 0.8

const fireSystems = [
  "Aerosol fire suppression module (panel-mounted)",
  "Thermal fuse link with auto cut-off",
  "Fire retardant cable coating",
]

const pdMethods = [
  "Corona shield application on busbar joints",
  "Insulation re-taping at termination points",
  "Busbar re-torquing to specified values",
  "Nano-coating on HT insulators",
]

const supervisors = ["Priya Nair", "Rakesh Menon", "Divya Iyer", "Arun Prakash"]

const notes = [
  "Panel cleaned and dried; all terminations re-torqued to spec. No abnormality observed after energising.",
  "Dust accumulation cleared from busbar chamber. Two loose terminations corrected and re-checked under load.",
  "Contact surfaces cleaned; insulation resistance within acceptable limits after treatment.",
  "Moisture ingress noted at cable gland; sealed and treated. Recommend follow-up inspection next cycle.",
]

const descriptions = [
  "Carry out scheduled preventive maintenance: de-dust the panel, clean contact surfaces, verify terminations and record post-work readings.",
  "Condition-based intervention following elevated thermal readings. Clean, re-torque and re-scan the affected compartment.",
  "Fire preventive maintenance round: inspect suppression readiness, apply retardant treatment and log the outcome.",
]

/** dd-MM-yyyy + hour → "dd-MM-yyyy HH:mm" */
const at = (date: string, hour: number, minute = 0) =>
  `${date} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`

export function taskDetail(row: TaskRow): TaskDetail {
  let seed = [...row.id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 11)
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
  const pick = <T,>(pool: readonly T[]) => pool[Math.floor(random() * pool.length)]

  // An Open task has been raised but not started, so it has nothing recorded against it
  const started = row.status !== "open"
  const finished = row.status === "assigned" || row.status === "completed" || row.status === "rejected"

  const registered = row.assetTag ? findRegisteredAsset(row.assetTag) : undefined
  const detail: TaskDetail = {
    priority: pick(priorities),
    description: pick(descriptions),
    createdBy: `${pick(supervisors)} (OCC)`,
    // Read off the register asset worked on, so both screens describe the same kit
    area: registered?.area ?? pick(areas),
    assetTag: row.assetTag ?? `TAG-${row.plant.slice(0, 3).toUpperCase()}-${row.id.slice(-4)}`,
    assetCategory: registered?.category ?? pick(assetCategories),
    assetCriticality: registered?.criticality ?? pick(assetCriticality),
    commissionedOn: registered?.commissionedOn ?? commissionDate(random),
    products: [],
    evidence: [],
  }

  if (started) {
    // Whoever actually attended: usually the assigned ELPREMAR, sometimes a stand-in
    const standIn = random() < 0.25
    detail.execution = {
      performedBy: standIn ? `${pick(supervisors)} (stand-in)` : row.elpremar,
      mode: random() < 0.55 ? "Offline / Out-of-Service" : "Online / In-Service",
      startedAt: at(row.scheduled, row.slot, Math.floor(random() * 4) * 5),
      endedAt: finished ? at(row.scheduled, row.slot + 1, Math.floor(random() * 6) * 5) : undefined,
      notes: pick(notes),
    }

    // Most panels only carry light contamination, so INSTA 50 is the usual fluid
    detail.products.push({ name: random() < INSTA_50_SHARE ? "INSTA 50" : "INSTA 100" })
  }

  // The two add-on activities only apply to some jobs, which is what "Not performed" is for
  if (row.type === "Fire Preventive Maintenance" || random() < 0.2)
    detail.firePrevention = {
      system: pick(fireSystems),
      remarks: "Installed and function-tested; tamper seal intact.",
    }
  if (random() < 0.45)
    detail.pdMitigation = {
      method: pick(pdMethods),
      remarks: "PD level re-measured after treatment and found within limits.",
    }

  if (finished) {
    detail.evidence = [
      { id: `${row.id}-p1`, kind: "photo", label: "Panel front — before", caption: `${row.asset} prior to work`, meta: at(row.scheduled, row.slot, 5) },
      { id: `${row.id}-p2`, kind: "photo", label: "Busbar chamber — after", caption: "Contact surfaces cleaned and re-torqued", meta: at(row.scheduled, row.slot + 1, 0) },
      { id: `${row.id}-t1`, kind: "thermal", label: "Thermal scan — incomer", caption: "Hotspot 46.2 °C, within limits after work", meta: at(row.scheduled, row.slot + 1, 10) },
      { id: `${row.id}-d1`, kind: "document", label: "Job completion certificate.pdf", caption: "Signed by plant electrical in-charge", meta: "412 KB" },
    ]
    if (random() < 0.5)
      detail.evidence.push({ id: `${row.id}-d2`, kind: "document", label: "Thermography report.pdf", caption: "Full scan, 14 measurement points", meta: "1.8 MB" })
  }

  if (row.status === "assigned" || row.status === "completed")
    detail.review = {
      outcome: "approved",
      by: pick(supervisors),
      at: at(row.scheduled, row.slot + 2),
      remarks:
        row.status === "completed"
          ? "Evidence verified and the activity closed out. Health report updated."
          : "Evidence complete and consistent with the scope. Approved for health report update.",
    }
  if (row.status === "rejected")
    detail.review = {
      outcome: "rejected",
      by: pick(supervisors),
      at: at(row.scheduled, row.slot + 2),
      remarks: "Thermal image is out of focus and the completion certificate is unsigned. Please re-upload both.",
    }

  return detail
}

/**
 * The maintenance lifecycle as it stands for this activity. Steps with no
 * timestamp have not happened yet, which is how the screen greys them out.
 * OCC raises self-approved work, so there is no sign-off step to wait on: the
 * timeline runs from raised through execution to the updated health report.
 */
export function taskTimeline(row: TaskRow, detail: TaskDetail): TimelineStep[] {
  const { execution, evidence } = detail // + review, with the approval steps below
  // Everything that has finished goes to OCC; only work still in the field has not
  // const submitted = row.status !== "in_progress"

  return [
    { step: "Task assigned", at: at(row.scheduled, Math.max(9, row.slot - 1)), note: `${detail.createdBy} → ${row.elpremar}` },
    { step: "Maintenance started", at: execution?.startedAt, note: execution && `${execution.mode} · ${slotLabel(row.slot)}` },
    { step: "Maintenance completed", at: execution?.endedAt, note: execution?.endedAt ? `Performed by ${execution.performedBy}` : undefined },
    { step: "Evidence uploaded", at: evidence.length ? evidence.at(-1)!.meta.includes(":") ? evidence.at(-1)!.meta : execution?.endedAt : undefined, note: evidence.length ? `${evidence.length} items` : undefined },
    /* Self-approved work never goes for sign-off, so these two steps are out.
    { step: "Submitted for approval", at: submitted ? execution?.endedAt : undefined },
    {
      step: review?.outcome === "rejected" ? "Correction requested" : "Approved",
      at: review?.at,
      note: review && `${review.by} · ${review.outcome === "rejected" ? "sent back" : "approved"}`,
    },
    */
    // Work waiting on approval (or sent back) has not reached the health report yet
    {
      step: "Health report updated",
      at: execution?.endedAt && row.status !== "open" && row.status !== "rejected" ? at(row.scheduled, row.slot + 3) : undefined,
    },
  ]
}
