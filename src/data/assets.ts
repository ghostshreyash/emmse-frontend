/**
 * The enterprise's asset register: what Asset Management lists, what the asset
 * detail screen opens, and what the Add Maintenance Task screen's Load Asset looks
 * up by Asset ID / Tag ID. A few hand-written assets lead it; the rest are generated
 * per plant with a seeded RNG so every plant's asset count and health split match the
 * dashboard exactly. Categories and manufacturers use the onboarding master lists, so
 * an asset added through Asset Onboarding sits beside these as an equal.
 * Stand-ins until the register comes from GET /assets.
 */
import { addDays, format, subDays } from "date-fns"

import { plants } from "@/data/dashboard"
import { assetCategoryCode, type AssetCriticality } from "@/data/master-data"
import { seeded, units } from "@/data/operations"
import { shortCategory } from "@/lib/category-icons"
import type { HealthStatus } from "@/lib/status"

export type AssetRecord = {
  /** The Asset ID, unique across the enterprise */
  tagId: string
  name: string
  category: string
  plant: string
  /** Department inside the plant, and the sub-department under it */
  department: string
  subDepartment: string
  /** Free-text location, as Asset Onboarding asks for it */
  area: string
  manufacturer: string
  model: string
  serial: string
  criticality: AssetCriticality
  /**
   * Null until the asset has been inspected: a newly onboarded asset has no score
   * rather than a placeholder one, and reads as "Not inspected yet".
   */
  health: Exclude<HealthStatus, "offline"> | null
  /** Current health score out of 100, null until inspected */
  healthScore: number | null
  /** All dates dd-MM-yyyy; lastInspection is empty until the first inspection */
  nextDue: string
  lastInspection: string
  commissionedOn: string
  /** When the asset joined the register */
  onboarded: string
}

/** A health band an asset can be in once it has been inspected */
export type AssetHealth = NonNullable<AssetRecord["health"]>

/** Each department in a plant and the sub-departments under it */
export const departments: Record<string, string[]> = {
  "Main Substation (11kV)": ["Incomer Bay", "Transformer Bay", "Bus Coupler Section"],
  "LT Panels - Block A": ["LT Distribution", "Motor Control"],
  "DG Set Area": ["DG Control Room", "Fuel Yard"],
  "Production Floor": ["Line 1", "Line 2", "Packing"],
  "Utility Area": ["Compressor House", "Pump House", "Power Factor Correction"],
  "Cable Trench": ["North Trench", "South Trench"],
}

