/**
 * Mock data for the Enterprise Dashboard (EMMS-E mockup, page 31), scoped to the
 * signed-in admin's enterprise. Replace with API calls (TanStack Query) once the
 * backend exists; every figure here is a stand-in.
 *
 * The dashboard shows either the whole enterprise ("all") or one plant. Each plant's
 * asset counts, departments and users add up to the enterprise figures.
 */
import type { HealthStatus } from "@/lib/status"

/**
 * Plants of the signed-in enterprise. `logo` is an uploaded image URL; plants without
 * one show a generic plant mark. Capacity is the rated crude steel / product output.
 */
export const plants = [
  { id: "JSR", name: "Jamshedpur Works", type: "Integrated Steel Plant", capacity: "11 MTPA", logo: null as string | null, location: "Jamshedpur, Jharkhand", head: "Rajesh Kumar Sinha", commissioned: "27-08-1912", assets: 420, healthy: 290, attention: 98, critical: 32, change: 5, departments: 6, activeUsers: 18, activeThisWeek: 4 },
  { id: "KLN", name: "Kalinganagar Works", type: "Integrated Steel Plant", capacity: "8 MTPA", logo: null as string | null, location: "Jajpur, Odisha", head: "Anita Mohanty", commissioned: "08-05-2016", assets: 300, healthy: 216, attention: 63, critical: 21, change: 8, departments: 4, activeUsers: 13, activeThisWeek: 3 },
  { id: "MER", name: "Meramandali Works", type: "Integrated Steel Plant", capacity: "5.6 MTPA", logo: null as string | null, location: "Dhenkanal, Odisha", head: "Suresh Patnaik", commissioned: "16-11-2013", assets: 260, healthy: 180, attention: 60, critical: 20, change: 7, departments: 4, activeUsers: 11, activeThisWeek: 2 },
  { id: "KHP", name: "Khopoli Works", type: "Cold Rolling Mill", capacity: "0.8 MTPA", logo: null as string | null, location: "Khopoli, Maharashtra", head: "Meera Deshpande", commissioned: "12-03-1999", assets: 148, healthy: 106, attention: 33, critical: 9, change: 4, departments: 2, activeUsers: 8, activeThisWeek: 2 },
  { id: "SBD", name: "Sahibabad Works", type: "Precision Tubes", capacity: "0.2 MTPA", logo: null as string | null, location: "Ghaziabad, Uttar Pradesh", head: "Vikram Chauhan", commissioned: "21-09-1987", assets: 120, healthy: 84, attention: 28, critical: 8, change: 6, departments: 2, activeUsers: 6, activeThisWeek: 1 },
] as const

export type Plant = (typeof plants)[number]
export type PlantId = Plant["id"]
/** What the dashboard is showing: the whole enterprise or a single plant */
export type DashboardScope = "all" | PlantId

export const isPlantId = (value: string | null): value is PlantId => plants.some((p) => p.id === value)

export const enterpriseInfo = {
  id: "TSL-ENT-001",
  name: "Tata Steel Limited",
  /** Uploaded logo URL; until onboarding stores one the dashboard draws a monogram */
  logo: null as string | null,
  /** Enterprise sector chosen at onboarding: "Industry" or "Retail" */
  sector: "Industry" as "Industry" | "Retail",
  description: "Integrated steel producer with operations across mining, steelmaking and finished products.",
  onboardedOn: "15-03-2026",
  website: "https://www.tatasteel.com",
  address: {
    line: "Bombay House, 24 Homi Mody Street, Fort",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    country: "India",
  },
  plants: plants.length,
  departments: plants.reduce((sum, p) => sum + p.departments, 0),
  assets: plants.reduce((sum, p) => sum + p.assets, 0),
  activeUsers: plants.reduce((sum, p) => sum + p.activeUsers, 0),
}

export const maintenanceTypes = [
  { key: "preventive", label: "Preventive", color: "var(--primary)" },
  { key: "corrective", label: "Corrective", color: "var(--warning)" },
  { key: "conditionBased", label: "Condition Based", color: "var(--success)" },
  { key: "emergency", label: "Emergency", color: "var(--destructive)" },
] as const

