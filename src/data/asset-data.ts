/**
 * What Asset Onboarding and the asset detail screen read about an asset beyond its
 * register row: the profile onboarding captured, the site it is registered at, and
 * how its Asset ID is built.
 *
 * Ported from EVITA's asset-data.ts. EVITA is one engineer's tablet at one plant;
 * this is the enterprise portal, so the site is the enterprise plus whichever of its
 * plants the asset is registered at, and the register itself lives in data/assets.ts.
 */
import { enterpriseInfo, plants } from "@/data/dashboard"
import { departments, type AssetRecord } from "@/data/assets"
import { parametersFor } from "@/data/asset-parameters"
import { installEnvironments } from "@/data/maintenance-schedule"
import { assetCategoryCode } from "@/data/master-data"

/** Everything the onboarding wizard captured, as the detail screen reads it */
export type AssetProfile = {
  details: {
    enterprise: string
    plant: string
    area: string
    department: string
    subDepartment: string
    category: string
    tag: string
    description: string
    /** The asset's own coordinates, defaulting to the plant's */
    latitude: string
    longitude: string
    /**
     * Controlled / AC or Uncontrolled / non-AC. Decides how often the asset is
     * scheduled for cleaning - see data/maintenance-schedule.ts.
     */
    environment: string
  }
  /**
   * The electrical specification, as the asset type defines it. Resolved to
   * label and value here so a screen can render it without knowing which
   * parameters this kind of asset carries.
   */
  parameters: { label: string; value: string; unit?: string }[]
  /** Named by whoever captured them - there is no fixed set */
  documents: { id: string; name: string; file: string; uploaded: string }[]
  images: { id: string; name: string }[]
}

/* ---------- Helpers ---------- */

const seedOf = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/** DD-MM-YYYY -> Date, for sorting and comparing the dates held as strings */
export const parseDmy = (d: string) => {
  const [dd, mm, yyyy] = d.split("-").map(Number)
  return new Date(yyyy, mm - 1, dd)
}

/* ---------- Where an asset is registered ---------- */

/** Each plant's registered location, which an asset's coordinates default to */
const plantCoordinates: Record<string, { latitude: string; longitude: string }> = {
  JSR: { latitude: "22.7868", longitude: "86.1837" },
  KLN: { latitude: "20.9781", longitude: "86.0112" },
  MER: { latitude: "20.8389", longitude: "85.1022" },
  KHP: { latitude: "18.7883", longitude: "73.3419" },
  SBD: { latitude: "28.6772", longitude: "77.3584" },
}

export type Site = {
  enterprise: string
  plant: { id: string; name: string; latitude: string; longitude: string }
  /** The plant's departments and the sub-departments under each */
  departments: Record<string, string[]>
}

/**
 * The site an asset is registered at. EVITA fixes this to the engineer's own
 * posting; here the enterprise is fixed and the plant is the one picked on step 1.
 */
export function siteFor(plantName: string): Site {
  const plant = plants.find((p) => p.name === plantName) ?? plants[0]
  return {
    enterprise: enterpriseInfo.name,
    plant: { id: plant.id, name: plant.name, ...(plantCoordinates[plant.id] ?? { latitude: "", longitude: "" }) },
    departments,
  }
}

/* ---------- Asset ID ---------- */

/**
 * The unique Asset ID: category, plant and a running number within that group,
 * e.g. TRF-JSR-0013 - the same shape as the rest of this register. Built rather
 * than typed, so two assets can never be handed the same one.
 */
export function buildAssetId(parts: {
  plantName: string
  category: string
  /** Assets already registered, so the running number continues from them */
  existing: readonly AssetRecord[]
}) {
  const plant = plants.find((p) => p.name === parts.plantName) ?? plants[0]
  const prefix = `${assetCategoryCode(parts.category)}-${plant.id}`
  const taken = parts.existing.filter((a) => a.tagId.startsWith(prefix + "-"))
  const highest = taken.reduce((n, a) => Math.max(n, Number(a.tagId.slice(prefix.length + 1)) || 0), 0)
  return `${prefix}-${String(highest + 1).padStart(4, "0")}`
}

/* ---------- Profile ---------- */

/**
 * Rebuild everything onboarding would have captured for an asset already on the
 * register. Seeded off the Asset ID, so the detail screen and the edit wizard agree
 * without any of it being stored.
 *
 * The specification is generated from the asset type's own parameter list, with
 * the register's manufacturer and model filled in where the type asks for them.
 */
export function assetProfileFor(a: AssetRecord): AssetProfile {
  const s = seedOf(a.tagId)
  const site = siteFor(a.plant)
  return {
    details: {
      enterprise: site.enterprise,
      plant: a.plant,
      area: a.area,
      department: a.department,
      subDepartment: a.subDepartment,
      category: a.category,
      tag: a.name,
      description: `${a.category} — ${a.name}`,
      latitude: site.plant.latitude,
      longitude: site.plant.longitude,
      // Roughly a third of a plant's assets sit in an air-conditioned room
      environment: installEnvironments[s % 3 === 0 ? 0 : 1],
    },
    parameters: seededParameters(a, s),
    documents: [
      { id: "d1", name: "Nameplate Photo (Close-up)", file: `${a.tagId}-Nameplate.jpg`, uploaded: a.onboarded },
      { id: "d2", name: "Manufacturer Datasheet", file: `${a.tagId}_Datasheet.pdf`, uploaded: a.onboarded },
      { id: "d3", name: "Installation Report", file: `${a.tagId}_InstallationReport.pdf`, uploaded: a.onboarded },
      { id: "d4", name: "Single Line Diagram (SLD)", file: `SLD_${a.department.replace(/\W/g, "")}.pdf`, uploaded: a.onboarded },
      { id: "d5", name: "Warranty Certificate", file: `Warranty_${a.tagId}.pdf`, uploaded: a.onboarded },
    ],
    images: [
      { id: "i1", name: "Front View" },
      { id: "i2", name: "Side View" },
      { id: "i3", name: "Nameplate" },
      { id: "i4", name: "Panel / Accessories" },
      { id: "i5", name: "Overall Area" },
    ],
  }
}

/**
 * A plausible answer for every parameter the asset's type asks for. The register's
 * own manufacturer, model and criticality are used where the type asks for them; a
 * choice otherwise picks from the sheet's own list, and a number is scaled by unit.
 */
function seededParameters(a: AssetRecord, s: number) {
  return parametersFor(a.category).map((spec, i) => {
    if (spec.key === "criticality") return { label: spec.label, value: a.criticality }
    if (spec.key === "manufacturer") return { label: spec.label, value: a.manufacturer }
    if (spec.key === "modelType") return { label: spec.label, value: a.model }
    const unit = spec.units?.[(s + i) % spec.units.length]
    if (spec.options) return { label: spec.label, value: spec.options[(s + i * 5) % spec.options.length], unit }
    if (spec.kind === "number") {
      const n = spec.unit === "%" ? 4 + ((s + i) % 40) / 10 : spec.unit === "Nos." ? 2 + ((s + i) % 20) : 100 + ((s + i * 37) % 900)
      return { label: spec.label, value: spec.unit === "%" ? n.toFixed(2) : String(n), unit: spec.unit }
    }
    return { label: spec.label, value: `${a.tagId}-${spec.key.slice(0, 3).toUpperCase()}`, unit: spec.unit }
  })
}