/** Hand-written assets, kept first so the mockup's examples are easy to find */
const featured: AssetRecord[] = [
  { tagId: "TRF-T1-11KV", name: "11kV/415V Transformer - T1", category: "Transformer", plant: "Jamshedpur Works", department: "Main Substation (11kV)", subDepartment: "Transformer Bay", area: "Main Substation (11kV), Transformer Bay", manufacturer: "Tata", model: "Unistar 11kV", criticality: "High", serial: "TAT-TRF-2019-001", health: "critical", healthScore: 48, nextDue: "27-11-2026", lastInspection: "27-09-2026", commissionedOn: "15-03-2019", onboarded: "12-04-2019" },
  { tagId: "HTP-INC1-JSR", name: "HT Panel - Incomer 1", category: "HT Panel", plant: "Jamshedpur Works", department: "Main Substation (11kV)", subDepartment: "Incomer Bay", area: "Main Substation (11kV), Incomer Bay", manufacturer: "Siemens", model: "NXAir 12kV", criticality: "High", serial: "SIE-HTP-2017-114", health: "attention", healthScore: 71, nextDue: "18-11-2026", lastInspection: "02-10-2026", commissionedOn: "08-06-2017", onboarded: "20-06-2017" },
  { tagId: "MCC-U1-JSR", name: "MCC - Unit 1", category: "MCC (Motor Control Center)", plant: "Jamshedpur Works", department: "Production Floor", subDepartment: "Line 1", area: "Production Floor, Line 1", manufacturer: "Larsen & Toubro (L&T)", model: "Tricolite MCC", criticality: "Medium", serial: "LNT-MCC-2020-043", health: "attention", healthScore: 66, nextDue: "15-11-2026", lastInspection: "21-09-2026", commissionedOn: "11-01-2020", onboarded: "25-01-2020" },
  { tagId: "TRF-T2-KLN", name: "11kV/415V Transformer - T2", category: "Transformer", plant: "Kalinganagar Works", department: "Main Substation (11kV)", subDepartment: "Transformer Bay", area: "Main Substation (11kV), Transformer Bay", manufacturer: "ABB", model: "ResiBloc 11kV", criticality: "High", serial: "ABB-TRF-2016-208", health: "critical", healthScore: 52, nextDue: "20-11-2026", lastInspection: "30-09-2026", commissionedOn: "22-04-2016", onboarded: "05-05-2016" },
  { tagId: "APFC-1-KLN", name: "APFC Panel - 1", category: "APFC Panel", plant: "Kalinganagar Works", department: "Utility Area", subDepartment: "Power Factor Correction", area: "Utility Area, Power Factor Correction", manufacturer: "Schneider Electric", model: "VarSet 400", criticality: "Low", serial: "SCH-APF-2018-077", health: "healthy", healthScore: 88, nextDue: "05-12-2026", lastInspection: "12-09-2026", commissionedOn: "19-09-2018", onboarded: "02-10-2018" },
  { tagId: "LTP-A-MER", name: "LT Panel - Block A", category: "LT Panel", plant: "Meramandali Works", department: "LT Panels - Block A", subDepartment: "LT Distribution", area: "LT Panels - Block A, LT Distribution", manufacturer: "Larsen & Toubro (L&T)", model: "T-ERA LT", criticality: "Medium", serial: "LNT-LTP-2015-019", health: "attention", healthScore: 69, nextDue: "22-11-2026", lastInspection: "26-09-2026", commissionedOn: "03-02-2015", onboarded: "20-02-2015" },
  { tagId: "UPS-03-MER", name: "UPS - 03", category: "UPS", plant: "Meramandali Works", department: "Utility Area", subDepartment: "Compressor House", area: "Utility Area, Compressor House", manufacturer: "Vertiv", model: "Liebert EXL S1", criticality: "Medium", serial: "VRT-UPS-2021-006", health: "healthy", healthScore: 91, nextDue: "10-12-2026", lastInspection: "15-09-2026", commissionedOn: "27-07-2021", onboarded: "10-08-2021" },
  { tagId: "DB-ADM-KHP", name: "Distribution Board - Admin", category: "Distribution Board (DB)", plant: "Khopoli Works", department: "Production Floor", subDepartment: "Line 2", area: "Production Floor, Line 2", manufacturer: "Havells", model: "Pro DB 63A", criticality: "Low", serial: "HAV-DB-2019-310", health: "attention", healthScore: 74, nextDue: "28-11-2026", lastInspection: "04-10-2026", commissionedOn: "14-10-2019", onboarded: "28-10-2019" },
  { tagId: "SB-SB2-SBD", name: "Switchboard - SB2", category: "PCC (Power Control Center)", plant: "Sahibabad Works", department: "Main Substation (11kV)", subDepartment: "Bus Coupler Section", area: "Main Substation (11kV), Bus Coupler Section", manufacturer: "Siemens", model: "SIVACON S8", criticality: "High", serial: "SIE-SWB-2014-052", health: "critical", healthScore: 55, nextDue: "19-11-2026", lastInspection: "29-09-2026", commissionedOn: "30-05-2014", onboarded: "15-06-2014" },
  { tagId: "DG-PCC-SBD", name: "PCC - DG Set Area", category: "PCC (Power Control Center)", plant: "Sahibabad Works", department: "DG Set Area", subDepartment: "DG Control Room", area: "DG Set Area, DG Control Room", manufacturer: "Schneider Electric", model: "Okken PCC", criticality: "Medium", serial: "SCH-PCC-2017-088", health: "healthy", healthScore: 86, nextDue: "08-12-2026", lastInspection: "18-09-2026", commissionedOn: "12-12-2017", onboarded: "30-12-2017" },
]

/* ---------- The generated rest of the register ---------- */

/** The kit a plant actually holds, drawn from the onboarding master list */
const registerCategories = [
  "Transformer",
  "HT Panel",
  "LT Panel",
  "APFC Panel",
  "MCC (Motor Control Center)",
  "PCC (Power Control Center)",
  "Distribution Board (DB)",
  "Sub Distribution Board (SDB)",
  "UPS",
  "Control Panel",
  "Fire Alarm Panel",
  "VCB (Vacuum Circuit Breaker)",
  "ACB (Air Circuit Breaker)",
  "VFD (Variable Frequency Drive)",
] as const

const panelMakers = {
  "Larsen & Toubro (L&T)": ["T-ERA LT", "Tricolite MCC", "U-Power Omega"],
  "Schneider Electric": ["Okken PCC", "Prisma P", "VarSet 400"],
  Siemens: ["SIVACON S8", "SENTRON 3VA"],
  ABB: ["MNS iS", "ArTu L"],
  Havells: ["Pro DB 63A", "Euro-II"],
}