type MaintenanceKey = (typeof maintenanceTypes)[number]["key"]
export type MaintenanceLabel = (typeof maintenanceTypes)[number]["label"]
export type MaintenanceMonth = { month: string } & Record<MaintenanceKey, number>

export type AttentionAsset = {
  /** System-generated Digital Asset ID — the only asset identifier (no separate tag) */
  id: string
  name: string
  category: string
  location: string
  health: HealthStatus
  /** Plant the asset belongs to (name) */
  plant: string
  scheduledOn: string
  activityType: MaintenanceLabel
}

export type Announcement = { title: string; date: string }

export type DashboardData = {
  assetKpis: {
    total: { value: number; change: number }
    healthy: { value: number; percent: number }
    attention: { value: number; percent: number }
    critical: { value: number; percent: number }
  }
  maintenanceTrend: MaintenanceMonth[]
  assetsRequiringAttention: AttentionAsset[]
  announcements: Announcement[]
  compliance: { percent: number; note: string }
  dataSync: { lastSynced: string; syncedBy: string }
  systemUsage: { activeUsers: number; activeThisWeek: number }
}

function kpis(c: { assets: number; healthy: number; attention: number; critical: number; change: number }): DashboardData["assetKpis"] {
  const pct = (n: number) => Math.round((n / c.assets) * 100)
  return {
    total: { value: c.assets, change: c.change },
    healthy: { value: c.healthy, percent: pct(c.healthy) },
    attention: { value: c.attention, percent: pct(c.attention) },
    critical: { value: c.critical, percent: pct(c.critical) },
  }
}

/** Enterprise-wide maintenance activities closed per month, by type */
const enterpriseTrend: MaintenanceMonth[] = [
  { month: "May", preventive: 52, corrective: 18, conditionBased: 20, emergency: 10 },
  { month: "Jun", preventive: 84, corrective: 38, conditionBased: 30, emergency: 18 },
  { month: "Jul", preventive: 56, corrective: 24, conditionBased: 18, emergency: 12 },
  { month: "Aug", preventive: 70, corrective: 32, conditionBased: 24, emergency: 14 },
  { month: "Sep", preventive: 80, corrective: 40, conditionBased: 30, emergency: 18 },
  { month: "Oct", preventive: 82, corrective: 42, conditionBased: 32, emergency: 20 },
]

/**
 * Splits the enterprise trend across plants by asset share; the last plant takes the
 * rounding remainder so the plants always add back up to the enterprise figure.
 */
const plantTrends = Object.fromEntries(plants.map((p) => [p.id, [] as MaintenanceMonth[]])) as Record<PlantId, MaintenanceMonth[]>
for (const row of enterpriseTrend) {
  const left = { ...row }
  plants.forEach((p, i) => {
    const last = i === plants.length - 1
    const share = p.assets / enterpriseInfo.assets
    const split = { month: row.month } as MaintenanceMonth
    for (const { key } of maintenanceTypes) {
      split[key] = last ? left[key] : Math.round(row[key] * share)
      left[key] -= split[key]
    }
    plantTrends[p.id].push(split)
  })
}

const enterpriseAnnouncements: Announcement[] = [
  { title: "INSTA CLEAN 200 now available for heavy contamination.", date: "06 Oct 2026" },
  { title: "New Fire Prevention System guidelines released.", date: "03 Oct 2026" },
  { title: "Update your asset inspection data regularly.", date: "27 Sep 2026" },
]

/** Per-plant figures the enterprise view does not roll up from */
type PlantAsset = Omit<AttentionAsset, "plant">

