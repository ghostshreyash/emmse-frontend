/**
 * Mock data for the Enterprise Dashboard (EMMS-E mockup, page 31), scoped to the
 * signed-in admin's enterprise. Replace with API calls (TanStack Query) once the
 * backend exists; every figure here is a stand-in.
 */
import type { HealthStatus } from "@/lib/status"

export const assetKpis = {
  total: { value: 1248, change: 6 },
  healthy: { value: 876, percent: 70 },
  attention: { value: 282, percent: 23 },
  critical: { value: 90, percent: 7 },
}

export const enterpriseInfo = {
  id: "TSL-ENT-001",
  name: "Tata Steel Limited",
  headquarters: "Mumbai, Maharashtra",
  locations: "5 Plants",
  subDivisions: 18,
  assets: 1248,
  activeUsers: 56,
}

export const maintenanceTypes = [
  { key: "preventive", label: "Preventive", color: "var(--primary)" },
  { key: "corrective", label: "Corrective", color: "var(--warning)" },
  { key: "conditionBased", label: "Condition Based", color: "var(--success)" },
  { key: "emergency", label: "Emergency", color: "var(--destructive)" },
] as const

/** Maintenance activities closed per month, by type */
export const maintenanceTrend = [
  { month: "May", preventive: 52, corrective: 18, conditionBased: 20, emergency: 10 },
  { month: "Jun", preventive: 84, corrective: 38, conditionBased: 30, emergency: 18 },
  { month: "Jul", preventive: 56, corrective: 24, conditionBased: 18, emergency: 12 },
  { month: "Aug", preventive: 70, corrective: 32, conditionBased: 24, emergency: 14 },
  { month: "Sep", preventive: 80, corrective: 40, conditionBased: 30, emergency: 18 },
  { month: "Oct", preventive: 82, corrective: 42, conditionBased: 32, emergency: 20 },
]

export type AttentionAsset = {
  /** System-generated Digital Asset ID — the only asset identifier (no separate tag) */
  id: string
  name: string
  category: string
  location: string
  health: HealthStatus
  nextDue: string
  issue: string
}

export const assetsRequiringAttention: AttentionAsset[] = [
  { id: "TSL-MUM-TRF-001", name: "11kV/415V Transformer - T1", category: "Transformer", location: "Main Substation", health: "critical", nextDue: "12-10-2026", issue: "High PD detected" },
  { id: "TSL-MUM-HTP-001", name: "HT Panel - Incomer 1", category: "HT Panel", location: "Main Substation", health: "attention", nextDue: "18-10-2026", issue: "Cleaning due (INSTA 100)" },
  { id: "TSL-MUM-MCC-001", name: "MCC - Unit 1", category: "MCC", location: "Production Floor", health: "attention", nextDue: "15-10-2026", issue: "Thermal hotspot observed" },
  { id: "TSL-MUM-APF-001", name: "APFC Panel - 1", category: "APFC Panel", location: "Utility Area", health: "healthy", nextDue: "20-11-2026", issue: "No action required" },
  { id: "TSL-MUM-DB-001", name: "Distribution Board", category: "Distribution Board", location: "Admin Building", health: "attention", nextDue: "16-10-2026", issue: "Dust accumulation" },
]

export const announcements = [
  { title: "INSTA CLEAN 200 now available for heavy contamination.", date: "06 Oct 2026" },
  { title: "New Fire Prevention System guidelines released.", date: "03 Oct 2026" },
  { title: "Scheduled maintenance shutdown - Plant 2.", date: "29 Sep 2026" },
  { title: "Update your asset inspection data regularly.", date: "27 Sep 2026" },
]

export const compliance = { percent: 100, note: "All mandatory inspections are up to date." }

export const dataSync = { lastSynced: "09-10-2026 10:24", syncedBy: "TSL-ADM-01" }

export const systemUsage = { activeUsers: 56, activeThisWeek: 12 }