/** Who makes each kind of kit, and their models - so a transformer is never a UPS maker's */
const makersFor: Record<(typeof registerCategories)[number], Record<string, string[]>> = {
  Transformer: { Tata: ["Unistar 11kV", "Unistar 33kV"], ABB: ["ResiBloc 11kV"], Siemens: ["GEAFOL Cast Resin"], "CG Power": ["CG Dry Type 2MVA"] },
  "HT Panel": { Siemens: ["NXAir 12kV"], ABB: ["UniGear ZS1"], "Schneider Electric": ["PIX 12"], "Larsen & Toubro (L&T)": ["VCB-SL 12kV"] },
  "LT Panel": panelMakers,
  "APFC Panel": panelMakers,
  "MCC (Motor Control Center)": panelMakers,
  "PCC (Power Control Center)": panelMakers,
  "Distribution Board (DB)": panelMakers,
  "Sub Distribution Board (SDB)": panelMakers,
  UPS: { Vertiv: ["Liebert EXL S1", "Liebert ITA2"], Eaton: ["93PM"], "Schneider Electric": ["Galaxy VS"] },
  "Control Panel": panelMakers,
  "Fire Alarm Panel": { Siemens: ["Cerberus PRO FC724"], Eaton: ["CF3000"] },
  "VCB (Vacuum Circuit Breaker)": { ABB: ["VD4"], Siemens: ["3AH5"], "Larsen & Toubro (L&T)": ["VCB-SL"] },
  "ACB (Air Circuit Breaker)": { ABB: ["Emax 2"], "Schneider Electric": ["MasterPact MTZ"], "Larsen & Toubro (L&T)": ["U-Power Omega"] },
  "VFD (Variable Frequency Drive)": { ABB: ["ACS880"], Siemens: ["SINAMICS G120"], "Rockwell Automation": ["PowerFlex 755"] },
}

const scoreBand: Record<AssetHealth, [number, number]> = { healthy: [80, 98], attention: [60, 79], critical: [35, 59] }

function generateRegister(): AssetRecord[] {
  const { random, pick } = seeded(20261015)
  const today = new Date()
  const rows: AssetRecord[] = []

  for (const plant of plants) {
    // What this plant still needs once its hand-written assets are counted
    const need = { healthy: plant.healthy, attention: plant.attention, critical: plant.critical }
    for (const a of featured) if (a.plant === plant.name && a.health) need[a.health]--

    const healths = (Object.keys(need) as AssetHealth[]).flatMap((h) => Array<AssetHealth>(need[h]).fill(h))
    // Shuffle so health is spread through the list rather than in blocks
    for (let i = healths.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[healths[i], healths[j]] = [healths[j], healths[i]]
    }

    healths.forEach((health, i) => {
      const category = pick(registerCategories)
      const department = pick(Object.keys(departments))
      const subDepartment = pick(departments[department])
      const makers = makersFor[category]
      const maker = pick(Object.keys(makers))
      const [lo, hi] = scoreBand[health]
      const commissioned = 2010 + Math.floor(random() * 14)
      const lastInspection = subDays(today, 3 + Math.floor(random() * 120))
      // Critical assets are more often overdue, which is why they are critical
      const nextDue = addDays(lastInspection, health === "critical" ? 20 + Math.floor(random() * 60) : 45 + Math.floor(random() * 150))
      const code = assetCategoryCode(category)
      const seq = String(i + 1).padStart(4, "0")
      rows.push({
        tagId: `${code}-${plant.id}-${seq}`,
        name: `${shortCategory(category)} - ${pick(units)}`,
        category,
        plant: plant.name,
        department,
        subDepartment,
        area: `${department}, ${subDepartment}`,
        manufacturer: maker,
        model: pick(makers[maker]),
        serial: `${maker.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase()}-${code}-${commissioned}-${seq}`,
        // A poorly asset is more often a critical one; otherwise spread across the three
        criticality: health === "critical" && random() < 0.6 ? "High" : pick(["High", "Medium", "Low"] as const),
        health,
        healthScore: lo + Math.floor(random() * (hi - lo + 1)),
        nextDue: format(nextDue, "dd-MM-yyyy"),
        lastInspection: format(lastInspection, "dd-MM-yyyy"),
        commissionedOn: `${String(1 + Math.floor(random() * 28)).padStart(2, "0")}-${String(1 + Math.floor(random() * 12)).padStart(2, "0")}-${commissioned}`,
        onboarded: format(subDays(lastInspection, 30 + Math.floor(random() * 400)), "dd-MM-yyyy"),
      })
    })
  }
  return rows
}

/** Every asset in the enterprise: the hand-written ones, then the generated rest */
export const assetRegister: AssetRecord[] = [...featured, ...generateRegister()]

/** The register as generated; use the asset store to see assets onboarded since */
export const findRegisteredAsset = (tagId: string) => assetRegister.find((a) => a.tagId.toLowerCase() === tagId.trim().toLowerCase())