const plantDetails: Record<PlantId, Pick<DashboardData, "dataSync"> & { assetsRequiringAttention: PlantAsset[]; announcement: Announcement }> = {
  JSR: {
    assetsRequiringAttention: [
      { id: "TSL-JSR-TRF-004", name: "33kV/11kV Transformer - T4", category: "Transformer", location: "Blast Furnace Substation", health: "critical", scheduledOn: "11-10-2026", activityType: "Condition Based" },
      { id: "TSL-JSR-HTP-002", name: "HT Panel - Incomer 2", category: "HT Panel", location: "Main Receiving Station", health: "critical", scheduledOn: "13-10-2026", activityType: "Corrective" },
      { id: "TSL-JSR-MCC-007", name: "MCC - Rolling Mill 2", category: "MCC", location: "Hot Strip Mill", health: "attention", scheduledOn: "17-10-2026", activityType: "Condition Based" },
      { id: "TSL-JSR-DB-012", name: "Distribution Board - Coke Plant", category: "Distribution Board", location: "Coke Plant", health: "attention", scheduledOn: "19-10-2026", activityType: "Preventive" },
      { id: "TSL-JSR-APF-002", name: "APFC Panel - 2", category: "APFC Panel", location: "Utility Area", health: "healthy", scheduledOn: "22-11-2026", activityType: "Preventive" },
    ],
    dataSync: { lastSynced: "09-10-2026 10:24", syncedBy: "TSL-JSR-ADM-01" },
    announcement: { title: "Scheduled maintenance shutdown - Blast Furnace G.", date: "29 Sep 2026" },
  },
  KLN: {
    assetsRequiringAttention: [
      { id: "TSL-KLN-TRF-002", name: "11kV/415V Transformer - T2", category: "Transformer", location: "Pellet Plant Substation", health: "critical", scheduledOn: "12-10-2026", activityType: "Condition Based" },
      { id: "TSL-KLN-HTP-003", name: "HT Panel - Bus Coupler", category: "HT Panel", location: "Main Substation", health: "attention", scheduledOn: "16-10-2026", activityType: "Preventive" },
      { id: "TSL-KLN-MCC-004", name: "MCC - Sinter Plant", category: "MCC", location: "Sinter Plant", health: "attention", scheduledOn: "18-10-2026", activityType: "Corrective" },
      { id: "TSL-KLN-APF-001", name: "APFC Panel - 1", category: "APFC Panel", location: "Utility Area", health: "healthy", scheduledOn: "25-11-2026", activityType: "Preventive" },
    ],
    dataSync: { lastSynced: "09-10-2026 09:58", syncedBy: "TSL-KLN-ADM-01" },
    announcement: { title: "Scheduled maintenance shutdown - Pellet Plant.", date: "29 Sep 2026" },
  },
  MER: {
    assetsRequiringAttention: [
      { id: "TSL-MER-TRF-001", name: "11kV/415V Transformer - T1", category: "Transformer", location: "Main Substation", health: "critical", scheduledOn: "14-10-2026", activityType: "Emergency" },
      { id: "TSL-MER-MCC-003", name: "MCC - Cold Rolling Mill", category: "MCC", location: "Cold Rolling Mill", health: "attention", scheduledOn: "15-10-2026", activityType: "Condition Based" },
      { id: "TSL-MER-DB-005", name: "Distribution Board - Admin", category: "Distribution Board", location: "Admin Building", health: "attention", scheduledOn: "20-10-2026", activityType: "Preventive" },
      { id: "TSL-MER-HTP-001", name: "HT Panel - Incomer 1", category: "HT Panel", location: "Main Substation", health: "healthy", scheduledOn: "28-11-2026", activityType: "Preventive" },
    ],
    dataSync: { lastSynced: "09-10-2026 10:05", syncedBy: "TSL-MER-ADM-01" },
    announcement: { title: "Thermography survey planned for Cold Rolling Mill.", date: "30 Sep 2026" },
  },
  KHP: {
    assetsRequiringAttention: [
      { id: "TSL-KHP-HTP-001", name: "HT Panel - Incomer 1", category: "HT Panel", location: "Main Substation", health: "critical", scheduledOn: "13-10-2026", activityType: "Preventive" },
      { id: "TSL-KHP-MCC-002", name: "MCC - Tube Mill", category: "MCC", location: "Tube Mill", health: "attention", scheduledOn: "18-10-2026", activityType: "Preventive" },
      { id: "TSL-KHP-TRF-001", name: "11kV/415V Transformer - T1", category: "Transformer", location: "Main Substation", health: "healthy", scheduledOn: "30-11-2026", activityType: "Preventive" },
    ],
    dataSync: { lastSynced: "09-10-2026 09:41", syncedBy: "TSL-KHP-ADM-01" },
    announcement: { title: "Earthing pit inspection drive this month.", date: "01 Oct 2026" },
  },
  SBD: {
    assetsRequiringAttention: [
      { id: "TSL-SBD-TRF-002", name: "11kV/415V Transformer - T2", category: "Transformer", location: "Main Substation", health: "critical", scheduledOn: "15-10-2026", activityType: "Emergency" },
      { id: "TSL-SBD-DB-003", name: "Distribution Board - Stores", category: "Distribution Board", location: "Stores", health: "attention", scheduledOn: "21-10-2026", activityType: "Preventive" },
      { id: "TSL-SBD-APF-001", name: "APFC Panel - 1", category: "APFC Panel", location: "Utility Area", health: "healthy", scheduledOn: "02-12-2026", activityType: "Preventive" },
    ],
    dataSync: { lastSynced: "09-10-2026 09:30", syncedBy: "TSL-SBD-ADM-01" },
    announcement: { title: "Scheduled maintenance shutdown - Plant 2.", date: "29 Sep 2026" },
  },
}

