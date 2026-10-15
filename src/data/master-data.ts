/**
 * Shared vocabularies, copied from occ-frontend's `src/data/master-data.ts`.
 * Only what EMMS-E uses so far lives here; add entries from that file (keeping
 * the wording identical) as screens need them.
 */

/* ---------- Contact ---------- */

/** Dialling codes for the countries the platform operates in */
export const dialCodes = [
  { code: "+91", country: "India" },
  { code: "+971", country: "United Arab Emirates" },
  { code: "+966", country: "Saudi Arabia" },
  { code: "+65", country: "Singapore" },
  { code: "+44", country: "United Kingdom" },
  { code: "+49", country: "Germany" },
  { code: "+31", country: "Netherlands" },
  { code: "+1", country: "United States" },
  { code: "+55", country: "Brazil" },
  { code: "+27", country: "South Africa" },
  { code: "+61", country: "Australia" },
] as const

/* ---------- Work ---------- */

/**
 * Inspection Type and Maintenance Type, verbatim from the parameter sheet
 * (`docs/PARAMETERS.md`, "Work") and worded exactly as occ-frontend's own
 * `master-data.ts` words them, so the two never drift.
 *
 * The sheet lists three maintenance types and no "Corrective" or "Emergency":
 * the screens here used to carry both, plus a third spelling on the Add Task
 * form, which is why every type on every EMMS-E screen now reads from these
 * two lists and nothing declares its own.
 */
export const inspectionTypes = [
  "Visual Inspection",
  "Thermal Inspection",
  "Fire Prevention System Inspection",
  "Re-inspection",
] as const

export type InspectionType = (typeof inspectionTypes)[number]

export const maintenanceTypes = [
  "Preventive Maintenance",
  "Condition-Based Maintenance",
  "Fire Preventive Maintenance",
] as const

export type MaintenanceType = (typeof maintenanceTypes)[number]

/**
 * The type shown where a screen lists inspection and maintenance work together.
 *
 * The client settled at the 03-10-2026 review that an inspection and the
 * maintenance it raises are the same activity by the same ELPREMAR, only not
 * necessarily at the same time - so the two vocabularies are one list wherever
 * both kinds of work appear on a screen, as they do on Reports.
 */
export const activityTypeOptions = [...inspectionTypes, ...maintenanceTypes] as const

export type ActivityType = InspectionType | MaintenanceType

/* ---------- Health score ---------- */

/**
 * Health score bands (parameter sheet, "Health Score"). The wording is the one
 * the client confirmed at the screen review: Healthy / Alarming / At Risk.
 */
export const healthBands = [
  { min: 70, max: 100, label: "Healthy", tone: "healthy" as const },
  { min: 50, max: 69, label: "Alarming", tone: "attention" as const },
  { min: 0, max: 49, label: "At Risk", tone: "critical" as const },
]

export const healthBandFor = (score: number) =>
  healthBands.find((b) => score >= b.min && score <= b.max) ?? healthBands[healthBands.length - 1]
