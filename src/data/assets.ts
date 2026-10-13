/**
 * A small asset register for the Add Task screen's Select Asset step: what Load
 * Asset and the QR scan look up by Asset ID / Tag ID. Stand-ins until the asset
 * register comes from GET /assets.
 */
import type { HealthStatus } from "@/lib/status"

export type AssetRecord = {
  tagId: string
  name: string
  category: string
  plant: string
  /** Department inside the plant, and the sub-department under it */
  department: string
  subDepartment: string
  manufacturer: string
  model: string
  serial: string
  health: Exclude<HealthStatus, "offline">
  /** Current health score out of 100 */
  healthScore: number
  /** All dates dd-MM-yyyy */
  nextDue: string
  lastInspection: string
  commissionedOn: string
}

/** Each department in a plant and the sub-departments under it */
export const departments: Record<string, string[]> = {
  "Main Substation (11kV)": ["Incomer Bay", "Transformer Bay", "Bus Coupler Section"],
  "LT Panels - Block A": ["LT Distribution", "Motor Control"],
  "DG Set Area": ["DG Control Room", "Fuel Yard"],
  "Production Floor": ["Line 1", "Line 2", "Packing"],
  "Utility Area": ["Compressor House", "Pump House", "Power Factor Correction"],
  "Cable Trench": ["North Trench", "South Trench"],
}

export const assetRegister: AssetRecord[] = [
  { tagId: "TRF-T1-11KV", name: "11kV/415V Transformer - T1", category: "Transformer", plant: "Jamshedpur Works", department: "Main Substation (11kV)", subDepartment: "Transformer Bay", manufacturer: "Tata", model: "Unistar 11kV", serial: "TAT-TRF-2019-001", health: "critical", healthScore: 48, nextDue: "27-11-2026", lastInspection: "27-09-2026", commissionedOn: "15-03-2019" },
  { tagId: "HTP-INC1-JSR", name: "HT Panel - Incomer 1", category: "HT Panel", plant: "Jamshedpur Works", department: "Main Substation (11kV)", subDepartment: "Incomer Bay", manufacturer: "Siemens", model: "NXAir 12kV", serial: "SIE-HTP-2017-114", health: "attention", healthScore: 71, nextDue: "18-11-2026", lastInspection: "02-10-2026", commissionedOn: "08-06-2017" },
  { tagId: "MCC-U1-JSR", name: "MCC - Unit 1", category: "MCC", plant: "Jamshedpur Works", department: "Production Floor", subDepartment: "Line 1", manufacturer: "L&T", model: "Tricolite MCC", serial: "LNT-MCC-2020-043", health: "attention", healthScore: 66, nextDue: "15-11-2026", lastInspection: "21-09-2026", commissionedOn: "11-01-2020" },
  { tagId: "TRF-T2-KLN", name: "11kV/415V Transformer - T2", category: "Transformer", plant: "Kalinganagar Works", department: "Main Substation (11kV)", subDepartment: "Transformer Bay", manufacturer: "ABB", model: "ResiBloc 11kV", serial: "ABB-TRF-2016-208", health: "critical", healthScore: 52, nextDue: "20-11-2026", lastInspection: "30-09-2026", commissionedOn: "22-04-2016" },
  { tagId: "APFC-1-KLN", name: "APFC Panel - 1", category: "APFC Panel", plant: "Kalinganagar Works", department: "Utility Area", subDepartment: "Power Factor Correction", manufacturer: "Schneider", model: "VarSet 400", serial: "SCH-APF-2018-077", health: "healthy", healthScore: 88, nextDue: "05-12-2026", lastInspection: "12-09-2026", commissionedOn: "19-09-2018" },
  { tagId: "LTP-A-MER", name: "LT Panel - Block A", category: "LT Panel", plant: "Meramandali Works", department: "LT Panels - Block A", subDepartment: "LT Distribution", manufacturer: "L&T", model: "T-ERA LT", serial: "LNT-LTP-2015-019", health: "attention", healthScore: 69, nextDue: "22-11-2026", lastInspection: "26-09-2026", commissionedOn: "03-02-2015" },
  { tagId: "UPS-03-MER", name: "UPS - 03", category: "UPS", plant: "Meramandali Works", department: "Utility Area", subDepartment: "Compressor House", manufacturer: "Vertiv", model: "Liebert EXL S1", serial: "VRT-UPS-2021-006", health: "healthy", healthScore: 91, nextDue: "10-12-2026", lastInspection: "15-09-2026", commissionedOn: "27-07-2021" },
  { tagId: "DB-ADM-KHP", name: "Distribution Board - Admin", category: "Distribution Board", plant: "Khopoli Works", department: "Production Floor", subDepartment: "Line 2", manufacturer: "Havells", model: "Pro DB 63A", serial: "HAV-DB-2019-310", health: "attention", healthScore: 74, nextDue: "28-11-2026", lastInspection: "04-10-2026", commissionedOn: "14-10-2019" },
  { tagId: "SB-SB2-SBD", name: "Switchboard - SB2", category: "Switchboard", plant: "Sahibabad Works", department: "Main Substation (11kV)", subDepartment: "Bus Coupler Section", manufacturer: "Siemens", model: "SIVACON S8", serial: "SIE-SWB-2014-052", health: "critical", healthScore: 55, nextDue: "19-11-2026", lastInspection: "29-09-2026", commissionedOn: "30-05-2014" },
  { tagId: "DG-PCC-SBD", name: "PCC - DG Set Area", category: "PCC", plant: "Sahibabad Works", department: "DG Set Area", subDepartment: "DG Control Room", manufacturer: "Schneider", model: "Okken PCC", serial: "SCH-PCC-2017-088", health: "healthy", healthScore: 86, nextDue: "08-12-2026", lastInspection: "18-09-2026", commissionedOn: "12-12-2017" },
]

export const findAsset = (tagId: string) => assetRegister.find((a) => a.tagId.toLowerCase() === tagId.trim().toLowerCase())