/** "12-10-2026" → sortable timestamp */
const dayValue = (ddmmyyyy: string) => {
  const [d, m, y] = ddmmyyyy.split("-").map(Number)
  return new Date(y, m - 1, d).getTime()
}

const plantAssets = (id: PlantId): AttentionAsset[] => {
  const plant = plants.find((p) => p.id === id)!
  return plantDetails[id].assetsRequiringAttention.map((a) => ({ ...a, plant: plant.name }))
}

/** The enterprise view lists the next few scheduled activities across every plant */
function soonestAcrossPlants(count: number) {
  return plants
    .flatMap((p) => plantAssets(p.id))
    .sort((a, b) => dayValue(a.scheduledOn) - dayValue(b.scheduledOn))
    .slice(0, count)
}

const enterpriseData: DashboardData = {
  assetKpis: kpis({ ...enterpriseInfo, ...sumHealth(), change: 6 }),
  maintenanceTrend: enterpriseTrend,
  assetsRequiringAttention: soonestAcrossPlants(5),
  announcements: [
    enterpriseAnnouncements[0],
    enterpriseAnnouncements[1],
    { title: "Scheduled maintenance shutdown - Plant 2.", date: "29 Sep 2026" },
    enterpriseAnnouncements[2],
  ],
  compliance: { percent: 100, note: "All mandatory inspections are up to date." },
  dataSync: { lastSynced: "09-10-2026 10:24", syncedBy: "TSL-ADM-01" },
  systemUsage: {
    activeUsers: enterpriseInfo.activeUsers,
    activeThisWeek: plants.reduce((sum, p) => sum + p.activeThisWeek, 0),
  },
}

function sumHealth() {
  return {
    healthy: plants.reduce((sum, p) => sum + p.healthy, 0),
    attention: plants.reduce((sum, p) => sum + p.attention, 0),
    critical: plants.reduce((sum, p) => sum + p.critical, 0),
  }
}

/** Everything the dashboard renders, for the whole enterprise or one plant */
export function getDashboardData(scope: DashboardScope): DashboardData {
  if (scope === "all") return enterpriseData
  const plant = plants.find((p) => p.id === scope)!
  const details = plantDetails[scope]
  return {
    assetKpis: kpis(plant),
    maintenanceTrend: plantTrends[scope],
    assetsRequiringAttention: plantAssets(scope),
    // Newest first, as in the enterprise list
    announcements: [...enterpriseAnnouncements, details.announcement].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
    compliance: enterpriseData.compliance,
    dataSync: details.dataSync,
    systemUsage: { activeUsers: plant.activeUsers, activeThisWeek: plant.activeThisWeek },
  }
}
