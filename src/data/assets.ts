/**
 * The enterprise's asset register: what the Add Task screen's Load Asset and QR
 * scan look up by Asset ID / Tag ID, and what Reports draws a row from. Five
 * assets per plant, so a plant filter never empties a screen.
 *
 * `healthScore` and `health` have to agree with the score bands in master-data.
 * Four rows here used to sit outside their own band - a score of 74 badged
 * "attention" - which Reports would show as a Healthy band beside an Alarming
 * pill. Check a new row against `healthBandFor` before adding it.
 *
 * Stand-ins until the register comes from GET /assets.
 */
import type { AssetCriticality } from "@/data/master-data"
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
  /** How badly a failure here would hurt: High / Medium / Low */
  criticality: AssetCriticality
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
  /* --- Jamshedpur Works --- */
  { tagId: "TRF-T1-JSR", name: "11kV/415V Transformer - T1", category: "Transformer", plant: "Jamshedpur Works", department: "Main Substation (11kV)", subDepartment: "Transformer Bay", manufacturer: "CG Power", model: "Unistar 11kV", serial: "CGP-TRF-2019-001", criticality: "High", health: "critical", healthScore: 48, nextDue: "27-11-2026", lastInspection: "27-09-2026", commissionedOn: "15-03-2019" },
  { tagId: "HTP-INC1-JSR", name: "HT Panel - Incomer 1", category: "HT Panel", plant: "Jamshedpur Works", department: "Main Substation (11kV)", subDepartment: "Incomer Bay", manufacturer: "Siemens", model: "NXAir 12kV", serial: "SIE-HTP-2017-114", criticality: "High", health: "attention", healthScore: 68, nextDue: "18-11-2026", lastInspection: "02-10-2026", commissionedOn: "08-06-2017" },
  { tagId: "MCC-U1-JSR", name: "MCC - Unit 1", category: "MCC", plant: "Jamshedpur Works", department: "Production Floor", subDepartment: "Line 1", manufacturer: "Larsen & Toubro (L&T)", model: "Tricolite MCC", serial: "LNT-MCC-2020-043", criticality: "High", health: "attention", healthScore: 66, nextDue: "15-11-2026", lastInspection: "21-09-2026", commissionedOn: "11-01-2020" },
  { tagId: "FAP-BLKA-JSR", name: "Fire Alarm Panel - Block A", category: "Fire Alarm Panel", plant: "Jamshedpur Works", department: "Production Floor", subDepartment: "Packing", manufacturer: "Siemens", model: "Cerberus PRO", serial: "SIE-FAP-2021-204", criticality: "Medium", health: "healthy", healthScore: 90, nextDue: "06-12-2026", lastInspection: "11-09-2026", commissionedOn: "05-05-2021" },
  { tagId: "CTR-NTH-JSR", name: "Control Panel - North Trench", category: "Control Panel", plant: "Jamshedpur Works", department: "Cable Trench", subDepartment: "North Trench", manufacturer: "Rockwell Automation", model: "CompactLogix Cabinet", serial: "ROK-CTR-2018-061", criticality: "Medium", health: "healthy", healthScore: 83, nextDue: "01-12-2026", lastInspection: "24-09-2026", commissionedOn: "17-08-2018" },

  /* --- Kalinganagar Works --- */
  { tagId: "TRF-T2-KLN", name: "11kV/415V Transformer - T2", category: "Transformer", plant: "Kalinganagar Works", department: "Main Substation (11kV)", subDepartment: "Transformer Bay", manufacturer: "ABB", model: "ResiBloc 11kV", serial: "ABB-TRF-2016-208", criticality: "High", health: "critical", healthScore: 42, nextDue: "20-11-2026", lastInspection: "30-09-2026", commissionedOn: "22-04-2016" },
  { tagId: "APFC-1-KLN", name: "APFC Panel - 1", category: "APFC Panel", plant: "Kalinganagar Works", department: "Utility Area", subDepartment: "Power Factor Correction", manufacturer: "Schneider Electric", model: "VarSet 400", serial: "SCH-APF-2018-077", criticality: "Medium", health: "healthy", healthScore: 88, nextDue: "05-12-2026", lastInspection: "12-09-2026", commissionedOn: "19-09-2018" },
  { tagId: "HTP-BC1-KLN", name: "HT Panel - Bus Coupler", category: "HT Panel", plant: "Kalinganagar Works", department: "Main Substation (11kV)", subDepartment: "Bus Coupler Section", manufacturer: "Hitachi Energy", model: "UniGear ZS1", serial: "HIT-HTP-2017-131", criticality: "High", health: "attention", healthScore: 61, nextDue: "16-11-2026", lastInspection: "28-09-2026", commissionedOn: "30-11-2017" },
  { tagId: "PDB-CMP-KLN", name: "PDB - Compressor House", category: "PDB", plant: "Kalinganagar Works", department: "Utility Area", subDepartment: "Compressor House", manufacturer: "Legrand", model: "XL3 800", serial: "LEG-PDB-2020-115", criticality: "Medium", health: "healthy", healthScore: 79, nextDue: "29-11-2026", lastInspection: "19-09-2026", commissionedOn: "02-02-2020" },
  { tagId: "LTP-MC2-KLN", name: "LT Panel - Motor Control 2", category: "LT Panel", plant: "Kalinganagar Works", department: "LT Panels - Block A", subDepartment: "Motor Control", manufacturer: "Larsen & Toubro (L&T)", model: "T-ERA LT", serial: "LNT-LTP-2019-088", criticality: "High", health: "critical", healthScore: 46, nextDue: "14-11-2026", lastInspection: "01-10-2026", commissionedOn: "23-06-2019" },

  /* --- Meramandali Works --- */
  { tagId: "LTP-A-MER", name: "LT Panel - Block A", category: "LT Panel", plant: "Meramandali Works", department: "LT Panels - Block A", subDepartment: "LT Distribution", manufacturer: "Larsen & Toubro (L&T)", model: "T-ERA LT", serial: "LNT-LTP-2015-019", criticality: "Medium", health: "attention", healthScore: 69, nextDue: "22-11-2026", lastInspection: "26-09-2026", commissionedOn: "03-02-2015" },
  { tagId: "UPS-03-MER", name: "UPS - 03", category: "UPS", plant: "Meramandali Works", department: "Utility Area", subDepartment: "Compressor House", manufacturer: "Eaton", model: "Liebert EXL S1", serial: "EAT-UPS-2021-006", criticality: "Medium", health: "healthy", healthScore: 91, nextDue: "10-12-2026", lastInspection: "15-09-2026", commissionedOn: "27-07-2021" },
  { tagId: "PCC-DG1-MER", name: "PCC - DG Control Room", category: "PCC", plant: "Meramandali Works", department: "DG Set Area", subDepartment: "DG Control Room", manufacturer: "Schneider Electric", model: "Okken PCC", serial: "SCH-PCC-2016-029", criticality: "High", health: "attention", healthScore: 57, nextDue: "17-11-2026", lastInspection: "23-09-2026", commissionedOn: "09-10-2016" },
  { tagId: "SWB-L2-MER", name: "Switchboard - Line 2", category: "Switchboard", plant: "Meramandali Works", department: "Production Floor", subDepartment: "Line 2", manufacturer: "GE", model: "Spectra Series", serial: "GE-SWB-2014-073", criticality: "High", health: "healthy", healthScore: 76, nextDue: "03-12-2026", lastInspection: "14-09-2026", commissionedOn: "18-01-2014" },
  { tagId: "DB-FUEL-MER", name: "Distribution Board - Fuel Yard", category: "Distribution Board", plant: "Meramandali Works", department: "DG Set Area", subDepartment: "Fuel Yard", manufacturer: "Havells", model: "Pro DB 63A", serial: "HAV-DB-2022-150", criticality: "Low", health: "healthy", healthScore: 94, nextDue: "12-12-2026", lastInspection: "08-09-2026", commissionedOn: "21-04-2022" },

  /* --- Khopoli Works --- */
  { tagId: "DB-ADM-KHP", name: "Distribution Board - Admin", category: "Distribution Board", plant: "Khopoli Works", department: "Production Floor", subDepartment: "Line 2", manufacturer: "Havells", model: "Pro DB 63A", serial: "HAV-DB-2019-310", criticality: "Low", health: "attention", healthScore: 64, nextDue: "28-11-2026", lastInspection: "04-10-2026", commissionedOn: "14-10-2019" },
  { tagId: "TRF-T1-KHP", name: "11kV/415V Transformer - T1", category: "Transformer", plant: "Khopoli Works", department: "Main Substation (11kV)", subDepartment: "Transformer Bay", manufacturer: "Bharat Heavy Electricals Limited (BHEL)", model: "ONAN 1600 kVA", serial: "BHE-TRF-2013-044", criticality: "High", health: "healthy", healthScore: 81, nextDue: "30-11-2026", lastInspection: "17-09-2026", commissionedOn: "07-07-2013" },
  { tagId: "MCC-TUB-KHP", name: "MCC - Tube Mill", category: "MCC", plant: "Khopoli Works", department: "Production Floor", subDepartment: "Line 1", manufacturer: "ABB", model: "MNS iS", serial: "ABB-MCC-2018-192", criticality: "High", health: "attention", healthScore: 59, nextDue: "11-11-2026", lastInspection: "25-09-2026", commissionedOn: "12-12-2018" },
  { tagId: "APFC-2-KHP", name: "APFC Panel - 2", category: "APFC Panel", plant: "Khopoli Works", department: "Utility Area", subDepartment: "Power Factor Correction", manufacturer: "Crompton Greaves", model: "APFC 300 kVAr", serial: "CRG-APF-2020-087", criticality: "Medium", health: "healthy", healthScore: 87, nextDue: "08-12-2026", lastInspection: "10-09-2026", commissionedOn: "16-03-2020" },
  { tagId: "CTR-PMP-KHP", name: "Control Panel - Pump House", category: "Control Panel", plant: "Khopoli Works", department: "Utility Area", subDepartment: "Pump House", manufacturer: "Mitsubishi Electric", model: "FX5U Cabinet", serial: "MIT-CTR-2021-033", criticality: "Medium", health: "healthy", healthScore: 85, nextDue: "04-12-2026", lastInspection: "13-09-2026", commissionedOn: "28-09-2021" },

  /* --- Sahibabad Works --- */
  { tagId: "SB-SB2-SBD", name: "Switchboard - SB2", category: "Switchboard", plant: "Sahibabad Works", department: "Main Substation (11kV)", subDepartment: "Bus Coupler Section", manufacturer: "Siemens", model: "SIVACON S8", serial: "SIE-SWB-2014-052", criticality: "High", health: "critical", healthScore: 45, nextDue: "19-11-2026", lastInspection: "29-09-2026", commissionedOn: "30-05-2014" },
  { tagId: "DG-PCC-SBD", name: "PCC - DG Set Area", category: "PCC", plant: "Sahibabad Works", department: "DG Set Area", subDepartment: "DG Control Room", manufacturer: "Schneider Electric", model: "Okken PCC", serial: "SCH-PCC-2017-088", criticality: "High", health: "healthy", healthScore: 86, nextDue: "08-12-2026", lastInspection: "18-09-2026", commissionedOn: "12-12-2017" },
  { tagId: "LTP-STR-SBD", name: "LT Panel - Stores", category: "LT Panel", plant: "Sahibabad Works", department: "LT Panels - Block A", subDepartment: "LT Distribution", manufacturer: "Legrand", model: "XL3 400", serial: "LEG-LTP-2019-128", criticality: "Low", health: "attention", healthScore: 63, nextDue: "13-11-2026", lastInspection: "02-10-2026", commissionedOn: "04-04-2019" },
  { tagId: "UPS-01-SBD", name: "UPS - 01", category: "UPS", plant: "Sahibabad Works", department: "Utility Area", subDepartment: "Compressor House", manufacturer: "Eaton", model: "93PS 40 kVA", serial: "EAT-UPS-2020-017", criticality: "Medium", health: "healthy", healthScore: 92, nextDue: "15-12-2026", lastInspection: "07-09-2026", commissionedOn: "11-11-2020" },
  { tagId: "DB-STH-SBD", name: "Distribution Board - South Trench", category: "Distribution Board", plant: "Sahibabad Works", department: "Cable Trench", subDepartment: "South Trench", manufacturer: "Havells", model: "Pro DB 32A", serial: "HAV-DB-2016-241", criticality: "Low", health: "critical", healthScore: 49, nextDue: "10-11-2026", lastInspection: "03-10-2026", commissionedOn: "26-08-2016" },
]

export const findAsset = (tagId: string) => assetRegister.find((a) => a.tagId.toLowerCase() === tagId.trim().toLowerCase())
