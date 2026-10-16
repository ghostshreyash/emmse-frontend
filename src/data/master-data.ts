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

/* ---------- Asset ---------- */

/**
 * Asset Criticality (parameter sheet, "Asset"). How badly a failure here would
 * hurt, which the client defined by function at the 03-10-2026 review: a panel
 * directly affecting the operational performance of the enterprise is critical,
 * an admin or guest-house panel is not. It is a property of the **asset**, not
 * of a job against it.
 */

/* ---------- Asset onboarding (ported from EVITA's master-data) ---------- */

/** The full asset category master list, from the platform parameter sheet */
export const assetCategories = [
  "Transformer",
  "Power Transformer",
  "Distribution Transformer",
  "Instrument Transformer (CT/PT)",
  "HT Panel",
  "LT Panel",
  "MCC (Motor Control Center)",
  "PCC (Power Control Center)",
  "APFC Panel",
  "AMF Panel",
  "Distribution Board (DB)",
  "Sub Distribution Board (SDB)",
  "Lighting Distribution Board (LDB)",
  "Busbar",
  "VCB (Vacuum Circuit Breaker)",
  "ACB (Air Circuit Breaker)",
  "SF6 Circuit Breaker",
  "MCCB",
  "VFD (Variable Frequency Drive)",
  "Soft Starter Panel",
  "UPS",
  "Battery Bank",
  "Battery Charger",
  "Inverter",
  "Relay Panel",
  "Control Panel",
  "PLC Panel",
  "SCADA System",
  "RTU (Remote Terminal Unit)",
  "Fire Alarm Panel",
  "Solar Inverter",
  "Solar Combiner Box",
  "Solar Transformer",
  "Network Switch",
  "Industrial Network Equipment",
  "Other",
] as const

export const assetCriticality = ["High", "Medium", "Low"] as const

export type AssetCriticality = (typeof assetCriticality)[number]

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
/** Manufacturers offered on the technical step; Tata and Vertiv added for this register */
export const manufacturers = [
  "ABB",
  "Siemens",
  "Schneider Electric",
  "Larsen & Toubro (L&T)",
  "CG Power",
  "Crompton Greaves",
  "GE",
  "Hitachi Energy",
  "Eaton",
  "Legrand",
  "Havells",
  "Bharat Heavy Electricals Limited (BHEL)",
  "Toshiba",
  "Mitsubishi Electric",
  "Rockwell Automation",
  "Tata",
  "Vertiv",
  "Other",
] as const

/**
 * The categories offered directly on the Asset Category Reference grid during
 * onboarding — the kit a plant actually holds. The remaining categories are not
 * hidden: "Other" opens the full master list above.
 */
export const commonAssetCategories = [
  "Transformer",
  "Distribution Transformer",
  "HT Panel",
  "LT Panel",
  "MCC (Motor Control Center)",
  "PCC (Power Control Center)",
  "APFC Panel",
  "Distribution Board (DB)",
  "VCB (Vacuum Circuit Breaker)",
  "ACB (Air Circuit Breaker)",
  "VFD (Variable Frequency Drive)",
  "UPS",
  "Battery Bank",
  "Control Panel",
  "PLC Panel",
  "Fire Alarm Panel",
  "Busbar",
  "Relay Panel",
  "Network Switch",
  "Other",
] as const

/**
 * Three-letter code per category, used to build the unique Asset ID at the end
 * of onboarding (TSL-MUM-11KV-TRF-001). Every category needs one, so an asset in
 * any category can be given an ID; anything unlisted falls back to its initials.
 */
const assetCategoryCodes: Record<string, string> = {
  Transformer: "TRF",
  "Power Transformer": "PTR",
  "Distribution Transformer": "DTR",
  "Instrument Transformer (CT/PT)": "ITR",
  "HT Panel": "HTP",
  "LT Panel": "LTP",
  "MCC (Motor Control Center)": "MCC",
  "PCC (Power Control Center)": "PCC",
  "APFC Panel": "APF",
  "AMF Panel": "AMF",
  "Distribution Board (DB)": "DB",
  "Sub Distribution Board (SDB)": "SDB",
  "Lighting Distribution Board (LDB)": "LDB",
  Busbar: "BUS",
  "VCB (Vacuum Circuit Breaker)": "VCB",
  "ACB (Air Circuit Breaker)": "ACB",
  "SF6 Circuit Breaker": "SF6",
  MCCB: "MCB",
  "VFD (Variable Frequency Drive)": "VFD",
  "Soft Starter Panel": "SSP",
  UPS: "UPS",
  "Battery Bank": "BAT",
  "Battery Charger": "BCH",
  Inverter: "INV",
  "Relay Panel": "RLY",
  "Control Panel": "CTP",
  "PLC Panel": "PLC",
  "SCADA System": "SCD",
  "RTU (Remote Terminal Unit)": "RTU",
  "Fire Alarm Panel": "FAP",
  "Solar Inverter": "SIN",
  "Solar Combiner Box": "SCB",
  "Solar Transformer": "STR",
  "Network Switch": "NSW",
  "Industrial Network Equipment": "INE",
  Other: "OTH",
}

/** Asset ID segment for a category, e.g. "Transformer" -> "TRF" */
export const assetCategoryCode = (category: string) => {
  const known = assetCategoryCodes[category]
  if (known) return known
  // Initials of an unlisted category, ignoring anything in brackets
  const initials = category
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 3)
  return initials || "AST"
}

/**
 * Suggested names for the photographs and documents captured at onboarding.
 *
 * Suggestions, not a fixed set. What is available varies from asset to asset
 * and site to site, so the engineer names each upload themselves and these only
 * save them typing the common ones - see the client's answer of 07-10-2026.
 *
 * Kept to six apiece: they are offered as tappable chips under the name box, so
 * a longer list would wrap into a wall of them on a tablet.
 */
export const suggestedImageNames = [
  "Front View",
  "Side View",
  "Nameplate",
  "Panel / Accessories",
  "Overall Area",
  "Cable Termination",
] as const

export const suggestedDocumentNames = [
  "Nameplate Photo",
  "Manufacturer Datasheet",
  "Installation Report",
  "Single Line Diagram",
  "Warranty Certificate",
  "Test Report",
] as const
